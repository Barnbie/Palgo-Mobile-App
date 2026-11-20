-- Notifications: in-app feed, device push tokens, and delivery (push + email)
-- through the send-notification edge function.

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens(user_id);
alter table public.push_tokens enable row level security;
drop policy if exists "Own push tokens" on public.push_tokens;
create policy "Own push tokens" on public.push_tokens for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'pal')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "Read own notifications" on public.notifications;
create policy "Read own notifications" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Mark own notifications read" on public.notifications;
create policy "Mark own notifications read" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, delete on public.notifications from anon, authenticated;
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Shared secret so only the database can call the delivery function.
insert into public.app_settings(key, value)
values ('notify_webhook_secret', to_jsonb(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')))
on conflict (key) do nothing;
insert into public.app_settings(key, value)
values ('notify_function_url', to_jsonb('https://uavbrpmezbodtwyyqfvj.supabase.co/functions/v1/send-notification'::text))
on conflict (key) do nothing;

-- After a notification row is stored, ask the edge function to deliver it.
create or replace function public.deliver_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  fn_url text := (select (value #>> '{}') from public.app_settings where key = 'notify_function_url');
  secret text := (select (value #>> '{}') from public.app_settings where key = 'notify_webhook_secret');
begin
  if fn_url is null or secret is null then return new; end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    body := jsonb_build_object('id', new.id)
  );
  return new;
exception when others then
  return new; -- delivery problems must never block the errand action
end; $$;
revoke all on function public.deliver_notification() from public, anon, authenticated;
drop trigger if exists deliver_notification_after_insert on public.notifications;
create trigger deliver_notification_after_insert
  after insert on public.notifications for each row execute function public.deliver_notification();

-- Errand events create notifications.
create or replace function public.notify_errand_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op <> 'UPDATE' or new.status is not distinct from old.status then return new; end if;
  if new.status = 'accepted' then
    insert into public.notifications(user_id, role, title, body, data)
    values (new.requester_id, 'user', 'A Pal accepted your errand',
            'Your errand "' || left(new.title, 60) || '" has been accepted.',
            jsonb_build_object('errand_id', new.id, 'status', new.status));
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
revoke all on function public.notify_errand_change() from public, anon, authenticated;
drop trigger if exists notify_errand_change_after_update on public.errands;
create trigger notify_errand_change_after_update
  after update on public.errands for each row execute function public.notify_errand_change();
