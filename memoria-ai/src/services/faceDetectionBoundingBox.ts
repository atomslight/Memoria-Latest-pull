import * as canvas from 'canvas';
import * as faceapi from '@vladmandic/face-api';
import path from 'path';
import '@tensorflow/tfjs-node';
import { FaceDetectionResult } from '../validators/internal';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(process.cwd(), 'src/config/face_api_models'));
  modelsLoaded = true;
}

export async function generateFaceDetectionBoundingBox(
  imageUrl: string,
  mimeType: string,
  padding: number = 40
): Promise<FaceDetectionResult[]> {
  try {
    await loadModels();

    const img = await canvas.loadImage(imageUrl);
    console.log(`Image loaded — width: ${img.width}, height: ${img.height}`);

    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })
    );

    console.log(`Total detections found: ${detections.length}`);
    // mimeType is validated by controller (captionBodySchema), included for future image type-specific processing

    return detections
      .map((detection, i) => {
        if (!detection?.box) {
          console.warn(`Skipping detection ${i} — no box found`);
          return undefined;
        }

        const box = detection.box;

        const x = Math.max(0, box.x - padding);
        const y = Math.max(0, box.y - padding);
        const width = Math.min(img.width - x, box.width + padding * 2);
        const height = Math.min(img.height - y, box.height + padding * 2);

        console.log(`Face ${i} — x: ${x}, y: ${y}, width: ${width}, height: ${height}`);

        return { x, y, width, height, label: `face_${i}` };
      })
      .filter(Boolean) as FaceDetectionResult[];

  } catch (err) {
    console.error('Error in generateFaceDetectionBoundingBox 👉', err);
    throw err;
  }
}