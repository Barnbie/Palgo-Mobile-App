-- Profile settings: editable phone number (not verified yet), notification
-- preferences for both profiles, and the Pal availability switch.

alter table public.user_profiles
  add column if not exists push_enabled boolean not null default true,
  add column if not exists email_notifications boolean not null default true;

alter table public.pal_profiles
  add column if not exists push_enabled boolean not null default true,
  add column if not exists email_notifications boolean not null default true,
  add column if not exists available boolean not null default true;

alter table public.user_profiles drop constraint if exists user_phone_length_check;
alter table public.user_profiles add constraint user_phone_length_check
  check (phone is null or char_length(phone) <= 40);
alter table public.pal_profiles drop constraint if exists pal_phone_length_check;
alter table public.pal_profiles add constraint pal_phone_length_check
  check (phone is null or char_length(phone) <= 40);

-- Column-level update grants: add the new harmless columns.
grant update (phone, push_enabled, email_notifications) on public.user_profiles to authenticated;
grant update (phone, push_enabled, email_notifications, available) on public.pal_profiles to authenticated;
