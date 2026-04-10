/**
 * Retry Caption Generation Script
 * 
 * Re-queues AI caption jobs for photos that are stuck in 'pending' status
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../config/database';
import { aiCaptionQueue } from '../queues/aiCaption';

async function retryCaptions() {
  console.log('🔄 Finding photos with pending captions...');

  // Find all AIResults with pending or failed status
  const pendingResults = await prisma.aIResult.findMany({
    where: {
      processingStatus: {
        in: ['pending', 'failed'],
      },
    },
    include: {
      photo: true,
    },
  });

  console.log(`Found ${pendingResults.length} photos with pending/failed captions`);

  if (pendingResults.length === 0) {
    console.log('✅ No pending/failed captions to retry');
    process.exit(0);
  }

  // Reset status to pending before re-queueing
  await prisma.aIResult.updateMany({
    where: {
      processingStatus: {
        in: ['pending', 'failed'],
      },
    },
    data: {
      processingStatus: 'pending',
    },
  });

  console.log('✅ Reset all statuses to pending');

  // Re-queue each photo
  for (const result of pendingResults) {
    const { photo } = result;
    
    console.log(`📤 Queueing caption job for photo ${photo.id}`);
    
    await aiCaptionQueue.add(
      'generate-caption',
      {
        photoId: photo.id,
        userId: photo.userId,
        storagePath: photo.storagePath,
        mimeType: photo.mimeType,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  console.log(`✅ Queued ${pendingResults.length} caption jobs`);
  console.log('💡 Check the worker logs to see progress');
  
  // Wait a bit for jobs to be queued
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  process.exit(0);
}

retryCaptions().catch((error) => {
  console.error('❌ Error retrying captions:', error);
  process.exit(1);
});
