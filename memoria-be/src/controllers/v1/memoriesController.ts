import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { storageService } from '../../services/storage';
import { aiCaptionQueue } from '../../queues/aiCaption';
import { UploadMemoryMetaSchema } from '../../validators';
import { metadataQueue } from '../../queues/metadata';
import { faceDetectionQueue } from '../../queues/faceDetection';
// GET /api/v1/memories/activity
export const getActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const since = new Date();
    since.setDate(since.getDate() - 83);
    since.setHours(0, 0, 0, 0);

    const photos = await prisma.photo.findMany({
      where: { userId, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const counts: Record<string, number> = {};
    for (const p of photos) {
      const key = p.createdAt.toISOString().split('T')[0] ?? '';
      counts[key] = (counts[key] || 0) + 1;
    }

    const data: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0] ?? '';
      data.push({ date: key, count: counts[key] || 0 });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
};

// GET /api/v1/memories
export const getMemories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
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

    const memories = await Promise.all(
      photos.map(async (photo) => {
        const imageUrl = await storageService.getSignedUrl('memories', photo.storagePath, 3600);

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
          locationName: photo.aiResult?.locationName || null,
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
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/v1/memories/trash
export const getTrash = async (req: Request, res: Response) => {
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

    const memories = await Promise.all(
      photos.map(async (photo) => {
        const imageUrl = await storageService.getSignedUrl('memories', photo.storagePath, 3600);

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
          thumbnailSmall: imageUrl,
          thumbnailMedium: imageUrl,
          thumbnailLarge: imageUrl,
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
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/v1/memories/:id
export const getMemory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id!;

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

    const thumbnailUrl = await storageService.getSignedUrl('memories', photo.storagePath, 3600);

    res.json({
      ...photo,
      caption: photo.aiResult?.caption || null,
      captionStatus: photo.aiResult?.processingStatus || null,
      thumbnailUrl,
      mood: photo.mood,
      cluster: photo.cluster,
      locationName: photo.aiResult?.locationName || null,
    });
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({
      error: 'Failed to fetch memory',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/v1/memories
export const createMemory = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    


    const userId = req.user!.id;
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${userId}/${timestamp}-${randomStr}.${fileExt}`;

    await storageService.uploadFile('memories', fileName, req.file.buffer, req.file.mimetype, {
      upsert: false,
    });

    const url = await storageService.getPublicUrl('memories', fileName);
    const hash = `hash-${timestamp}-${randomStr}`;

    const photo = await prisma.photo.create({
      data: {
        userId,
        hash,
        storagePath: fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        width: 0,
        height: 0,
        capturedAt: new Date(),
      },
    });
    //Face Detection Pipeline Trigger
    await faceDetectionQueue.add('detect-faces', {
      photoId: photo.id,
      userId,
      storagePath: fileName, // Use compressed for detection
      mimeType: 'image/jpeg',
    });
    
    console.log('Upload meta validation result Before latitude here', req.body.latitude);
    console.log('Upload meta validation result Before longitude', req.body.longitude);
    const meta = UploadMemoryMetaSchema.safeParse({
      mood: req.body.mood,
      cluster: req.body.cluster,
      locationName: req.body.locationName,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      caption: req.body.caption,
    });
    console.log('Upload meta validation result After:', meta);

    if (meta.success && (meta.data.mood || meta.data.cluster)) {
       await prisma.photo.update({
         where: { id: photo.id },
         data: {
           mood: meta.data.mood,
           cluster: meta.data.cluster,
         },
       });
     }
 
     const captionProvided = meta.success && meta.data.caption;
     const locationNameGiven = meta.success && meta.data.locationName;

     const lat = meta.success ? meta.data.latitude : null;
     const lng = meta.success ? meta.data.longitude : null;
     console.log('Upload lat fetched  result After:', lat);
     console.log('Upload lng fetched  result After:', lng);
    await prisma.aIResult.create({
       data: {
         photoId: photo.id,
         caption: captionProvided ? meta.data!.caption : null,
         locationName: locationNameGiven ? meta.data!.locationName : null,
         ...(lat != null && lng != null && { latitude: lat, longitude: lng }),
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
      } catch (queueError) {
        console.error('Failed to enqueue caption job:', queueError);
      }
    }

    const needsGeocoding = !locationNameGiven && lat !== null && lng !== null;

    if (needsGeocoding) {
      try {
        await metadataQueue.add('metadata', {
          photoId: photo.id,
          userId,
          storagePath: fileName,
          mimeType: req.file.mimetype,
        });
      } catch (queueError) {
        console.error('Failed to enqueue metadata job:', queueError);
      }
    }

    return res.status(201).json({
      id: photo.id,
      url,
      message: 'Memory uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading memory:', error);
    return res.status(500).json({
      error: 'Failed to upload memory',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PATCH /api/v1/memories/:id
export const updateMemory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const userId = req.user!.id;
    if (!id) {
      res.status(400).json({ error: 'Missing id' });
      return;
    }

    const photo = await prisma.photo.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!photo) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    const { mood, cluster, locationName, caption } = req.body;

    const photoUpdate: { mood?: string; cluster?: string } = {};
    if (mood !== undefined) photoUpdate.mood = mood;
    if (cluster !== undefined) photoUpdate.cluster = cluster;

    if (Object.keys(photoUpdate).length > 0) {
      await prisma.photo.update({ where: { id }, data: photoUpdate });
    }

    if (caption !== undefined || locationName !== undefined) {
      const aiResultUpdate: any = {};
      if (caption !== undefined) {
        aiResultUpdate.caption = caption;
        aiResultUpdate.processingStatus = 'completed';
      }
      if (locationName !== undefined) {
        aiResultUpdate.locationName = locationName;
      }

      await prisma.aIResult.upsert({
        where: { photoId: id },
        update: aiResultUpdate,
        create: {
          photoId: id,
          ...aiResultUpdate,
          processingStatus: caption !== undefined ? 'completed' : 'pending',
        },
      });
    }

    res.json({ message: 'Memory updated' });
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
};

// DELETE /api/v1/memories/:id
export const deleteMemory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id!;
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
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/v1/memories/:id/restore
export const restoreMemory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id!;
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
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// DELETE /api/v1/memories/:id/permanent
export const permanentDeleteMemory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id!;
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

    await prisma.photo.delete({
      where: { id },
    });

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
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/v1/memories/:id/retry-caption
export const retryCaption = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id!;
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

    await prisma.aIResult.update({
      where: { photoId: id },
      data: { processingStatus: 'pending' },
    });

    await aiCaptionQueue.add('generate-caption', {
      photoId: photo.id,
      userId,
      storagePath: photo.storagePath,
      mimeType: photo.mimeType,
    });

    res.json({ message: 'Caption generation re-queued' });
  } catch (error) {
    console.error('Error retrying caption:', error);
    res.status(500).json({
      error: 'Failed to retry caption',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/v1/memories/retry-all-failed
export const retryAllFailed = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

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

    for (const result of failedResults) {
      await aiCaptionQueue.add('generate-caption', {
        photoId: result.photo.id,
        userId,
        storagePath: result.photo.storagePath,
        mimeType: result.photo.mimeType,
      });
    }

    res.json({
      message: 'All failed captions re-queued',
      count: failedResults.length,
    });
  } catch (error) {
    console.error('Error retrying all failed captions:', error);
    res.status(500).json({
      error: 'Failed to retry captions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
