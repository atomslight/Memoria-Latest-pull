import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiServiceEnv } from '../config/env';

const genAI = new GoogleGenerativeAI(aiServiceEnv.GEMINI_API_KEY);
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function captionPrompt(): string {
  return `Generate a brief, descriptive caption for this photo in 1-2 sentences.
Focus on what you see, the mood, and any notable details.
Be natural and conversational, as if describing the photo to a friend.`;
}

async function generateCaptionWithGemini(
  base64: string,
  mimeType: string
): Promise<{ caption: string; confidence: number }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    captionPrompt(),
    {
      inlineData: {
        data: base64,
        mimeType: mimeType || 'image/jpeg',
      },
    },
  ]);
  const caption = result.response.text().trim();
  return { caption, confidence: 0.85 };
}

async function generateCaptionWithOpenAI(
  imageUrl: string
): Promise<{ caption: string; confidence: number }> {
  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${aiServiceEnv.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: captionPrompt() },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI caption request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const caption = data.choices?.[0]?.message?.content?.trim();
  if (!caption) {
    throw new Error('OpenAI caption response missing text content');
  }
  return { caption, confidence: 0.82 };
}

export async function generateCaptionFromImageUrl(
  imageUrl: string,
  mimeType: string
): Promise<{ caption: string; confidence: number }> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to download image for caption: HTTP ${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const base64 = buf.toString('base64');
  try {
    return await generateCaptionWithGemini(base64, mimeType);
  } catch (geminiError) {
    console.warn('Gemini caption failed, falling back to OpenAI:', geminiError);
    return generateCaptionWithOpenAI(imageUrl);
  }
}
