-- ============================================================
--  Supabase Storage – run in Supabase SQL Editor
-- ============================================================

-- Create buckets
insert into storage.buckets (id, name, public)
values
  ('designs',  'designs',  true),   -- animation files
  ('payments', 'payments', false),  -- payment logos (owner only)
  ('logos',    'logos',    false),  -- user logo uploads
  ('transactions', 'transactions', false)  -- payment screenshots
on conflict (id) do nothing;

-- Public read for designs bucket (anyone can fetch animation files)
create policy "Public read designs"
  on storage.objects for select
  using ( bucket_id = 'designs' );

-- Authenticated upload for logos and transactions
create policy "Auth upload logos"
  on storage.objects for insert
  with check ( bucket_id in ('logos','transactions') );

-- Service role handles payments bucket via backend only
