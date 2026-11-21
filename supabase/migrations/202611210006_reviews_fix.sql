-- Reviews: one per errand per role; "cannot review yourself" now lives in the function so the
-- same-account testing switch (allow_self_errands) can lift it. Plus has_reviewed_errand().
alter table public.profile_reviews drop constraint if exists profile_reviews_check;
alter table public.profile_reviews drop constraint if exists profile_reviews_errand_id_reviewer_id_key;
alter table public.profile_reviews add constraint profile_reviews_errand_reviewer_role_key unique (errand_id, reviewer_id, reviewer_role);

create or replace function public.submit_profile_review(errand_to_review uuid, stars smallint, words text default '', as_role text default null)
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
  if target = auth.uid() and not public.self_errands_allowed() then
    raise exception 'You cannot review yourself.';
  end if;
  if exists (select 1 from public.profile_reviews r where r.errand_id=e.id and r.reviewer_id=auth.uid() and r.reviewer_role=acting_role) then
    raise exception 'You have already reviewed this errand.';
  end if;
  insert into public.profile_reviews(errand_id,reviewer_id,reviewee_id,reviewer_role,reviewee_role,rating,review_text)
  values(e.id,auth.uid(),target,acting_role,case when acting_role='user' then 'pal' else 'user' end,stars,left(coalesce(words,''),2000)) returning * into result;
  return result;
end; $$;
revoke all on function public.submit_profile_review(uuid, smallint, text, text) from public, anon;
grant execute on function public.submit_profile_review(uuid, smallint, text, text) to authenticated;

create or replace function public.has_reviewed_errand(errand_to_check uuid, as_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profile_reviews r
                 where r.errand_id = errand_to_check and r.reviewer_id = auth.uid() and r.reviewer_role = as_role);
$$;
revoke all on function public.has_reviewed_errand(uuid, text) from public, anon;
grant execute on function public.has_reviewed_errand(uuid, text) to authenticated;
