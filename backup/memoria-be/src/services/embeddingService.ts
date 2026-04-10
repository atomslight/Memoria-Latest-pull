import { prisma } from '../config/database';
import { storageService } from './storage';
import { aiInferenceClient } from './aiInferenceClient';

export interface SimilarPhoto {
  photoId: string;
  similarity: number;
  caption: string | null;
  capturedAt: Date | null;
  storagePath: string;
}

interface SimilarPhotoRow {
  id: string;
  caption: string | null;
  captured_at: Date | null;
  storage_path: string;
  similarity: number;
}

/**
 * Photo / text embeddings are computed by the AI inference service.
 * Similarity search runs in the API process against PostgreSQL + pgvector.
 */
export class EmbeddingService {
  /**
   * Generate embedding for a photo: presigned URL → AI service → Vertex multimodal embedding.
   */
  async generatePhotoEmbedding(storagePath: string, mimeType: string): Promise<number[]> {
    const imageUrl = await storageService.getSignedUrl('memories', storagePath, 900);
    return aiInferenceClient.embedImageFromUrl(imageUrl, mimeType);
  }

  async generateTextEmbedding(text: string): Promise<number[]> {
    return aiInferenceClient.embedText(text);
  }

  /**
   * Find photos visually similar to a query embedding vector (pgvector cosine similarity).
   */
  async searchSimilar(
    userId: string,
    queryEmbedding: number[],
    limit: number,
    threshold: number
  ): Promise<SimilarPhoto[]> {
    const embeddingLiteral = JSON.stringify(queryEmbedding);

    const rows = await prisma.$queryRawUnsafe<SimilarPhotoRow[]>(
      `SELECT
         p.id,
         ar.caption,
         p.captured_at,
         p.storage_path,
         1 - (p.embedding <=> $1::vector) AS similarity
       FROM photos p
       LEFT JOIN ai_results ar ON ar.photo_id = p.id
       WHERE p.user_id = $2
         AND p.embedding_status = 'completed'
         AND p.deleted_at IS NULL
         AND 1 - (p.embedding <=> $1::vector) >= $3
       ORDER BY similarity DESC
       LIMIT $4`,
      embeddingLiteral,
      userId,
      threshold,
      limit
    );

    return rows.map((row) => ({
      photoId: row.id,
      similarity: Number(row.similarity),
      caption: row.caption,
      capturedAt: row.captured_at,
      storagePath: row.storage_path,
    }));
  }
}

export const embeddingService = new EmbeddingService();
