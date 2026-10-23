-- Private document bucket. Objects are only reachable through short-lived
-- signed URLs generated server-side.
--
-- Path layout:
--   invoices/<client_id>/<uuid>-<filename>   client invoice documents
--   scans/<scan_id>/<uuid>-<filename>        prospect Cash Leak Scan uploads

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic']
)
on conflict (id) do update set public = false;

create policy documents_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'documents' and public.is_admin())
  with check (bucket_id = 'documents' and public.is_admin());

create policy documents_client_read on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'invoices'
    and (storage.foldername(name))[2] = public.my_client_id()::text
  );
