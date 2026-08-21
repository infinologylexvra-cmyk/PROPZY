import { isAdminUser } from './accessControl';
import { redisGet, redisSet, redisDel, isRedisAvailable } from './redis';

interface CacheEntry {
  payload: any;
  timestamp: number;
}

// In-Memory Fast API Server Layer 1 Cache
const apiPropertiesCache = new Map<string, CacheEntry>();
export const SERVER_CACHE_TTL_MS = 45000; // 45 Seconds TTL
export const SERVER_CACHE_TTL_SECONDS = 45; // 45 Seconds Redis TTL
export const SERVER_CACHE_STALE_TTL_MS = 5 * 60 * 1000; // 5 Minutes Stale Fallback

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

export interface CachedPropertyResult {
  payload: any;
  source: 'redis' | 'memory';
}

/**
 * Retrieves cached property data from Redis (L2) or in-memory map (L1).
 */
export async function getPropertiesCache(key: string): Promise<CachedPropertyResult | undefined> {
  // 1. Try Redis Distributed Cache
  try {
    const redisData = await redisGet<any>(key);
    if (redisData) {
      // Also warm in-memory L1 cache
      apiPropertiesCache.set(key, { payload: redisData, timestamp: Date.now() });
      return { payload: redisData, source: 'redis' };
    }
  } catch (err) {
    // Silently fall through to L1 memory cache
  }

  // 2. Fallback to Local In-Memory Cache
  const entry = apiPropertiesCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > SERVER_CACHE_TTL_MS) {
    apiPropertiesCache.delete(key);
    return undefined;
  }

  return { payload: entry.payload, source: 'memory' };
}

/**
 * Retrieves stale cache when database is unavailable.
 */
export async function getStalePropertiesCache(key: string): Promise<{ payload: any } | undefined> {
  const entry = apiPropertiesCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > SERVER_CACHE_STALE_TTL_MS) {
    apiPropertiesCache.delete(key);
    return undefined;
  }
  return { payload: entry.payload };
}

/**
 * Saves payload to both Redis (L2) with TTL and in-memory map (L1).
 */
export async function setPropertiesCache(
  key: string,
  payload: any,
  ttlSeconds: number = SERVER_CACHE_TTL_SECONDS
): Promise<void> {
  // 1. Save in L1 In-Memory Cache
  apiPropertiesCache.set(key, { payload, timestamp: Date.now() });

  // 2. Save in Redis Distributed Cache
  try {
    await redisSet(key, payload, ttlSeconds);
  } catch (err) {
    // Error logged inside redisSet, in-memory continues to function
  }
}

/**
 * Clears cache keys across Redis and in-memory.
 * Supports pattern purging (default: 'prop:*' to clear all property queries).
 */
export async function clearPropertiesCache(pattern: string = 'prop:*'): Promise<void> {
  // Clear L1 memory cache
  apiPropertiesCache.clear();

  // Clear Redis L2 keys by pattern
  try {
    await redisDel(pattern);
  } catch (err) {
    // Fail-safe
  }
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
