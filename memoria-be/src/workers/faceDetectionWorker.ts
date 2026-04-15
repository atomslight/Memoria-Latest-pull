import { AIFaceDetectionJobData } from '../queues/faceDetection';
import { faceDetectionService as FaceDetectionServiceClass } from '../services/faceDetectionService';
import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { prisma } from '../config/database';
import { faceMatchingService } from '../services/faceMatchingService';
const faceDetectionService = new FaceDetectionServiceClass();

export const faceDetectionWorker = new Worker<AIFaceDetectionJobData>(
  'detect-faces',
  async (job) => {
    const { photoId, userId, storagePath, mimeType } = job.data;

    console.log(`Processing AI Face Detection for ${photoId} (user: ${userId})`);

    try {
      const detections = await faceDetectionService.postFaceDetection(storagePath, mimeType);
      const boundingBoxes = detections?.boundingBoxes ?? [];
      const embeddings = detections?.embeddings ?? [];
      console.log(`Face detection completed for ${photoId}:`, boundingBoxes);

      if (boundingBoxes.length > 0) {
        // 1. Update AIResult status only
        await prisma.aIResult.upsert({
          where: { photoId },
          update: { processingStatus: 'completed' },
          create: { photoId, processingStatus: 'completed' },
        });
        // 2. Clear previous detections for this photo (safe reprocessing)
        await prisma.face.deleteMany({
          where: { photoId: photoId },
        });
        // 3. Insert all faces with incremental cover_face_id
        await prisma.$transaction(
  boundingBoxes.map((box, index) => {
    const embedding = embeddings[index];

    return prisma.$executeRawUnsafe(`
      INSERT INTO faces (
        photo_id,
        cover_face_id,
        face_x,
        face_y,
        face_width,
        face_height,
        face_label,
        confidence,
        embedding
      )
      VALUES (
        '${photoId}',
        ${index},
        ${box.x ?? 'NULL'},
        ${box.y ?? 'NULL'},
        ${box.width ?? 'NULL'},
        ${box.height ?? 'NULL'},
        ${box.label ? `'${box.label}'` : 'NULL'},
        ${(box as any).confidence ?? 'NULL'},
        ${embedding ? `'[${embedding.join(',')}]'::vector` : 'NULL'}
      )
        
    `);
  })
);


      } else {
        await prisma.aIResult.upsert({
          where: { photoId },
          update: { processingStatus: 'no_face_found' },
          create: { photoId, processingStatus: 'no_face_found' },
        });
      }
      if (embeddings.length > 0) {
    await faceMatchingService.matchNewFaces(userId, embeddings, photoId);
    }
      return {
        success: true,
        facesDetected: boundingBoxes.length,
      };

    } catch (error) {
      console.error(`Error processing face detection for photo ${photoId}:`, error);
      throw error;
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 3,
    limiter: {
      max: 4,
      duration: 1000,
    },
  }
);

faceDetectionWorker.on('ready', () => {
  console.log('✅ Face detection worker is ready and listening for jobs');
});

faceDetectionWorker.on('active', (job) => {
  console.log(`🔄 Processing face detection job ${job.id} for photo ${job.data.photoId}`);
});

faceDetectionWorker.on('completed', (job) => {
  console.log(`✅ Face detection job ${job.id} completed — ${job.returnvalue?.facesDetected} face(s) detected`);
});

faceDetectionWorker.on('failed', (job, err) => {
  console.error(`❌ Face detection job ${job?.id} failed:`, err.message);
});

faceDetectionWorker.on('error', (err) => {
  console.error('❌ Face detection worker error:', err);
});

console.log('🎯 Face detection worker created, waiting for jobs...');
