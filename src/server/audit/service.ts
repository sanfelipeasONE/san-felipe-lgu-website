import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AuditAction } from "@/server/audit/constants";

export interface LogAuditOptions {
  action: AuditAction;
  userId?: string | null;
  officeId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Sensitive field names that must never be recorded or displayed in audit logs.
 */
export const SENSITIVE_KEYS = new Set([
  "password",
  "plaintext",
  "passwordhash",
  "token",
  "tokenhash",
  "sessiontoken",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "privatekey",
  "secretkey",
  "encryptionkey",
]);

/**
 * Checks if a property key should be considered sensitive.
 * Avoids over-redacting benign keys such as `serviceKey`, `cacheKey`, or `key`.
 */
function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower)) return true;
  if (
    lower.includes("password") ||
    lower.includes("secret") ||
    lower.includes("recoverycode")
  ) {
    return true;
  }
  // Check token but avoid matching harmless words
  if (lower === "token" || lower.endsWith("token") || lower.startsWith("token")) {
    return true;
  }
  // Match specific sensitive key combinations without catching benign keys like "serviceKey"
  if (
    lower.includes("apikey") ||
    lower.includes("privatekey") ||
    lower.includes("secretkey") ||
    lower.includes("encryptionkey")
  ) {
    return true;
  }
  return false;
}

/**
 * Deep recursive redaction function to strip any sensitive credentials, bearer tokens, or secrets.
 * Safely processes objects, arrays, and primitive values.
 */
export function redactSensitiveMetadata(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveMetadata(item));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = redactSensitiveMetadata(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Deep sanitization function to strip any sensitive credentials or bearer tokens from audit details.
 */
function sanitizeAuditDetails(
  details: Record<string, unknown> | null | undefined
): Record<string, unknown> | undefined {
  if (!details) return undefined;
  return redactSensitiveMetadata(details) as Record<string, unknown>;
}

/**
 * Records an immutable administrative audit log entry.
 */
export async function recordAuditEvent(options: LogAuditOptions): Promise<void> {
  const { action, userId, officeId, details, ipAddress, userAgent } = options;
  const cleanDetails = sanitizeAuditDetails(details);

  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId ?? null,
        officeId: officeId ?? null,
        details: cleanDetails ? (cleanDetails as Prisma.InputJsonValue) : undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    // Audit log failure must not crash the primary operational flow,
    // but should be logged to server stderr.
    console.error("[AUDIT FAILURE] Could not persist audit log:", error);
  }
}

export { recordAuditEvent as logAuditEvent };

