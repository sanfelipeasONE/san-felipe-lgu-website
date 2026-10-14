"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { verifyPassword } from "@/server/auth/password";
import { createSession, revokeCurrentSession } from "@/server/auth/session";
import { authRateLimiter } from "@/server/auth/rate-limit";
import { recordAuditEvent } from "@/server/audit/service";
import { AUDIT_ACTIONS } from "@/server/audit/constants";

export interface LoginActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof LoginInput, string[]>>;
  redirectTo?: string;
}

/**
 * Pre-computed valid Argon2id hash used to mitigate timing side-channels
 * when a non-existent email identifier is submitted.
 */
const TIMING_MITIGATION_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c2FudGhlbGlwZWF1dGg$Z/E3Q8i9E+yYQh40h0rR6qg6wZ0l1k9uF7k0v6n2p8A";

/**
 * Validates request origin against the Host header for state-changing POST actions.
 */
async function validateRequestOrigin(): Promise<boolean> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  const host = headerList.get("host");

  if (!origin || !host) {
    // Non-browser or direct invocation without origin header allowed if server-action CSRF token is present
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Extracts sanitized client network information for audit and rate-limiting.
 */
async function getClientContext(): Promise<{ ipAddress: string; userAgent: string }> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headerList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}

/**
 * Server action processing municipal staff login submissions.
 * Validates credentials using Argon2id, checks rate limits, creates PostgreSQL
 * session records, and sets an HttpOnly cookie upon success.
 */
export async function authenticateStaff(
  data: unknown
): Promise<LoginActionResult> {
  // 1. Origin / CSRF Verification
  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) {
    return {
      success: false,
      message: "Request origin validation failed. Please refresh the page and try again.",
    };
  }

  const { ipAddress, userAgent } = await getClientContext();

  // 2. Schema Validation
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    const flattened = result.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Please correct the errors in the form.",
      fieldErrors: flattened,
    };
  }

  const normalizedEmail = result.data.email.trim().toLowerCase();
  const rawPassword = result.data.password;

  const ipKey = `ip:${ipAddress}`;
  const idKey = `id:${normalizedEmail}`;

  // 3. Rate Limit Check (by IP and by normalized email identifier)
  const ipLimit = authRateLimiter.check(ipKey);
  const idLimit = authRateLimiter.check(idKey);

  if (!ipLimit.allowed || !idLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, idLimit.retryAfterSeconds);
    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_RATE_LIMITED,
      details: {
        attemptIdentifier: normalizedEmail,
        retryAfterSeconds: retryAfter,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: `Too many failed login attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`,
    };
  }

  // 4. Lookup User in PostgreSQL
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      role: true,
      office: true,
    },
  });

  // 5. Account Check & Timing-Mitigated Verification
  if (!user) {
    // Consume equivalent Argon2id compute time to prevent user enumeration
    await verifyPassword(rawPassword, TIMING_MITIGATION_HASH);

    authRateLimiter.recordFailure(ipKey);
    authRateLimiter.recordFailure(idKey);

    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      details: {
        attemptIdentifier: normalizedEmail,
        reason: "Generic credential mismatch",
      },
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: "Invalid credentials.",
    };
  }

  // 6. Verify Argon2id Password Hash
  const isPasswordValid = await verifyPassword(rawPassword, user.passwordHash);

  if (!isPasswordValid) {
    authRateLimiter.recordFailure(ipKey);
    authRateLimiter.recordFailure(idKey);

    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      userId: user.id,
      officeId: user.officeId,
      details: {
        attemptIdentifier: normalizedEmail,
        reason: "Invalid password",
      },
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: "Invalid credentials.",
    };
  }

  // 7. Verify Account Status
  if (user.status !== "ACTIVE") {
    authRateLimiter.recordFailure(ipKey);
    authRateLimiter.recordFailure(idKey);

    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      userId: user.id,
      officeId: user.officeId,
      details: {
        attemptIdentifier: normalizedEmail,
        reason: `Account status is ${user.status}`,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: "This municipal staff account is currently inactive. Please contact the ICT Office.",
    };
  }

  // 7.1 Verify Operational Status of Assigned Municipal Office
  if (!user.role.isSystemScope && user.office?.status === "INACTIVE") {
    authRateLimiter.recordFailure(ipKey);
    authRateLimiter.recordFailure(idKey);

    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      userId: user.id,
      officeId: user.officeId,
      details: {
        attemptIdentifier: normalizedEmail,
        reason: "Assigned municipal office is currently inactive",
      },
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: "Your assigned municipal office is currently inactive. Please contact the system administrator.",
    };
  }

  // 8. Successful Authentication: Reset Rate Limiting
  authRateLimiter.reset(ipKey);
  authRateLimiter.reset(idKey);

  // 9. Create Server Session & Set HttpOnly Cookie
  await createSession(user.id, {
    ipAddress,
    userAgent,
  });

  // 10. Update lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 11. Record Audit Log Entry
  await recordAuditEvent({
    action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
    userId: user.id,
    officeId: user.officeId,
    details: {
      role: user.role.slug,
    },
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    redirectTo: "/admin",
  };
}

/**
 * Server action processing municipal staff logout.
 * Revokes the server-side session in PostgreSQL, deletes the cookie,
 * logs the security event, and redirects to the login screen.
 */
export async function logoutStaff(): Promise<void> {
  const { ipAddress, userAgent } = await getClientContext();
  const userId = await revokeCurrentSession();

  if (userId) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      userId,
      ipAddress,
      userAgent,
    });
  }

  redirect("/staff/login");
}
