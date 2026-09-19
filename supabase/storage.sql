-- =========================================
-- TRADE SCREENSHOTS STORAGE
-- =========================================

-- Create private storage bucket
insert into storage.buckets (id, name, public)
values (
  'trade-screenshots',
  'trade-screenshots',
  false
)
on conflict (id) do nothing;


-- =========================================
-- UPLOAD
-- User can upload only inside their own folder
-- =========================================

create policy "Users can upload own screenshots"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- =========================================
-- VIEW
-- User can view only their own screenshots
-- =========================================

create policy "Users can view own screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- =========================================
-- DELETE
-- User can delete only their own screenshots
-- =========================================

create policy "Users can delete own screenshots"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);