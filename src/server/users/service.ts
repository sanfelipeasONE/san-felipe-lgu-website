import "server-only";
import { prisma } from "@/server/db/client";
import { type SessionUser, revokeAllUserSessions } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { hashPassword } from "@/server/auth/password";
import { recordAuditEvent } from "@/server/audit/service";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import { RoleTier, UserStatus } from "@prisma/client";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@/lib/validation/users";

export const CANONICAL_ROLE_SLUGS = [
  "super-admin",
  "office-admin",
  "staff",
] as const;

export const RETIRED_ROLE_SLUGS = [
  "site-admin",
  "office-editor",
  "approver",
] as const;

export class UserError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "UserError";
  }
}

/**
 * Critical permissions required for effective, coherent system administration and recovery.
 * Derived from routes and services for user, office, and role configuration.
 */
export const CRITICAL_RECOVERY_PERMISSIONS = [
  PERMISSIONS.USERS_VIEW,
  PERMISSIONS.USERS_CREATE,
  PERMISSIONS.USERS_UPDATE,
  PERMISSIONS.USERS_DISABLE,
  PERMISSIONS.OFFICES_VIEW,
  PERMISSIONS.OFFICES_UPDATE,
  PERMISSIONS.SETTINGS_MANAGE,
] as const;

/**
 * Counts how many active, recovery-capable system administrators exist in the database,
 * optionally excluding a specific user ID.
 * An effective system administrator is ACTIVE, SYSTEM-scoped, SYSTEM_ADMIN tier,
 * and holds all 7 critical recovery permissions.
 */
export async function countEffectiveActiveSystemAdmins(excludeUserId?: string): Promise<number> {
  const candidateUsers = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      role: {
        isSystemScope: true,
        tier: RoleTier.SYSTEM_ADMIN,
      },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: {
      id: true,
      role: {
        select: {
          permissions: {
            select: {
              permission: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  const effectiveAdmins = candidateUsers.filter((user) => {
    const userPerms = new Set(user.role.permissions.map((rp) => rp.permission.code));
    return CRITICAL_RECOVERY_PERMISSIONS.every((p) => userPerms.has(p));
  });

  return effectiveAdmins.length;
}

/**
 * Checks if a target user is an effective active system administrator.
 */
export function isEffectiveActiveSystemAdmin(user: {
  status: UserStatus;
  role: {
    isSystemScope: boolean;
    tier: RoleTier;
    permissions?: Array<{ permission: { code: string } }>;
  };
}): boolean {
  if (
    user.status !== UserStatus.ACTIVE ||
    !user.role.isSystemScope ||
    user.role.tier !== RoleTier.SYSTEM_ADMIN
  ) {
    return false;
  }

  if (user.role.permissions) {
    const userPerms = new Set(user.role.permissions.map((rp) => rp.permission.code));
    return CRITICAL_RECOVERY_PERMISSIONS.every((p) => userPerms.has(p));
  }

  return true;
}

/**
 * Lists user accounts subject to strict authority boundaries.
 * - SYSTEM scope: lists across all municipal offices with optional filters.
 * - OFFICE scope: strictly restricted to ordinary Staff accounts in caller.officeId.
 */
export async function listUsers(
  caller: SessionUser,
  params?: {
    officeId?: string;
    roleId?: string;
    status?: UserStatus;
    search?: string;
  }
) {
  if (!hasPermission(caller, PERMISSIONS.USERS_VIEW)) {
    throw new UserError("Missing required permission: users.view", 403);
  }

  if (caller.isSystemScope) {
    // SYSTEM admin can view across offices
    return prisma.user.findMany({
      where: {
        ...(params?.officeId ? { officeId: params.officeId } : {}),
        ...(params?.roleId ? { roleId: params.roleId } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.search
          ? {
              OR: [
                { name: { contains: params.search, mode: "insensitive" } },
                { email: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        officeId: true,
        office: { select: { id: true, name: true, shortName: true } },
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            isSystemScope: true,
            tier: true,
            isBuiltIn: true,
          },
        },
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ name: "asc" }],
    });
  }

  // OFFICE admin: strictly own office, strictly ordinary STAFF tier
  if (!caller.officeId) {
    throw new UserError("Your account is not assigned to a municipal office.", 403);
  }

  return prisma.user.findMany({
    where: {
      officeId: caller.officeId,
      role: { tier: RoleTier.STAFF },
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      officeId: true,
      office: { select: { id: true, name: true, shortName: true } },
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          isSystemScope: true,
          tier: true,
          isBuiltIn: true,
        },
      },
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ name: "asc" }],
  });
}

/**
 * Retrieves a single user record with eligibility enforcement.
 */
export async function getUserById(caller: SessionUser, targetId: string) {
  if (!hasPermission(caller, PERMISSIONS.USERS_VIEW)) {
    throw new UserError("Missing required permission: users.view", 403);
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      officeId: true,
      office: { select: { id: true, name: true, shortName: true, status: true } },
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          isSystemScope: true,
          tier: true,
          isBuiltIn: true,
        },
      },
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!target) {
    throw new UserError("User account not found.", 404);
  }

  // Office Admin eligibility check
  if (!caller.isSystemScope) {
    if (!caller.officeId || target.officeId !== caller.officeId) {
      throw new UserError("Access restricted: you do not hold authority over this office's accounts.", 403);
    }
    if (target.role.tier !== RoleTier.STAFF || target.role.isSystemScope) {
      throw new UserError("Access restricted: Office Administrators may only manage ordinary Staff accounts.", 403);
    }
  }

  return target;
}

/**
 * Creates a new municipal user account.
 * - SYSTEM scope: can create accounts across offices, validating active office and assignable role.
 * - OFFICE scope: strictly creates an ordinary Staff account in caller's own office.
 */
export async function createUser(
  caller: SessionUser,
  input: CreateUserInput,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.USERS_CREATE)) {
    throw new UserError("Missing required permission: users.create", 403);
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  // Check email uniqueness
  const existingByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingByEmail) {
    throw new UserError("A user account with this municipal email address already exists.", 400);
  }

  let targetOfficeId: string | null = null;
  let targetRoleId: string;

  if (caller.isSystemScope) {
    if (!input.roleId) {
      throw new UserError("A role must be selected for the new user account.", 400);
    }

    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
      select: { id: true, isSystemScope: true, tier: true, slug: true },
    });
    if (!role) {
      throw new UserError("The selected role does not exist.", 400);
    }
    if ((RETIRED_ROLE_SLUGS as readonly string[]).includes(role.slug)) {
      throw new UserError("The selected role is retired and cannot be assigned to user accounts.", 400);
    }

    if (!role.isSystemScope) {
      // Office-scoped role requires an active municipal office
      if (!input.officeId) {
        throw new UserError("An assigned municipal office is required for office-scoped roles.", 400);
      }
      const office = await prisma.office.findUnique({
        where: { id: input.officeId },
        select: { id: true, slug: true, status: true },
      });
      if (!office || office.slug === "icto") {
        throw new UserError("The selected municipal office does not exist.", 400);
      }
      if (office.status !== "ACTIVE") {
        throw new UserError("User accounts can only be assigned to active municipal offices.", 400);
      }
      targetOfficeId = office.id;
    } else {
      // System-scoped role: office affiliation is optional (system-wide by default)
      if (input.officeId) {
        const office = await prisma.office.findUnique({
          where: { id: input.officeId },
          select: { id: true, slug: true, status: true },
        });
        if (office && office.status === "ACTIVE" && office.slug !== "icto") {
          targetOfficeId = office.id;
        }
      }
    }

    targetRoleId = role.id;
  } else {
    // OFFICE Admin: strictly own office, strictly canonical ordinary STAFF role
    if (!caller.officeId) {
      throw new UserError("Your account is not assigned to a municipal office.", 403);
    }
    const callerOffice = await prisma.office.findUnique({
      where: { id: caller.officeId },
      select: { id: true, status: true },
    });
    if (!callerOffice || callerOffice.status !== "ACTIVE") {
      throw new UserError("Cannot create staff accounts for an inactive municipal office.", 400);
    }
    targetOfficeId = caller.officeId;

    // Find canonical Staff role
    const staffRole = await prisma.role.findFirst({
      where: {
        tier: RoleTier.STAFF,
        isBuiltIn: true,
        slug: "staff",
      },
      select: { id: true },
    });
    if (!staffRole) {
      // Fallback to any built-in staff role
      const fallbackStaff = await prisma.role.findFirst({
        where: { tier: RoleTier.STAFF, isBuiltIn: true },
        select: { id: true },
      });
      if (!fallbackStaff) {
        throw new UserError("System configuration error: Canonical Staff role not found.", 500);
      }
      targetRoleId = fallbackStaff.id;
    } else {
      targetRoleId = staffRole.id;
    }
  }

  // Hash password with Argon2id (never store plaintext)
  const passwordHash = await hashPassword(input.password);

  const newUser = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      officeId: targetOfficeId,
      roleId: targetRoleId,
      status: caller.isSystemScope ? (input.status ?? "ACTIVE") : "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      officeId: true,
      roleId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.USER_CREATED,
    userId: caller.id,
    officeId: targetOfficeId,
    details: {
      targetUserId: newUser.id,
      targetEmail: newUser.email,
      targetRoleId: newUser.roleId,
      targetOfficeId: newUser.officeId,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return newUser;
}

/**
 * Updates a user account's profile or administrative properties.
 * - SYSTEM scope: can update name, email, officeId, roleId, status.
 *   Enforces last-system-admin protection on role demotion.
 * - OFFICE scope: strictly can update name and email of ordinary Staff in own office.
 *   Cannot alter roleId, officeId, status, or permissions.
 */
export async function updateUser(
  caller: SessionUser,
  targetId: string,
  input: UpdateUserInput,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.USERS_UPDATE)) {
    throw new UserError("Missing required permission: users.update", 403);
  }

  // Validate target user eligibility
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      role: {
        select: {
          id: true,
          isSystemScope: true,
          tier: true,
          name: true,
          permissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      },
      office: { select: { id: true, status: true } },
    },
  });

  if (!target) {
    throw new UserError("User account not found.", 404);
  }

  // Office Admin eligibility check: strictly own office, strictly ordinary staff
  if (!caller.isSystemScope) {
    if (!caller.officeId || target.officeId !== caller.officeId) {
      throw new UserError("Access restricted: you do not hold authority over this office's accounts.", 403);
    }
    if (target.role.tier !== RoleTier.STAFF || target.role.isSystemScope) {
      throw new UserError("Access restricted: Office Administrators may only manage ordinary Staff accounts.", 403);
    }
  }

  // Optimistic concurrency check
  if (
    input.expectedUpdatedAt &&
    target.updatedAt.toISOString() !== input.expectedUpdatedAt
  ) {
    throw new UserError(
      "This user account was modified by another administrator. Please refresh and review before saving.",
      409
    );
  }

  const normalizedEmail = input.email ? input.email.trim().toLowerCase() : target.email;
  if (normalizedEmail !== target.email) {
    const emailConflict = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (emailConflict && emailConflict.id !== target.id) {
      throw new UserError("A user account with this municipal email address already exists.", 400);
    }
  }

  let nextOfficeId = target.officeId;
  let nextRoleId = target.roleId;
  let nextStatus = target.status;
  let roleChanged = false;
  let officeChanged = false;

  if (caller.isSystemScope) {
    // Role change validation
    if (input.roleId && input.roleId !== target.roleId) {
      const targetRole = await prisma.role.findUnique({
        where: { id: input.roleId },
        select: { id: true, isSystemScope: true, tier: true, slug: true },
      });
      if (!targetRole) {
        throw new UserError("The selected role does not exist.", 400);
      }
      if ((RETIRED_ROLE_SLUGS as readonly string[]).includes(targetRole.slug)) {
        throw new UserError("The selected role is retired and cannot be assigned to user accounts.", 400);
      }

      // Last system admin protection on role demotion
      if (
        isEffectiveActiveSystemAdmin(target) &&
        (!targetRole.isSystemScope || targetRole.tier !== RoleTier.SYSTEM_ADMIN)
      ) {
        const otherAdmins = await countEffectiveActiveSystemAdmins(target.id);
        if (otherAdmins === 0) {
          throw new UserError("Cannot demote the last active system administrator.", 400);
        }
      }

      nextRoleId = targetRole.id;
      roleChanged = true;
    }

    // Office change validation
    if (input.officeId !== undefined && input.officeId !== target.officeId) {
      if (input.officeId !== null) {
        const office = await prisma.office.findUnique({
          where: { id: input.officeId },
          select: { id: true, slug: true, status: true },
        });
        if (!office || office.slug === "icto") {
          throw new UserError("The selected municipal office does not exist.", 400);
        }
        if (office.status !== "ACTIVE") {
          throw new UserError("User accounts can only be assigned to active municipal offices.", 400);
        }
        nextOfficeId = office.id;
      } else {
        nextOfficeId = null;
      }
      officeChanged = true;
    }

    if (input.status) {
      nextStatus = input.status;
    }
  } else {
    // Office Admin: cannot alter role or office.
    // Authorized to change status of ordinary Staff in own office.
    if (input.status && input.status !== target.status) {
      if (input.status !== UserStatus.ACTIVE && !hasPermission(caller, PERMISSIONS.USERS_DISABLE)) {
        throw new UserError("Missing required permission: users.disable", 403);
      }
      nextStatus = input.status;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: target.id },
    data: {
      name: input.name ? input.name.trim() : target.name,
      email: normalizedEmail,
      officeId: nextOfficeId,
      roleId: nextRoleId,
      status: nextStatus,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      officeId: true,
      roleId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const statusChanged = nextStatus !== target.status;

  // Security: Revoke all sessions for target user if role, office, or status changed to inactive/suspended
  if (roleChanged || officeChanged || (statusChanged && nextStatus !== UserStatus.ACTIVE)) {
    await revokeAllUserSessions(target.id);
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.USER_UPDATED,
    userId: caller.id,
    officeId: updatedUser.officeId,
    details: {
      targetUserId: updatedUser.id,
      nameChanged: input.name !== undefined ? input.name.trim() !== target.name : false,
      emailChanged: input.email !== undefined ? normalizedEmail !== target.email : false,
      roleChanged,
      officeChanged,
      statusChanged,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  if (roleChanged) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
      userId: caller.id,
      officeId: updatedUser.officeId,
      details: {
        targetUserId: updatedUser.id,
        previousRoleId: target.roleId,
        newRoleId: nextRoleId,
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });
  }

  if (officeChanged) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_OFFICE_CHANGED,
      userId: caller.id,
      officeId: updatedUser.officeId,
      details: {
        targetUserId: updatedUser.id,
        previousOfficeId: target.officeId,
        newOfficeId: nextOfficeId,
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });
  }

  if (statusChanged) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
      userId: caller.id,
      officeId: updatedUser.officeId,
      details: {
        targetUserId: updatedUser.id,
        previousStatus: target.status,
        newStatus: nextStatus,
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });
    if (nextStatus !== UserStatus.ACTIVE) {
      await recordAuditEvent({
        action: AUDIT_ACTIONS.USER_DISABLED,
        userId: caller.id,
        officeId: updatedUser.officeId,
        details: {
          targetUserId: updatedUser.id,
          status: nextStatus,
        },
        ipAddress: clientMeta?.ipAddress,
        userAgent: clientMeta?.userAgent,
      });
    }
  }

  return updatedUser;
}

/**
 * Sets account status (ACTIVE, INACTIVE, SUSPENDED).
 * - Last active system administrator cannot be disabled.
 * - Revokes all active sessions for the target user immediately when disabled/suspended.
 */
export async function setUserStatus(
  caller: SessionUser,
  targetId: string,
  newStatus: UserStatus,
  expectedUpdatedAt?: string,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  const isActivating = newStatus === UserStatus.ACTIVE;
  const hasDisablePerm = hasPermission(caller, PERMISSIONS.USERS_DISABLE);
  const hasUpdatePerm = hasPermission(caller, PERMISSIONS.USERS_UPDATE);

  if (!hasDisablePerm && !hasUpdatePerm) {
    throw new UserError("Missing required permission to manage user status.", 403);
  }
  if (!isActivating && !hasDisablePerm) {
    throw new UserError("Missing required permission: users.disable", 403);
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      role: {
        select: {
          slug: true,
          isSystemScope: true,
          tier: true,
          permissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      },
    },
  });

  if (!target) {
    throw new UserError("User account not found.", 404);
  }

  // Optimistic concurrency check
  if (
    expectedUpdatedAt &&
    target.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new UserError(
      "This user account was modified by another administrator. Please refresh and review before saving.",
      409
    );
  }

  // Office Admin eligibility check
  if (!caller.isSystemScope) {
    if (!caller.officeId || target.officeId !== caller.officeId) {
      throw new UserError("Access restricted: you do not hold authority over this office's accounts.", 403);
    }
    if (target.role.tier !== RoleTier.STAFF || target.role.isSystemScope || target.role.slug !== "staff") {
      throw new UserError("Access restricted: Office Administrators may only manage status for ordinary Staff accounts.", 403);
    }
  }

  // Last system admin protection
  if (
    newStatus !== UserStatus.ACTIVE &&
    isEffectiveActiveSystemAdmin(target)
  ) {
    const otherAdmins = await countEffectiveActiveSystemAdmins(target.id);
    if (otherAdmins === 0) {
      throw new UserError("Cannot disable or suspend the last active system administrator.", 400);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    return tx.user.update({
      where: { id: target.id },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        officeId: true,
        updatedAt: true,
      },
    });
  });

  // Invalidate all active sessions for the user when disabled or suspended
  if (newStatus !== UserStatus.ACTIVE) {
    await revokeAllUserSessions(target.id);
  }

  const isDisable = newStatus === UserStatus.INACTIVE || newStatus === UserStatus.SUSPENDED;
  await recordAuditEvent({
    action: isDisable ? AUDIT_ACTIONS.USER_DISABLED : AUDIT_ACTIONS.USER_ENABLED,
    userId: caller.id,
    officeId: updated.officeId,
    details: {
      targetUserId: updated.id,
      previousStatus: target.status,
      newStatus,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return updated;
}

/**
 * Resets a user's password credential.
 * - Hashes new password with Argon2id.
 * - Revokes all active sessions for target user immediately.
 * - Plaintext password is never persisted or logged.
 */
export async function resetUserCredential(
  caller: SessionUser,
  targetId: string,
  newPasswordPlaintext: string,
  expectedUpdatedAt?: string,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.USERS_UPDATE)) {
    throw new UserError("Missing required permission: users.update to reset credentials.", 403);
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      role: { select: { tier: true, isSystemScope: true } },
    },
  });

  if (!target) {
    throw new UserError("User account not found.", 404);
  }

  // Optimistic concurrency check
  if (
    expectedUpdatedAt &&
    target.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new UserError(
      "This user account was modified by another administrator. Please refresh and review before saving.",
      409
    );
  }

  // Office Admin eligibility check
  if (!caller.isSystemScope) {
    if (!caller.officeId || target.officeId !== caller.officeId) {
      throw new UserError("Access restricted: you do not hold authority over this office's accounts.", 403);
    }
    if (target.role.tier !== RoleTier.STAFF || target.role.isSystemScope) {
      throw new UserError("Access restricted: Office Administrators may only reset credentials for ordinary Staff accounts.", 403);
    }
  }

  const passwordHash = await hashPassword(newPasswordPlaintext);

  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash },
  });

  // Revoke target user's active sessions immediately
  await revokeAllUserSessions(target.id);

  await recordAuditEvent({
    action: AUDIT_ACTIONS.USER_CREDENTIAL_RESET,
    userId: caller.id,
    officeId: target.officeId,
    details: {
      targetUserId: target.id,
      targetEmail: target.email,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return { success: true };
}
