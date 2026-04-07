import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiServiceEnv } from '../config/env';

const genAI = new GoogleGenerativeAI(aiServiceEnv.GEMINI_API_KEY);
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function captionPrompt(): string {
  return `Come up with a short engaging 1–3 sentence caption for the image, focusing on what you see, the mood, the feel and a few key details.
Keep it simple and natural—don’t go into too much detail or sound technical.
Add a touch of feeling so it captures the overall vibe in a relatable way.
Stick to what’s visible, and write it like you’re casually describing it to a friend.
Output must strictly follow: {"caption":"<text>","mood":"<emoji + mood>"} and return EXACTLY one valid JSON object.`;
}

async function generateCaptionWithGemini(
  base64: string,
  mimeType: string
): Promise<{ caption: string; confidence: number }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash',generationConfig: { temperature: 0.8 } });
  const result = await model.generateContent([
    captionPrompt(),
    {
      inlineData: {
        data: base64,
        mimeType: mimeType || 'image/jpeg',
      },
    },
  ]);
  const raw = result.response.text();
  console.log("Whole result that was gen: \n",raw)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
      console.error('No JSON found:', raw);
      return res.status(500).json({ error: 'Invalid model output' });
    }
  let parsed;
  try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse failed:', jsonMatch[0]);
      return res.status(500).json({ error: 'Invalid JSON structure' });
    }
  const caption = parsed.caption.trim() ?? 'unknown';
  const mood = parsed.mood ?? 'unknown';
  return { caption,mood,confidence: 0.85};
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
