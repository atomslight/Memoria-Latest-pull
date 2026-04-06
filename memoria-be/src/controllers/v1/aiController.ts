import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { storageService } from '../../services/storage';
import { env } from '../../config/env';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a signed URL for a photo storage path.
 * Returns empty string on failure (graceful degradation).
 */
async function signUrl(storagePath: string): Promise<string> {
  try {
    return await storageService.getSignedUrl('memories', storagePath, 3600);
  } catch {
    return '';
  }
}

/**
 * Re-sign photo URLs in assistant message parts.
 * When loading past conversations, stored signed URLs may have expired.
 * This regenerates them from the stored photoId by looking up storagePath.
 */
async function refreshSignedUrlsInParts(parts: unknown): Promise<unknown> {
  if (!Array.isArray(parts)) return parts;

  return Promise.all(
    parts.map(async (part: unknown) => {
      if (
        typeof part !== 'object' ||
        part === null ||
        (part as Record<string, unknown>).type !== 'tool-invocation'
      ) {
        return part;
      }

      const p = part as Record<string, unknown>;
      const inv = p.toolInvocation as Record<string, unknown> | undefined;
      if (!inv || inv.toolName !== 'searchPhotos' || inv.state !== 'result') {
        return part;
      }

      const result = inv.result as
        | {
            photos?: Array<{
              photoId: string;
              thumbnailUrl: string;
              caption: string | null;
              capturedAt: string;
            }>;
          }
        | undefined;
      if (!result?.photos?.length) return part;

      const refreshedPhotos = await Promise.all(
        result.photos.map(async (photo) => {
          const dbPhoto = await prisma.photo.findUnique({
            where: { id: photo.photoId },
            select: { storagePath: true },
          });
          if (!dbPhoto) return photo;
          const freshUrl = await signUrl(dbPhoto.storagePath);
          return { ...photo, thumbnailUrl: freshUrl || photo.thumbnailUrl };
        })
      );

      return {
        ...part,
        toolInvocation: {
          ...inv,
          result: { ...result, photos: refreshedPhotos },
        },
      };
    })
  );
}

// ─── POST /chat (proxied to Memoria AI service — OpenAI streaming lives there) ─

export const chat = async (req: Request, res: Response) => {
  const { messages, conversationId }: { messages: unknown; conversationId?: string } = req.body;
  const userId = req.user!.id;

  try {
    const base = env.AI_SERVICE_URL.replace(/\/$/, '');
    const upstream = await fetch(`${base}/internal/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AI_INTERNAL_SECRET}`,
      },
      body: JSON.stringify({ messages, conversationId, userId }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).json({ error: 'AI chat failed', details: text });
      return;
    }

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(key, value);
    });

    if (upstream.body) {
      const reader = upstream.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          res.write(value);
        }
      };
      pump().catch((err) => {
        console.error('stream pump error:', err);
        res.end();
      });
    } else {
      res.end();
    }
  } catch (err) {
    console.error('POST /chat error:', err);
    res.status(500).json({
      error: 'AI chat failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};

// ─── GET /conversations ───────────────────────────────────────────────────────

export const getConversations = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    }),
    prisma.conversation.count({ where: { userId, deletedAt: null } }),
  ]);

  res.json({ conversations, pagination: { page, limit, total, hasMore: skip + limit < total } });
};

// ─── GET /conversations/:id/messages ─────────────────────────────────────────

export const getConversationMessages = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const rawMessages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
  });

  const messages = await Promise.all(
    rawMessages.map(async (msg) => {
      if (msg.role !== 'assistant') return msg;
      const refreshedParts = await refreshSignedUrlsInParts(msg.parts);
      return { ...msg, parts: refreshedParts };
    })
  );

  res.json({ messages });
};

// ─── DELETE /conversations/:id ────────────────────────────────────────────────

export const deleteConversation = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  await prisma.conversation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.status(204).send();
};
