import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis';

/**
 * AI Embedding Generation Queue
 * Processes photos to generate visual embeddings using Vertex AI
 */
export const faceDetectionQueue = new Queue('detect-faces', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    removeOnComplete: {
      age: 120, // Keep completed jobs for 5 minutes
      count: 100
    },
    //Remove it
    removeOnFail: {
      age: 86400 // Keep failed jobs for 24 hours
    }
  }
});

// Job data interface
export interface AIFaceDetectionJobData {
  photoId: string;
  userId: string;
  storagePath: string;
  mimeType: string;
}
