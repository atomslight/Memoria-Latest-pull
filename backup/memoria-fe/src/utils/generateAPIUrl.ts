import { appConfig } from '../config/appConfig';

/**
 * Generates the full API URL for a given relative path.
 * Uses the same base URL as `apiClient` (`appConfig.apiBaseUrl`).
 */
export const generateAPIUrl = (relativePath: string): string => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const base = appConfig.apiBaseUrl.replace(/\/$/, '');
  return `${base}${path}`;
};
