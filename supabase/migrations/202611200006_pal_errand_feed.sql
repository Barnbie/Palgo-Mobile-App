-- Pals choose what they receive: only errands that match the skills they signed up with
-- (the default) or every errand. Matching Pals are also notified when an errand is posted.

alter table public.pal_profiles add column if not exists receive_all_errands boolean not null default false;
grant update (receive_all_errands) on public.pal_profiles to authenticated;

-- Which Pal skills can do which errand category.
create or replace function public.skills_for_category(category text)
returns text[] language sql immutable set search_path = '' as $$
  select case category
    when 'Grocery' then array['Errand','Delivery','Chef']
    when 'Pickup' then array['Errand','Delivery']
    when 'Delivery' then array['Delivery','Errand']
    when 'General errand' then array['Errand','Delivery','House chores']
    when 'Cleaning' then array['House chores','Car wash','Nanny']
    when 'Repairs' then array['Plumbing','Electrician','Mechanic','Tailor']
    else null end;
$$;

-- True when this Pal should see an errand of this category.
create or replace function public.pal_wants_errand(pal uuid, category text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pal_profiles p
    where p.id = pal
      and (
        p.receive_all_errands
        or public.skills_for_category(category) is null           -- "Others": any Pal
        or p.services && public.skills_for_category(category)
        or 'Others' = any(p.services)
      )
  );
$$;
revoke all on function public.pal_wants_errand(uuid, text) from public, anon, authenticated;

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
      where e.pal_id = auth.uid()
         or (e.requester_id <> auth.uid() and e.status = 'pending' and e.pal_id is null
             and public.pal_wants_errand(auth.uid(), e.service_category))
      order by e.created_at desc;
  end if;
end; $$;
revoke all on function public.get_account_errands(text) from public, anon;
grant execute on function public.get_account_errands(text) to authenticated;

-- Tell matching, available Pals when a new errand is posted.
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
    and public.pal_wants_errand(p.id, new.service_category);
  return new;
end; $$;
revoke all on function public.notify_pals_new_errand() from public, anon, authenticated;
drop trigger if exists notify_pals_new_errand_after_insert on public.errands;
create trigger notify_pals_new_errand_after_insert
  after insert on public.errands for each row execute function public.notify_pals_new_errand();
