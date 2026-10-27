/**
 * Scope and Authority Helpers for San Felipe LGU Multi-Office CMS.
 *
 * Core Security Model:
 * 1. WHO: Authenticated User
 * 2. WHAT: Granular Permissions (e.g. "posts.view", "users.create")
 * 3. WHERE: Operational Scope (SYSTEM vs OFFICE + officeId)
 *
 * Authorization decisions evaluate permissions and operational scope,
 * never by role name string matching.
 */

export interface AuthorizableUser {
  id: string;
  isSystemScope: boolean;
  officeId: string | null;
  permissions: string[];
}

/**
 * Checks if a user has a specific granular permission code.
 */
export function hasPermission(
  user: { permissions: string[] },
  permissionCode: string
): boolean {
  return user.permissions.includes(permissionCode);
}

/**
 * Checks if a user has at least one permission from a given list.
 */
export function hasAnyPermission(
  user: { permissions: string[] },
  permissionCodes: string[]
): boolean {
  return permissionCodes.some((code) => user.permissions.includes(code));
}

/**
 * Checks if a user possesses all permissions in a given list.
 */
export function hasAllPermissions(
  user: { permissions: string[] },
  permissionCodes: string[]
): boolean {
  return permissionCodes.every((code) => user.permissions.includes(code));
}

/**
 * Returns true if the user operates under SYSTEM scope.
 * System-scoped users have authority across all municipal offices
 * subject to their granular permissions.
 */
export function isSystemScoped(user: { isSystemScope: boolean }): boolean {
  return Boolean(user.isSystemScope);
}

/**
 * Returns true if the user is scoped to a specific municipal office.
 */
export function isOfficeScoped(user: {
  isSystemScope: boolean;
  officeId: string | null;
}): boolean {
  return !user.isSystemScope && Boolean(user.officeId);
}

/**
 * Validates office-level access boundary.
 *
 * Rule:
 * 1. SYSTEM scope users can access any municipal office.
 * 2. OFFICE scope users can ONLY access their own assigned officeId.
 * 3. Any attempt by an office-scoped user to access another office is denied.
 */
export function canAccessOffice(
  user: { isSystemScope: boolean; officeId: string | null },
  targetOfficeId: string | null | undefined
): boolean {
  if (user.isSystemScope) {
    return true;
  }
  if (!user.officeId || !targetOfficeId) {
    return false;
  }
  return user.officeId === targetOfficeId;
}

/**
 * Validates content ownership boundary for office-scoped content.
 *
 * Rule:
 * 1. User must possess the required permission.
 * 2. If SYSTEM scope: permitted across all offices.
 * 3. If OFFICE scope: content.officeId MUST equal user.officeId.
 */
export function canManageOfficeContent(
  user: AuthorizableUser,
  contentOfficeId: string | null | undefined,
  requiredPermission: string
): boolean {
  if (!hasPermission(user, requiredPermission)) {
    return false;
  }
  return canAccessOffice(user, contentOfficeId);
}

export type AuthorityLevel = "SUPER_ADMIN" | "OFFICE_ADMIN" | "STAFF";

/**
 * Computes the practical account level based on permissions and scope,
 * NOT brittle role display name matching.
 */
export function getAuthorityLevel(user: {
  isSystemScope: boolean;
  permissions: string[];
}): AuthorityLevel {
  if (user.isSystemScope) {
    return "SUPER_ADMIN";
  }
  if (user.permissions.includes("users.view")) {
    return "OFFICE_ADMIN";
  }
  return "STAFF";
}

/**
 * Returns a human-readable authority summary for display in the CMS shell.
 */
export function getAuthoritySummary(user: {
  name: string;
  email: string;
  isSystemScope: boolean;
  officeId: string | null;
  office?: { name: string; shortName: string | null } | null;
  permissions: string[];
}) {
  const level = getAuthorityLevel(user);

  let levelLabel = "Municipal Staff User";
  if (level === "SUPER_ADMIN") {
    levelLabel = "System Administrator";
  } else if (level === "OFFICE_ADMIN") {
    levelLabel = "Office Administrator";
  }

  const scopeLabel = user.isSystemScope
    ? "System-Wide (All Municipal Offices)"
    : user.office
      ? `${user.office.name}${user.office.shortName ? ` (${user.office.shortName})` : ""}`
      : "Assigned Office Scope";

  return {
    level,
    levelLabel,
    scopeLabel,
    isSystem: user.isSystemScope,
    canManageUsers: hasPermission(user, "users.view"),
    canManageOffices: isSystemScoped(user) && hasPermission(user, "offices.view"),
    canManageRoles: isSystemScoped(user) && hasPermission(user, "settings.manage"),
    canViewAudit: isSystemScoped(user) && hasPermission(user, "audit.view"),
    canPublishNews: hasPermission(user, "posts.publish"),
    canCreateNews: hasPermission(user, "posts.create"),
  };
}
