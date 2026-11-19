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

export const TOURISM_ROLE_SLUG = "tourism-content-manager";
export const TOURISM_ROLE_NAME = "Tourism Content Manager";
export const TOURISM_PERMISSIONS = [
  PERMISSIONS.TOURISM_VIEW,
  PERMISSIONS.TOURISM_CREATE,
  PERMISSIONS.TOURISM_UPDATE,
  PERMISSIONS.TOURISM_PUBLISH,
  PERMISSIONS.TOURISM_ARCHIVE,
  PERMISSIONS.TOURISM_DELETE,
] as const;

export const SB_ADMIN_ROLE_SLUG = "sangguniang-bayan-admin";
export const SB_ADMIN_ROLE_NAME = "Sangguniang Bayan Admin";
export const SB_OFFICE_SLUG = "office-of-the-sangguniang-bayan";
export const SB_RESOLUTION_PERMISSIONS = [
  PERMISSIONS.SB_RESOLUTIONS_VIEW,
  PERMISSIONS.SB_RESOLUTIONS_CREATE,
  PERMISSIONS.SB_RESOLUTIONS_UPDATE,
  PERMISSIONS.SB_RESOLUTIONS_PUBLISH,
  PERMISSIONS.SB_RESOLUTIONS_ARCHIVE,
  PERMISSIONS.SB_RESOLUTIONS_DELETE,
] as const;

export const CANONICAL_PORTAL_ROLES = [
  ...CANONICAL_PRODUCTION_ROLES,
  TOURISM_ROLE_SLUG,
  SB_ADMIN_ROLE_SLUG,
] as const;

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

  // Enforce Tourism role strict domain boundary: cannot receive non-tourism permissions (Phase 31.1)
  if (role.slug === TOURISM_ROLE_SLUG) {
    const invalidCodes = permissionCodes.filter(
      (code) => !(TOURISM_PERMISSIONS as readonly string[]).includes(code)
    );
    if (invalidCodes.length > 0) {
      throw new RoleError(
        `The Tourism Content Manager role is strictly restricted to municipal tourism permissions. The following non-tourism permissions cannot be assigned: ${invalidCodes.join(", ")}`,
        400
      );
    }
  }

  // Enforce Sangguniang Bayan Admin strict domain boundary: cannot receive non-SB-resolution permissions
  if (role.slug === SB_ADMIN_ROLE_SLUG) {
    const invalidCodes = permissionCodes.filter(
      (code) => !(SB_RESOLUTION_PERMISSIONS as readonly string[]).includes(code)
    );
    if (invalidCodes.length > 0) {
      throw new RoleError(
        `The Sangguniang Bayan Admin role is strictly restricted to Sangguniang Bayan Resolutions permissions. The following permissions cannot be assigned: ${invalidCodes.join(", ")}`,
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

/**
 * Ensures the dedicated Tourism Content Manager role exists in the database
 * with its canonical 6 tourism permissions (Phase 31).
 */
export async function ensureTourismRole() {
  const role = await prisma.role.upsert({
    where: { slug: TOURISM_ROLE_SLUG },
    update: {
      name: TOURISM_ROLE_NAME,
      isSystemScope: false,
      tier: RoleTier.CUSTOM,
      isBuiltIn: true,
      description: "Dedicated editorial, publishing, and media authority for municipal tourism attractions, hospitality accommodations, cultural heritage, and local trade products.",
    },
    create: {
      name: TOURISM_ROLE_NAME,
      slug: TOURISM_ROLE_SLUG,
      isSystemScope: false,
      tier: RoleTier.CUSTOM,
      isBuiltIn: true,
      description: "Dedicated editorial, publishing, and media authority for municipal tourism attractions, hospitality accommodations, cultural heritage, and local trade products.",
    },
  });

  // Assign the exact 6 tourism permissions
  for (const code of TOURISM_PERMISSIONS) {
    const perm = await prisma.permission.findUnique({ where: { code } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Ensure runtime initialization cannot leave the role with unauthorized permissions (Phase 31.1)
  await prisma.rolePermission.deleteMany({
    where: {
      roleId: role.id,
      permission: {
        code: { notIn: [...TOURISM_PERMISSIONS] },
      },
    },
  });

  return role;
}

const SB_PERMISSION_CATALOG: Array<{ code: string; name: string; description: string }> = [
  { code: PERMISSIONS.SB_RESOLUTIONS_VIEW, name: "View SB Resolutions", description: "View Sangguniang Bayan resolutions and drafts" },
  { code: PERMISSIONS.SB_RESOLUTIONS_CREATE, name: "Create SB Resolutions", description: "Create Sangguniang Bayan resolution drafts and upload PDFs" },
  { code: PERMISSIONS.SB_RESOLUTIONS_UPDATE, name: "Update SB Resolutions", description: "Edit Sangguniang Bayan resolution metadata and PDF attachments" },
  { code: PERMISSIONS.SB_RESOLUTIONS_PUBLISH, name: "Publish SB Resolutions", description: "Publish or unpublish Sangguniang Bayan resolutions" },
  { code: PERMISSIONS.SB_RESOLUTIONS_ARCHIVE, name: "Archive SB Resolutions", description: "Archive Sangguniang Bayan resolutions" },
  { code: PERMISSIONS.SB_RESOLUTIONS_DELETE, name: "Delete SB Resolutions", description: "Permanently delete Sangguniang Bayan resolutions" },
];

/**
 * Ensures the dedicated Sangguniang Bayan Admin role and its 6 sb_resolutions.*
 * permissions exist in the database, with strict domain isolation.
 */
export async function ensureSangguniangBayanRole() {
  const superAdminRole = await prisma.role.findUnique({
    where: { slug: "super-admin" },
    select: { id: true },
  });

  const permIds: string[] = [];
  for (const item of SB_PERMISSION_CATALOG) {
    const existing = await prisma.permission.findUnique({
      where: { code: item.code },
      select: { id: true },
    });

    const perm = existing
      ? existing
      : await prisma.permission.create({
          data: {
            code: item.code,
            name: item.name,
            module: "sb_resolutions",
            description: item.description,
          },
          select: { id: true },
        });

    permIds.push(perm.id);

    // Ensure Super Admin automatically receives newly created SB resolution permissions
    if (!existing && superAdminRole) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  const role = await prisma.role.upsert({
    where: { slug: SB_ADMIN_ROLE_SLUG },
    update: {
      name: SB_ADMIN_ROLE_NAME,
      isSystemScope: false,
      tier: RoleTier.CUSTOM,
      isBuiltIn: true,
      description:
        "Dedicated Sangguniang Bayan Resolutions management authority bound to the Office of the Sangguniang Bayan.",
    },
    create: {
      name: SB_ADMIN_ROLE_NAME,
      slug: SB_ADMIN_ROLE_SLUG,
      isSystemScope: false,
      tier: RoleTier.CUSTOM,
      isBuiltIn: true,
      description:
        "Dedicated Sangguniang Bayan Resolutions management authority bound to the Office of the Sangguniang Bayan.",
    },
  });

  for (const permissionId of permIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId,
      },
    });
  }

  // Ensure runtime initialization cannot leave the role with unauthorized permissions
  await prisma.rolePermission.deleteMany({
    where: {
      roleId: role.id,
      permission: {
        code: { notIn: [...SB_RESOLUTION_PERMISSIONS] },
      },
    },
  });

  return role;
}
