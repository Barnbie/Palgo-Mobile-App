-- One location field: Pals are matched on whatever the User typed (or GPS filled in).
-- The state is worked out from the text when it is not given.

create or replace function public.infer_state(t text)
returns text language sql immutable set search_path = '' as $$
  select (
    select s from unnest(array[
      'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
      'Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
      'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
      'Yobe','Zamfara','FCT']) s
    where lower(coalesce(t, '')) ~ ('\m' || lower(s) || '\M')
       or (s = 'FCT' and lower(coalesce(t, '')) ~ '\m(abuja|f\.c\.t)')
    limit 1);
$$;

create or replace function public.set_errand_state()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(btrim(new.state), '') = '' then new.state := public.infer_state(new.location); end if;
  return new;
end; $$;
drop trigger if exists set_errand_state_before_insert on public.errands;
create trigger set_errand_state_before_insert before insert on public.errands
  for each row execute function public.set_errand_state();

-- Comma-separated pieces of an address, without state names and "Nigeria".
create or replace function public.place_parts(t text, state_name text)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array(
    select btrim(x) from unnest(string_to_array(coalesce(t, ''), ',')) x
    where btrim(x) <> '' and public.norm_place(x) <> 'nigeria'
      and not (state_name is not null and public.norm_place(x) = public.norm_place(state_name))
  ), '{}');
$$;

drop function if exists public.pal_wants_errand(uuid, text, text, text);
create or replace function public.pal_wants_errand(
  pal uuid, category text, errand_location text, errand_area text, errand_state text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pal_profiles p,
      lateral (select coalesce(errand_state, public.infer_state(errand_location)) as st) es,
      lateral (
        -- Where the Pal works: listed areas plus the city and address from sign-up.
        select public.place_parts(
          array_to_string(coalesce(p.service_areas, '{}') || array[p.city, p.address], ','), p.state) as places
      ) pv,
      lateral (
        select public.place_parts(concat_ws(',', errand_location, errand_area), es.st) as places
      ) ev
    where p.id = pal
      and (
        p.receive_all_errands
        or (
          (
            public.skills_for_category(category) is null
            or p.services && public.skills_for_category(category)
            or 'Others' = any(p.services)
          )
          and (
            case when public.is_wide_category(category) then
              es.st is null or p.state is null or public.place_matches(es.st, p.state)
              or exists (select 1 from unnest(pv.places) a, unnest(ev.places) b where public.place_matches(a, b))
            when cardinality(pv.places) > 0 and cardinality(ev.places) > 0 then
              exists (select 1 from unnest(pv.places) a, unnest(ev.places) b where public.place_matches(a, b))
            else
              es.st is null or p.state is null or public.place_matches(es.st, p.state)
            end
          )
        )
      )
  );
$$;
revoke all on function public.pal_wants_errand(uuid, text, text, text, text) from public, anon, authenticated;

do $$
declare d text;
begin
  select pg_get_functiondef('public.get_account_errands(text)'::regprocedure) into d;
  d := replace(d, 'public.pal_wants_errand(auth.uid(), e.service_category, e.area, e.state)',
                  'public.pal_wants_errand(auth.uid(), e.service_category, e.location, e.area, e.state)');
  -- Show Pals the area, or the address without its first (street) line.
  d := replace(d, 'coalesce(nullif(concat_ws('', '', e.area, e.city, e.state), ''''),',
                  'coalesce(nullif(concat_ws('', '', e.area, e.city, e.state), ''''), nullif(array_to_string((string_to_array(e.location, '',''))[2:], '',''), ''''),');
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
    and public.pal_wants_errand(p.id, new.service_category, new.location, new.area, new.state);
  return new;
end; $$;
