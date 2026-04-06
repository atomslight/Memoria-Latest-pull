import type { Request, Response } from 'express';
import { streamText, convertToModelMessages, tool, stepCountIs, jsonSchema } from 'ai';
import type { UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { aiServiceEnv } from '../../config/env';

const openai = createOpenAI({
  apiKey: aiServiceEnv.OPENAI_API_KEY,
});

const chatStreamBodySchema = z.object({
  userId: z.string().min(1),
  conversationId: z.string().optional(),
  messages: z.array(z.unknown()),
});

function buildSystemPrompt(): string {
  return `You are Memoria, a warm personal AI companion helping users explore their photo memories.
Always use the searchPhotos tool before answering questions about specific memories, events, people, or places.
When you find photos, describe them warmly and reference them naturally in your response.
Keep responses concise and conversational. If no photos are found, say so kindly.`;
}

function mainBaseUrl(): string {
  return aiServiceEnv.MAIN_API_URL.replace(/\/$/, '');
}

function internalHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${aiServiceEnv.AI_INTERNAL_SECRET}`,
  };
}

async function callMainSearchPhotos(
  userId: string,
  query: string,
  limit: number
): Promise<{ photos: unknown[] }> {
  const r = await fetch(`${mainBaseUrl()}/internal/v1/tool/search-photos`, {
    method: 'POST',
    headers: internalHeaders(),
    body: JSON.stringify({ userId, query, limit }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Main API search-photos failed: ${r.status} ${text}`);
  }
  return r.json() as Promise<{ photos: unknown[] }>;
}

async function callMainPersistMessages(body: {
  userId: string;
  conversationId?: string;
  userMessages: UIMessage[];
  assistantMessages: unknown[];
}): Promise<void> {
  const r = await fetch(`${mainBaseUrl()}/internal/v1/ai/persist-messages`, {
    method: 'POST',
    headers: internalHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    console.error('persist-messages failed:', r.status, text);
  }
}

export const postChatStream = async (req: Request, res: Response): Promise<void> => {
  const parsed = chatStreamBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }

  const { userId, conversationId } = parsed.data;
  const messages = parsed.data.messages as UIMessage[];

  try {
    const result = streamText({
      model: openai('gpt-4.1'),
      maxRetries: 0,
      system: buildSystemPrompt(),
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools: {
        searchPhotos: tool({
          description: "Search the user's photo memories by natural language query",
          inputSchema: jsonSchema<{ query: string; limit?: number }>({
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Natural language description of photos to find',
              },
              limit: { type: 'number', default: 6 },
            },
            required: ['query'],
          }),
          execute: async ({ query, limit = 6 }) => {
            try {
              return await callMainSearchPhotos(userId, query, limit);
            } catch (err) {
              console.error('searchPhotos tool error:', err);
              return { photos: [] };
            }
          },
        }),
      },
      onFinish: async ({ response }) => {
        await callMainPersistMessages({
          userId,
          conversationId,
          userMessages: messages,
          assistantMessages: response.messages,
        });
      },
      onError: (err) => {
        console.error('streamText error:', err);
      },
    });

    const webResponse = result.toUIMessageStreamResponse({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'none',
      },
    });

    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          res.write(value);
        }
      };
      pump().catch((err) => {
        console.error('stream pump error:', err);
        res.end();
      });
    } else {
      res.end();
    }
  } catch (err) {
    console.error('POST /chat/stream error:', err);
    res.status(500).json({
      error: 'AI chat failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};
