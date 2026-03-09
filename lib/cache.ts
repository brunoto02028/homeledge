/**
 * Simple in-memory cache with TTL for expensive API responses.
 *
 * Usage:
 *   import { memCache } from '@/lib/cache';
 *   const data = await memCache.getOrSet('key', 60, async () => { ... fetch data ... });
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries = 500;

  /** Get cached value or compute + store it. TTL in seconds. */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (entry && entry.expiresAt > now) {
      return entry.data;
    }

    const data = await fetcher();
    this.store.set(key, { data, expiresAt: now + ttlSeconds * 1000 });

    // Evict oldest entries if over max
    if (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }

    return data;
  }

  /** Invalidate a specific cache key */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Clear entire cache */
  clear(): void {
    this.store.clear();
  }

  /** Get cache stats */
  stats(): { size: number; maxEntries: number } {
    return { size: this.store.size, maxEntries: this.maxEntries };
  }
}

// Singleton: global cache survives hot reloads in dev
const globalForCache = globalThis as typeof globalThis & { __memCache?: MemoryCache };

export const memCache = globalForCache.__memCache ?? new MemoryCache();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.__memCache = memCache;
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of (memCache as any).store) {
    if ((entry as CacheEntry<unknown>).expiresAt < now) {
      (memCache as any).store.delete(key);
    }
  }
}, 10 * 60 * 1000);
