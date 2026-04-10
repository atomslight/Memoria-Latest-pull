import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { MetadataJobData } from '../queues/metadata';

/**
 * Metadata Worker
 * Processes jobs to extract EXIF metadata from photos
 */
export const metadataWorker = new Worker<MetadataJobData>(
  'metadata',
  async (job) => {
    const { photoId, userId, filePath: _filePath } = job.data;
    
    console.log(`Processing metadata for photo ${photoId} (user: ${userId})`);
    
    // TODO: Implement EXIF extraction in Epic 5
    // For now, just log and return success
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate processing
    
    console.log(`Metadata extracted for photo ${photoId}`);
    
    return {
      success: true,
      photoId,
      metadata: {
        capturedAt: new Date().toISOString(),
        camera: 'Placeholder Camera',
        location: null,
        dimensions: { width: 1920, height: 1080 }
      }
    };
  },
  {
    connection: getRedisConnection(),
    concurrency: 15, // Process 15 jobs concurrently
    limiter: {
      max: 30,
      duration: 1000
    }
  }
);

// Event listeners
metadataWorker.on('completed', (job) => {
  console.log(`✅ Metadata job ${job.id} completed`);
});

metadataWorker.on('failed', (job, err) => {
  console.error(`❌ Metadata job ${job?.id} failed:`, err.message);
});

metadataWorker.on('error', (err) => {
  console.error('❌ Metadata worker error:', err);
});
