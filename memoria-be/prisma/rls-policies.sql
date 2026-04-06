-- Row-Level Security (RLS) Policies for Memoria
-- Run this in Supabase SQL Editor

-- ============================================
-- Step 1: Enable RLS on all tables
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: Users Table Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- ============================================
-- Step 3: Photos Table Policies
-- ============================================

-- Users can view their own photos
CREATE POLICY "Users can view own photos"
  ON photos FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- Step 4: AI Results Table Policies
-- ============================================

-- Users can view AI results for their own photos
CREATE POLICY "Users can view own AI results"
  ON ai_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = ai_results.photo_id
      AND photos.user_id = auth.uid()::text
    )
  );

-- Users can insert AI results for their own photos
CREATE POLICY "Users can insert own AI results"
  ON ai_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = ai_results.photo_id
      AND photos.user_id = auth.uid()::text
    )
  );

-- Users can update AI results for their own photos
CREATE POLICY "Users can update own AI results"
  ON ai_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = ai_results.photo_id
      AND photos.user_id = auth.uid()::text
    )
  );

-- ============================================
-- Step 5: Verify Policies (Optional)
-- ============================================

-- Run this to see all policies created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: 10 policies total
-- - 3 for users table
-- - 4 for photos table
-- - 3 for ai_results table
