import { PropertyItem } from './seedData';

interface ClientCacheEntry {
  data: PropertyItem[];
  pagination?: any;
  timestamp: number;
}

const clientPropertiesCache = new Map<string, ClientCacheEntry>();
export const CLIENT_CACHE_TTL_MS = 60000; // 60s client cache TTL

/**
 * Reads from the in-memory client-side property cache
 */
export function getClientPropertiesCache(key: string): ClientCacheEntry | undefined {
  const entry = clientPropertiesCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CLIENT_CACHE_TTL_MS) {
    clientPropertiesCache.delete(key);
    return undefined;
  }
  return entry;
}

/**
 * Saves a property search query response in client-side cache
 */
export function setClientPropertiesCache(key: string, data: PropertyItem[], pagination?: any): void {
  clientPropertiesCache.set(key, { data, pagination, timestamp: Date.now() });
}

/**
 * Clears the client-side property cache
 */
export function clearClientPropertiesCache(): void {
  clientPropertiesCache.clear();
}
