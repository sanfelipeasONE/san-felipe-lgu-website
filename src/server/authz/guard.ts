import "server-only";
import { getCurrentUser, type SessionUser } from "@/server/auth/session";
import type { PermissionCode } from "@/server/authz/permissions";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = "Authentication required to access this resource.") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

/**
 * Ensures the caller is authenticated and holds an ACTIVE municipal account.
 * Denies access if the user is unauthenticated, INACTIVE, or SUSPENDED.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  if (user.status !== "ACTIVE") {
    throw new ForbiddenError("Account is not active. Please contact the ICT Office.");
  }

  return user;
}

/**
 * Ensures the authenticated user possesses the specific permission code.
 * Rejects requests without the required permission (deny-by-default).
 */
export async function requirePermission(
  permissionCode: PermissionCode
): Promise<SessionUser> {
  const user = await requireUser();

  const hasPermission = user.permissions.includes(permissionCode);
  if (!hasPermission) {
    throw new ForbiddenError(
      `Missing required permission: ${permissionCode}`
    );
  }

  return user;
}

/**
 * Validates office-level ownership.
 * Grants access if:
 * 1. The user has system-wide scope (e.g. Super Admin, Site Admin).
 * 2. OR the user belongs directly to the specified target office.
 */
export async function requireOfficeAccess(
  targetOfficeId: string
): Promise<SessionUser> {
  const user = await requireUser();

  if (user.isSystemScope) {
    return user;
  }

  if (!user.officeId || user.officeId !== targetOfficeId) {
    throw new ForbiddenError(
      "Access restricted: you do not hold authorization for this municipal office."
    );
  }

  return user;
}
