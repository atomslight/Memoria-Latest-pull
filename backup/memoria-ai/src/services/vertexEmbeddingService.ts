import { GoogleAuth } from 'google-auth-library';
import { aiServiceEnv } from '../config/env';

const EMBEDDING_DIMENSION = 1408;

interface VertexAIImagePrediction {
  imageEmbedding: number[];
}

interface VertexAITextPrediction {
  textEmbedding: number[];
}

type VertexAIPrediction = VertexAIImagePrediction | VertexAITextPrediction;

interface VertexAIResponse {
  predictions: VertexAIPrediction[];
}

async function getGCPAccessToken(): Promise<string> {
  let auth: GoogleAuth;

  const keyJson = process.env.VERTEX_AI_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    const credentials = JSON.parse(keyJson);
    auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  } else {
    auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  const token = await auth.getAccessToken();
  if (!token) throw new Error('Failed to obtain GCP access token');
  return token;
}

function validateEmbeddingVector(vector: unknown): number[] {
  if (!Array.isArray(vector)) {
    throw new Error(`Embedding must be an array, got ${typeof vector}`);
  }
  if (vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding must have exactly ${EMBEDDING_DIMENSION} elements, got ${vector.length}`
    );
  }
  for (let i = 0; i < vector.length; i++) {
    const v = vector[i];
    if (typeof v !== 'number' || !isFinite(v)) {
      throw new Error(`Embedding element at index ${i} is not a finite number: ${v}`);
    }
  }
  return vector as number[];
}

export class VertexMultimodalEmbedding {
  constructor(
    private readonly projectId: string,
    private readonly location: string,
    private readonly dimension: number
  ) {}

  private get endpoint(): string {
    return (
      `https://${this.location}-aiplatform.googleapis.com/v1` +
      `/projects/${this.projectId}/locations/${this.location}` +
      `/publishers/google/models/multimodalembedding@001:predict`
    );
  }

  private async callVertexAI(body: Record<string, unknown>): Promise<VertexAIResponse> {
    const token = await getGCPAccessToken();
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Vertex AI API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<VertexAIResponse>;
  }

  async embedText(text: string): Promise<number[]> {
    const responseBody = await this.callVertexAI({
      instances: [{ text }],
      parameters: { dimension: this.dimension },
    });

    const prediction = responseBody.predictions?.[0] as VertexAITextPrediction | undefined;
    if (!prediction?.textEmbedding) {
      throw new Error('Vertex AI response missing textEmbedding field');
    }

    return validateEmbeddingVector(prediction.textEmbedding);
  }

  async embedImageBase64(base64: string, _mimeType: string): Promise<number[]> {
    const responseBody = await this.callVertexAI({
      instances: [{ image: { bytesBase64Encoded: base64 } }],
      parameters: { dimension: this.dimension },
    });

    const prediction = responseBody.predictions?.[0] as VertexAIImagePrediction | undefined;
    if (!prediction?.imageEmbedding) {
      throw new Error('Vertex AI response missing imageEmbedding field');
    }

    return validateEmbeddingVector(prediction.imageEmbedding);
  }
}

export const vertexEmbedding = new VertexMultimodalEmbedding(
  aiServiceEnv.VERTEX_AI_PROJECT_ID,
  aiServiceEnv.VERTEX_AI_LOCATION,
  EMBEDDING_DIMENSION
);
