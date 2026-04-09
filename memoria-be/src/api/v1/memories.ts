/**
 * Memories API Routes
 * 
 * Handles memory CRUD operations and timeline queries
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { storageService } from '../../services/storage';
import { authMiddleware } from '../../middleware/auth';
import { aiCaptionQueue } from '../../queues/aiCaption';

const router: RouterType = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

import { UploadMemoryMetaSchema } from '../../validators';

// Apply auth middleware to all memory routes
router.use(authMiddleware);

/**
 * GET /api/v1/memories/activity
 *
 * Returns daily memory counts for the last 84 days (12 weeks × 7 days).
 * MUST be registered before /:id to avoid route conflict.
 */
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const since = new Date();
    since.setDate(since.getDate() - 83); // 84 days inclusive
    since.setHours(0, 0, 0, 0);

    const photos = await prisma.photo.findMany({
      where: { userId, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    // Group by YYYY-MM-DD
    const counts: Record<string, number> = {};
    for (const p of photos) {
      const key = p.createdAt.toISOString().split('T')[0];
      counts[key] = (counts[key] || 0) + 1;
    }

    // Build 84-entry array oldest-first
    const data: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      data.push({ date: key, count: counts[key] || 0 });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

/**
 * GET /api/v1/memories
 * 
 * Fetch paginated memories for the authenticated user
 * Query params: page (default: 1), limit (default: 20)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get userId from authenticated user
    const userId = req.user!.id;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { userId, deletedAt: null },
        include: { aiResult: true },
        orderBy: { capturedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where: { userId, deletedAt: null } }),
    ]);

    // Build signed URLs for each photo (private bucket)
    const memories = await Promise.all(
      photos.map(async (photo) => {
        // Create a signed URL valid for 1 hour
        const imageUrl = await storageService.getSignedUrl(
          'memories',
          photo.storagePath,
          3600
        );

        return {
          id: photo.id,
          userId: photo.userId,
          storagePath: photo.storagePath,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          width: photo.width,
          height: photo.height,
          capturedAt: photo.capturedAt,
          caption: photo.aiResult?.caption || null,
          captionStatus: photo.aiResult?.processingStatus || null,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
          thumbnailSmall: imageUrl,
          thumbnailMedium: imageUrl,
          thumbnailLarge: imageUrl,
          mood: photo.mood,
          cluster: photo.cluster,
          locationName: photo.locationName,
        };
      })
    );

    res.json({
      memories,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + photos.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch memories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/memories/trash
 * 
 * Fetch trashed memories for the authenticated user
 * Query params: page (default: 1), limit (default: 20)
 */
router.get('/trash', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const userId = req.user!.id;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { userId, deletedAt: { not: null } },
        include: { aiResult: true },
        orderBy: { deletedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where: { userId, deletedAt: { not: null } } }),
    ]);

    // Build signed URLs for each photo
    const memories = await Promise.all(
      photos.map(async (photo) => {
        const thumb = await storageService.getSignedUrl(
          'memories',
          photo.storagePath,
          3600
        );

        return {
          id: photo.id,
          userId: photo.userId,
          storagePath: photo.storagePath,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          width: photo.width,
          height: photo.height,
          capturedAt: photo.capturedAt,
          deletedAt: photo.deletedAt,
          caption: photo.aiResult?.caption || null,
          captionStatus: photo.aiResult?.processingStatus || null,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
          thumbnailSmall: thumb,
          thumbnailMedium: thumb,
          thumbnailLarge: thumb,
        };
      })
    );

    res.json({
      memories,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + photos.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching trash:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trash',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/memories/:id
 * 
 * Fetch a single memory by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const photo = await prisma.photo.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
      include: {
        aiResult: true,
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    // Build signed URL
    const thumbnailUrl = await storageService.getSignedUrl(
      'memories',
      photo.storagePath,
      3600
    );

    res.json({
      ...photo,
      caption: photo.aiResult?.caption || null,
      captionStatus: photo.aiResult?.processingStatus || null,
      thumbnailUrl,
      mood: photo.mood,
      cluster: photo.cluster,
      locationName: photo.locationName,
    });
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch memory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/memories
 * 
 * Upload a new memory with photo/video
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get userId from authenticated user
    const userId = req.user!.id; // Authenticated via auth middleware

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${userId}/${timestamp}-${randomStr}.${fileExt}`;

    await storageService.uploadFile('memories', fileName, req.file.buffer, req.file.mimetype, {
      upsert: false,
    });

    const urlData = { publicUrl: storageService.getPublicUrl('memories', fileName) };

    // Calculate hash (simplified for now - should be done on client)
    const hash = `hash-${timestamp}-${randomStr}`;

    // Create photo record in database
    const photo = await prisma.photo.create({
      data: {
        userId,
        hash,
        storagePath: fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        width: 0, // TODO: Extract from EXIF
        height: 0, // TODO: Extract from EXIF
        capturedAt: new Date(),
      },
    });

    // Parse optional metadata fields from multipart form body
    const meta = UploadMemoryMetaSchema.safeParse({
      mood: req.body.mood,
      cluster: req.body.cluster,
      locationName: req.body.locationName,
      caption: req.body.caption,
      locationCoordinates: req.body.locationCoordinates,
    });

    // Apply mood/cluster/locationName/coordinates if provided
    if (meta.success) {
      const updateData: any = {};

      if (meta.data.mood) updateData.mood = meta.data.mood;
      if (meta.data.cluster) updateData.cluster = meta.data.cluster;
      if (meta.data.locationName) updateData.locationName = meta.data.locationName;

      // Save coordinates to Photo model if they exist
      if (meta.data.locationCoordinates) {
        updateData.latitude = meta.data.locationCoordinates.latitude;
        updateData.longitude = meta.data.locationCoordinates.longitude;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.photo.update({
          where: { id: photo.id },
          data: updateData,
        });
      }
    }

    // Handle Caption Queue
    const captionProvided = meta.success && meta.data.caption;
    await prisma.aIResult.create({
      data: {
        photoId: photo.id,
        caption: captionProvided ? meta.data!.caption : null,
        processingStatus: captionProvided ? 'completed' : 'pending',
      },
    });

    if (!captionProvided) {
      try {
        await aiCaptionQueue.add('generate-caption', {
          photoId: photo.id,
          userId,
          storagePath: fileName,
          mimeType: req.file.mimetype,
        });
        console.log(`Enqueued caption job for photo ${photo.id}`);
      } catch (queueError) {
        console.error('Failed to enqueue caption job:', queueError);
      }
    }

    // Always enqueue metadata extraction job (this is where reverse geocoding happens later)
    try {
      // @ts-ignore - metadataQueue needs to be imported, but we'll import it below if missing or ignore
      const { metadataQueue } = await import('../../queues/metadata');
      await metadataQueue.add('extract-metadata', {
        photoId: photo.id,
        userId,
        storagePath: fileName,
        mimeType: req.file.mimetype,
      });
      console.log(`Enqueued metadata job for photo ${photo.id}`);
    } catch (queueError) {
      console.error('Failed to enqueue metadata job:', queueError);
    }

    return res.status(201).json({
      id: photo.id,
      url: urlData.publicUrl,
      message: 'Memory uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading memory:', error);
    return res.status(500).json({ 
      error: 'Failed to upload memory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/v1/memories/:id
 *
 * Update mood, cluster, locationName, and/or caption on an existing memory.
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const photo = await prisma.photo.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!photo) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    const { mood, cluster, locationName, caption } = req.body;

    // Update photo metadata fields
    const photoUpdate: { mood?: string; cluster?: string; locationName?: string } = {};
    if (mood !== undefined) photoUpdate.mood = mood;
    if (cluster !== undefined) photoUpdate.cluster = cluster;
    if (locationName !== undefined) photoUpdate.locationName = locationName;

    if (Object.keys(photoUpdate).length > 0) {
      await prisma.photo.update({ where: { id }, data: photoUpdate });
    }

    // Update caption if provided
    if (caption !== undefined) {
      await prisma.aIResult.upsert({
        where: { photoId: id },
        update: { caption, processingStatus: 'completed' },
        create: { photoId: id, caption, processingStatus: 'completed' },
      });
    }

    res.json({ message: 'Memory updated' });
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

/**
 * DELETE /api/v1/memories/:id
 * 
 * Soft-delete a memory (move to trash)
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const photo = await prisma.photo.findFirst({
      where: { id, userId },
    });

    if (!photo) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    if (photo.deletedAt) {
      res.status(400).json({ error: 'Memory is already in trash' });
      return;
    }

    await prisma.photo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Memory moved to trash' });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ 
      error: 'Failed to delete memory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/memories/:id/restore
 * 
 * Restore a memory from trash
 */
router.post('/:id/restore', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const photo = await prisma.photo.findFirst({
      where: { id, userId },
    });

    if (!photo) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    if (!photo.deletedAt) {
      res.status(400).json({ error: 'Memory is not in trash' });
      return;
    }

    await prisma.photo.update({
      where: { id },
      data: { deletedAt: null },
    });

    res.json({ message: 'Memory restored' });
  } catch (error) {
    console.error('Error restoring memory:', error);
    res.status(500).json({ 
      error: 'Failed to restore memory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/memories/:id/permanent
 * 
 * Permanently delete a memory from trash
 */
router.delete('/:id/permanent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const photo = await prisma.photo.findFirst({
      where: { id, userId },
    });

    if (!photo) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    if (!photo.deletedAt) {
      res.status(400).json({ error: 'Memory must be in trash before permanent deletion' });
      return;
    }

    // Delete from database first
    await prisma.photo.delete({
      where: { id },
    });

    // Attempt to delete from storage (non-blocking)
    try {
      await storageService.deleteFiles('memories', [photo.storagePath]);
    } catch (storageErr) {
      console.error('Failed to delete from storage:', storageErr);
    }

    res.json({ message: 'Memory permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting memory:', error);
    res.status(500).json({ 
      error: 'Failed to permanently delete memory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/memories/:id/retry-caption
 * 
 * Retry caption generation for a failed memory
 */
router.post('/:id/retry-caption', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const photo = await prisma.photo.findFirst({
      where: { id, userId, deletedAt: null },
      include: { aiResult: true },
    });

    if (!photo) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    if (!photo.aiResult) {
      res.status(400).json({ error: 'No AI result found for this memory' });
      return;
    }

    // Reset status to pending
    await prisma.aIResult.update({
      where: { photoId: id },
      data: { processingStatus: 'pending' },
    });

    // Re-queue caption generation job
    await aiCaptionQueue.add('generate-caption', {
      photoId: photo.id,
      userId,
      storagePath: photo.storagePath,
      mimeType: photo.mimeType,
    });

    console.log(`Re-queued caption job for photo ${photo.id}`);

    res.json({ message: 'Caption generation re-queued' });
  } catch (error) {
    console.error('Error retrying caption:', error);
    res.status(500).json({ 
      error: 'Failed to retry caption',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/memories/retry-all-failed
 * 
 * Retry caption generation for all failed memories
 */
router.post('/retry-all-failed', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Find all failed AI results for this user
    const failedResults = await prisma.aIResult.findMany({
      where: {
        processingStatus: 'failed',
        photo: {
          userId,
          deletedAt: null,
        },
      },
      include: { photo: true },
    });

    if (failedResults.length === 0) {
      res.json({ message: 'No failed captions to retry', count: 0 });
      return;
    }

    // Reset all to pending
    await prisma.aIResult.updateMany({
      where: {
        processingStatus: 'failed',
        photo: {
          userId,
          deletedAt: null,
        },
      },
      data: { processingStatus: 'pending' },
    });

    // Re-queue all jobs
    for (const result of failedResults) {
      await aiCaptionQueue.add('generate-caption', {
        photoId: result.photo.id,
        userId,
        storagePath: result.photo.storagePath,
        mimeType: result.photo.mimeType,
      });
    }

    console.log(`Re-queued ${failedResults.length} caption jobs`);

    res.json({ 
      message: 'All failed captions re-queued', 
      count: failedResults.length 
    });
  } catch (error) {
    console.error('Error retrying all failed captions:', error);
    res.status(500).json({ 
      error: 'Failed to retry captions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
