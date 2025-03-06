import getConfig from 'next/config';

/**
 * Utility function to get the current base URL, accounting for port changes
 * This prevents issues when the server port changes (e.g., from 3000 to 3001)
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: get from window location
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // Server-side: use environment variables or default
  const { publicRuntimeConfig } = getConfig() || { publicRuntimeConfig: {} };
  const baseUrl = publicRuntimeConfig.baseUrl || '';
  
  if (baseUrl) {
    return baseUrl;
  }
  
  // Default fallback - this should rarely be used
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
}

/**
 * Create an absolute URL with the correct base and optional cache-busting
 */
export function createUrl(path: string, addCacheBuster = false): string {
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;
  
  if (addCacheBuster) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }
  
  return url;
}

/**
 * Create a URL with cache-busting for resources that might be cached
 */
export function createCacheBustedUrl(path: string): string {
  return createUrl(path, true);
} 