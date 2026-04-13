import { Request, Response } from 'express';
import { faceDetectionBoundingBoxSchema } from '../../validators/internal';
import { generateFaceDetectionBoundingBox } from '../../services/faceDetectionBoundingBox';
//faceDetectionBoundingBoxSchema
export const postFaceDetection = async (req: Request, res: Response): Promise<void> => {
  const parsed = faceDetectionBoundingBoxSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Face Bounding box validator', details: parsed.error.flatten() });
    return;
  }
try {
const  result = await generateFaceDetectionBoundingBox(parsed.data.imageUrl, parsed.data.mimeType);
res.json(result);
  } catch (err) {
    console.error('captions:', err);
    res.status(500).json({
      error: 'Caption generation failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};