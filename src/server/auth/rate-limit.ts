import "server-only";
import { AUTH_CONFIG } from "@/server/auth/config";

interface AttemptRecord {
  timestamps: number[];
}

/**
 * In-memory sliding window rate limiter for authentication endpoints.
 * Tracks failed authentication attempts by key (source IP or normalized login identifier).
 *
 * NOTE & LIMITATION:
 * This in-memory store is appropriate for single-instance Next.js deployments.
 * In multi-region serverless clusters without sticky sessions, this should later
 * be backed by Redis/Upstash if distributed rate-limiting is required.
 */
class RateLimiter {
  private store = new Map<string, AttemptRecord>();
  private lastCleanup = Date.now();

  /**
   * Cleans up expired entries periodically to prevent memory leaks.
   */
  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < 60_000) return; // run at most once per minute

    this.lastCleanup = now;
    const cutoff = now - AUTH_CONFIG.rateLimitWindowMs;

    for (const [key, record] of this.store.entries()) {
      const active = record.timestamps.filter((ts) => ts > cutoff);
      if (active.length === 0) {
        this.store.delete(key);
      } else {
        record.timestamps = active;
      }
    }
  }

  /**
   * Checks if an identifier or IP is currently rate-limited.
   */
  public check(key: string): { allowed: boolean; retryAfterSeconds: number } {
    this.cleanup();
    const record = this.store.get(key);
    if (!record) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const now = Date.now();
    const cutoff = now - AUTH_CONFIG.rateLimitWindowMs;
    const activeAttempts = record.timestamps.filter((ts) => ts > cutoff);

    if (activeAttempts.length >= AUTH_CONFIG.rateLimitMaxAttempts) {
      const oldestActive = activeAttempts[0];
      const remainingMs = oldestActive + AUTH_CONFIG.rateLimitWindowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  /**
   * Records a failed authentication attempt.
   */
  public recordFailure(key: string): void {
    const now = Date.now();
    const cutoff = now - AUTH_CONFIG.rateLimitWindowMs;

    const record = this.store.get(key) ?? { timestamps: [] };
    const active = record.timestamps.filter((ts) => ts > cutoff);
    active.push(now);

    this.store.set(key, { timestamps: active });
  }

  /**
   * Clears failed attempts upon successful authentication.
   */
  public reset(key: string): void {
    this.store.delete(key);
  }
}

// Global instance in server memory
export const authRateLimiter = new RateLimiter();
