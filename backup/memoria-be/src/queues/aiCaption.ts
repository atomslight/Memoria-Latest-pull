import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis';

/**
 * AI Caption Generation Queue
 * Processes photos to generate AI captions using Gemini API
 */
export const aiCaptionQueue = new Queue('ai-caption', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100
    },
    removeOnFail: {
      age: 86400 // Keep failed jobs for 24 hours
    }
  }
});

// Job data interface
export interface AICaptionJobData {
  photoId: string;
  userId: string;
  storagePath: string;
  mimeType: string;
}
