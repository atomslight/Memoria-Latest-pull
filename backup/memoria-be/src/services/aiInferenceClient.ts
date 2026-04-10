import { env } from '../config/env';

interface EmbeddingResponse {
  embedding: number[];
}

interface CaptionResponse {
  caption: string;
  mood?: string;
  confidence: number;
}

function baseUrl(): string {
  return env.AI_SERVICE_URL.replace(/\/$/, '');
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.AI_INTERNAL_SECRET}`,
  };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI service ${path} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * HTTP client for the Memoria AI inference service (Vertex embeddings, Gemini captions).
 * The API process calls this service over the internal network; secrets must match `AI_INTERNAL_SECRET`.
 */
export const aiInferenceClient = {
  async embedText(text: string): Promise<number[]> {
    const data = await postJson<EmbeddingResponse>('/internal/v1/embeddings/text', { text });
    return data.embedding;
  },

  async embedImageFromUrl(imageUrl: string, mimeType: string): Promise<number[]> {
    const data = await postJson<EmbeddingResponse>('/internal/v1/embeddings/image', {
      imageUrl,
      mimeType,
    });
    return data.embedding;
  },

  async generateCaption(
    imageUrl: string,
    mimeType: string
  ): Promise<{ caption: string; confidence: number; mood?: string }> {
    return postJson<CaptionResponse>('/internal/v1/captions', { imageUrl, mimeType });
  },
};
