import { Request, Response } from 'express';
import { faceDetectionBoundingBoxSchema} from '../../validators/internal';
import { generateFaceDetectionBoundingBox } from '../../services/faceDetectionBoundingBox';
import { extractFaceEmbeddings } from '../../services/faceDetectionSimilarity';
import { z } from 'zod';
import { checkMatchSimilarity } from '../../services/faceDetectionSimilarity';
export const postFaceDetection = async (req: Request, res: Response): Promise<void> => {
  const parsed = faceDetectionBoundingBoxSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Face Bounding box validator', details: parsed.error.flatten() });
    return;
  }
  try {
    const boundingBoxes = await generateFaceDetectionBoundingBox(parsed.data.imageUrl, parsed.data.mimeType);
    const embeddings = await extractFaceEmbeddings(parsed.data.imageUrl, boundingBoxes, 'photo_' + Date.now());
    res.json({
      boundingBoxes,
      embeddings: embeddings.embeddings,
      photoId: embeddings.photoId,
      count: embeddings.count,
    });
  } catch (err) {
    console.error('Face detection bounding box error:', err);
    res.status(500).json({
      error: 'Face detection failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};

export const detectFaceDetection = async (req: Request, res: Response): Promise<void> => {
  const parsed = faceDetectionBoundingBoxSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Face detection Bounding box validator', details: parsed.error.flatten() });
    return;
  }
  try {
    const boundingBoxes = await generateFaceDetectionBoundingBox(parsed.data.imageUrl, parsed.data.mimeType);
    const embeddings = await extractFaceEmbeddings(parsed.data.imageUrl, boundingBoxes, 'photo_' + Date.now());
    res.json(embeddings);
  } catch (err) {
    console.error('Face detection embedding error:', err);
    res.status(500).json({
      error: 'Face detection and embedding extraction failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};

 // Validation schema for match request
  const matchFaceEmbeddingsSchema = z.object({
    cropEmbeddings: z.array(z.array(z.number())),
    dbRecords: z.array(z.object({
      id: z.string(),
      embedding: z.array(z.number()),
      label: z.string().optional(),
    })),
    metric: z.enum(['euclidean', 'cosine']).optional(),
    threshold: z.number().optional(),
  });

  export const matchFaceEmbeddings = async (req: Request, res: Response): Promise<void> => {
    const parsed = matchFaceEmbeddingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid match request', details: parsed.error.flatten() });
      return;
    }
    try {
      const result = checkMatchSimilarity(
        parsed.data.cropEmbeddings,
        parsed.data.dbRecords,
        parsed.data.metric,
        parsed.data.threshold
      );
      res.json(result);
    } catch (err) {
      console.error('Face matching error:', err);
      res.status(500).json({
        error: 'Face matching failed',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  };