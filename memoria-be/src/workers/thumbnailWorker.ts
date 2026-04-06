import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { ThumbnailJobData } from '../queues/thumbnail';

/**
 * Thumbnail Worker
 * Processes jobs to generate thumbnails for photos
 */
export const thumbnailWorker = new Worker<ThumbnailJobData>(
  'thumbnail',
  async (job) => {
    const { photoId, userId, originalPath: _originalPath, sizes } = job.data;
    
    console.log(`Processing thumbnails for photo ${photoId} (user: ${userId})`);
    console.log(`Generating ${sizes.length} thumbnail sizes`);
    
    // TODO: Implement thumbnail generation in Epic 2
    // For now, just log and return success
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    
    console.log(`Thumbnails generated for photo ${photoId}`);
    
    return {
      success: true,
      photoId,
      thumbnails: sizes.map(size => ({
        name: size.name,
        path: `thumbnails/${userId}/${photoId}_${size.name}.jpg`,
        width: size.width,
        height: size.height || size.width
      }))
    };
  },
  {
    connection: getRedisConnection(),
    concurrency: 10, // Process 10 jobs concurrently
    limiter: {
      max: 20,
      duration: 1000
    }
  }
);

// Event listeners
thumbnailWorker.on('completed', (job) => {
  console.log(`✅ Thumbnail job ${job.id} completed`);
});

thumbnailWorker.on('failed', (job, err) => {
  console.error(`❌ Thumbnail job ${job?.id} failed:`, err.message);
});

thumbnailWorker.on('error', (err) => {
  console.error('❌ Thumbnail worker error:', err);
});
