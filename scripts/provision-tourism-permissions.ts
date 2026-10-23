import { PrismaClient } from "@prisma/client";

export const TOURISM_PERMISSIONS = [
  {
    code: "tourism.view",
    name: "View Tourism Entries",
    module: "tourism",
    description: "View municipal tourism attractions, resorts, culture, and products",
  },
  {
    code: "tourism.create",
    name: "Create Tourism Entries",
    module: "tourism",
    description: "Draft municipal tourism entries",
  },
  {
    code: "tourism.update",
    name: "Update Tourism Entries",
    module: "tourism",
    description: "Edit municipal tourism entry details",
  },
  {
    code: "tourism.publish",
    name: "Publish Tourism Entries",
    module: "tourism",
    description: "Publish official tourism entries directly to the portal",
  },
  {
    code: "tourism.archive",
    name: "Archive Tourism Entries",
    module: "tourism",
    description: "Archive municipal tourism entries",
  },
  {
    code: "tourism.delete",
    name: "Delete Tourism Entries",
    module: "tourism",
    description: "Permanently delete municipal tourism entries",
  },
] as const;

export interface ProvisionResult {
  success: boolean;
  superAdminRoleId: string;
  permissionsCreated: number;
  permissionsExisting: number;
  rolePermissionsAssigned: number;
  rolePermissionsExisting: number;
}

/**
 * Idempotently provisions the 6 Tourism management permissions and assigns them
 * to the authoritative built-in SYSTEM Super Admin role.
 *
 * Strict invariants:
 * - Does NOT create users or alter roles.
 * - Fails closed if the Super Admin role does not exist.
 * - Does NOT touch unrelated permissions or role assignments.
 * - Safe for repeat executions (idempotent).
 */
export async function provisionTourismPermissions(
  client?: PrismaClient
): Promise<ProvisionResult> {
  const prisma = client ?? new PrismaClient();

  try {
    // 1. Locate authoritative built-in/system Super Admin role
    const superAdminRole = await prisma.role.findFirst({
      where: {
        slug: "super-admin",
        isSystemScope: true,
      },
    });

    if (!superAdminRole) {
      throw new Error(
        "Authoritative Super Admin role ('super-admin', isSystemScope=true) not found in database. Provisioning failed closed."
      );
    }

    let permissionsCreated = 0;
    let permissionsExisting = 0;
    const permissionRecords: Array<{ id: string; code: string }> = [];

    // 2. Idempotently register the 6 Tourism permissions
    for (const perm of TOURISM_PERMISSIONS) {
      const existing = await prisma.permission.findUnique({
        where: { code: perm.code },
      });

      if (existing) {
        permissionsExisting++;
        // Keep name and description in sync without altering id or code
        const updated = await prisma.permission.update({
          where: { id: existing.id },
          data: {
            name: perm.name,
            module: perm.module,
            description: perm.description,
          },
        });
        permissionRecords.push({ id: updated.id, code: updated.code });
      } else {
        const created = await prisma.permission.create({
          data: {
            code: perm.code,
            name: perm.name,
            module: perm.module,
            description: perm.description,
          },
        });
        permissionsCreated++;
        permissionRecords.push({ id: created.id, code: created.code });
      }
    }

    // 3. Idempotently assign all 6 permissions to the Super Admin role
    let rolePermissionsAssigned = 0;
    let rolePermissionsExisting = 0;

    for (const perm of permissionRecords) {
      const existingAssignment = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
      });

      if (existingAssignment) {
        rolePermissionsExisting++;
      } else {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        });
        rolePermissionsAssigned++;
      }
    }

    return {
      success: true,
      superAdminRoleId: superAdminRole.id,
      permissionsCreated,
      permissionsExisting,
      rolePermissionsAssigned,
      rolePermissionsExisting,
    };
  } finally {
    if (!client) {
      await prisma.$disconnect();
    }
  }
}

// Direct CLI entry point
const isDirectExecution =
  process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/provision-tourism-permissions.ts") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/provision-tourism-permissions.js");

if (isDirectExecution) {
  const prisma = new PrismaClient();
  provisionTourismPermissions(prisma)
    .then((result) => {
      console.log("✅ Tourism permissions provisioned successfully:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Failed to provision tourism permissions:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
