n_id") REFERENCES public.conversations("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Disable RLS on architecture tables (backend uses service role key)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_photos DISABLE ROW LEVEL SECURITY;
  "id"              TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role"            TEXT NOT NULL,
    "parts"           JSONB NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx"
    ON public.messages("conversation_id", "created_at");

ALTER TABLE public.messages
    ADD CONSTRAINT IF NOT EXISTS "messages_conversation_id_fkey"
    FOREIGN KEY ("conversatioMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "conversations_user_id_updated_at_idx"
    ON public.conversations("user_id", "updated_at");

ALTER TABLE public.conversations
    ADD CONSTRAINT IF NOT EXISTS "conversations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES public.users("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Create messages table (used by AI companion feature)
CREATE TABLE IF NOT EXISTS public.messages (
  s pgvector extension.
-- Run this separately if pgvector is enabled:
-- ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS embedding vector(1408);

-- 6. Create conversations table (used by AI companion feature)
CREATE TABLE IF NOT EXISTS public.conversations (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "title"      TEXT NOT NULL DEFAULT 'New Conversation',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAtra columns: photos_shared
--    Architecture version: id, circle_id, user_id, role, joined_at only
ALTER TABLE public.circle_members
    DROP COLUMN IF EXISTS photos_shared;

-- 4. Fix circles table
--    Supabase version had extra column: cover_photo_url
ALTER TABLE public.circles
    DROP COLUMN IF EXISTS cover_photo_url;

-- 5. Add embedding columns to photos if missing
ALTER TABLE public.photos
    ADD COLUMN IF NOT EXISTS embedding_status TEXT DEFAULT 'pending';

-- Note: The vector(1408) column requireEIGN KEY ("circle_id") REFERENCES public.circles("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.circle_photos
    ADD CONSTRAINT "circle_photos_photo_id_fkey"
    FOREIGN KEY ("photo_id") REFERENCES public.photos("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.circle_photos
    ADD CONSTRAINT "circle_photos_uploaded_by_fkey"
    FOREIGN KEY ("uploaded_by") REFERENCES public.users("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Fix circle_members table
--    Supabase version had exON public.circle_photos("circle_id", "uploaded_at");

ALTER TABLE public.circle_photos
    ADD CONSTRAINT "circle_photos_circle_id_fkey"
    FORABLE IF EXISTS public.circle_photos CASCADE;

CREATE TABLE public.circle_photos (
    "id"          TEXT NOT NULL,
    "circle_id"   TEXT NOT NULL,
    "photo_id"    TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "circle_photos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "circle_photos_circle_id_photo_id_key"
    ON public.circle_photos("circle_id", "photo_id");

CREATE INDEX "circle_photos_circle_id_uploaded_at_idx"
    S public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.memories CASCADE;

-- 2. Fix circle_photos table
--    Supabase version had: memory_id, shared_by, event_group, shared_at, event_id
--    Architecture version needs: photo_id, uploaded_by, uploaded_at
--    The table exists but with wrong columns — rebuild it cleanly.
DROP Tdrift, keep only the
--          architecture-spec tables managed by Prisma.
-- ============================================================

-- 1. Drop tables that don't belong to our architecture
--    (Supabase-native tables created outside Prisma)
DROP TABLE IF EXISTS public.circle_invites CASCADE;
DROP TABLE IF EXISTS public.circle_events CASCADE;
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXIST-- ============================================================
-- Migration: sync_architecture_schema
-- Purpose: Remove Supabase-native schema 