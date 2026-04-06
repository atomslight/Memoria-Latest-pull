import { Request, Response } from 'express';
import { vertexEmbedding } from '../../services/vertexEmbeddingService';
import { imageEmbeddingBodySchema, textEmbeddingBodySchema } from '../../validators/internal';

export const postTextEmbedding = async (req: Request, res: Response): Promise<void> => {
  const parsed = textEmbeddingBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }

  try {
    const embedding = await vertexEmbedding.embedText(parsed.data.text);
    res.json({ embedding });
  } catch (err) {
    console.error('embeddings/text:', err);
    res.status(500).json({
      error: 'Text embedding failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};

export const postImageEmbedding = async (req: Request, res: Response): Promise<void> => {
  const parsed = imageEmbeddingBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }

  try {
    const { imageUrl, mimeType } = parsed.data;
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      res.status(502).json({
        error: 'Failed to fetch image',
        details: `HTTP ${imgRes.status}`,
      });
      return;
    }

    const buf = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buf.toString('base64');
    const embedding = await vertexEmbedding.embedImageBase64(base64, mimeType);
    res.json({ embedding });
  } catch (err) {
    console.error('embeddings/image:', err);
    res.status(500).json({
      error: 'Image embedding failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};
