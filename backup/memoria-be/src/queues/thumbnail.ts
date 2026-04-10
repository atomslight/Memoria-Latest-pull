import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis';

/**
 * Thumbnail Generation Queue
 * Processes photos to generate thumbnails in multiple sizes
 */
export const thumbnailQueue = new Queue('thumbnail', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: {
      age: 3600,
      count: 100
    },
    removeOnFail: {
      age: 86400
    }
  }
});

// Job data interface
export interface ThumbnailJobData {
  photoId: string;
  userId: string;
  originalPath: string;
  sizes: Array<{
    name: string;
    width: number;
    height?: number;
  }>;
}
