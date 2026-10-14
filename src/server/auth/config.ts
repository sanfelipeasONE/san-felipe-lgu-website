import "server-only";

/**
 * Authentication & Session Security Configuration
 * Municipality of San Felipe, Zambales - Staff Portal
 */

export const AUTH_CONFIG = {
  /**
   * Name of the secure session cookie.
   * Non-sensitive, opaque identifier.
   */
  cookieName: "sfz_session",

  /**
   * Explicit session lifespan (8 hours).
   * Ensures sessions are never effectively permanent.
   */
  sessionTtlSeconds: 8 * 60 * 60,

  /**
   * Session lifespan in milliseconds.
   */
  sessionTtlMs: 8 * 60 * 60 * 1000,

  /**
   * Maximum failed login attempts allowed before rate limit lockout.
   */
  rateLimitMaxAttempts: 5,

  /**
   * Sliding rate-limiting window (15 minutes).
   */
  rateLimitWindowSeconds: 15 * 60,
  rateLimitWindowMs: 15 * 60 * 1000,

  /**
   * Production cookie options.
   */
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
} as const;
