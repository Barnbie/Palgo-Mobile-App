-- Counter offers: a Pal can answer a pending errand with a different price.
-- The requester sees the offers (with the Pal's face and rating) and accepts or declines.

create table if not exists public.counter_offers (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references public.errands(id) on delete cascade,
  pal_id uuid not null references public.pal_profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 2000),
  message text check (message is null or char_length(message) <= 300),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (errand_id, pal_id)
);
create index if not exists counter_offers_errand_idx on public.counter_offers(errand_id);
create index if not exists counter_offers_pal_idx on public.counter_offers(pal_id);
alter table public.counter_offers enable row level security;
drop policy if exists "Participants read counter offers" on public.counter_offers;
create policy "Participants read counter offers" on public.counter_offers for select to authenticated
  using (
    pal_id = (select auth.uid())
    or exists (select 1 from public.errands e where e.id = errand_id and e.requester_id = (select auth.uid()))
  );
revoke insert, update, delete on public.counter_offers from anon, authenticated;

-- A Pal sends (or changes) a counter offer on a pending errand.
create or replace function public.make_counter_offer(errand_to_offer uuid, offer_amount numeric, offer_message text default null)
returns public.counter_offers language plpgsql security definer set search_path = '' as $$
declare result public.counter_offers;
begin
  if auth.uid() is null or not exists (select 1 from public.pal_profiles p where p.id = auth.uid()) then
    raise exception 'Only signed-in Pals can send counter offers.';
  end if;
  if not exists (select 1 from public.pal_profiles p where p.id = auth.uid() and p.pal_profile_complete) then
    raise exception 'Complete your Pal profile before sending counter offers.';
  end if;
  if public.require_verified_pals()
     and not exists (select 1 from public.pal_profiles p where p.id = auth.uid() and p.verification_status = 'verified') then
    raise exception 'Your identity must be verified before you can send counter offers.';
  end if;
  if offer_amount is null or offer_amount < 2000 then
    raise exception 'The minimum amount is 2,000.';
  end if;
  if not exists (
    select 1 from public.errands e
    where e.id = errand_to_offer and e.status = 'pending' and e.pal_id is null and e.requester_id <> auth.uid()
  ) then
    raise exception 'This errand is no longer available.';
  end if;
  insert into public.counter_offers(errand_id, pal_id, amount, message)
  values (errand_to_offer, auth.uid(), round(offer_amount, 2), nullif(left(trim(coalesce(offer_message, '')), 300), ''))
  on conflict (errand_id, pal_id) do update
    set amount = excluded.amount, message = excluded.message, status = 'pending', updated_at = now()
  returning * into result;
  return result;
end; $$;
revoke all on function public.make_counter_offer(uuid, numeric, text) from public, anon;
grant execute on function public.make_counter_offer(uuid, numeric, text) to authenticated;

-- The requester accepts an offer: the Pal is assigned and the price becomes the offer.
create or replace function public.accept_counter_offer(offer_to_accept uuid)
returns public.errands language plpgsql security definer set search_path = '' as $$
declare offer public.counter_offers; result public.errands;
begin
  select o.* into offer from public.counter_offers o
    join public.errands e on e.id = o.errand_id
    where o.id = offer_to_accept and e.requester_id = auth.uid() and o.status = 'pending';
  if offer.id is null then raise exception 'This offer is no longer available.'; end if;
  perform set_config('palgo.skip_accept_notice', '1', true);
  update public.errands set pal_id = offer.pal_id, amount = offer.amount, status = 'accepted', updated_at = now()
    where id = offer.errand_id and status = 'pending' and pal_id is null and requester_id = auth.uid()
    returning * into result;
  if result.id is null then raise exception 'This errand is no longer waiting for a Pal.'; end if;
  update public.counter_offers set status = 'accepted', updated_at = now() where id = offer.id;
  update public.counter_offers set status = 'declined', updated_at = now()
    where errand_id = offer.errand_id and id <> offer.id and status = 'pending';
  return result;
end; $$;
revoke all on function public.accept_counter_offer(uuid) from public, anon;
grant execute on function public.accept_counter_offer(uuid) to authenticated;

create or replace function public.decline_counter_offer(offer_to_decline uuid)
returns public.counter_offers language plpgsql security definer set search_path = '' as $$
declare result public.counter_offers;
begin
  update public.counter_offers o set status = 'declined', updated_at = now()
    from public.errands e
    where o.id = offer_to_decline and e.id = o.errand_id and e.requester_id = auth.uid() and o.status = 'pending'
    returning o.* into result;
  if result.id is null then raise exception 'This offer is no longer available.'; end if;
  return result;
end; $$;
revoke all on function public.decline_counter_offer(uuid) from public, anon;
grant execute on function public.decline_counter_offer(uuid) to authenticated;

-- Offers for the signed-in person: a requester sees pending offers on their errands (with the
-- Pal's details); a Pal sees the offers they sent.
create or replace function public.get_counter_offers()
returns setof jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', o.id, 'errandId', o.errand_id, 'palUserId', o.pal_id, 'amount', o.amount,
    'message', o.message, 'status', o.status, 'createdAt', o.created_at,
    'pal', jsonb_build_object(
      'userId', p.id, 'name', p.full_name, 'skills', p.services,
      'rating', coalesce(r.average_rating, 0), 'reviewCount', coalesce(r.review_count, 0),
      'profilePhotoPath', p.profile_photo_path, 'idVerified', p.verification_status = 'verified')
  )
  from public.counter_offers o
  join public.errands e on e.id = o.errand_id
  join public.pal_profiles p on p.id = o.pal_id
  left join lateral (select * from public.get_profile_rating(p.id, 'pal')) r on true
  where auth.uid() is not null
    and ((e.requester_id = auth.uid() and o.status = 'pending' and e.status = 'pending') or o.pal_id = auth.uid())
  order by o.created_at desc;
$$;
revoke all on function public.get_counter_offers() from public, anon;
grant execute on function public.get_counter_offers() to authenticated;

-- The requester may see the photo of a Pal who sent an offer on their errand.
drop policy if exists "Requesters view photos of offering Pals" on storage.objects;
create policy "Requesters view photos of offering Pals" on storage.objects for select to authenticated
using (
  bucket_id = 'pal-profile-photos'
  and exists (
    select 1 from public.counter_offers o
    join public.errands e on e.id = o.errand_id
    where e.requester_id = (select auth.uid()) and o.status = 'pending'
      and o.pal_id::text = (storage.foldername(name))[1]
  )
);

-- Notifications for offers; do not tell the requester "a Pal accepted" when they accepted the offer.
create or replace function public.notify_counter_offer()
returns trigger language plpgsql security definer set search_path = '' as $$
declare e public.errands;
begin
  select * into e from public.errands where id = new.errand_id;
  if new.status = 'pending' and (tg_op = 'INSERT' or new.amount is distinct from old.amount) then
    insert into public.notifications(user_id, role, title, body, data)
    values (e.requester_id, 'user', 'New counter offer',
            'A Pal offered ' || to_char(new.amount, 'FM999,999,990') || ' for "' || left(e.title, 60) || '".',
            jsonb_build_object('errand_id', e.id, 'offer_id', new.id));
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.notifications(user_id, role, title, body, data)
    values (new.pal_id, 'pal', 'Your counter offer was accepted',
            'You can now start "' || left(e.title, 60) || '".', jsonb_build_object('errand_id', e.id));
  elsif tg_op = 'UPDATE' and new.status = 'declined' and old.status <> 'declined' then
    insert into public.notifications(user_id, role, title, body, data)
    values (new.pal_id, 'pal', 'Counter offer declined',
            'Your offer for "' || left(e.title, 60) || '" was not accepted.', jsonb_build_object('errand_id', e.id));
  end if;
  return new;
end; $$;
revoke all on function public.notify_counter_offer() from public, anon, authenticated;
drop trigger if exists notify_counter_offer_after_change on public.counter_offers;
create trigger notify_counter_offer_after_change
  after insert or update on public.counter_offers for each row execute function public.notify_counter_offer();

create or replace function public.notify_errand_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op <> 'UPDATE' or new.status is not distinct from old.status then return new; end if;
  if new.status = 'accepted' then
    if coalesce(current_setting('palgo.skip_accept_notice', true), '') <> '1' then
      insert into public.notifications(user_id, role, title, body, data)
      values (new.requester_id, 'user', 'A Pal accepted your errand',
              'Your errand "' || left(new.title, 60) || '" has been accepted.',
              jsonb_build_object('errand_id', new.id, 'status', new.status));
    end if;
  elsif new.status = 'active' then
    insert into public.notifications(user_id, role, title, body, data)
    values (new.requester_id, 'user', 'Your errand has started',
            'Your Pal has started "' || left(new.title, 60) || '".',
            jsonb_build_object('errand_id', new.id, 'status', new.status));
  elsif new.status = 'pal_completed' then
    insert into public.notifications(user_id, role, title, body, data)
    values (new.requester_id, 'user', 'Please confirm your errand',
            'Your Pal says "' || left(new.title, 60) || '" is done. Confirm to complete it.',
            jsonb_build_object('errand_id', new.id, 'status', new.status));
  elsif new.status = 'completed' and new.pal_id is not null then
    insert into public.notifications(user_id, role, title, body, data)
    values (new.pal_id, 'pal', 'Errand confirmed',
            'The errand "' || left(new.title, 60) || '" was confirmed as complete.',
            jsonb_build_object('errand_id', new.id, 'status', new.status));
  elsif new.status = 'cancelled' and old.pal_id is not null then
    insert into public.notifications(user_id, role, title, body, data)
    values (old.pal_id, 'pal', 'Errand cancelled',
            'The errand "' || left(new.title, 60) || '" was cancelled.',
            jsonb_build_object('errand_id', new.id, 'status', new.status));
  end if;
  return new;
end; $$;
