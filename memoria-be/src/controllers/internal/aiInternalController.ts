import { Request, Response } from 'express';
import { z } from 'zod';
import { searchPhotosForChatTool } from '../../services/aiChatSearchTool';
import { persistChatMessages } from '../../services/aiChatPersistence';

const searchBodySchema = z.object({
  userId: z.string().min(1),
  query: z.string().min(1),
  limit: z.number().int().positive().max(50).optional(),
});

export const postSearchPhotosTool = async (req: Request, res: Response): Promise<void> => {
  const parsed = searchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }

  const { userId, query, limit = 6 } = parsed.data;
  try {
    const result = await searchPhotosForChatTool(userId, query, limit);
    res.json(result);
  } catch (err) {
    console.error('postSearchPhotosTool:', err);
    res.status(500).json({
      error: 'searchPhotos failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};

const persistBodySchema = z.object({
  userId: z.string().min(1),
  conversationId: z.string().optional(),
  userMessages: z.array(z.unknown()),
  assistantMessages: z.array(z.unknown()),
});

export const postPersistChatMessages = async (req: Request, res: Response): Promise<void> => {
  const parsed = persistBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }

  const { userId, conversationId, userMessages, assistantMessages } = parsed.data;
  await persistChatMessages(
    userId,
    conversationId,
    userMessages as Array<{ role?: string; parts?: unknown }>,
    assistantMessages
  );
  res.status(204).send();
};
