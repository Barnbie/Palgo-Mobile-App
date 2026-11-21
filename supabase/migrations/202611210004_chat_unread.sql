-- When each person last opened an errand's chat, so unread messages can be counted.
create table if not exists public.chat_reads (
  errand_id uuid not null references public.errands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'pal')),
  last_read_at timestamptz not null default now(),
  primary key (errand_id, user_id, role)
);
alter table public.chat_reads enable row level security;

create or replace function public.mark_chat_read(errand_to_read uuid, as_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare e public.errands;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  select * into e from public.errands where id = errand_to_read;
  if not found
     or not ((as_role = 'user' and e.requester_id = auth.uid()) or (as_role = 'pal' and e.pal_id = auth.uid())) then
    raise exception 'You are not part of this errand.';
  end if;
  insert into public.chat_reads(errand_id, user_id, role, last_read_at)
  values (errand_to_read, auth.uid(), as_role, now())
  on conflict (errand_id, user_id, role) do update set last_read_at = now();
  update public.notifications set read_at = now()
   where user_id = auth.uid() and role = as_role and read_at is null
     and data->>'type' = 'message' and data->>'errand_id' = errand_to_read::text;
end $$;
revoke all on function public.mark_chat_read(uuid, text) from public, anon;
grant execute on function public.mark_chat_read(uuid, text) to authenticated;

create or replace function public.get_unread_message_count(errand_to_check uuid, as_role text)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare e public.errands; since timestamptz; result integer;
begin
  if auth.uid() is null then return 0; end if;
  select * into e from public.errands where id = errand_to_check;
  if not found
     or not ((as_role = 'user' and e.requester_id = auth.uid()) or (as_role = 'pal' and e.pal_id = auth.uid())) then
    return 0;
  end if;
  select coalesce(max(last_read_at), '-infinity'::timestamptz) into since
    from public.chat_reads where errand_id = errand_to_check and user_id = auth.uid() and role = as_role;
  select count(*)::integer into result from public.messages m
   where m.errand_id = errand_to_check and m.sender_role <> as_role and m.created_at > since;
  return result;
end $$;
revoke all on function public.get_unread_message_count(uuid, text) from public, anon;
grant execute on function public.get_unread_message_count(uuid, text) to authenticated;
