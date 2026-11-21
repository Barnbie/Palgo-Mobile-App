-- TESTING SWITCH: one account may act as both User and Pal on its own errands.
-- Turn off before launch:  update public.app_flags set allow_self_errands = false;
create table if not exists public.app_flags (
  id boolean primary key default true check (id),
  allow_self_errands boolean not null default false
);
alter table public.app_flags enable row level security;
insert into public.app_flags (id, allow_self_errands) values (true, true)
  on conflict (id) do update set allow_self_errands = true;

create or replace function public.self_errands_allowed()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((select allow_self_errands from public.app_flags where id), false); $$;
revoke all on function public.self_errands_allowed() from public, anon, authenticated;

-- Patches accept_errand, make_counter_offer, notify_pals_new_errand and the Pal feed in
-- get_account_errands so "requester <> me" also passes while the flag is on.
do $$
declare f text; d text;
begin
  foreach f in array array['accept_errand','make_counter_offer','notify_pals_new_errand','get_account_errands'] loop
    select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = f;
    d := regexp_replace(d, '((?:\m[a-z]\.)?requester_id) <> auth\.uid\(\)', '(\1 <> auth.uid() or public.self_errands_allowed())', 'g');
    d := regexp_replace(d, '(\mp\.id) <> new\.requester_id', '(\1 <> new.requester_id or public.self_errands_allowed())', 'g');
    execute d;
  end loop;
end $$;
