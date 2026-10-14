import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/server/db/client";
import { AUTH_CONFIG } from "@/server/auth/config";

export interface SessionOffice {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

export interface SessionRole {
  id: string;
  name: string;
  slug: string;
  isSystemScope: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  officeId: string | null;
  office: SessionOffice | null;
  roleId: string;
  role: SessionRole;
  isSystemScope: boolean;
  permissions: string[];
  sessionId: string;
}

/**
 * Computes a SHA-256 hash of the bearer token for database storage and lookup.
 * This ensures the raw bearer token is never persisted at rest in the database.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically secure random session bearer token.
 * 32 random bytes encoded in base64url provide 256 bits of entropy.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Creates a new persistent server session in PostgreSQL and sets the HttpOnly session cookie.
 */
export async function createSession(
  userId: string,
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<{ token: string; sessionId: string }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.sessionTtlMs);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.cookieName, token, {
    ...AUTH_CONFIG.cookieOptions,
    maxAge: AUTH_CONFIG.sessionTtlSeconds,
    expires: expiresAt,
  });

  return { token, sessionId: session.id };
}

/**
 * Retrieves the currently authenticated municipal staff member session.
 * Reads the HttpOnly cookie, verifies against PostgreSQL, and loads:
 * User + Office + Role + Permissions.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONFIG.cookieName);

  if (!sessionCookie?.value) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionCookie.value);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          office: true,
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Verify session validity and revocation state
  if (!session) {
    return null;
  }

  const now = new Date();
  if (session.revokedAt !== null || session.expiresAt <= now) {
    return null;
  }

  const user = session.user;
  if (!user) {
    return null;
  }

  // Reject inactive or suspended user accounts
  if (user.status !== "ACTIVE") {
    return null;
  }

  // Reject office-scoped users assigned to an inactive municipal office
  if (!user.role.isSystemScope && user.office?.status === "INACTIVE") {
    return null;
  }

  // Update lastUsedAt if older than 5 minutes (sliding tracking without database churn)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  if (!session.lastUsedAt || session.lastUsedAt < fiveMinutesAgo) {
    // Fire and forget update
    prisma.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: now },
      })
      .catch((err) => {
        console.error("[SESSION] Failed to update lastUsedAt:", err);
      });
  }

  // Extract flat list of granular permission codes
  const permissions: string[] = user.role.permissions.map(
    (rp) => rp.permission.code
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    officeId: user.officeId,
    office: user.office
      ? {
          id: user.office.id,
          name: user.office.name,
          shortName: user.office.shortName,
          slug: user.office.slug,
        }
      : null,
    roleId: user.roleId,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug,
      isSystemScope: user.role.isSystemScope,
    },
    isSystemScope: user.role.isSystemScope,
    permissions,
    sessionId: session.id,
  };
}

/**
 * Revokes the current server-side session and clears the browser cookie.
 */
export async function revokeCurrentSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONFIG.cookieName);

  let userId: string | null = null;

  if (sessionCookie?.value) {
    const tokenHash = hashSessionToken(sessionCookie.value);
    const existing = await prisma.session.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true },
    });

    if (existing) {
      userId = existing.userId;
      await prisma.session.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  // Clear cookie from the browser
  cookieStore.delete(AUTH_CONFIG.cookieName);

  return userId;
}

/**
 * Revokes all active server-side sessions for a specific user.
 * Used when accounts are disabled, roles are modified, offices are changed,
 * or credentials are reset.
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  return result.count;
}

/**
 * Revokes all active sessions for all users assigned to a specific role.
 * Used when role permissions are modified.
 */
export async function revokeRoleSessions(roleId: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      user: { roleId },
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  return result.count;
}

/**
 * Revokes all active sessions for all users belonging to a specific municipal office.
 * Used when an office is deactivated.
 */
export async function revokeOfficeSessions(officeId: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      user: { officeId },
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  return result.count;
}

export interface UserSessionRecord {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  isCurrent: boolean;
}

/**
 * Lists active server sessions for a given user, marking the current session.
 * Never returns tokens or token hashes.
 */
export async function listUserSessions(
  userId: string,
  currentSessionId?: string
): Promise<UserSessionRecord[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return sessions.map((s) => ({
    ...s,
    isCurrent: s.id === currentSessionId,
  }));
}

/**
 * Revokes a specific session belonging to a caller user.
 * Caller cannot revoke other users' sessions.
 */
export async function revokeSessionById(
  callerUserId: string,
  sessionId: string
): Promise<boolean> {
  const result = await prisma.session.updateMany({
    where: {
      id: sessionId,
      userId: callerUserId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count > 0;
}

/**
 * Revokes all sessions belonging to the caller except the current active session.
 */
export async function revokeAllOtherSessions(
  callerUserId: string,
  currentSessionId: string
): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId: callerUserId,
      id: { not: currentSessionId },
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count;
}

