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
    
    console.log(`Processing AI Face Detection for ${photoId} (user: ${userId})`);
    
    try {
      // Get face detections from AI microservice
      const detections = await faceDetectionService.postFaceDetection(storagePath, mimeType);
      const firstDetection = detections?.boundingBoxes?.[0]; // Take the first detected face for simplicity
      
      const faceData = {
        x: firstDetection?.x ?? null,
        y: firstDetection?.y ?? null,
        width: firstDetection?.width ?? null,
        height: firstDetection?.height ?? null,
        label: firstDetection?.label ?? null,
      };

      console.log(`Face detection completed for ${photoId}:`, faceData);
      const existing = await prisma.aIResult.findUnique({ where: { photoId } });
      console.log('AIResult row exists?', existing);
      // Store results in database
      //cover_face_id should act as a session-wise incremental ID per photoId (Full image) 
      if (firstDetection) {
        await prisma.aIResult.update({
          where: { photoId },
          data: {
            faceX: firstDetection.x ?? null,
            faceY: firstDetection.y ?? null,
            faceWidth: firstDetection.width ?? null,
            faceHeight: firstDetection.height ?? null,
            faceLabel: firstDetection.label ?? null,
            processingStatus: 'completed',
          },
        });
      } else {
        await prisma.aIResult.upsert({
          where: { photoId },
          update: { processingStatus: 'no_face_found' },
          create: { photoId, processingStatus: 'no_face_found' },
        });
      }

      return {
        success: true,
        ...faceData,
      };
    }  catch (error) {
      console.error(`Error processing face detection for photo ${photoId}:`, error);
      throw error; // BullMQ marks job as failed, retries trigger, 'failed' event fires
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

faceDetectionWorker.on('ready', () => {
   console.log('✅ Face detection worker is ready and listening for jobs');
 });

 faceDetectionWorker.on('active', (job) => {
   console.log(`🔄 Processing face detection job ${job.id} for photo ${job.data.photoId}`);
 });

 faceDetectionWorker.on('completed', (job) => {
   console.log(`✅ Face detection job ${job.id} completed`);
   if (job.returnvalue?.embeddings) {
     console.log('📊 Embeddings:', job.returnvalue.embeddings);
   }
 });

 faceDetectionWorker.on('failed', (job, err) => {
   console.error(`❌ Face detection job ${job?.id} failed:`, err.message);
 });

 faceDetectionWorker.on('error', (err) => {
   console.error('❌ Face detection worker error:', err);
 });

 console.log('🎯 Face detection worker created, waiting for jobs...');