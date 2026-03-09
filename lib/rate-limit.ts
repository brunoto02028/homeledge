/**
 * In-memory rate limiter for Next.js API routes.
 * Uses a sliding-window counter per IP/key.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit';
 *   const limiter = rateLimit({ interval: 60_000, limit: 10 });
 *
 *   // In API route:
 *   const { success, remaining, reset } = limiter.check(ip);
 *   if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  interval?: number;
  /** Max requests per window (default: 60) */
  limit?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

const globalStore = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [name, store] of globalStore) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
    if (store.size === 0) {
      globalStore.delete(name);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig = {}) {
  const interval = config.interval ?? 60_000;
  const limit = config.limit ?? 60;
  const name = `rl_${interval}_${limit}`;

  if (!globalStore.has(name)) {
    globalStore.set(name, new Map());
  }
  const store = globalStore.get(name)!;

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        // New window
        store.set(key, { count: 1, resetAt: now + interval });
        return { success: true, remaining: limit - 1, reset: now + interval, limit };
      }

      entry.count++;

      if (entry.count > limit) {
        return { success: false, remaining: 0, reset: entry.resetAt, limit };
      }

      return { success: true, remaining: limit - entry.count, reset: entry.resetAt, limit };
    },
  };
}

// ── Pre-configured limiters for common routes ───────────────

/** Auth routes: 10 requests per minute per IP */
export const authLimiter = rateLimit({ interval: 60_000, limit: 10 });

/** Sensitive routes (password reset, signup): 5 per minute */
export const sensitiveLimiter = rateLimit({ interval: 60_000, limit: 5 });

/** AI routes: 20 per minute (expensive operations) */
export const aiLimiter = rateLimit({ interval: 60_000, limit: 20 });

/** General API: 120 per minute */
export const apiLimiter = rateLimit({ interval: 60_000, limit: 120 });

/** Upload routes: 30 per minute */
export const uploadLimiter = rateLimit({ interval: 60_000, limit: 30 });

/**
 * Helper: extract client IP from request headers.
 * Works behind nginx/cloudflare proxy.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}
