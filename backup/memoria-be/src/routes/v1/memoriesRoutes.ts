import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/auth';
import {
  getActivity,
  getMemories,
  getTrash,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory,
  restoreMemory,
  permanentDeleteMemory,
  retryCaption,
  retryAllFailed,
} from '../../controllers/v1/memoriesController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Apply auth middleware to all memory routes
router.use(authMiddleware);

/**
 * GET /api/v1/memories/activity
 *
 * Returns daily memory counts for the last 84 days (12 weeks × 7 days).
 * MUST be registered before /:id to avoid route conflict.
 */
router.get('/activity', getActivity);

/**
 * GET /api/v1/memories
 */
router.get('/', getMemories);

/**
 * GET /api/v1/memories/trash
 */
router.get('/trash', getTrash);

/**
 * GET /api/v1/memories/:id
 */
router.get('/:id', getMemory);

/**
 * POST /api/v1/memories
 */
router.post('/', upload.single('file'), createMemory);

/**
 * PATCH /api/v1/memories/:id
 */
router.patch('/:id', updateMemory);

/**
 * DELETE /api/v1/memories/:id
 */
router.delete('/:id', deleteMemory);

/**
 * POST /api/v1/memories/:id/restore
 */
router.post('/:id/restore', restoreMemory);

/**
 * DELETE /api/v1/memories/:id/permanent
 */
router.delete('/:id/permanent', permanentDeleteMemory);

/**
 * POST /api/v1/memories/:id/retry-caption
 */
router.post('/:id/retry-caption', retryCaption);

/**
 * POST /api/v1/memories/retry-all-failed
 */
router.post('/retry-all-failed', retryAllFailed);

export default router;