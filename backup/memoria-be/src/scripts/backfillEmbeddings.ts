// Usage: npx ts-node src/scripts/backfillEmbeddings.ts [--batch-size=50] [--delay-ms=1000]

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../config/database';
import { aiEmbeddingQueue, AIEmbeddingJobData } from '../queues/aiEmbedding';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function parseArgs(): { batchSize: number; delayMs: number } {
  const args = process.argv.slice(2);
  let batchSize = 50;
  let delayMs = 1000;

  for (const arg of args) {
    const batchMatch = arg.match(/^--batch-size=(\d+)$/);
    const delayMatch = arg.match(/^--delay-ms=(\d+)$/);

    if (batchMatch?.[1]) {
      batchSize = parseInt(batchMatch[1], 10);
    } else if (delayMatch?.[1]) {
      delayMs = parseInt(delayMatch[1], 10);
    }
  }

  return { batchSize, delayMs };
}

async function backfillEmbeddings(): Promise<void> {
  const { batchSize, delayMs } = parseArgs();

  console.log(`🔍 Backfill Embeddings`);
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Delay between batches: ${delayMs}ms`);
  console.log('');

  // Query photos that need embeddings
  const photos = await prisma.photo.findMany({
    where: {
      deletedAt: null,
      aiResult: { processingStatus: 'completed' },
      OR: [
        { embeddingStatus: 'pending' },
        { embeddingStatus: null },
      ],
    },
    select: { id: true, userId: true, storagePath: true, mimeType: true },
  });

  const totalFound = photos.length;
  console.log(`📊 Total photos found: ${totalFound}`);

  if (totalFound === 0) {
    console.log('✅ No photos need backfilling');
    await prisma.$disconnect();
    process.exit(0);
  }

  let enqueuedCount = 0;
  let errorCount = 0;
  let batchNumber = 0;

  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    batchNumber++;

    for (const photo of batch) {
      try {
        const jobData: AIEmbeddingJobData = {
          photoId: photo.id,
          userId: photo.userId,
          storagePath: photo.storagePath,
          mimeType: photo.mimeType,
        };

        await aiEmbeddingQueue.add('generate-embedding', jobData);
        enqueuedCount++;
      } catch (err) {
        errorCount++;
        console.error(`  ❌ Failed to enqueue photo ${photo.id}:`, err instanceof Error ? err.message : err);
      }
    }

    const processedSoFar = Math.min(i + batchSize, totalFound);
    console.log(`  Enqueued ${processedSoFar}/${totalFound} (batch ${batchNumber})`);

    // Delay between batches (skip after the last batch)
    if (i + batchSize < photos.length) {
      await sleep(delayMs);
    }
  }

  console.log('');
  console.log('📋 Summary:');
  console.log(`   Total found:  ${totalFound}`);
  console.log(`   Enqueued:     ${enqueuedCount}`);
  console.log(`   Errors:       ${errorCount}`);

  if (errorCount > 0) {
    console.log('⚠️  Some jobs failed to enqueue. Check errors above.');
  } else {
    console.log('✅ Backfill complete!');
  }

  await prisma.$disconnect();
  process.exit(errorCount > 0 ? 1 : 0);
}

backfillEmbeddings().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
