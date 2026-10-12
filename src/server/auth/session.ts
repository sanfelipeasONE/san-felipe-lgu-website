import "server-only";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  officeId: string | null;
  roleId: string;
  isSystemScope: boolean;
  permissions: string[];
}

/**
 * Retrieves the currently authenticated municipal staff member session.
 * Phase 1 stub returns null; Phase 2 will resolve this via HttpOnly session cookies/tokens.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Phase 1: Authentication session implementation deferred to Phase 2.
  return null;
}
