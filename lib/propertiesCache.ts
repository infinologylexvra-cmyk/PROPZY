import { isAdminUser } from './accessControl';

interface CacheEntry {
  payload: any;
  timestamp: number;
}

// In-Memory Fast API Server Cache Layer
const apiPropertiesCache = new Map<string, CacheEntry>();
export const SERVER_CACHE_TTL_MS = 45000; // 45 Seconds Server TTL

// In-Flight Request Deduplication Map
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Deterministically constructs a cache key based on query parameters and user role identity.
 */
export function buildPropertyCacheKey(searchParams: URLSearchParams, authUser: any): string {
  const sortedParams = Array.from(searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const cacheIdentity = !authUser
    ? 'guest'
    : isAdminUser(authUser)
    ? 'admin'
    : `user:${authUser.id || 'auth'}`;

  return `prop:${cacheIdentity}:${sortedParams}`;
}

export function getPropertiesCache(key: string): CacheEntry | undefined {
  const entry = apiPropertiesCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > SERVER_CACHE_TTL_MS) {
    apiPropertiesCache.delete(key);
    return undefined;
  }
  return entry;
}

export function setPropertiesCache(key: string, payload: any): void {
  apiPropertiesCache.set(key, { payload, timestamp: Date.now() });
}

export function clearPropertiesCache(): void {
  apiPropertiesCache.clear();
}

export function getInFlight(key: string): Promise<any> | undefined {
  return inFlightRequests.get(key);
}

export function setInFlight(key: string, promise: Promise<any>): void {
  inFlightRequests.set(key, promise);
}

export function deleteInFlight(key: string): void {
  inFlightRequests.delete(key);
}
