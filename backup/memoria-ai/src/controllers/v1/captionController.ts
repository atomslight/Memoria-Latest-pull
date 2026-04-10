import { Request, Response } from 'express';
import { generateCaptionFromImageUrl } from '../../services/captionInferenceService';
import { captionBodySchema } from '../../validators/internal';

export const postCaption = async (req: Request, res: Response): Promise<void> => {
  const parsed = captionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await generateCaptionFromImageUrl(parsed.data.imageUrl, parsed.data.mimeType);
    res.json(result);
  } catch (err) {
    console.error('captions:', err);
    res.status(500).json({
      error: 'Caption generation failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};
