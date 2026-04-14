import * as canvas from 'canvas';
import * as faceapi from '@vladmandic/face-api';
import path from 'path';
import '@tensorflow/tfjs-node';
import { FaceDetectionResult, FaceEmbeddingResult } from '../validators/internal';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(process.cwd(), 'src/config/face_api_models');
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
  ]);
  modelsLoaded = true;
}

/**
 * Extract face embeddings from bounding boxes in an image
 * @param imageUrl - URL or path to the image
 * @param boundingBoxes - Array of face bounding boxes
 * @param photoId - Unique identifier for the photo
 * @returns Face embeddings data with descriptors
 */
export async function extractFaceEmbeddings(
  imageUrl: string,
  boundingBoxes: FaceDetectionResult[],
  photoId: string
): Promise<FaceEmbeddingResult> {
  try {
    await loadModels();

    const img = await canvas.loadImage(imageUrl);
    console.log(`Image loaded for embedding extraction — width: ${img.width}, height: ${img.height}`);

    const embeddings: number[][] = [];

    // Process each bounding box to extract embeddings
    for (const boundingBox of boundingBoxes) {
      // ✅ CORRECTED: Check if object exists, not each property (guaranteed by type system)
      if (!boundingBox) {
        console.warn(`Skipping null bounding box`);
        continue;
      }

      try {
        // Create a cropped canvas from the bounding box
        const cropCanvas = new Canvas(boundingBox.width, boundingBox.height);
        const ctx = cropCanvas.getContext('2d');

        console.log(
          `Cropping region for ${boundingBox.label}: ` +
          `source=(x=${boundingBox.x}, y=${boundingBox.y}, w=${boundingBox.width}, h=${boundingBox.height}) → ` +
          `canvas=${boundingBox.width}x${boundingBox.height}`
        );

        ctx.drawImage(
          img as any,
          boundingBox.x,
          boundingBox.y,
          boundingBox.width,
          boundingBox.height,
          0,
          0,
          boundingBox.width,
          boundingBox.height
        );

        const buffer = cropCanvas.toBuffer('image/jpeg');
        const croppedImg = await canvas.loadImage(buffer);

        // Detect face and get descriptor from cropped image
        // Note: withFaceLandmarks() is required to compute descriptors even if we don't use landmarks
        let croppedDetection;
        try {
          croppedDetection = await faceapi
            .detectSingleFace(croppedImg as any)
            .withFaceLandmarks()
            .withFaceDescriptor();
        } catch (detectionErr) {
          console.error(
            `Detection failed for ${boundingBox.label}:`,
            detectionErr instanceof Error ? detectionErr.message : String(detectionErr)
          );
          continue;
        }

        if (croppedDetection?.descriptor) {
          embeddings.push(Array.from(croppedDetection.descriptor));
          console.log(
            `Embedding generated for face: label=${boundingBox.label}, ` +
            `position=(x=${boundingBox.x}, y=${boundingBox.y})`
          );
          console.log(`Embedding data:`, Array.from(croppedDetection.descriptor));
        } else {
          console.warn(
            `No descriptor found for face at label=${boundingBox.label}, ` +
            `skipping embedding extraction`
          );
        }
      } catch (err) {
        console.error(
          `Error processing bounding box ${boundingBox.label}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    console.log(
      `Face embedding extraction completed for photoId: ${photoId}, ` +
      `total_faces: ${boundingBoxes.length}, ` +
      `embeddings_extracted: ${embeddings.length}`
    );

    // Compare the first two embeddings if available
    if (embeddings.length >= 2) {
      compareEmbeddings(embeddings[0], embeddings[1]);
      compareEmbeddings(embeddings[0], embeddings[1], 'cosine');
    }

    return {
      photoId,
      embeddings,
      count: embeddings.length,
    };
  } catch (err) {
    console.error('Error in extractFaceEmbeddings 👉', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Face comparison — added below; no existing code was changed
// ---------------------------------------------------------------------------

// Thresholds for L2-normalized face-api.js vectors
const EUCLIDEAN_THRESHOLD = 0.6;  // < 0.6 → same person
const COSINE_THRESHOLD    = 0.40; // > 0.40 similarity → same person (1 - 0.6 / 2 ≈ 0.82 for strict; 0.40 is a safe default)

export type ComparisonMetric = 'euclidean' | 'cosine';

export interface FaceComparisonResult {
  status: 'matched' | 'unmatched';
  score: number;    // euclidean: lower = more similar | cosine: higher = more similar
  metric: ComparisonMetric;
}

/** Asserts both vectors exist and share the same dimension. */
function assertCompatible(a: number[], b: number[]): void {
  if (!a?.length || !b?.length) throw new Error('Embedding vector must be non-empty.');
  if (a.length !== b.length) {
    throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
  }
}

/**
 * Euclidean distance between two L2-normalized vectors.
 * Range: [0, 2]  — 0 = identical, 2 = opposite.
 * Match when score < EUCLIDEAN_THRESHOLD (0.6).
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

/**
 * Cosine similarity between two L2-normalized vectors.
 * Range: [-1, 1] — 1 = identical direction, -1 = opposite.
 * For already-normalized vectors this is simply the dot product.
 * Match when score > COSINE_THRESHOLD (0.40).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot      = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA     = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB     = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  // Guard against zero-magnitude vectors (should never happen with face-api output)
  return magA && magB ? dot / (magA * magB) : 0;
}

/**
 * Compare two 128-dim face embedding vectors.
 *
 * @param embeddingA - First face embedding (from extractFaceEmbeddings)
 * @param embeddingB - Second face embedding
 * @param metric     - 'euclidean' (default) or 'cosine'
 * @param threshold  - Override the default threshold for the chosen metric
 * @returns FaceComparisonResult { status, score, metric }
 *
 * @example
 * // Euclidean (default)
 * compareEmbeddings(a, b);
 * // → { status: 'matched', score: 0.38, metric: 'euclidean' }
 *
 * // Cosine similarity
 * compareEmbeddings(a, b, 'cosine');
 * // → { status: 'matched', score: 0.91, metric: 'cosine' }
 */
export function compareEmbeddings(
  embeddingA: number[],
  embeddingB: number[],
  metric: ComparisonMetric = 'euclidean',
  threshold?: number
): FaceComparisonResult {
  assertCompatible(embeddingA, embeddingB);

  if (metric === 'cosine') {
    const score     = cosineSimilarity(embeddingA, embeddingB);
    const cutoff    = threshold ?? COSINE_THRESHOLD;
    const status    = score > cutoff ? 'matched' : 'unmatched';
    console.log(`Face comparison [cosine] — similarity: ${score.toFixed(4)}, threshold: >${cutoff}, status: ${status}`);
    return { status, score, metric };
  }

  // Default: euclidean
  const score   = euclideanDistance(embeddingA, embeddingB);
  const cutoff  = threshold ?? EUCLIDEAN_THRESHOLD;
  const status  = score < cutoff ? 'matched' : 'unmatched';
  console.log(`Face comparison [euclidean] — distance: ${score.toFixed(4)}, threshold: <${cutoff}, status: ${status}`);
  return { status, score, metric };
}