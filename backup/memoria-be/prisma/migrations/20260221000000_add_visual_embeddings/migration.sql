-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (1408-dimensional vector for Vertex AI multimodalembedding@001)
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "embedding" vector(1408);

-- Add embedding_status column with default 'pending'
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "embedding_status" VARCHAR(20) DEFAULT 'pending';

-- HNSW index for fast approximate nearest-neighbor cosine similarity search
CREATE INDEX IF NOT EXISTS "photos_embedding_hnsw_idx"
  ON "photos" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Composite index for efficient filtering by user + embedding status
CREATE INDEX IF NOT EXISTS "photos_user_id_embedding_status_idx"
  ON "photos"("user_id", "embedding_status");
