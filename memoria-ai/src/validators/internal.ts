import { z } from 'zod';

export const textEmbeddingBodySchema = z.object({
  text: z.string().min(1),
});

export const imageEmbeddingBodySchema = z.object({
  imageUrl: z.string().url(),
  mimeType: z.string().min(1),
});

export const captionBodySchema = z.object({
  imageUrl: z.string().url(),
  mimeType: z.string().min(1),
});

export const faceDetectionBoundingBoxSchema = z.object({
  imageUrl: z.string().url(),
  mimeType: z.string().min(1),
});

// Output types (no Zod schema needed - guaranteed by TypeScript)
export type FaceDetectionResult = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type FaceEmbeddingResult = {
  photoId: string;
  embeddings: number[][];
  count: number;
};

//Face embedding validation comparison from DB
// Represents one row fetched from your DB embeddings table
export interface DbEmbeddingRecord {
  id: string;              // DB primary key / person ID
  embedding: number[];     // 128-dim vector stored in DB
  label?: string;          // optional display name
}

// Result per crop face
export interface CropMatchResult {
  cropIndex: number;       // which crop embed (0-based)
  matched: boolean;
  matchedDbId?: string;    // the DB record id it matched against
  score?: number;
  metric:'euclidean' | 'cosine';
}

// Top-level return
export interface SimilarityCheckResult {
  anyMatched: boolean;     // true if at least one crop matched a DB record
  results: CropMatchResult[];
}