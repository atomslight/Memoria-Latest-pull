import { z } from 'zod';

export const textEmbeddingBodySchema = z.object({
  text: z.string().min(1),
});

export const imageEmbeddingBodySchema = z.object({
  imageUrl: z.string().url(),
  mimeType: z.string().min(1),
});

export const captionBodySchema = z.object({
  imageUrl: z.string().url(),
  mimeType: z.string().min(1),
});

export const faceDetectionBoundingBoxSchema = z.object({
  imageUrl: z.string().url(),
  mimeType: z.string().min(1),
});

// Output types (no Zod schema needed - guaranteed by TypeScript)
export type FaceDetectionResult = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type FaceEmbeddingResult = {
  photoId: string;
  embeddings: number[][];
  count: number;
};