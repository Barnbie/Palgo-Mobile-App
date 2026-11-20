-- Security hardening: profile tables become the single source of truth.
--
-- Before this migration the app trusted `auth.users.raw_user_meta_data`, which
-- every signed-in user can edit, for roles, Pal profile completion, Pal
-- verification status and even the Pal's ID number. This migration:
--   1. stops the auth trigger from creating/upgrading profiles from metadata
--   2. moves ID number, address and the rest of the Pal data into pal_profiles
--      and scrubs it from auth metadata
--   3. makes verification_status writable only by admins (service role / SQL)
--   4. scopes profile-photo reads to the owner and their errand counterpart
--   5. stops leaking exact addresses of pending errands to every Pal
-- Safe to re-run.

------------------------------------------------------------------------------
-- 1. Settings (no client access: RLS on, no policies)
------------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
-- Flip to true once Pal identity review exists. While false, a Pal with a
-- complete profile can accept errands (current testing behaviour).
insert into public.app_settings(key, value)
values ('require_verified_pals', 'false'::jsonb)
on conflict (key) do nothing;

create or replace function public.require_verified_pals()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (value)::text::boolean from public.app_settings where key = 'require_verified_pals'), false);
$$;
revoke all on function public.require_verified_pals() from public, anon, authenticated;

------------------------------------------------------------------------------
-- 2. Auth trigger: create the first profile at sign-up, then only sync email.
--    Pal details are NEVER read from metadata any more.
------------------------------------------------------------------------------
drop trigger if exists sync_role_profile_after_auth_change on auth.users;

create or replace function public.sync_role_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if tg_op = 'INSERT' then
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
revoke all on function public.sync_role_profile() from public, anon, authenticated;

create trigger sync_role_profile_after_auth_change
after insert or update of email on auth.users
for each row execute function public.sync_role_profile();

------------------------------------------------------------------------------
-- 3. Backfill Pal data from metadata into pal_profiles, then scrub metadata.
------------------------------------------------------------------------------
update public.pal_profiles p set
  id_type          = coalesce(p.id_type, u.raw_user_meta_data->>'pal_id_type'),
  id_number        = coalesce(p.id_number, u.raw_user_meta_data->>'pal_id_number'),
  address          = coalesce(p.address, u.raw_user_meta_data->>'pal_address'),
  city             = coalesce(p.city, u.raw_user_meta_data->>'pal_city'),
  state            = coalesce(p.state, u.raw_user_meta_data->>'pal_state'),
  occupation       = coalesce(p.occupation, u.raw_user_meta_data->>'pal_occupation'),
  other_service    = coalesce(p.other_service, u.raw_user_meta_data->>'pal_other_service'),
  experience       = coalesce(p.experience, u.raw_user_meta_data->>'pal_experience'),
  about            = coalesce(p.about, u.raw_user_meta_data->>'pal_about'),
  id_document_path = coalesce(p.id_document_path, u.raw_user_meta_data->>'pal_id_document_path'),
  profile_photo_path = coalesce(p.profile_photo_path, u.raw_user_meta_data->>'profile_photo_path')
from auth.users u
where u.id = p.id;

-- Only trust storage paths that live inside the owner's own folder.

update public.pal_profiles
set id_document_path = null
where id_document_path is not null and id_document_path not like id::text || '/%';
update public.pal_profiles
set profile_photo_path = null
where profile_photo_path is not null and profile_photo_path not like id::text || '/%';
update public.user_profiles
set profile_photo_path = null
where profile_photo_path is not null and profile_photo_path not like id::text || '/%';

update public.pal_profiles set id_submitted = true where id_document_path is not null and not id_submitted;
-- Metadata is client-controlled, so nobody is "verified" because metadata said so.
update public.pal_profiles set verification_status = 'pending'
where verification_status not in ('pending', 'verified', 'rejected');

update auth.users
set raw_user_meta_data = raw_user_meta_data - array[
  'pal_id_type','pal_id_number','pal_address','pal_city','pal_state','pal_occupation','pal_services',
  'pal_other_service','pal_experience','pal_about','pal_id_submitted','pal_id_document_path',
  'pal_verification_status','pal_verification_reason','pal_profile_complete','account_roles',
  'profile_photo_path','role'
]
where raw_user_meta_data ?| array[
  'pal_id_type','pal_id_number','pal_address','pal_city','pal_state','pal_occupation','pal_services',
  'pal_other_service','pal_experience','pal_about','pal_id_submitted','pal_id_document_path',
  'pal_verification_status','pal_verification_reason','pal_profile_complete','account_roles',
  'profile_photo_path','role'
];

------------------------------------------------------------------------------
-- 4. Table integrity and column-level write access
------------------------------------------------------------------------------
alter table public.pal_profiles drop constraint if exists pal_verification_status_check;
alter table public.pal_profiles add constraint pal_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));
alter table public.pal_profiles drop constraint if exists pal_id_document_path_owner_check;
alter table public.pal_profiles add constraint pal_id_document_path_owner_check
  check (id_document_path is null or id_document_path like id::text || '/%');
alter table public.pal_profiles drop constraint if exists pal_photo_path_owner_check;
alter table public.pal_profiles add constraint pal_photo_path_owner_check
  check (profile_photo_path is null or profile_photo_path like id::text || '/%');
alter table public.user_profiles drop constraint if exists user_photo_path_owner_check;
alter table public.user_profiles add constraint user_photo_path_owner_check
  check (profile_photo_path is null or profile_photo_path like id::text || '/%');

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists touch_user_profiles on public.user_profiles;
create trigger touch_user_profiles before update on public.user_profiles for each row execute function public.touch_updated_at();
drop trigger if exists touch_pal_profiles on public.pal_profiles;
create trigger touch_pal_profiles before update on public.pal_profiles for each row execute function public.touch_updated_at();

-- Clients may edit only these harmless columns directly. Everything that
-- affects trust (role tables, ID, verification, completion) goes through the
-- RPCs below or through an admin.
revoke update on public.user_profiles from anon, authenticated;
revoke update on public.pal_profiles from anon, authenticated;
grant update (full_name, date_of_birth, gender, city, state, profile_photo_path) on public.user_profiles to authenticated;
grant update (full_name, date_of_birth, gender, city, state, address, profile_photo_path,
              occupation, services, other_service, experience, about) on public.pal_profiles to authenticated;

------------------------------------------------------------------------------
-- 5. RPCs
------------------------------------------------------------------------------
-- Create or update the caller's Pal profile (creates the Pal profile for an
-- account that so far only had a User profile).
create or replace function public.save_pal_profile(details jsonb)
returns public.pal_profiles language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  base record;
  result public.pal_profiles;
  next_id_type text := nullif(btrim(coalesce(details->>'id_type', '')), '');
  next_id_number text := nullif(btrim(coalesce(details->>'id_number', '')), '');
  next_services text[];
  profile_ready boolean;
begin
  if me is null then raise exception 'Sign in to save your Pal profile.'; end if;

  next_services := coalesce(array(select left(btrim(t.v), 80) from jsonb_array_elements_text(coalesce(details->'services', '[]'::jsonb)) as t(v) where btrim(t.v) <> ''), '{}');
  if cardinality(next_services) > 20 then raise exception 'Too many services selected.'; end if;

  if not exists (select 1 from public.pal_profiles where id = me) then
    select coalesce(up.full_name, au.raw_user_meta_data->>'full_name', '') as full_name, coalesce(au.email, '') as email,
           up.phone as phone, up.date_of_birth as date_of_birth, up.gender as gender
      into base
      from auth.users au left join public.user_profiles up on up.id = au.id
      where au.id = me;
    insert into public.pal_profiles(id, full_name, email, phone, date_of_birth, gender)
    values (me, coalesce(base.full_name, ''), coalesce(base.email, ''), base.phone, base.date_of_birth, base.gender);
  end if;

  update public.pal_profiles p set
    address = left(coalesce(nullif(btrim(details->>'address'), ''), p.address), 300),
    city = left(coalesce(nullif(btrim(details->>'city'), ''), p.city), 120),
    state = left(coalesce(nullif(btrim(details->>'state'), ''), p.state), 120),
    id_type = coalesce(next_id_type, p.id_type),
    id_number = left(coalesce(next_id_number, p.id_number), 80),
    occupation = left(coalesce(nullif(btrim(details->>'occupation'), ''), p.occupation), 120),
    services = case when details ? 'services' then next_services else p.services end,
    other_service = case when details ? 'other_service' then left(nullif(btrim(details->>'other_service'), ''), 120) else p.other_service end,
    experience = case when details ? 'experience' then left(nullif(btrim(details->>'experience'), ''), 120) else p.experience end,
    about = case when details ? 'about' then left(nullif(btrim(details->>'about'), ''), 2000) else p.about end,
    -- Changing the ID sends the profile back to review.
    verification_status = case
      when (next_id_type is not null and next_id_type is distinct from p.id_type)
        or (next_id_number is not null and next_id_number is distinct from p.id_number)
      then 'pending' else p.verification_status end
  where p.id = me
  returning * into result;

  profile_ready := result.address is not null and result.city is not null and result.state is not null
    and result.id_type is not null and result.id_number is not null
    and (result.occupation is not null or cardinality(result.services) > 0);

  update public.pal_profiles set pal_profile_complete = profile_ready where id = me returning * into result;
  return result;
end; $$;
revoke all on function public.save_pal_profile(jsonb) from public, anon;
grant execute on function public.save_pal_profile(jsonb) to authenticated;

-- Record that the caller uploaded an ID photo (path must be inside their folder).
create or replace function public.register_pal_identity_document(document_path text)
returns public.pal_profiles language plpgsql security definer set search_path = '' as $$
declare result public.pal_profiles;
begin
  if auth.uid() is null then raise exception 'Sign in to upload your ID.'; end if;
  if document_path is null or document_path not like auth.uid()::text || '/%' then
    raise exception 'That file is not in your private ID folder.';
  end if;
  update public.pal_profiles
  set id_document_path = document_path, id_submitted = true, verification_status = 'pending'
  where id = auth.uid()
  returning * into result;
  if result.id is null then raise exception 'Create your Pal profile before uploading an ID.'; end if;
  return result;
end; $$;
revoke all on function public.register_pal_identity_document(text) from public, anon;
grant execute on function public.register_pal_identity_document(text) to authenticated;

-- Give a Pal-only account a User profile (the reverse is save_pal_profile).
create or replace function public.add_user_profile()
returns public.user_profiles language plpgsql security definer set search_path = '' as $$
declare result public.user_profiles; base record;
begin
  if auth.uid() is null then raise exception 'Sign in to add a User profile.'; end if;
  select * into result from public.user_profiles where id = auth.uid();
  if result.id is not null then return result; end if;
  select coalesce(pp.full_name, au.raw_user_meta_data->>'full_name', '') as full_name, coalesce(au.email, '') as email,
         pp.phone, pp.date_of_birth, pp.gender, pp.city, pp.state, pp.profile_photo_path
    into base from auth.users au left join public.pal_profiles pp on pp.id = au.id where au.id = auth.uid();
  insert into public.user_profiles(id, full_name, email, phone, date_of_birth, gender, city, state, profile_photo_path)
  values (auth.uid(), coalesce(base.full_name, ''), base.email, base.phone, base.date_of_birth, base.gender, base.city, base.state, base.profile_photo_path)
  returning * into result;
  return result;
end; $$;
revoke all on function public.add_user_profile() from public, anon;
grant execute on function public.add_user_profile() to authenticated;

------------------------------------------------------------------------------
-- 6. Errands: Pals no longer read the errands table directly (that exposed
--    exact addresses). They use get_account_errands, which hides them.
------------------------------------------------------------------------------
drop policy if exists "Participants and Pals read errands" on public.errands;
drop policy if exists "Participants read errands" on public.errands;
create policy "Participants read errands" on public.errands for select to authenticated
  using (requester_id = (select auth.uid()) or pal_id = (select auth.uid()));

create or replace function public.accept_errand(errand_to_accept uuid)
returns public.errands language plpgsql security definer set search_path = '' as $$
declare result public.errands;
begin
  if auth.uid() is null or not exists(select 1 from public.pal_profiles p where p.id = auth.uid()) then
    raise exception 'Only signed-in Pals can accept errands.';
  end if;
  if not exists(select 1 from public.pal_profiles p where p.id = auth.uid() and p.pal_profile_complete) then
    raise exception 'Complete your Pal profile before accepting errands.';
  end if;
  if public.require_verified_pals()
     and not exists(select 1 from public.pal_profiles p where p.id = auth.uid() and p.verification_status = 'verified') then
    raise exception 'Your identity must be verified before you can accept errands.';
  end if;
  update public.errands set pal_id = auth.uid(), status = 'accepted', updated_at = now()
  where id = errand_to_accept and status = 'pending' and pal_id is null and requester_id <> auth.uid()
  returning * into result;
  if result.id is null then raise exception 'This errand is no longer available.'; end if;
  return result;
end; $$;
revoke all on function public.accept_errand(uuid) from public, anon;
grant execute on function public.accept_errand(uuid) to authenticated;

create or replace function public.get_account_errands(requested_role text default null)
returns setof jsonb language plpgsql stable security definer set search_path = '' as $$
declare account_role text;
begin
  if auth.uid() is null then raise exception 'Sign in to view errands.'; end if;
  if requested_role is not null then
    if requested_role = 'user' and exists(select 1 from public.user_profiles p where p.id = auth.uid()) then account_role := 'user';
    elsif requested_role = 'pal' and exists(select 1 from public.pal_profiles p where p.id = auth.uid()) then account_role := 'pal';
    else raise exception 'This account does not have that profile type.'; end if;
  elsif exists(select 1 from public.user_profiles p where p.id = auth.uid()) and not exists(select 1 from public.pal_profiles p where p.id = auth.uid()) then account_role := 'user';
  elsif exists(select 1 from public.pal_profiles p where p.id = auth.uid()) and not exists(select 1 from public.user_profiles p where p.id = auth.uid()) then account_role := 'pal';
  else raise exception 'Choose which profile you want to use.'; end if;

  if account_role = 'user' then
    return query select to_jsonb(e) || jsonb_build_object(
      'fee', e.amount, 'category', e.service_category, 'requesterUserId', e.requester_id, 'palUserId', e.pal_id,
      'reviewedByCurrentUser', exists(select 1 from public.profile_reviews mine where mine.errand_id = e.id and mine.reviewer_id = auth.uid()),
      'pal', case when p.id is null then null else jsonb_build_object(
        'userId', p.id, 'name', p.full_name, 'skills', p.services,
        'rating', coalesce(r.average_rating, 0), 'reviewCount', coalesce(r.review_count, 0),
        'profilePhotoPath', p.profile_photo_path, 'phoneVerified', false,
        'idVerified', p.verification_status = 'verified') end
    ) from public.errands e
      left join public.pal_profiles p on p.id = e.pal_id
      left join lateral (select * from public.get_profile_rating(p.id, 'pal')) r on true
      where e.requester_id = auth.uid() order by e.created_at desc;
  else
    return query select
      case
        when e.pal_id is null then
          -- Not accepted yet: show only the area, never the street address or private notes.
          (to_jsonb(e) - 'location' - 'special_notes')
          || jsonb_build_object(
               'location', coalesce(nullif(concat_ws(', ', e.city, e.state), ''), 'Exact address is shared after you accept'),
               'special_notes', null, 'locationHidden', true)
        else to_jsonb(e)
      end || jsonb_build_object(
      'fee', e.amount, 'category', e.service_category, 'requesterUserId', e.requester_id, 'palUserId', e.pal_id,
      'reviewedByCurrentUser', exists(select 1 from public.profile_reviews mine where mine.errand_id = e.id and mine.reviewer_id = auth.uid()),
      'person', jsonb_build_object(
        'userId', u.id,
        'name', case when e.pal_id is null then split_part(u.full_name, ' ', 1) else u.full_name end,
        'rating', coalesce(r.average_rating, 0), 'reviewCount', coalesce(r.review_count, 0),
        'city', u.city, 'state', u.state,
        'profilePhotoPath', case when e.pal_id is null then null else u.profile_photo_path end,
        'phoneVerified', false, 'idVerified', false)
    ) from public.errands e
      join public.user_profiles u on u.id = e.requester_id
      left join lateral (select * from public.get_profile_rating(u.id, 'user')) r on true
      where e.pal_id = auth.uid() or (e.requester_id <> auth.uid() and e.status = 'pending' and e.pal_id is null)
      order by e.created_at desc;
  end if;
end; $$;
revoke all on function public.get_account_errands(text) from public, anon;
grant execute on function public.get_account_errands(text) to authenticated;

------------------------------------------------------------------------------
-- 7. Storage: profile photos readable only by the owner and by the other
--    person on a shared, assigned errand. ID documents stay owner-only.
------------------------------------------------------------------------------
drop policy if exists "Participants can view profile photos" on storage.objects;
drop policy if exists "Errand counterparts view profile photos" on storage.objects;
create policy "Errand counterparts view profile photos" on storage.objects for select to authenticated
using (
  bucket_id = 'pal-profile-photos'
  and exists (
    select 1 from public.errands e
    where e.status in ('accepted', 'active', 'pal_completed', 'completed')
      and (
        (e.requester_id = (select auth.uid()) and e.pal_id::text = (storage.foldername(name))[1])
        or (e.pal_id = (select auth.uid()) and e.requester_id::text = (storage.foldername(name))[1])
      )
  )
);

------------------------------------------------------------------------------
-- 8. Signed-out visitors may not call the app's functions (Supabase grants
--    anon execute by default).
------------------------------------------------------------------------------
revoke execute on function public.get_account_roles() from anon;
revoke execute on function public.get_profile_rating(uuid, text) from anon;
revoke execute on function public.submit_profile_review(uuid, smallint, text, text) from anon;
revoke execute on function public.update_errand_status(uuid, text) from anon;
