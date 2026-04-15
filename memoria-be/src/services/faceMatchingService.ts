import { prisma } from '../config/database';
  import { aiInferenceClient } from './aiInferenceClient';

  // Parse Postgres vector string to number array
  function parseVectorString(raw: string): number[] {
    return raw
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(Number);
  }

  interface DbEmbeddingRecord {
    id: string;
    embedding: number[];
    label?: string;
  }

  interface MatchResult {
    anyMatched: boolean;
    results: Array<{
      cropIndex: number;
      matched: boolean;
      matchedDbId?: string;
      score?: number;
      metric: 'euclidean' | 'cosine';
    }>;
  }

  export class FaceMatchingService {
    async matchNewFaces(
      userId: string,
      cropEmbeddings: number[][],
      photoId: string
    ): Promise<{ anyMatched: boolean; updatedCount: number }> {
      // 1. Fetch existing face embeddings from DB (exclude current photo)
      const rows = await prisma.$queryRaw<
        { id: string; embedding: string; face_label: string | null }[]
      >`
        SELECT f.id, f.embedding::text, f.face_label
        FROM faces f
        INNER JOIN photos p ON p.id = f.photo_id
        WHERE p.user_id = ${userId}
          AND f.embedding IS NOT NULL
          AND p.deleted_at IS NULL
          AND f.photo_id != ${photoId}
        ORDER BY f.created_at ASC
      `;

      const dbRecords: DbEmbeddingRecord[] = rows.map((row) => ({
        id: row.id,
        embedding: parseVectorString(row.embedding),
        label: row.face_label ?? undefined,
      }));

      // 2. Call AI service for matching
      const result = await aiInferenceClient.matchFaceEmbeddings(cropEmbeddings, dbRecords);

      // 3. Update face_match_status in DB
      const { count: updatedCount } = await prisma.face.updateMany({
        where: { photoId },
        data: { face_match_status: result.anyMatched },
      });

      console.log(`[FaceMatching] photoId=${photoId}, anyMatched=${result.anyMatched}, updated=${updatedCount}`);

      return { anyMatched: result.anyMatched, updatedCount };
    }
  }

  export const faceMatchingService = new FaceMatchingService();