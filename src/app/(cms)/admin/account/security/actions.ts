"use server";

import { headers } from "next/headers";
import { getCurrentUser, revokeSessionById, revokeAllOtherSessions } from "@/server/auth/session";
import { recordAuditEvent } from "@/server/audit/service";
import { AUDIT_ACTIONS } from "@/server/audit/constants";

async function getClientContext(): Promise<{ ipAddress: string; userAgent: string }> {
  const headerList = await headers();
  const realIp = headerList.get("x-real-ip");
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");
  const userAgent = headerList.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}

/**
 * Revokes a specific session belonging to the currently authenticated user.
 * Strictly enforces user ownership boundary.
 */
export async function revokeOtherSessionAction(sessionId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { success: false, message: "Unauthorized." };
  }

  if (sessionId === user.sessionId) {
    return { success: false, message: "Cannot revoke your current session from here. Use sign out instead." };
  }

  const { ipAddress, userAgent } = await getClientContext();
  const revoked = await revokeSessionById(user.id, sessionId);

  if (revoked) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.SESSION_REVOKED,
      userId: user.id,
      officeId: user.officeId,
      details: { revokedSessionId: sessionId },
      ipAddress,
      userAgent,
    });
  }

  return { success: true };
}

/**
 * Revokes all sessions belonging to the current user except the current active session.
 */
export async function revokeAllOtherSessionsAction(): Promise<{
  success: boolean;
  message?: string;
  count?: number;
}> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { success: false, message: "Unauthorized." };
  }

  const { ipAddress, userAgent } = await getClientContext();
  const count = await revokeAllOtherSessions(user.id, user.sessionId);

  await recordAuditEvent({
    action: AUDIT_ACTIONS.SESSIONS_REVOKED_ALL,
    userId: user.id,
    officeId: user.officeId,
    details: { count, retainedSessionId: user.sessionId },
    ipAddress,
    userAgent,
  });

  return { success: true, count };
}
