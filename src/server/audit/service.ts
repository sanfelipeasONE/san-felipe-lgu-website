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
 * Sensitive field names that must never be recorded in audit logs.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "plainText",
  "passwordHash",
  "token",
  "tokenHash",
  "secret",
  "authorization",
  "cookie",
]);

/**
 * Deep sanitization function to strip any sensitive credentials or bearer tokens.
 */
function sanitizeAuditDetails(
  details: Record<string, unknown> | null | undefined
): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
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

