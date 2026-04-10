import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

/**
 * Bull Board Dashboard
 * Web UI for monitoring BullMQ queues
 */

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

let boardInitialized = false;

function initializeBullBoard() {
  if (!boardInitialized) {
    // Lazy load queues only when needed
    const { aiCaptionQueue } = require('../queues/aiCaption');
    const { thumbnailQueue } = require('../queues/thumbnail');
    const { metadataQueue } = require('../queues/metadata');
    const { aiEmbeddingQueue } = require('../queues/aiEmbedding');

    // Create Bull Board with all queues
    createBullBoard({
      queues: [
        new BullMQAdapter(aiCaptionQueue) as any,
        new BullMQAdapter(thumbnailQueue) as any,
        new BullMQAdapter(metadataQueue) as any,
        new BullMQAdapter(aiEmbeddingQueue) as any
      ],
      serverAdapter
    });

    boardInitialized = true;
  }
  return serverAdapter;
}

export { serverAdapter, initializeBullBoard };
