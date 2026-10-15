import "server-only";
import { prisma } from "@/server/db/client";
import { type SessionUser, revokeRoleSessions } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { recordAuditEvent } from "@/server/audit/service";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import { RoleTier } from "@prisma/client";
import type { UpdateRoleInput } from "@/lib/validation/roles";

export class RoleError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "RoleError";
  }
}

/**
 * The three canonical production roles for the San Felipe LGU portal.
 * site-admin, approver, and office-editor are retired from active production assignment.
 */
export const CANONICAL_PRODUCTION_ROLES = [
  "super-admin",
  "office-admin",
  "staff",
] as const;

export type CanonicalProductionRole = (typeof CANONICAL_PRODUCTION_ROLES)[number];

export const RETIRED_ROLE_SLUGS = [
  "site-admin",
  "office-editor",
  "approver",
] as const;

export type RetiredRoleSlug = (typeof RETIRED_ROLE_SLUGS)[number];

export const CANONICAL_ROLE_SLUGS = CANONICAL_PRODUCTION_ROLES;

/**
 * Critical permissions required for effective system administration.
 * A system administrator role cannot be stripped of these permissions.
 */
export const CRITICAL_SYSTEM_PERMISSIONS = [
  PERMISSIONS.USERS_VIEW,
  PERMISSIONS.USERS_CREATE,
  PERMISSIONS.USERS_UPDATE,
  PERMISSIONS.USERS_DISABLE,
  PERMISSIONS.OFFICES_VIEW,
  PERMISSIONS.OFFICES_UPDATE,
  PERMISSIONS.SETTINGS_MANAGE,
];

/**
 * Lists all system roles with their assigned permission codes and user counts.
 * Strictly SYSTEM-only with settings.manage permission.
 */
export async function listRoles(caller: SessionUser) {
  if (!caller.isSystemScope) {
    throw new RoleError("Access restricted: Role administration requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.SETTINGS_MANAGE)) {
    throw new RoleError("Missing required permission: settings.manage", 403);
  }

  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: {
            select: { code: true, name: true, module: true },
          },
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: [{ isSystemScope: "desc" }, { name: "asc" }],
  });

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    isSystemScope: r.isSystemScope,
    tier: r.tier,
    isBuiltIn: r.isBuiltIn,
    userCount: r._count.users,
    permissions: r.permissions.map((rp) => rp.permission),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Retrieves a single role with full permission details.
 */
export async function getRoleById(caller: SessionUser, roleId: string) {
  if (!caller.isSystemScope) {
    throw new RoleError("Access restricted: Role administration requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.SETTINGS_MANAGE)) {
    throw new RoleError("Missing required permission: settings.manage", 403);
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  if (!role) {
    throw new RoleError("Role not found.", 404);
  }

  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystemScope: role.isSystemScope,
    tier: role.tier,
    isBuiltIn: role.isBuiltIn,
    userCount: role._count.users,
    permissions: role.permissions.map((rp) => rp.permission),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

/**
 * Updates a role's label or description.
 * Immutable fields: tier, slug, isBuiltIn, and isSystemScope cannot be changed.
 */
export async function updateRole(
  caller: SessionUser,
  roleId: string,
  input: UpdateRoleInput,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!caller.isSystemScope) {
    throw new RoleError("Access restricted: Role administration requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.SETTINGS_MANAGE)) {
    throw new RoleError("Missing required permission: settings.manage", 403);
  }

  const existing = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!existing) {
    throw new RoleError("Role not found.", 404);
  }

  // Optimistic concurrency check
  if (
    input.expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== input.expectedUpdatedAt
  ) {
    throw new RoleError(
      "This role was modified by another administrator. Please refresh and review before saving.",
      409
    );
  }

  const updated = await prisma.role.update({
    where: { id: roleId },
    data: {
      name: input.name.trim(),
      description: input.description ? input.description.trim() : null,
    },
  });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.ROLE_UPDATED,
    userId: caller.id,
    details: {
      roleId: updated.id,
      name: updated.name,
      slug: updated.slug,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return updated;
}

/**
 * Updates the granular permissions assigned to a role.
 * - Transactional mutation.
 * - Enforces last-admin safety: cannot strip critical system administrative
 *   permissions from the SYSTEM_ADMIN role.
 * - Revokes active sessions of all users assigned to this role.
 */
export async function updateRolePermissions(
  caller: SessionUser,
  roleId: string,
  permissionCodes: string[],
  expectedUpdatedAt?: string,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!caller.isSystemScope) {
    throw new RoleError("Access restricted: Role administration requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.SETTINGS_MANAGE)) {
    throw new RoleError("Missing required permission: settings.manage", 403);
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: { select: { code: true } } },
      },
    },
  });

  if (!role) {
    throw new RoleError("Role not found.", 404);
  }

  // Optimistic concurrency check
  if (
    expectedUpdatedAt &&
    role.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new RoleError(
      "This role's configuration was modified by another administrator. Please refresh and review before saving.",
      409
    );
  }

  // Last-admin safeguard: SYSTEM_ADMIN role cannot lose critical administrative permissions
  if (role.isSystemScope && role.tier === RoleTier.SYSTEM_ADMIN) {
    const missingCritical = CRITICAL_SYSTEM_PERMISSIONS.filter(
      (perm) => !permissionCodes.includes(perm)
    );
    if (missingCritical.length > 0) {
      throw new RoleError(
        `Cannot remove critical administrative permissions from the System Administrator role: ${missingCritical.join(", ")}`,
        400
      );
    }
  }

  // Validate that all supplied permission codes exist in the database
  const matchingPermissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true, code: true },
  });

  if (matchingPermissions.length !== permissionCodes.length) {
    const foundCodes = new Set(matchingPermissions.map((p) => p.code));
    const invalidCodes = permissionCodes.filter((c) => !foundCodes.has(c));
    throw new RoleError(
      `One or more invalid permission codes were supplied: ${invalidCodes.join(", ")}`,
      400
    );
  }

  const previousCodes = role.permissions.map((rp) => rp.permission.code);

  await prisma.$transaction(async (tx) => {
    // Remove existing role-permission assignments
    await tx.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new role-permission assignments
    await tx.rolePermission.createMany({
      data: matchingPermissions.map((p) => ({
        roleId,
        permissionId: p.id,
      })),
    });

    // Touch role updatedAt
    await tx.role.update({
      where: { id: roleId },
      data: { updatedAt: new Date() },
    });
  });

  // Revoke active sessions for all users holding this role
  await revokeRoleSessions(roleId);

  await recordAuditEvent({
    action: AUDIT_ACTIONS.ROLE_PERMISSIONS_CHANGED,
    userId: caller.id,
    details: {
      roleId,
      roleName: role.name,
      previousPermissions: previousCodes,
      newPermissions: permissionCodes,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return { success: true };
}

/**
 * Returns the complete, read-only catalog of permissions grouped by module.
 */
export async function listPermissionCatalog(caller: SessionUser) {
  if (!caller.isSystemScope) {
    throw new RoleError("Access restricted: Permission catalog requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.SETTINGS_MANAGE)) {
    throw new RoleError("Missing required permission: settings.manage", 403);
  }

  return prisma.permission.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      module: true,
      description: true,
      createdAt: true,
    },
    orderBy: [{ module: "asc" }, { code: "asc" }],
  });
}
