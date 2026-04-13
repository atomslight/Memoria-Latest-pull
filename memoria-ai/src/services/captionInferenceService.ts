import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiServiceEnv } from '../config/env';
import { error } from 'console';  

const genAI = new GoogleGenerativeAI(aiServiceEnv.GEMINI_API_KEY);
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function captionPrompt(): string {
  return `Generate a short engaging 1–3 sentence caption for the image, focusing on what you see, the mood (ensure it clearly reflects a recognizable sentiment like 😊 Happy, 😢 Sad, 😡 Angry, 🤩 Excited, 😌 Calm, 🕰️ Nostalgic, ❤️ Romantic, 😨 Fearful, 😲 Surprised, 🌧️ Melancholic, etc.), the feel and a few key details.
Keep it casual and natural—don’t go into too much detail or sound technical.Add a touch of feeling so it captures the overall vibe in a relatable way.Stick to what’s visible, and write it like you’re casually describing it to a friend.
##OUTPUT (STRICT JSON ONLY, NO EXTRA TEXT OR EXPLANATION {"key": "value"} FORMAT):
{
"caption":"<caption describing the image in 1-3 sentences>",
"mood":"<emoji + mood (1 word)>"
} 
`;
}
function extractJsonFromText(rawText: string): { caption?: string; mood?: string } {
  let rawJson = rawText.trim();

  // Step 1: unwrap if it's a stringified JSON
  if (rawJson.startsWith('"')) {
    try {
      rawJson = JSON.parse(rawJson);
    } catch {
      throw new Error(`Failed to unwrap outer JSON string. Raw: ${rawText}`);
    }
  }

  // Step 2: extract JSON object
  const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found. Raw: ${rawJson}`);
  }

  // Step 3: parse JSON
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
	  console.error(e);
    throw new Error(`JSON parse failed. Raw: ${jsonMatch[0]}`);
  }
}
async function generateCaptionWithGemini(
  base64: string,
  mimeType: string
): Promise<{ caption: string;mood?: string; confidence: number }> {
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
  const rawText  = result.response.text().trim();
  console.log("Whole result that was gen: RAWTEXT\n",rawText)
  // If rawText is a JSON-encoded string (starts with "), unwrap it first
  const parsed=extractJsonFromText(rawText);
  const caption = parsed.caption?.trim() ?? 'unknown';
  const mood = parsed.mood ?? 'unknown';

  console.log("After JSON Filtering 1.Caption", { caption }, "2.Mood", { mood });
  return { caption, mood, confidence: 0.85 };
}

async function generateCaptionWithOpenAI(
  imageUrl: string
): Promise<{ caption: string; mood?:string; confidence: number }> {
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
  
	console.log("OPENAI Module running");
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI caption request failed: ${response.status} ${text}`);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
  throw new Error('OpenAI caption response missing content');
  }
  console.log("OpenAI RAW:", content);
  const parsed = extractJsonFromText(content);
  const caption = parsed.caption?.trim() ?? 'unknown';
  const mood = parsed.mood ?? 'unknown';
  console.log("OpenAI After JSON FIlter caption:", caption,"OpenAI After JSON FIlter mood:",mood);
  return { caption,mood,confidence: 0.82 };
}

export async function generateCaptionFromImageUrl(
  imageUrl: string,
  mimeType: string
): Promise<{ caption: string;mood?: string; confidence: number }> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to download image for caption: HTTP ${res.status}`);
  }
  console.log("Before JSON Filtering0");
  const buf = Buffer.from(await res.arrayBuffer());
  const base64 = buf.toString('base64');
  try {
    
    return await generateCaptionWithGemini(base64, mimeType);
  } catch (geminiError) {
    console.warn('Gemini caption failed, falling back to OpenAI:', geminiError);
    //
    return generateCaptionWithOpenAI(imageUrl);
	
  }
}
