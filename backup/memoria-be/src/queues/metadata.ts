import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis';

/**
 * Metadata Extraction Queue
 * Processes photos to extract EXIF metadata
 */
export const metadataQueue = new Queue('metadata', {
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
export interface MetadataJobData {
  photoId: string;
  userId: string;
  filePath: string;
}
