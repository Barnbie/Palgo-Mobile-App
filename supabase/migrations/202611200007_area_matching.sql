-- Match errands to Pals by area as well as by skill, add Styling and Cooking categories,
-- and keep a library of the custom skills Pals type under "Others".

alter table public.errands add column if not exists area text;
alter table public.pal_profiles add column if not exists service_areas text[] not null default '{}';
grant update (service_areas) on public.pal_profiles to authenticated;

-- "Lagos State" and "lagos" compare equal; punctuation and spaces are ignored.
create or replace function public.norm_place(t text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(regexp_replace(lower(coalesce(t, '')), '\mstate\M', '', 'g'), '[^a-z0-9]', '', 'g');
$$;

-- True when two places are the same, or one contains the other ("Amuwo" vs "Amuwo Odofin").
create or replace function public.place_matches(a text, b text)
returns boolean language sql immutable set search_path = '' as $$
  select length(public.norm_place(a)) >= 3 and length(public.norm_place(b)) >= 3
    and (public.norm_place(a) like '%' || public.norm_place(b) || '%'
      or public.norm_place(b) like '%' || public.norm_place(a) || '%');
$$;

create or replace function public.skills_for_category(category text)
returns text[] language sql immutable set search_path = '' as $$
  select case category
    when 'Grocery' then array['Errand','Delivery','Chef','Caterer']
    when 'Pickup' then array['Errand','Delivery']
    when 'Delivery' then array['Delivery','Errand']
    when 'General errand' then array['Errand','Delivery','House chores']
    when 'Cleaning' then array['House chores','Car wash','Nanny']
    when 'Repairs' then array['Plumbing','Electrician','Mechanic','Tailor']
    when 'Styling' then array['Hairstylist','Barber','Makeup artist','Tailor']
    when 'Cooking' then array['Chef','Caterer']
    else null end;
$$;

-- Services that take time and pay well are not tied to one neighbourhood: the whole state matches.
create or replace function public.is_wide_category(category text)
returns boolean language sql immutable set search_path = '' as $$
  select category in ('Styling', 'Cooking');
$$;

drop function if exists public.pal_wants_errand(uuid, text);
create or replace function public.pal_wants_errand(pal uuid, category text, errand_area text, errand_state text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pal_profiles p
    where p.id = pal
      and (
        p.receive_all_errands
        or public.skills_for_category(category) is null
        or p.services && public.skills_for_category(category)
        or 'Others' = any(p.services)
      )
      and (
        -- Wide categories: same state, or one of the Pal's areas.
        case when public.is_wide_category(category) then
          errand_state is null or p.state is null or public.place_matches(errand_state, p.state)
          or exists (select 1 from unnest(p.service_areas) a where public.place_matches(a, errand_area))
        -- Local errands: one of the Pal's areas. Without areas on either side, fall back to the state.
        else
          case when errand_area is not null and cardinality(p.service_areas) > 0 then
            exists (select 1 from unnest(p.service_areas) a where public.place_matches(a, errand_area))
          else
            errand_state is null or p.state is null or public.place_matches(errand_state, p.state)
          end
        end
      )
  );
$$;
revoke all on function public.pal_wants_errand(uuid, text, text, text) from public, anon, authenticated;

-- Pals see the area (never the street address) before they accept.
do $$
declare d text;
begin
  select pg_get_functiondef('public.get_account_errands(text)'::regprocedure) into d;
  d := replace(d, 'public.pal_wants_errand(auth.uid(), e.service_category)', 'public.pal_wants_errand(auth.uid(), e.service_category, e.area, e.state)');
  d := replace(d, 'concat_ws('', '', e.city, e.state)', 'concat_ws('', '', e.area, e.city, e.state)');
  execute d;
end $$;

create or replace function public.notify_pals_new_errand()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id, role, title, body, data)
  select p.id, 'pal', 'New errand available',
         left(new.title, 60) || ' · ' || to_char(new.amount, 'FM999,999,990'),
         jsonb_build_object('errand_id', new.id)
  from public.pal_profiles p
  where p.id <> new.requester_id
    and p.available is not false
    and p.pal_profile_complete
    and (not public.require_verified_pals() or p.verification_status = 'verified')
    and public.pal_wants_errand(p.id, new.service_category, new.area, new.state);
  return new;
end; $$;

-- Library of skills Pals typed under "Others", for the team to review and promote.
create table if not exists public.skill_suggestions (
  skill text primary key,
  first_seen timestamptz not null default now()
);
alter table public.skill_suggestions enable row level security;
revoke all on public.skill_suggestions from anon, authenticated;

create or replace function public.track_custom_skills()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.skill_suggestions(skill)
  select distinct initcap(btrim(s)) from unnest(new.services) s
  where btrim(s) <> '' and lower(btrim(s)) not in (
    'errand','delivery','car wash','plumbing','electrician','house chores','mechanic','chef','caterer',
    'nanny','security','hairstylist','barber','makeup artist','tailor','others')
  on conflict (skill) do nothing;
  return new;
end; $$;
revoke all on function public.track_custom_skills() from public, anon, authenticated;
drop trigger if exists track_custom_skills_after_change on public.pal_profiles;
create trigger track_custom_skills_after_change
  after insert or update of services on public.pal_profiles
  for each row execute function public.track_custom_skills();
