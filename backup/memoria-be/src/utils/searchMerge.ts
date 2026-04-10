/**
 * Search result merging utility for hybrid caption + vector search.
 *
 * Scoring rules (per Requirements 6.2, 6.3, 6.6):
 *   - Caption-only match  → combinedScore = 1.0
 *   - Vector-only match   → combinedScore = similarity
 *   - Both matches        → combinedScore = 1.0 + similarity (boosted)
 */

import { SimilarPhoto } from '../services/embeddingService';

// ─── Interfaces ──────────────────────────────────────────────────────────────

/**
 * A photo returned by the caption (ILIKE) search path.
 * Matches the shape built in search.ts before pagination.
 */
export interface CaptionResult {
  id: string;
  userId: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  capturedAt: Date | null;
  caption: string | null;
  captionStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  thumbnailSmall: string;
  thumbnailMedium: string;
  thumbnailLarge: string;
}

/**
 * A merged result carrying both the original photo fields and the
 * individual / combined scores used for ranking.
 */
export interface ScoredResult extends CaptionResult {
  photoId: string;
  captionScore: number;   // 1.0 if caption matched, 0 otherwise
  vectorScore: number;    // cosine similarity if vector matched, 0 otherwise
  combinedScore: number;  // captionScore + vectorScore
}

// ─── mergeResults ─────────────────────────────────────────────────────────────

/**
 * Merge caption search results and vector similarity results into a single
 * ranked list, applying the hybrid scoring rules.
 *
 * The returned array is sorted by descending `combinedScore`.
 */
export function mergeResults(
  captionResults: CaptionResult[],
  vectorResults: SimilarPhoto[]
): ScoredResult[] {
  const resultMap = new Map<string, ScoredResult>();

  // 1. Seed the map with caption matches (score = 1.0)
  for (const photo of captionResults) {
    resultMap.set(photo.id, {
      ...photo,
      photoId: photo.id,
      captionScore: 1.0,
      vectorScore: 0,
      combinedScore: 1.0,
    });
  }

  // 2. Merge vector matches
  for (const match of vectorResults) {
    const existing = resultMap.get(match.photoId);
    if (existing) {
      // Photo appeared in both sets — boost the score
      existing.vectorScore = match.similarity;
      existing.combinedScore = existing.captionScore + match.similarity;
    } else {
      // Vector-only match — build a CaptionResult-shaped entry from SimilarPhoto fields
      resultMap.set(match.photoId, {
        photoId: match.photoId,
        id: match.photoId,
        userId: '',           // not available from vector results; caller may enrich if needed
        storagePath: match.storagePath,
        fileSize: 0,
        mimeType: '',
        width: null,
        height: null,
        capturedAt: match.capturedAt,
        caption: match.caption,
        captionStatus: null,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        thumbnailSmall: '',
        thumbnailMedium: '',
        thumbnailLarge: '',
        captionScore: 0,
        vectorScore: match.similarity,
        combinedScore: match.similarity,
      });
    }
  }

  // 3. Sort by descending combined score
  return Array.from(resultMap.values()).sort(
    (a, b) => b.combinedScore - a.combinedScore
  );
}
