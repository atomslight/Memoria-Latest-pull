-- Storage Bucket Policies for Memoria
-- Run this in Supabase SQL Editor AFTER creating buckets in Storage UI

-- ============================================
-- IMPORTANT: First create buckets in Supabase UI
-- ============================================
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket: "memories" (Private)
-- 3. Create bucket: "thumbnails" (Private)
-- Then run this SQL

-- ============================================
-- Memories Bucket Policies
-- ============================================

-- Allow authenticated users to upload to memories bucket
INSERT INTO storage.policies (name, bucket_id, definition, check_definition)
VALUES (
  'Authenticated users can upload to memories',
  'memories',
  '(bucket_id = ''memories'' AND auth.role() = ''authenticated'')',
  '(bucket_id = ''memories'' AND auth.role() = ''authenticated'')'
);

-- Allow authenticated users to read from memories bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated users can read from memories',
  'memories',
  '(bucket_id = ''memories'' AND auth.role() = ''authenticated'')'
);

-- Allow authenticated users to delete from memories bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated users can delete from memories',
  'memories',
  '(bucket_id = ''memories'' AND auth.role() = ''authenticated'')'
);

-- ============================================
-- Thumbnails Bucket Policies
-- ============================================

-- Allow authenticated users to upload to thumbnails bucket
INSERT INTO storage.policies (name, bucket_id, definition, check_definition)
VALUES (
  'Authenticated users can upload to thumbnails',
  'thumbnails',
  '(bucket_id = ''thumbnails'' AND auth.role() = ''authenticated'')',
  '(bucket_id = ''thumbnails'' AND auth.role() = ''authenticated'')'
);

-- Allow authenticated users to read from thumbnails bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated users can read from thumbnails',
  'thumbnails',
  '(bucket_id = ''thumbnails'' AND auth.role() = ''authenticated'')'
);

-- Allow authenticated users to delete from thumbnails bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated users can delete from thumbnails',
  'thumbnails',
  '(bucket_id = ''thumbnails'' AND auth.role() = ''authenticated'')'
);

-- ============================================
-- Avatars Bucket Policies
-- ============================================
-- Create bucket: "avatars" (Public — profile pictures are publicly readable)
-- Run in Supabase Dashboard > Storage > New Bucket: name=avatars, Public=true

-- Allow authenticated users to upload their own avatar
INSERT INTO storage.policies (name, bucket_id, definition, check_definition)
VALUES (
  'Authenticated users can upload their own avatar',
  'avatars',
  '(bucket_id = ''avatars'' AND auth.role() = ''authenticated'')',
  '(bucket_id = ''avatars'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)'
);

-- Allow public read access to avatars (profile pictures are public)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Public read access for avatars',
  'avatars',
  '(bucket_id = ''avatars'')'
);

-- Allow authenticated users to update/delete their own avatar
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated users can delete their own avatar',
  'avatars',
  '(bucket_id = ''avatars'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)'
);

-- ============================================
-- Verify Policies (Optional)
-- ============================================

-- Run this to see all storage policies
SELECT name, bucket_id
FROM storage.policies
ORDER BY bucket_id, name;

-- Expected: 9 policies total
-- - 3 for memories bucket
-- - 3 for thumbnails bucket
-- - 3 for avatars bucket
