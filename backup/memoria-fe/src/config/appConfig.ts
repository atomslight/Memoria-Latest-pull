import { Platform } from 'react-native';

/** Shipped default when env vars are not inlined (common in RN dev if Metro cache ignores dotenv). */
const DEFAULT_API_BASE_URL = 'https://memoria.slashifytech.in';

/** Opt-in local API: set EXPO_PUBLIC_USE_LOCAL_API=true in `.env` then restart Metro with --reset-cache. */
const localApiFallback = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
})!;

function isLocalLoopbackApiUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '10.0.2.2'
    );
  } catch {
    return /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(url);
  }
}

function resolveApiBaseUrl(): string {
  const useLocal =
    process.env.EXPO_PUBLIC_USE_LOCAL_API === 'true' ||
    process.env.EXPO_PUBLIC_USE_LOCAL_API === '1';

  const raw =
    process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  const trimmed = raw ? `${raw}`.trim().replace(/\/$/, '') : '';

  // Metro / shell often sets EXPO_PUBLIC_* to localhost; without opt-in that breaks real devices.
  if (useLocal) {
    if (trimmed && !isLocalLoopbackApiUrl(trimmed)) {
      return trimmed;
    }
    return localApiFallback;
  }
  if (trimmed && !isLocalLoopbackApiUrl(trimmed)) {
    return trimmed;
  }
  return DEFAULT_API_BASE_URL;
}

/** Resolve on each call so Metro reload / env changes are not stuck behind a stale module-level `baseURL`. */
export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export const appConfig = {
  /**
   * Memoria API. Defaults to production (`https://memoria.slashifytech.in`) — same host your Postman calls should use instead of `localhost` on a device.
   * Local backend: `.env` → `EXPO_PUBLIC_USE_LOCAL_API=true` or set a non-loopback `EXPO_PUBLIC_API_URL`.
   */
  get apiBaseUrl(): string {
    return getApiBaseUrl();
  },

  // When true, skip auth flow and go straight to Tabs (works in release APK too).
  bypassAuth: false,

  /** Dev-only: network failures show an Alert with a redacted curl. */
  showNetworkCurlAlerts: __DEV__,
};

