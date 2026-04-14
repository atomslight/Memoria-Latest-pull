import { Request, Response } from 'express';
import { faceDetectionBoundingBoxSchema} from '../../validators/internal';
import { generateFaceDetectionBoundingBox } from '../../services/faceDetectionBoundingBox';
import { extractFaceEmbeddings } from '../../services/faceDetectionSimilarity';
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