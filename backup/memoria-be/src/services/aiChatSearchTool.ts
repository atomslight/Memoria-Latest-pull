import { embeddingService } from './embeddingService';
import { prisma } from '../config/database';
import { storageService } from './storage';

async function signUrl(storagePath: string): Promise<string> {
  try {
    return await storageService.getSignedUrl('memories', storagePath, 3600);
  } catch {
    return '';
  }
}

export type ChatSearchPhoto = {
  photoId: string;
  thumbnailUrl: string;
  caption: string | null;
  capturedAt: string;
};

/**
 * Hybrid vector + caption search used by the AI chat `searchPhotos` tool.
 */
export async function searchPhotosForChatTool(
  userId: string,
  query: string,
  limit: number
): Promise<{ photos: ChatSearchPhoto[] }> {
  let vectorResults: Awaited<ReturnType<typeof embeddingService.searchSimilar>> = [];
  try {
    const embedding = await embeddingService.generateTextEmbedding(query);
    vectorResults = await embeddingService.searchSimilar(userId, embedding, limit, 0.6);
  } catch (embErr) {
    console.warn('searchPhotos: embedding search failed, falling back to caption only:', embErr);
  }

  const captionPhotos = await prisma.photo.findMany({
    where: {
      userId,
      deletedAt: null,
      aiResult: { caption: { contains: query, mode: 'insensitive' } },
    },
    include: { aiResult: true },
    take: limit,
  });

  const photoMap = new Map<
    string,
    { photoId: string; caption: string | null; capturedAt: string; storagePath: string }
  >();

  for (const vr of vectorResults) {
    photoMap.set(vr.photoId, {
      photoId: vr.photoId,
      caption: vr.caption,
      capturedAt: vr.capturedAt?.toISOString() ?? '',
      storagePath: vr.storagePath,
    });
  }

  for (const cp of captionPhotos) {
    if (!photoMap.has(cp.id)) {
      photoMap.set(cp.id, {
        photoId: cp.id,
        caption: cp.aiResult?.caption ?? null,
        capturedAt: cp.capturedAt?.toISOString() ?? '',
        storagePath: cp.storagePath,
      });
    }
  }

  const photos = await Promise.all(
    Array.from(photoMap.values())
      .slice(0, limit)
      .map(async (p) => ({
        photoId: p.photoId,
        thumbnailUrl: await signUrl(p.storagePath),
        caption: p.caption,
        capturedAt: p.capturedAt,
      }))
  );

  return { photos };
}
