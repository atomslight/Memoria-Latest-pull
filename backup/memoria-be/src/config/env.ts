import 'dotenv/config';
import { z } from 'zod';

/** Strip wrapping quotes from .env values */
function stripQuotes(v: unknown): unknown {
  if (v == null || v === '') return undefined;
  const s = String(v).replace(/^['"]|['"]$/g, '').trim();
  return s === '' ? undefined : s;
}

/**
 * Environment Variables Schema
 * Validates all required environment variables on startup
 */
const envSchema = z
  .object({
    // Server
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),

    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

    // Auth — pair mode (access + refresh) OR legacy JWT_SECRET only
    JWT_ACCESS_TOKEN_SECRET: z.preprocess(stripQuotes, z.string().min(1).optional()),
    JWT_REFRESH_TOKEN_SECRET: z.preprocess(stripQuotes, z.string().min(1).optional()),
    JWT_ACCESS_TOKEN_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(60),
    JWT_REFRESH_TOKEN_EXPIRES_IN_HRS: z.coerce.number().int().positive().default(720),
    JWT_ACCESS_TOKEN_ISSUER: z.preprocess(stripQuotes, z.string().min(1).optional()),
    JWT_REFRESH_TOKEN_ISSUER: z.preprocess(stripQuotes, z.string().min(1).optional()),

    /** @deprecated use JWT_ACCESS_TOKEN_SECRET + JWT_REFRESH_TOKEN_SECRET */
    JWT_SECRET: z.preprocess(stripQuotes, z.string().optional()),
    /** @deprecated use JWT_ACCESS_TOKEN_EXPIRES_IN_MINUTES */
    JWT_EXPIRES_IN: z.preprocess(stripQuotes, z.string().optional()),

    // AWS S3 — public bucket (e.g. avatars + CloudFront) and private bucket (memories)
    S3_REGION: z.string().min(1, 'S3_REGION is required'),
    S3_BUCKET_NAME: z.string().min(1).optional(),
    S3_BUCKET: z.string().min(1).optional(),
    S3_PRIVATE_BUCKET_NAME: z.string().min(1, 'S3_PRIVATE_BUCKET_NAME is required'),
    S3_ENDPOINT: z.preprocess(
      (v) => (v === '' || v == null ? undefined : v),
      z.string().url().optional()
    ),
    S3_FORCE_PATH_STYLE: z.preprocess(
      (v) => v === 'true' || v === '1',
      z.boolean().default(false)
    ),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    CDN_URL: z.preprocess(
      (v) => (v === '' || v == null ? undefined : v),
      z.string().url().optional()
    ),
    S3_PRESIGN_DEFAULT_SECONDS: z.coerce.number().int().positive().default(3600),

    REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),

    GEMINI_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),

    VERTEX_AI_PROJECT_ID: z.string().min(1).optional(),
    VERTEX_AI_LOCATION: z.string().default('us-central1'),
    VERTEX_AI_SERVICE_ACCOUNT_KEY: z.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

    MOBILE_APP_URL: z.string().url().optional(),
    OPENAI_API_KEY: z.string().optional(),

    /** Base URL of the Memoria AI inference service (embeddings + captions). Must match ai-service listen port. */
    AI_SERVICE_URL: z.preprocess(
      (v) => (v === '' || v == null ? undefined : stripQuotes(v)),
      z.string().url().default('http://127.0.0.1:8080')
    ),
    /** Shared secret; must match the AI service `AI_INTERNAL_SECRET`. */
    AI_INTERNAL_SECRET: z.preprocess(
      stripQuotes,
      z.string().min(1).default('development-only-change-me')
    ),
  })
  .superRefine((data, ctx) => {
    const publicName = data.S3_BUCKET_NAME || data.S3_BUCKET;
    if (!publicName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set S3_BUCKET_NAME (or legacy S3_BUCKET) for the public bucket',
        path: ['S3_BUCKET_NAME'],
      });
    }

    const hasPair =
      !!data.JWT_ACCESS_TOKEN_SECRET?.length && !!data.JWT_REFRESH_TOKEN_SECRET?.length;
    const onlyOneAccess =
      !!data.JWT_ACCESS_TOKEN_SECRET?.length !== !!data.JWT_REFRESH_TOKEN_SECRET?.length;
    const legacy =
      !!data.JWT_SECRET && data.JWT_SECRET.length >= 32;

    if (onlyOneAccess) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set both JWT_ACCESS_TOKEN_SECRET and JWT_REFRESH_TOKEN_SECRET, or neither (then use JWT_SECRET)',
        path: ['JWT_REFRESH_TOKEN_SECRET'],
      });
    }
    if (!hasPair && !legacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Set JWT_ACCESS_TOKEN_SECRET + JWT_REFRESH_TOKEN_SECRET, or JWT_SECRET (min 32 characters) for legacy access-only JWTs',
        path: ['JWT_ACCESS_TOKEN_SECRET'],
      });
    }

    // Deployed environments must set service URLs/secrets explicitly (defaults are dev-only).
    if (data.NODE_ENV === 'production' || data.NODE_ENV === 'staging') {
      const rawAiUrl = process.env.AI_SERVICE_URL;
      if (rawAiUrl == null || String(rawAiUrl).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Set AI_SERVICE_URL to your AI inference service base URL (no trailing slash), e.g. https://ai.your-internal.host',
          path: ['AI_SERVICE_URL'],
        });
      }
      const rawAiSecret = process.env.AI_INTERNAL_SECRET;
      if (rawAiSecret == null || String(rawAiSecret).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Set AI_INTERNAL_SECRET in production/staging (must match the AI service)',
          path: ['AI_INTERNAL_SECRET'],
        });
      } else if (String(rawAiSecret).trim() === 'development-only-change-me') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Use a strong non-default AI_INTERNAL_SECRET in production/staging',
          path: ['AI_INTERNAL_SECRET'],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema> & {
  S3_PUBLIC_BUCKET: string;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  /** True when access+refresh secrets are configured (refresh tokens + /auth/refresh) */
  jwtPairMode: boolean;
};

export function validateEnv(): Env {
  try {
    const raw = envSchema.parse(process.env);
    const S3_PUBLIC_BUCKET = raw.S3_BUCKET_NAME || raw.S3_BUCKET!;
    const accessKeyId = raw.S3_ACCESS_KEY_ID || raw.AWS_ACCESS_KEY_ID;
    const secretAccessKey = raw.S3_SECRET_ACCESS_KEY || raw.AWS_SECRET_ACCESS_KEY;
    const jwtPairMode = !!(
      raw.JWT_ACCESS_TOKEN_SECRET &&
      raw.JWT_REFRESH_TOKEN_SECRET
    );

    const env: Env = {
      ...raw,
      S3_PUBLIC_BUCKET,
      accessKeyId,
      secretAccessKey,
      jwtPairMode,
    };
    console.log('✅ Environment variables validated');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
