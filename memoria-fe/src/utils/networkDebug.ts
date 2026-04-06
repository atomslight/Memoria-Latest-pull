import type { AxiosError } from 'axios';
import { appConfig } from '../config/appConfig';

export function isCurlAlertsEnabled() {
  return !!appConfig.showNetworkCurlAlerts;
}

function isProbablySecretHeader(key: string) {
  const k = key.toLowerCase();
  return k === 'authorization' || k === 'apikey' || k === 'x-api-key';
}

function redactSecrets(value: unknown) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('Bearer ')) return 'Bearer <redacted>';
  // JWT-ish
  if (value.split('.').length === 3 && value.length > 40) return '<redacted>';
  return value;
}

export function isNetworkFailure(message: unknown) {
  const m = `${message ?? ''}`.toLowerCase();
  return m.includes('network request failed') || m === 'network error';
}

export function toCurl({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers?: Record<string, unknown> | Array<[string, unknown]>;
  body?: unknown;
}) {
  const headerPairs: Array<[string, unknown]> = Array.isArray(headers)
    ? headers
    : Object.entries(headers ?? {});

  const safeHeaders = headerPairs
    .filter(([k, v]) => v !== undefined && v !== null && `${v}`.length > 0)
    .map(([k, v]) => {
      const key = `${k}`;
      const val =
        isProbablySecretHeader(key) ? '<redacted>' : redactSecrets(v);
      return `  -H '${key}: ${val}' \\`;
    });

  const safeBody =
    body && typeof body === 'object'
      ? JSON.parse(
          JSON.stringify(body, (key, value) => {
            const k = key.toLowerCase();
            if (
              k.includes('password') ||
              k.includes('token') ||
              k.includes('apikey') ||
              k.includes('anon')
            ) {
              return '<redacted>';
            }
            return value;
          })
        )
      : body;

  const dataPart =
    safeBody === undefined
      ? []
      : [`  --data-raw '${JSON.stringify(safeBody)}'`];

  return [
    `curl -X ${method.toUpperCase()} '${url}' \\`,
    ...safeHeaders,
    ...dataPart,
  ].join('\n');
}

export function alertCurl(title: string, curl: string) {
  if (!isCurlAlertsEnabled()) return;
  // Avoid blocking Alert modals (they stack with Supabase + Axios and confuse debugging).
  console.warn(`[memoria/network] ${title}\ndo ${curl}`);
}

export function alertCurlForAxiosNetworkError(error: AxiosError) {
  if (!isCurlAlertsEnabled()) return;
  // Axios "Network Error" typically has no response (DNS/SSL/offline).
  if (error.response) return;
  if (!isNetworkFailure(error.message)) return;

  const method = error.config?.method ?? 'GET';
  const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
  const curl = toCurl({
    method,
    url,
    headers: (error.config?.headers as any) ?? {},
    body: (error.config as any)?.data,
  });
  alertCurl('Network Error', curl);
}

export function installFetchCurlAlert() {
  if (!isCurlAlertsEnabled()) return;
  const g: any = globalThis as any;
  if (g.__memoria_fetch_wrapped) return;
  g.__memoria_fetch_wrapped = true;

  const originalFetch: typeof fetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: any, init?: any) => {
    try {
      return await originalFetch(input, init);
    } catch (err: any) {
      if (isNetworkFailure(err?.message ?? err)) {
        const url =
          typeof input === 'string'
            ? input
            : input?.url ?? '<unknown url>';
        const method = (init?.method ?? input?.method ?? 'GET') as string;
        const headers =
          init?.headers ??
          (typeof input?.headers?.forEach === 'function'
            ? (() => {
                const pairs: Array<[string, unknown]> = [];
                input.headers.forEach((v: any, k: any) => pairs.push([k, v]));
                return pairs;
              })()
            : input?.headers) ??
          {};
        const body = init?.body;

        const curl = toCurl({ method, url, headers, body });
        alertCurl('Network request failed', curl);
      }
      throw err;
    }
  }) as any;
}

