import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { AICaptionJobData } from '../queues/aiCaption';
import { aiEmbeddingQueue } from '../queues/aiEmbedding';
import { CaptionService } from '../services/captionService';
import { prisma } from '../config/database';

const captionService = new CaptionService();

/**
 * AI Caption Worker
 * Processes jobs to generate AI captions for photos using Gemini API
 */
export const aiCaptionWorker = new Worker<AICaptionJobData>(
  'ai-caption',
  async (job) => {
    const { photoId, userId, storagePath, mimeType } = job.data;
    
    console.log(`Processing AI caption for photo ${photoId} (user: ${userId})`);
    
    try {
      // Generate caption using Gemini API
      const { caption,mood, confidence } = await captionService.generateCaption(storagePath, mimeType);
      
      // Update AIResult with caption and mark as completed
      await prisma.aIResult.update({
        where: { photoId },
        data: {
          caption,
          captionConfidence: confidence,
          processingStatus: 'completed',
        },
      });
      if (mood) {
        await prisma.photo.update({
          where: { id: photoId },
          data: {
            mood: mood,
          },
        });
        console.log(`✨ AI detected and saved mood for photo ${photoId}: ${mood}`);
      }
      // Enqueue embedding generation job (fire-and-forget, don't block caption success)
      try {
        await aiEmbeddingQueue.add('generate-embedding', {
          photoId,
          userId,
          storagePath,
          mimeType,
        });
        console.log(`📤 Embedding job enqueued for photo ${photoId}`);
      } catch (enqueueError) {
        console.error(`Failed to enqueue embedding job for photo ${photoId}:`, enqueueError);
        // Don't throw — caption job still succeeds
      }

      console.log(`✅ AI caption generated for photo ${photoId}: "${caption}"`);
      
      return {
        success: true,
        photoId,
        caption,
		mood,
        confidence,
      };
    } catch (error) {
      console.error(`❌ Caption generation failed for photo ${photoId}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 5, // Process 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000 // Per second
    }
  }
);

// Event listeners
aiCaptionWorker.on('ready', () => {
  console.log('✅ AI caption worker is ready and listening for jobs');
});

aiCaptionWorker.on('active', (job) => {
  console.log(`🔄 Processing AI caption job ${job.id} for photo ${job.data.photoId}`);
});

aiCaptionWorker.on('completed', (job) => {
  console.log(`✅ AI caption job ${job.id} completed`);
});

aiCaptionWorker.on('failed', async (job, err) => {
  console.error(`❌ AI caption job ${job?.id} failed:`, err.message);
  
  // If all retries exhausted, mark as failed in database
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    try {
      await prisma.aIResult.update({
        where: { photoId: job.data.photoId },
        data: {
          processingStatus: 'failed',
        },
      });
      console.log(`Marked photo ${job.data.photoId} caption as failed after ${job.attemptsMade} attempts`);
    } catch (dbError) {
      console.error('Failed to update AIResult status:', dbError);
    }
  }
});

aiCaptionWorker.on('error', (err) => {
  console.error('❌ AI caption worker error:', err);
});

console.log('🎯 AI caption worker created, waiting for jobs...');
