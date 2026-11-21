-- ===== Chat =====
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references public.errands(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'pal')),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists messages_errand_created_idx on public.messages (errand_id, created_at);
alter table public.messages enable row level security;

create policy "Errand members read messages" on public.messages for select to authenticated
using (exists (select 1 from public.errands e where e.id = errand_id
  and (e.requester_id = (select auth.uid()) or e.pal_id = (select auth.uid()))));

-- You can only write as yourself, in your own role, while the errand is accepted or running.
create policy "Errand members send messages" on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.errands e where e.id = errand_id
    and e.pal_id is not null
    and e.status in ('accepted', 'active', 'pal_completed')
    and ((sender_role = 'user' and e.requester_id = (select auth.uid()))
      or (sender_role = 'pal' and e.pal_id = (select auth.uid()))))
);

alter publication supabase_realtime add table public.messages;

-- Tell the other person about a new message. Only the first unread one pings, so a
-- busy chat does not fill the notifications page.
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare e public.errands; target uuid; target_role text; sender_name text;
begin
  select * into e from public.errands where id = new.errand_id;
  if new.sender_role = 'user' then target := e.pal_id; target_role := 'pal';
  else target := e.requester_id; target_role := 'user'; end if;
  if target is null then return new; end if;
  if exists (select 1 from public.notifications n
             where n.user_id = target and n.role = target_role and n.read_at is null
               and n.data->>'type' = 'message' and n.data->>'errand_id' = new.errand_id::text) then
    return new;
  end if;
  select split_part(p.full_name, ' ', 1) into sender_name
    from (select full_name from public.user_profiles where id = new.sender_id and new.sender_role = 'user'
          union all select full_name from public.pal_profiles where id = new.sender_id and new.sender_role = 'pal') p limit 1;
  insert into public.notifications(user_id, role, title, body, data)
  values (target, target_role, 'New message from ' || coalesce(nullif(sender_name, ''), 'your errand partner'),
          left(new.body, 90),
          jsonb_build_object('errand_id', new.errand_id, 'type', 'message'));
  return new;
end $$;
revoke all on function public.notify_new_message() from public, anon, authenticated;
create trigger notify_new_message_after_insert after insert on public.messages
  for each row execute function public.notify_new_message();

-- The other person's phone number, for the call button. Only members of an accepted errand.
create or replace function public.get_errand_contact_phone(errand_to_call uuid, as_role text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare e public.errands; result text;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  select * into e from public.errands where id = errand_to_call;
  if not found or e.pal_id is null then raise exception 'There is nobody to call yet.'; end if;
  if as_role = 'user' and e.requester_id = auth.uid() then
    select phone into result from public.pal_profiles where id = e.pal_id;
  elsif as_role = 'pal' and e.pal_id = auth.uid() then
    select phone into result from public.user_profiles where id = e.requester_id;
  else raise exception 'You are not part of this errand.'; end if;
  return result;
end $$;
revoke all on function public.get_errand_contact_phone(uuid, text) from public, anon;
grant execute on function public.get_errand_contact_phone(uuid, text) to authenticated;

-- ===== Cancelling an accepted or running errand =====
create table if not exists public.errand_cancellations (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references public.errands(id) on delete cascade,
  cancelled_by uuid not null references auth.users(id),
  cancelled_by_role text not null check (cancelled_by_role in ('user', 'pal')),
  reason text not null,
  note text,
  stage text not null check (stage in ('pending', 'accepted', 'started')),
  -- true when it was cancelled after the errand started and both sides did not agree.
  -- Nothing is charged yet; this only records it until payments are connected.
  penalty_flag boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.errand_cancellations enable row level security;

create or replace function public.cancel_errand(
  errand_to_cancel uuid, as_role text, cancel_reason text, cancel_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.errands; stage text; flagged boolean;
  agreed constant text := 'We agreed to cancel together';
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if as_role not in ('user', 'pal') then raise exception 'Unknown role.'; end if;
  if nullif(btrim(coalesce(cancel_reason, '')), '') is null then raise exception 'Please choose a reason.'; end if;
  select * into e from public.errands where id = errand_to_cancel for update;
  if not found then raise exception 'Errand not found.'; end if;
  if as_role = 'user' and e.requester_id <> auth.uid() then raise exception 'This is not your errand.'; end if;
  if as_role = 'pal' and e.pal_id is distinct from auth.uid() then raise exception 'You are not the Pal on this errand.'; end if;
  if e.status not in ('pending', 'accepted', 'active') then
    raise exception 'This errand can no longer be cancelled.';
  end if;
  stage := case e.status when 'active' then 'started' when 'accepted' then 'accepted' else 'pending' end;
  flagged := stage = 'started' and cancel_reason <> agreed;
  insert into public.errand_cancellations(errand_id, cancelled_by, cancelled_by_role, reason, note, stage, penalty_flag)
  values (e.id, auth.uid(), as_role, left(cancel_reason, 120), nullif(left(btrim(coalesce(cancel_note, '')), 300), ''), stage, flagged);

  if as_role = 'user' then
    update public.errands set status = 'cancelled', updated_at = now() where id = e.id;
  else
    -- A Pal stepping away puts the errand back in front of other Pals.
    delete from public.counter_offers where errand_id = e.id and pal_id = e.pal_id;
    update public.errands set status = 'pending', pal_id = null, updated_at = now() where id = e.id;
    insert into public.notifications(user_id, role, title, body, data)
    values (e.requester_id, 'user', 'Your Pal cancelled',
            'Your errand "' || left(e.title, 60) || '" is open again so another Pal can take it.',
            jsonb_build_object('errand_id', e.id, 'status', 'pending'));
  end if;
  return jsonb_build_object('penalty', flagged, 'stage', stage);
end $$;
revoke all on function public.cancel_errand(uuid, text, text, text) from public, anon;
grant execute on function public.cancel_errand(uuid, text, text, text) to authenticated;
