-- Private storage for PAL identity photos. Run in the Supabase SQL editor once.
insert into storage.buckets (id, name, public)
values ('pal-identity-documents', 'pal-identity-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "PALs upload their own ID documents" on storage.objects;
create policy "PALs upload their own ID documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'pal-identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "PALs update their own ID documents" on storage.objects;
create policy "PALs update their own ID documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'pal-identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'pal-identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "PALs view their own ID documents" on storage.objects;
create policy "PALs view their own ID documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'pal-identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "PALs delete their own ID documents" on storage.objects;
create policy "PALs delete their own ID documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'pal-identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Private profile photos are readable only by their owner; the app uses short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('pal-profile-photos', 'pal-profile-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Users manage their own profile photos" on storage.objects;
create policy "Users manage their own profile photos"
on storage.objects for all to authenticated
using (
  bucket_id = 'pal-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'pal-profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
