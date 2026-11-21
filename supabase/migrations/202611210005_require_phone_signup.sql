-- A phone number is required for every new account (User and Pal), so someone who
-- later becomes the other role already has one. Existing accounts are not touched.
create or replace function public.sync_role_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  digits text := regexp_replace(coalesce(m->>'phone', ''), '\D', '', 'g');
begin
  if tg_op = 'INSERT' then
    if length(digits) < 7 or length(digits) > 15 then
      raise exception 'A valid phone number is required to create an account.';
    end if;
    if m ->> 'role' = 'pal' then
      insert into public.pal_profiles(id, full_name, email, phone, date_of_birth, gender)
      values (new.id, left(coalesce(m->>'full_name', ''), 120), coalesce(new.email, ''), left(m->>'phone', 40),
              nullif(m->>'date_of_birth', '')::date, left(m->>'gender', 40))
      on conflict (id) do nothing;
    else
      insert into public.user_profiles(id, full_name, email, phone, date_of_birth, gender)
      values (new.id, left(coalesce(m->>'full_name', ''), 120), coalesce(new.email, ''), left(m->>'phone', 40),
              nullif(m->>'date_of_birth', '')::date, left(m->>'gender', 40))
      on conflict (id) do nothing;
    end if;
  else
    update public.user_profiles set email = coalesce(new.email, ''), updated_at = now() where id = new.id and email is distinct from coalesce(new.email, '');
    update public.pal_profiles  set email = coalesce(new.email, ''), updated_at = now() where id = new.id and email is distinct from coalesce(new.email, '');
  end if;
  return new;
end; $$;
