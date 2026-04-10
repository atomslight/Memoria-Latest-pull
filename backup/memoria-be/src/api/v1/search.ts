import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { storageService } from '../../services/storage';
import { authMiddleware } from '../../middleware/auth';
import { embeddingService, SimilarPhoto } from '../../services/embeddingService';
import { mergeResults, CaptionResult, ScoredResult } from '../../utils/searchMerge';

const router: RouterType = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

const searchSchema = z.object({
  q: z.string().trim().min(1, 'Search query is required'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const params = searchSchema.parse(req.query);
    const { q, dateFrom, dateTo, page, limit } = params;
    const skip = (page - 1) * limit;
    const userId = req.user!.id;

    // ── Date filter object (reused for Prisma caption query) ──────────────────
    const capturedAtFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) capturedAtFilter.gte = new Date(dateFrom);
    if (dateTo) capturedAtFilter.lte = new Date(dateTo);

    const where = {
      userId,
      deletedAt: null,
      aiResult: { caption: { contains: q, mode: 'insensitive' as const } },
      ...(Object.keys(capturedAtFilter).length > 0 ? { capturedAt: capturedAtFilter } : {}),
    };

    // ── 1. Caption ILIKE search — fetch ALL matches (no pagination yet) ───────
    const captionPhotos = await prisma.photo.findMany({
      where,
      include: { aiResult: true },
      orderBy: { capturedAt: 'desc' },
    });

    // Build CaptionResult array (no signed URLs yet — added after merge+paginate)
    const captionResults: CaptionResult[] = captionPhotos.map((photo) => ({
      id: photo.id,
      userId: photo.userId,
      storagePath: photo.storagePath,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      width: photo.width,
      height: photo.height,
      capturedAt: photo.capturedAt,
      caption: photo.aiResult?.caption ?? null,
      captionStatus: photo.aiResult?.processingStatus ?? null,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
      thumbnailSmall: '',
      thumbnailMedium: '',
      thumbnailLarge: '',
    }));

    // ── 2. Vector similarity search (graceful fallback on failure) ────────────
    let vectorResults: SimilarPhoto[] = [];
    try {
      const queryEmbedding = await embeddingService.generateTextEmbedding(q);
      const rawVectorResults = await embeddingService.searchSimilar(
        userId,
        queryEmbedding,
        limit * 2,
        0.7
      );

      // Apply date filters to vector results
      vectorResults = rawVectorResults.filter((r) => {
        if (!r.capturedAt) return true;
        if (dateFrom && r.capturedAt < new Date(dateFrom)) return false;
        if (dateTo && r.capturedAt > new Date(dateTo)) return false;
        return true;
      });
    } catch (vectorError) {
      console.error('Vector search failed, falling back to caption-only:', vectorError);
      // vectorResults stays empty — graceful fallback to caption-only
    }

    // ── 3. Merge and rank by combined score ───────────────────────────────────
    const merged: ScoredResult[] = mergeResults(captionResults, vectorResults);

    // ── 4. Paginate the merged results ────────────────────────────────────────
    const total = merged.length;
    const paginatedResults = merged.slice(skip, skip + limit);

    // ── 5. Build signed URLs only for the paginated page ─────────────────────
    const results = await Promise.all(
      paginatedResults.map(async (item) => {
        const signedUrl = await storageService.getSignedUrl(
          'memories',
          item.storagePath,
          3600
        );
        return {
          id: item.id,
          userId: item.userId,
          storagePath: item.storagePath,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          width: item.width,
          height: item.height,
          capturedAt: item.capturedAt,
          caption: item.caption,
          captionStatus: item.captionStatus,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          thumbnailSmall: signedUrl,
          thumbnailMedium: signedUrl,
          thumbnailLarge: signedUrl,
        };
      })
    );

    return res.json({
      results,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + paginatedResults.length < total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid search parameters', details: error.errors });
    }
    console.error('Error searching memories:', error);
    return res.status(500).json({
      error: 'Failed to search memories',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
