-- Support and problem reports are stored in the database until a support mailbox exists.
-- Members can send and read their own requests; staff read them in the Supabase dashboard.
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 4000),
  acting_role text check (acting_role in ('user','pal')),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

alter table public.support_requests enable row level security;

create policy "Members send their own support requests"
  on public.support_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'open');

create policy "Members read their own support requests"
  on public.support_requests for select to authenticated
  using (user_id = auth.uid());

revoke all on public.support_requests from anon;
revoke update, delete on public.support_requests from authenticated;

create index support_requests_user_idx on public.support_requests (user_id, created_at desc);
