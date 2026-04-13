import { AIFaceDetectionJobData } from '../queues/faceDetection';
import { faceDetectionService as FaceDetectionServiceClass } from '../services/faceDetectionService';
import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { prisma } from '../config/database';

const faceDetectionService = new FaceDetectionServiceClass();

export const faceDetectionWorker = new Worker<AIFaceDetectionJobData>(
  'detect-faces',
  async (job) => {
    const { photoId, userId, storagePath, mimeType } = job.data;
    
    console.log(`Processing AI Face Detection Grouping for ${photoId} (user: ${userId})`);
    
    try {
      // Generate caption using Gemini API
      const detections = await faceDetectionService.postFaceDetection(storagePath, mimeType);
      const firstDetection = detections?.[0];
      const clean_x = firstDetection?.x || 'x not generated';
      const clean_y = firstDetection?.y || 'y not generated';
      const clean_width = firstDetection?.width || 'width not generated';
      const clean_height = firstDetection?.height || 'height not generated';
      const clean_label = firstDetection?.label || 'label not generated';
      // Update AIResult with caption and mark as completed
      return {
        success: true,
        x: clean_x,
        y: clean_y,
        width: clean_width,
        height: clean_height,
        label: clean_label,
      };
    } catch (error) {
      console.error(`Error processing face detection for photo ${photoId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 3,
    limiter: {
      max: 4, // Max 10 jobs
      duration: 1000 // Per second
    }
  }
);