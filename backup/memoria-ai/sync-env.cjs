/**
 * Copies AI-related variables from the repo root `.env` into `ai-service/.env`
 * so this package can run alongside memoria-be in the monorepo.
 *
 * Layout: memoria-be/.env  →  memoria-be/ai-service/.env
 * If you moved `ai-service` to another folder/repo, skip this script and maintain
 * `ai-service/.env` yourself (see `.env.example`); MAIN_API_URL and AI_INTERNAL_SECRET
 * must match where memoria-be runs and the secret in the main API `.env`.
 */
const fs = require('fs');
const path = require('path');

const rootEnvPath = path.resolve(__dirname, '..', '.env');
const outPath = path.join(__dirname, '.env');

const KEYS_FROM_ROOT = [
  'NODE_ENV',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'VERTEX_AI_PROJECT_ID',
  'VERTEX_AI_LOCATION',
  'VERTEX_AI_SERVICE_ACCOUNT_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS',
  /** Must match memoria-be `AI_INTERNAL_SECRET` (was missing here, so sync always overwrote with a fixed default). */
  'AI_INTERNAL_SECRET',
  'MAIN_API_URL',
];

if (!fs.existsSync(rootEnvPath)) {
  console.error(
    'Root .env not found at',
    rootEnvPath,
    '\nIf ai-service lives outside the memoria-be repo, copy ai-service/.env.example to ai-service/.env and set MAIN_API_URL, AI_INTERNAL_SECRET (same as main API), and API keys.'
  );
  process.exit(1);
}

const raw = fs.readFileSync(rootEnvPath, 'utf8');
const lines = raw.split(/\r?\n/);
const picked = [];

for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  if (KEYS_FROM_ROOT.includes(key)) {
    picked.push(line);
  }
}

const defaults = [
  '# memoria-ai-service — sync with: npm run env:sync (from monorepo root .env)',
  'AI_SERVICE_PORT=8080',
];

const out = [...defaults, ...picked].join('\n') + '\n';
fs.writeFileSync(outPath, out);
console.log('Wrote ai-service/.env (entries from root + service defaults).');
