import * as canvas from 'canvas';
import * as faceapi from '@vladmandic/face-api';
import path from 'path';
import '@tensorflow/tfjs-node';
import {
  FaceDetectionResult,
  FaceEmbeddingResult,
  DbEmbeddingRecord,
  CropMatchResult,
  SimilarityCheckResult,
} from '../validators/internal';

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

// ---------------------------------------------------------------------------
// Extract face embeddings from bounding boxes in an image
// ---------------------------------------------------------------------------

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

    for (const boundingBox of boundingBoxes) {
      if (!boundingBox) {
        console.warn(`Skipping null bounding box`);
        continue;
      }

      try {
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

        const buffer     = cropCanvas.toBuffer('image/jpeg');
        const croppedImg = await canvas.loadImage(buffer);

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
    /* Testing Demo code can be removed later
    if (embeddings.length >= 2) {
      compareEmbeddings(embeddings[0], embeddings[1]);
      compareEmbeddings(embeddings[0], embeddings[1], 'cosine');
    } */

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
// Thresholds for L2-normalized face-api.js vectors
// ---------------------------------------------------------------------------

const EUCLIDEAN_THRESHOLD = 0.6;   // < 0.6  → same person
const COSINE_THRESHOLD    = 0.40;  // > 0.40 → same person

export type ComparisonMetric = 'euclidean' | 'cosine';

export interface FaceComparisonResult {
  status: 'matched' | 'unmatched';
  score:  number;
  metric: ComparisonMetric;
}

// ---------------------------------------------------------------------------
// Internal math helpers
// ---------------------------------------------------------------------------

function assertCompatible(a: number[], b: number[]): void {
  if (!a?.length || !b?.length) throw new Error('Embedding vector must be non-empty.');
  if (a.length !== b.length) {
    throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
  }
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot  = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

// ---------------------------------------------------------------------------
// Compare two embedding vectors directly Demo function can be removed later only for testing
// ---------------------------------------------------------------------------
/*
export function compareEmbeddings(
  embeddingA: number[],
  embeddingB: number[],
  metric: ComparisonMetric = 'euclidean',
  threshold?: number
): FaceComparisonResult {
  assertCompatible(embeddingA, embeddingB);

  if (metric === 'cosine') {
    const score  = cosineSimilarity(embeddingA, embeddingB);
    const cutoff = threshold ?? COSINE_THRESHOLD;
    const status = score > cutoff ? 'matched' : 'unmatched';
    console.log(`Face comparison [cosine] — similarity: ${score.toFixed(4)}, threshold: >${cutoff}, status: ${status}`);
    return { status, score, metric };
  }

  const score  = euclideanDistance(embeddingA, embeddingB);
  const cutoff = threshold ?? EUCLIDEAN_THRESHOLD;
  const status = score < cutoff ? 'matched' : 'unmatched';
  console.log(`Face comparison [euclidean] — distance: ${score.toFixed(4)}, threshold: <${cutoff}, status: ${status}`);
  return { status, score, metric };
}

// ---------------------------------------------------------------------------
// Check each crop embedding against all DB embeddings
// Each DB record can only be claimed by one crop (first-come basis)
// ---------------------------------------------------------------------------
*/
export function checkMatchSimilarity(
  cropEmbeddings: number[][],
  dbRecords: DbEmbeddingRecord[],
  metric: ComparisonMetric = 'euclidean',
  threshold?: number
): SimilarityCheckResult {
  const claimedDbIds = new Set<string>();
  const results: CropMatchResult[] = [];

  for (let cropIdx = 0; cropIdx < cropEmbeddings.length; cropIdx++) {
    const cropVec = cropEmbeddings[cropIdx];
    let matched     = false;
    let matchedDbId: string | undefined;
    let bestScore:  number | undefined;

    for (const dbRecord of dbRecords) {
      if (claimedDbIds.has(dbRecord.id)) continue;

      let score: number;
      let isMatch: boolean;

      if (metric === 'cosine') {
        score   = cosineSimilarity(cropVec, dbRecord.embedding);
        const cutoff = threshold ?? COSINE_THRESHOLD;
        isMatch = score > cutoff;
      } else {
        score   = euclideanDistance(cropVec, dbRecord.embedding);
        const cutoff = threshold ?? EUCLIDEAN_THRESHOLD;
        isMatch = score < cutoff;
      }

      console.log(
        `[checkMatchSimilarity] crop[${cropIdx}] vs DB(${dbRecord.id}) ` +
        `[${metric}] score=${score.toFixed(4)} → ${isMatch ? 'MATCH ✅' : 'no match'}`
      );

      if (isMatch) {
        matched     = true;
        matchedDbId = dbRecord.id;
        bestScore   = score;
        claimedDbIds.add(dbRecord.id);
        break;
      }
    }

    results.push({ cropIndex: cropIdx, matched, matchedDbId, score: bestScore, metric });

    console.log(
      `[checkMatchSimilarity] crop[${cropIdx}] final → matched=${matched}` +
      (matchedDbId ? `, dbId=${matchedDbId}` : '')
    );
  }

  const anyMatched = results.some((r) => r.matched);

  console.log(
    `[checkMatchSimilarity] Summary — ` +
    `crops=${cropEmbeddings.length}, ` +
    `matched=${results.filter((r) => r.matched).length}, ` +
    `anyMatched=${anyMatched}`
  );

  return { anyMatched, results };
}
