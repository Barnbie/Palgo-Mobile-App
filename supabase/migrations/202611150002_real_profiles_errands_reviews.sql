-- Real role-separated profiles. Each profile ID is the auth.users UUID;
-- an account can have a row in either or both role tables.
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role = 'user'),
  full_name text not null default '', email text not null default '', phone text,
  date_of_birth date, gender text, city text, state text, profile_photo_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.pal_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'pal' check (role = 'pal'),
  full_name text not null default '', email text not null default '', phone text,
  date_of_birth date, gender text, profile_photo_path text,
  address text, city text, state text, id_type text, id_number text, id_document_path text,
  id_submitted boolean not null default false, verification_status text not null default 'pending',
  occupation text, services text[] not null default '{}', other_service text,
  experience text, about text, pal_profile_complete boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
alter table public.pal_profiles enable row level security;
drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile" on public.user_profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Users update own profile" on public.user_profiles;
create policy "Users update own profile" on public.user_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'user');
drop policy if exists "Pals read own profile" on public.pal_profiles;
create policy "Pals read own profile" on public.pal_profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Pals update own profile" on public.pal_profiles;
create policy "Pals update own profile" on public.pal_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'pal');

create or replace function public.sync_role_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  -- A Supabase auth user is one login identity. It may own both a User and
  -- Pal profile; adding the second role must never erase the first profile.
  if exists(select 1 from public.user_profiles where id=new.id) or m ->> 'role' = 'user' then
    insert into public.user_profiles(id,full_name,email,phone,date_of_birth,gender,city,state,profile_photo_path)
    values(new.id,coalesce(m->>'full_name',''),coalesce(new.email,''),m->>'phone',nullif(m->>'date_of_birth','')::date,m->>'gender',m->>'city',m->>'state',m->>'profile_photo_path')
    on conflict(id) do update set full_name=excluded.full_name,email=excluded.email,phone=excluded.phone,date_of_birth=excluded.date_of_birth,gender=excluded.gender,city=coalesce(excluded.city,public.user_profiles.city),state=coalesce(excluded.state,public.user_profiles.state),profile_photo_path=coalesce(excluded.profile_photo_path,public.user_profiles.profile_photo_path),updated_at=now();
  end if;
  if exists(select 1 from public.pal_profiles where id=new.id) or m ->> 'role' = 'pal' or coalesce((m->>'pal_profile_complete')::boolean,false) then
    insert into public.pal_profiles(id,full_name,email,phone,date_of_birth,gender,profile_photo_path,address,city,state,id_type,id_number,id_document_path,id_submitted,verification_status,occupation,services,other_service,experience,about,pal_profile_complete)
    values(new.id,coalesce(m->>'full_name',''),coalesce(new.email,''),m->>'phone',nullif(m->>'date_of_birth','')::date,m->>'gender',m->>'profile_photo_path',m->>'pal_address',m->>'pal_city',m->>'pal_state',m->>'pal_id_type',m->>'pal_id_number',m->>'pal_id_document_path',coalesce((m->>'pal_id_submitted')::boolean,false),'pending',m->>'pal_occupation',coalesce(array(select jsonb_array_elements_text(coalesce(m->'pal_services','[]'::jsonb))),'{}'),m->>'pal_other_service',m->>'pal_experience',m->>'pal_about',coalesce((m->>'pal_profile_complete')::boolean,false))
    on conflict(id) do update set full_name=excluded.full_name,email=excluded.email,phone=excluded.phone,date_of_birth=excluded.date_of_birth,gender=excluded.gender,profile_photo_path=coalesce(excluded.profile_photo_path,public.pal_profiles.profile_photo_path),address=coalesce(excluded.address,public.pal_profiles.address),city=coalesce(excluded.city,public.pal_profiles.city),state=coalesce(excluded.state,public.pal_profiles.state),id_type=coalesce(excluded.id_type,public.pal_profiles.id_type),id_number=coalesce(excluded.id_number,public.pal_profiles.id_number),id_document_path=coalesce(excluded.id_document_path,public.pal_profiles.id_document_path),id_submitted=excluded.id_submitted or public.pal_profiles.id_submitted,verification_status=public.pal_profiles.verification_status,occupation=coalesce(excluded.occupation,public.pal_profiles.occupation),services=case when cardinality(excluded.services)>0 then excluded.services else public.pal_profiles.services end,other_service=coalesce(excluded.other_service,public.pal_profiles.other_service),experience=coalesce(excluded.experience,public.pal_profiles.experience),about=coalesce(excluded.about,public.pal_profiles.about),pal_profile_complete=excluded.pal_profile_complete or public.pal_profiles.pal_profile_complete,updated_at=now();
  end if;
  return new;
end; $$;
drop trigger if exists sync_role_profile_after_auth_change on auth.users;
create trigger sync_role_profile_after_auth_change after insert or update of email,raw_user_meta_data on auth.users for each row execute function public.sync_role_profile();

-- Backfill profile rows for accounts that existed before this migration.
insert into public.user_profiles(id,full_name,email,phone,date_of_birth,gender,city,state,profile_photo_path)
select id,coalesce(raw_user_meta_data->>'full_name',''),coalesce(email,''),raw_user_meta_data->>'phone',nullif(raw_user_meta_data->>'date_of_birth','')::date,raw_user_meta_data->>'gender',raw_user_meta_data->>'city',raw_user_meta_data->>'state',raw_user_meta_data->>'profile_photo_path' from auth.users where raw_user_meta_data->>'role'='user' on conflict(id) do nothing;
insert into public.pal_profiles(id,full_name,email,phone,date_of_birth,gender,profile_photo_path,address,city,state,id_type,id_number,id_document_path,id_submitted,verification_status,occupation,services,other_service,experience,about,pal_profile_complete)
select id,coalesce(raw_user_meta_data->>'full_name',''),coalesce(email,''),raw_user_meta_data->>'phone',nullif(raw_user_meta_data->>'date_of_birth','')::date,raw_user_meta_data->>'gender',raw_user_meta_data->>'profile_photo_path',raw_user_meta_data->>'pal_address',raw_user_meta_data->>'pal_city',raw_user_meta_data->>'pal_state',raw_user_meta_data->>'pal_id_type',raw_user_meta_data->>'pal_id_number',raw_user_meta_data->>'pal_id_document_path',coalesce((raw_user_meta_data->>'pal_id_submitted')::boolean,false),'pending',raw_user_meta_data->>'pal_occupation',coalesce(array(select jsonb_array_elements_text(coalesce(raw_user_meta_data->'pal_services','[]'::jsonb))),'{}'),raw_user_meta_data->>'pal_other_service',raw_user_meta_data->>'pal_experience',raw_user_meta_data->>'pal_about',coalesce((raw_user_meta_data->>'pal_profile_complete')::boolean,false) from auth.users where raw_user_meta_data->>'role'='pal' on conflict(id) do nothing;

-- Errands contain the real requester and Pal counterpart account UUIDs.
create table if not exists public.errands (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.user_profiles(id) on delete cascade,
  pal_id uuid references public.pal_profiles(id) on delete set null,
  title text not null, description text not null, service_category text not null,
  location text not null, city text, state text, scheduled_for timestamptz, requested_time text,
  estimated_time text, amount numeric(12,2) not null check(amount >= 2000), special_notes text,
  status text not null default 'pending' check(status in ('pending','accepted','active','pal_completed','completed','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz
);
create index if not exists errands_open_created_idx on public.errands(status,created_at desc) where status='pending';
create index if not exists errands_requester_idx on public.errands(requester_id,created_at desc);
create index if not exists errands_pal_idx on public.errands(pal_id,created_at desc);
alter table public.errands enable row level security;
drop policy if exists "Participants and Pals read errands" on public.errands;
create policy "Participants and Pals read errands" on public.errands for select to authenticated using (requester_id=(select auth.uid()) or pal_id=(select auth.uid()) or (status='pending' and exists(select 1 from public.pal_profiles p where p.id=(select auth.uid()))));
drop policy if exists "Users create their own errands" on public.errands;
create policy "Users create their own errands" on public.errands for insert to authenticated with check (requester_id=(select auth.uid()) and pal_id is null and status='pending' and exists(select 1 from public.user_profiles p where p.id=(select auth.uid())));

create or replace function public.accept_errand(errand_to_accept uuid)
returns public.errands language plpgsql security definer set search_path = '' as $$
declare result public.errands;
begin
  if auth.uid() is null or not exists(select 1 from public.pal_profiles p where p.id=auth.uid()) then raise exception 'Only signed-in Pals can accept errands.'; end if;
  if not exists(select 1 from public.pal_profiles p where p.id=auth.uid() and p.pal_profile_complete) then raise exception 'Complete your Pal profile before accepting errands.'; end if;
  update public.errands set pal_id=auth.uid(),status='accepted',updated_at=now() where id=errand_to_accept and status='pending' and pal_id is null and requester_id<>auth.uid() returning * into result;
  if result.id is null then raise exception 'This errand is no longer available.'; end if;
  return result;
end; $$;
revoke all on function public.accept_errand(uuid) from public;
grant execute on function public.accept_errand(uuid) to authenticated;

create or replace function public.update_errand_status(errand_to_update uuid,next_status text)
returns public.errands language plpgsql security definer set search_path = '' as $$
declare result public.errands;
begin
  if auth.uid() is null then raise exception 'Sign in to update this errand.'; end if;
  if next_status='active' then
    update public.errands set status='active',updated_at=now() where id=errand_to_update and pal_id=auth.uid() and status='accepted' returning * into result;
  elsif next_status='pal_completed' then
    update public.errands set status='pal_completed',updated_at=now() where id=errand_to_update and pal_id=auth.uid() and status='active' returning * into result;
  elsif next_status='completed' then
    update public.errands set status='completed',completed_at=now(),updated_at=now() where id=errand_to_update and requester_id=auth.uid() and status='pal_completed' returning * into result;
  elsif next_status='cancelled' then
    update public.errands set status='cancelled',updated_at=now() where id=errand_to_update and requester_id=auth.uid() and status='pending' returning * into result;
  else raise exception 'That errand status change is not allowed.';
  end if;
  if result.id is null then raise exception 'This errand cannot be moved to that status.'; end if;
  return result;
end; $$;
revoke all on function public.update_errand_status(uuid,text) from public;
grant execute on function public.update_errand_status(uuid,text) to authenticated;

-- A review can only be inserted by a participant after completion, once each.
create table if not exists public.profile_reviews (
  id uuid primary key default gen_random_uuid(), errand_id uuid not null references public.errands(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  reviewer_role text not null check(reviewer_role in ('user','pal')),
  reviewee_role text not null check(reviewee_role in ('user','pal')),
  rating smallint not null check(rating between 1 and 5), review_text text not null default '',
  created_at timestamptz not null default now(), check(reviewer_id<>reviewee_id), unique(errand_id,reviewer_id)
);
alter table public.profile_reviews enable row level security;
drop policy if exists "Participants read their profile reviews" on public.profile_reviews;
create policy "Participants read their profile reviews" on public.profile_reviews for select to authenticated using (reviewer_id=(select auth.uid()) or reviewee_id=(select auth.uid()));
create or replace function public.submit_profile_review(errand_to_review uuid,stars smallint,words text default '',as_role text default null)
returns public.profile_reviews language plpgsql security definer set search_path = '' as $$
declare e public.errands; result public.profile_reviews; acting_role text; target uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to leave a review.'; end if;
  if as_role is not null then
    if as_role='user' and exists(select 1 from public.user_profiles p where p.id=auth.uid()) then acting_role:='user';
    elsif as_role='pal' and exists(select 1 from public.pal_profiles p where p.id=auth.uid()) then acting_role:='pal';
    else raise exception 'This account does not have that profile type.'; end if;
  elsif exists(select 1 from public.user_profiles p where p.id=auth.uid()) and not exists(select 1 from public.pal_profiles p where p.id=auth.uid()) then acting_role:='user';
  elsif exists(select 1 from public.pal_profiles p where p.id=auth.uid()) and not exists(select 1 from public.user_profiles p where p.id=auth.uid()) then acting_role:='pal';
  else raise exception 'Choose which profile you are reviewing from.'; end if;
  select * into e from public.errands where id=errand_to_review and status='completed' and (requester_id=auth.uid() or pal_id=auth.uid());
  if e.id is null then raise exception 'Reviews are available after an errand is completed.'; end if;
  if acting_role='user' and e.requester_id=auth.uid() then target:=e.pal_id;
  elsif acting_role='pal' and e.pal_id=auth.uid() then target:=e.requester_id;
  else raise exception 'This account does not match the errand participant role.';
  end if;
  if target is null then raise exception 'This errand has no assigned counterpart.'; end if;
  insert into public.profile_reviews(errand_id,reviewer_id,reviewee_id,reviewer_role,reviewee_role,rating,review_text)
  values(e.id,auth.uid(),target,acting_role,case when acting_role='user' then 'pal' else 'user' end,stars,left(coalesce(words,''),2000)) returning * into result;
  return result;
end; $$;
revoke all on function public.submit_profile_review(uuid,smallint,text,text) from public;
grant execute on function public.submit_profile_review(uuid,smallint,text,text) to authenticated;
create or replace function public.get_profile_rating(target_profile_id uuid,target_role text default null)
returns table(average_rating numeric,review_count bigint) language sql stable security definer set search_path = '' as $$
  select coalesce(round(avg(r.rating)::numeric,1),0),count(*) from public.profile_reviews r where r.reviewee_id=target_profile_id and (target_role is null or r.reviewee_role=target_role);
$$;
revoke all on function public.get_profile_rating(uuid,text) from public;
grant execute on function public.get_profile_rating(uuid,text) to authenticated;

-- Return only fields needed to display a person's errand list; ID numbers and
-- private document paths never leave the profile owner's account.
create or replace function public.get_account_errands(requested_role text default null)
returns setof jsonb language plpgsql stable security definer set search_path = '' as $$
declare account_role text;
begin
  if auth.uid() is null then raise exception 'Sign in to view errands.'; end if;
  if requested_role is not null then
    if requested_role='user' and exists(select 1 from public.user_profiles p where p.id=auth.uid()) then account_role:='user';
    elsif requested_role='pal' and exists(select 1 from public.pal_profiles p where p.id=auth.uid()) then account_role:='pal';
    else raise exception 'This account does not have that profile type.'; end if;
  elsif exists(select 1 from public.user_profiles p where p.id=auth.uid()) and not exists(select 1 from public.pal_profiles p where p.id=auth.uid()) then account_role:='user';
  elsif exists(select 1 from public.pal_profiles p where p.id=auth.uid()) and not exists(select 1 from public.user_profiles p where p.id=auth.uid()) then account_role:='pal';
  else raise exception 'Choose which profile you want to use.'; end if;
  if account_role='user' then
    return query select to_jsonb(e) || jsonb_build_object(
      'fee',e.amount,'category',e.service_category,'requesterUserId',e.requester_id,'palUserId',e.pal_id,
      'reviewedByCurrentUser',exists(select 1 from public.profile_reviews mine where mine.errand_id=e.id and mine.reviewer_id=auth.uid()),
      'pal',case when p.id is null then null else jsonb_build_object('userId',p.id,'name',p.full_name,'skills',p.services,'rating',coalesce(r.average_rating,0),'reviewCount',coalesce(r.review_count,0),'profilePhotoPath',p.profile_photo_path,'phoneVerified',false,'idVerified',p.verification_status='verified') end
    ) from public.errands e left join public.pal_profiles p on p.id=e.pal_id
      left join lateral (select * from public.get_profile_rating(p.id,'pal')) r on true
      where e.requester_id=auth.uid() order by e.created_at desc;
  else
    return query select to_jsonb(e) || jsonb_build_object(
      'fee',e.amount,'category',e.service_category,'requesterUserId',e.requester_id,'palUserId',e.pal_id,
      'reviewedByCurrentUser',exists(select 1 from public.profile_reviews mine where mine.errand_id=e.id and mine.reviewer_id=auth.uid()),
      'person',jsonb_build_object('userId',u.id,'name',u.full_name,'rating',coalesce(r.average_rating,0),'reviewCount',coalesce(r.review_count,0),'city',u.city,'state',u.state,'profilePhotoPath',u.profile_photo_path,'phoneVerified',false,'idVerified',false)
    ) from public.errands e join public.user_profiles u on u.id=e.requester_id
      left join lateral (select * from public.get_profile_rating(u.id,'user')) r on true
      where e.pal_id=auth.uid() or (e.requester_id<>auth.uid() and e.status='pending' and e.pal_id is null) order by e.created_at desc;
  end if;
end; $$;
revoke all on function public.get_account_errands(text) from public;
grant execute on function public.get_account_errands(text) to authenticated;

create or replace function public.get_account_roles()
returns text[] language sql stable security definer set search_path = '' as $$
  select array_remove(array[
    case when exists(select 1 from public.user_profiles p where p.id=auth.uid()) then 'user' end,
    case when exists(select 1 from public.pal_profiles p where p.id=auth.uid()) then 'pal' end
  ],null);
$$;
revoke all on function public.get_account_roles() from public;
grant execute on function public.get_account_roles() to authenticated;

grant select on public.user_profiles to authenticated;
grant select on public.pal_profiles to authenticated;
grant select,insert on public.errands to authenticated;
grant select on public.profile_reviews to authenticated;

-- Profile pictures are visible to signed-in errand participants; identity
-- documents remain private and are never covered by this policy.
drop policy if exists "Participants can view profile photos" on storage.objects;
create policy "Participants can view profile photos" on storage.objects for select to authenticated using (bucket_id='pal-profile-photos');
