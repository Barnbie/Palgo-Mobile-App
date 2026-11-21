-- The Pal's latest position while an errand is accepted or running. One row per errand,
-- written and read only through the functions below.
create table if not exists public.errand_locations (
  errand_id uuid primary key references public.errands(id) on delete cascade,
  pal_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy real,
  updated_at timestamptz not null default now()
);
alter table public.errand_locations enable row level security;

create or replace function public.share_pal_location(
  errand_to_share uuid, lat double precision, lng double precision, acc real default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from public.errands e where e.id = errand_to_share
      and e.pal_id = auth.uid() and e.status in ('accepted', 'active')) then
    raise exception 'You are not the Pal on a running errand.';
  end if;
  insert into public.errand_locations(errand_id, pal_id, latitude, longitude, accuracy, updated_at)
  values (errand_to_share, auth.uid(), lat, lng, acc, now())
  on conflict (errand_id) do update
    set pal_id = excluded.pal_id, latitude = excluded.latitude, longitude = excluded.longitude,
        accuracy = excluded.accuracy, updated_at = now();
end $$;
revoke all on function public.share_pal_location(uuid, double precision, double precision, real) from public, anon;
grant execute on function public.share_pal_location(uuid, double precision, double precision, real) to authenticated;

create or replace function public.get_pal_location(errand_to_view uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r public.errand_locations;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from public.errands e where e.id = errand_to_view
      and e.requester_id = auth.uid() and e.status in ('accepted', 'active')) then
    return null;
  end if;
  select * into r from public.errand_locations where errand_id = errand_to_view;
  if not found then return null; end if;
  return jsonb_build_object('latitude', r.latitude, 'longitude', r.longitude, 'updated_at', r.updated_at);
end $$;
revoke all on function public.get_pal_location(uuid) from public, anon;
grant execute on function public.get_pal_location(uuid) to authenticated;

-- The position is removed as soon as the errand is no longer accepted or running.
create or replace function public.clear_errand_location()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status not in ('accepted', 'active') or new.pal_id is distinct from old.pal_id then
    delete from public.errand_locations where errand_id = new.id;
  end if;
  return new;
end $$;
revoke all on function public.clear_errand_location() from public, anon, authenticated;
create trigger clear_errand_location_after_update after update on public.errands
  for each row execute function public.clear_errand_location();
