-- Tolerate spelling mistakes in places, count a Pal's sign-up address as their vicinity,
-- and let "Receive all errands" mean every errand, everywhere.

create extension if not exists fuzzystrmatch with schema extensions;

-- Same place if one contains the other, or they differ by only a letter or two.
create or replace function public.place_matches(a text, b text)
returns boolean language sql immutable set search_path = '' as $$
  select length(public.norm_place(a)) >= 3 and length(public.norm_place(b)) >= 3
    and (
      public.norm_place(a) like '%' || public.norm_place(b) || '%'
      or public.norm_place(b) like '%' || public.norm_place(a) || '%'
      or extensions.levenshtein(left(public.norm_place(a), 60), left(public.norm_place(b), 60))
         <= case when least(length(public.norm_place(a)), length(public.norm_place(b))) >= 8 then 2 else 1 end
    );
$$;

drop function if exists public.pal_wants_errand(uuid, text, text, text);
create or replace function public.pal_wants_errand(pal uuid, category text, errand_area text, errand_state text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pal_profiles p,
      lateral (
        -- Where the Pal works: the areas they listed, plus the city and address from sign-up.
        select array(
          select btrim(x) from unnest(
            coalesce(p.service_areas, '{}') || array[p.city] || coalesce(string_to_array(p.address, ','), '{}')
          ) x where btrim(coalesce(x, '')) <> ''
        ) as places
      ) v
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
              errand_state is null or p.state is null or public.place_matches(errand_state, p.state)
              or exists (select 1 from unnest(v.places) a where public.place_matches(a, errand_area))
            when errand_area is not null and cardinality(v.places) > 0 then
              exists (select 1 from unnest(v.places) a where public.place_matches(a, errand_area))
            else
              errand_state is null or p.state is null or public.place_matches(errand_state, p.state)
            end
          )
        )
      )
  );
$$;
revoke all on function public.pal_wants_errand(uuid, text, text, text) from public, anon, authenticated;
