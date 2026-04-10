import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { AIEmbeddingJobData } from '../queues/aiEmbedding';
import { embeddingService } from '../services/embeddingService';
import { prisma } from '../config/database';

/**
 * Embedding Worker
 * Processes jobs to generate visual embeddings for photos using Vertex AI
 */
export const embeddingWorker = new Worker<AIEmbeddingJobData>(
  'ai-embedding',
  async (job) => {
    const { photoId, userId, storagePath, mimeType } = job.data;

    console.log(`Processing embedding for photo ${photoId} (user: ${userId})`);

    try {
      // Generate embedding using Vertex AI Multimodal Embeddings API
      const embedding = await embeddingService.generatePhotoEmbedding(storagePath, mimeType);

      // Store vector via raw SQL (Prisma doesn't support pgvector natively)
      await prisma.$queryRawUnsafe(
        `UPDATE photos SET embedding = $1::vector, embedding_status = 'completed', updated_at = NOW() WHERE id = $2`,
        JSON.stringify(embedding),
        photoId
      );

      console.log(`✅ Embedding generated and stored for photo ${photoId}`);

      return { success: true, photoId };
    } catch (error) {
      console.error(`❌ Embedding generation failed for photo ${photoId}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 3, // Process 3 jobs concurrently
    limiter: {
      max: 5,       // Max 5 jobs
      duration: 1000 // Per second
    }
  }
);

// Event listeners
embeddingWorker.on('ready', () => {
  console.log('✅ Embedding worker is ready and listening for jobs');
});

embeddingWorker.on('active', (job) => {
  console.log(`🔄 Processing embedding job ${job.id} for photo ${job.data.photoId}`);
});

embeddingWorker.on('completed', (job) => {
  console.log(`✅ Embedding job ${job.id} completed`);
});

embeddingWorker.on('failed', async (job, err) => {
  console.error(`❌ Embedding job ${job?.id} failed:`, err.message);

  // If all retries exhausted, mark embedding as failed in database
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    try {
      await prisma.$queryRawUnsafe(
        `UPDATE photos SET embedding_status = 'failed', updated_at = NOW() WHERE id = $1`,
        job.data.photoId
      );
      console.log(`Marked photo ${job.data.photoId} embedding as failed after ${job.attemptsMade} attempts`);
    } catch (dbError) {
      console.error('Failed to update embedding status:', dbError);
    }
  }
});

embeddingWorker.on('error', (err) => {
  console.error('❌ Embedding worker error:', err);
});

console.log('🎯 Embedding worker created, waiting for jobs...');
