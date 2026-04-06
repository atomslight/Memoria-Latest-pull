import { storageService } from '../services/storage';

const PREFIXES = new Set(['avatars', 'memories']);

/**
 * Turn a stored profile value into a browser-usable URL.
 * Accepts legacy full HTTPS URLs, or object keys like `avatars/userId/avatar.jpg`.
 */
export async function resolveProfilePicUrl(
  stored: string | null | undefined
): Promise<string | null> {
  if (stored == null || stored === '') return null;
  if (stored.startsWith('http://') || stored.startsWith('https://')) {
    return stored;
  }
  const slash = stored.indexOf('/');
  if (slash === -1) return stored;
  const prefix = stored.slice(0, slash);
  const rest = stored.slice(slash + 1);
  if (PREFIXES.has(prefix)) {
    return storageService.getSignedUrl(prefix, rest, 3600);
  }
  return stored;
}
