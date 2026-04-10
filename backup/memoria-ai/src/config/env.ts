import path from 'path';
import { config } from 'dotenv';
import { z } from 'zod';

config({ path: path.resolve(__dirname, '../../.env') });

function stripQuotes(v: unknown): unknown {
  if (v == null || v === '') return undefined;
  const s = String(v).replace(/^['"]|['"]$/g, '').trim();
  return s === '' ? undefined : s;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  AI_SERVICE_PORT: z.string().default('8080'),
  AI_INTERNAL_SECRET: z
    .string()
    .min(1)
    .default('development-only-change-me'),

  VERTEX_AI_PROJECT_ID: z.string().min(1, 'VERTEX_AI_PROJECT_ID is required for the AI service'),
  VERTEX_AI_LOCATION: z.string().default('us-central1'),
  VERTEX_AI_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required for the AI service'),

  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for OpenAI chat'),

  /** Memoria API base URL (tool calls + message persistence). */
  MAIN_API_URL: z.preprocess(
    (v) => (v === '' || v == null ? undefined : stripQuotes(v)),
    z.string().url().default('http://127.0.0.1:3000')
  ),
})
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' || data.NODE_ENV === 'staging') {
      const rawMain = process.env.MAIN_API_URL;
      if (rawMain == null || String(rawMain).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Set MAIN_API_URL to your Memoria API base URL (no trailing slash), e.g. https://api.your-internal.host',
          path: ['MAIN_API_URL'],
        });
      }
      const rawSecret = process.env.AI_INTERNAL_SECRET;
      if (rawSecret == null || String(rawSecret).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Set AI_INTERNAL_SECRET in production/staging (must match the main API)',
          path: ['AI_INTERNAL_SECRET'],
        });
      } else if (String(rawSecret).trim() === 'development-only-change-me') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Use a strong non-default AI_INTERNAL_SECRET in production/staging',
          path: ['AI_INTERNAL_SECRET'],
        });
      }
    }
  });

export type AiServiceEnv = z.infer<typeof envSchema>;

export function loadAiServiceEnv(): AiServiceEnv {
  const parsed = envSchema.parse(process.env);
  return parsed;
}

export const aiServiceEnv = loadAiServiceEnv();
