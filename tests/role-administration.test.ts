// Standalone test mock for server-only marker package
(function () {
  const p = require.resolve("server-only");
  require.cache[p] = {
    id: p,
    filename: p,
    loaded: true,
    exports: {},
    children: [],
    paths: [],
  } as unknown as NodeJS.Module;
})();

import type { SessionUser } from "../src/server/auth/session";

async function runRoleAdministrationTests() {
  const fs = await import("fs");
  const path = await import("path");

  // Load .env dynamically if present
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
        }
      }
    }
  } catch {
    // Ignore
  }

  const { prisma } = await import("../src/server/db/client");
  const {
    listRoles,
    getRoleById,
    updateRole,
    updateRolePermissions,
    listPermissionCatalog,
    RoleError,
    CRITICAL_SYSTEM_PERMISSIONS,
  } = await import("../src/server/roles/service");
  const { RoleTier, UserStatus } = await import("@prisma/client");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  console.log("\n=======================================================");
  console.log("SAN FELIPE LGU ROLE ADMINISTRATION TEST SUITE (PHASE 17)");
  console.log("=======================================================\n");

  const ts = Date.now();

  // Get baseline roles
  const superAdminRole = await prisma.role.findFirstOrThrow({
    where: { tier: RoleTier.SYSTEM_ADMIN, isSystemScope: true, slug: "super-admin" },
  });
  const officeAdminRole = await prisma.role.findFirstOrThrow({
    where: { tier: RoleTier.OFFICE_ADMIN, isSystemScope: false, slug: "office-admin" },
  });
  const staffRole = await prisma.role.findFirstOrThrow({
    where: { tier: RoleTier.STAFF, isSystemScope: false, slug: "staff" },
  });

  // Create temporary role for testing permission mutation & session revocation
  const tempTestRole = await prisma.role.create({
    data: {
      name: `Test Custom Role ${ts}`,
      slug: `test-custom-${ts}`,
      description: "Temporary role for mutation testing",
      isSystemScope: false,
      tier: RoleTier.CUSTOM,
      isBuiltIn: false,
    },
  });

  // Actors
  const callerSuperAdmin: SessionUser = {
    id: `sa-role-${ts}`,
    name: "Role Test Super Admin",
    email: `sa-role-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: superAdminRole.id,
    role: {
      id: superAdminRole.id,
      name: superAdminRole.name,
      slug: superAdminRole.slug,
      isSystemScope: true,
    },
    isSystemScope: true,
    permissions: [
      "settings.manage",
      "users.view",
      "users.create",
      "users.update",
      "users.disable",
    ],
    sessionId: `session-sa-role-${ts}`,
  };

  const callerOfficeAdmin: SessionUser = {
    id: `oa-role-${ts}`,
    name: "Role Test Office Admin",
    email: `oa-role-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: officeAdminRole.id,
    role: {
      id: officeAdminRole.id,
      name: officeAdminRole.name,
      slug: officeAdminRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    permissions: ["settings.manage"], // Even if permission is present, office scope must deny!
    sessionId: `session-oa-role-${ts}`,
  };

  const callerStaff: SessionUser = {
    id: `staff-role-${ts}`,
    name: "Role Test Staff",
    email: `staff-role-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: staffRole.id,
    role: {
      id: staffRole.id,
      name: staffRole.name,
      slug: staffRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    permissions: ["posts.view"],
    sessionId: `session-staff-role-${ts}`,
  };

  const callerSystemNoSettings: SessionUser = {
    id: `sa-nosettings-${ts}`,
    name: "Super Admin No Settings",
    email: `sa-nosettings-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: superAdminRole.id,
    role: {
      id: superAdminRole.id,
      name: superAdminRole.name,
      slug: superAdminRole.slug,
      isSystemScope: true,
    },
    isSystemScope: true,
    permissions: ["users.view"], // lacks settings.manage
    sessionId: `session-sa-nosettings-${ts}`,
  };

  // Seed DB user records for audit logging foreign keys
  await prisma.user.create({
    data: {
      id: callerSuperAdmin.id,
      name: callerSuperAdmin.name,
      email: callerSuperAdmin.email,
      passwordHash: "hash-placeholder",
      roleId: superAdminRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  // User assigned to tempTestRole to test session invalidation on permission changes
  const userInTempRole = await prisma.user.create({
    data: {
      id: `user-temp-role-${ts}`,
      name: "User in Temp Role",
      email: `temprole-${ts}@sanfelipe.gov.ph`,
      passwordHash: "hash-placeholder",
      roleId: tempTestRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Staff & Office Admin Denied
    // -------------------------------------------------------------
    console.log("1. Staff & Office Admin Denial");
    let staffDenied = false;
    try {
      await listRoles(callerStaff);
    } catch (e: unknown) {
      staffDenied = e instanceof RoleError && e.statusCode === 403;
    }
    assert(staffDenied, "Staff is denied role management");

    let officeAdminDenied = false;
    try {
      await listRoles(callerOfficeAdmin);
    } catch (e: unknown) {
      officeAdminDenied = e instanceof RoleError && e.statusCode === 403;
    }
    assert(officeAdminDenied, "Office Admin is denied role management (SYSTEM scope required)");

    let officeAdminCatalogDenied = false;
    try {
      await listPermissionCatalog(callerOfficeAdmin);
    } catch (e: unknown) {
      officeAdminCatalogDenied = e instanceof RoleError && e.statusCode === 403;
    }
    assert(officeAdminCatalogDenied, "Office Admin is denied inspecting permission catalog");

    // -------------------------------------------------------------
    // Test 2: SYSTEM Scope without settings.manage Denied
    // -------------------------------------------------------------
    console.log("\n2. SYSTEM Scope without settings.manage Denied");
    let systemNoPermDenied = false;
    try {
      await listRoles(callerSystemNoSettings);
    } catch (e: unknown) {
      systemNoPermDenied =
        e instanceof RoleError &&
        e.statusCode === 403 &&
        e.message.includes("settings.manage");
    }
    assert(systemNoPermDenied, "SYSTEM scope user without settings.manage is denied");

    // -------------------------------------------------------------
    // Test 3: Authorized SYSTEM Role Listing & Catalog Inspection
    // -------------------------------------------------------------
    console.log("\n3. Authorized SYSTEM Role Listing & Catalog Inspection");
    const rolesList = await listRoles(callerSuperAdmin);
    assert(rolesList.length >= 6, "SYSTEM administrator lists all system roles");
    assert(
      rolesList.some((r) => r.slug === "super-admin" && r.tier === "SYSTEM_ADMIN" && r.isBuiltIn && r.isSystemScope),
      "Super Admin role is identified with SYSTEM_ADMIN tier, isBuiltIn: true, isSystemScope: true"
    );
    assert(
      rolesList.some((r) => r.slug === "office-admin" && r.tier === "OFFICE_ADMIN" && r.isBuiltIn && !r.isSystemScope),
      "Office Admin role is identified with OFFICE_ADMIN tier, isBuiltIn: true, isSystemScope: false"
    );
    assert(
      rolesList.some((r) => r.slug === "staff" && r.tier === "STAFF" && r.isBuiltIn && !r.isSystemScope),
      "Staff role is identified with STAFF tier, isBuiltIn: true, isSystemScope: false"
    );
    assert(
      rolesList.some((r) => r.slug === "site-admin" && r.tier === "CUSTOM" && r.isBuiltIn && r.isSystemScope),
      "Site Admin role is classified with CUSTOM tier, isBuiltIn: true, isSystemScope: true"
    );
    assert(
      rolesList.some((r) => r.slug === "office-editor" && r.tier === "CUSTOM" && r.isBuiltIn && !r.isSystemScope),
      "Office Editor role is classified with CUSTOM tier, isBuiltIn: true, isSystemScope: false"
    );
    assert(
      rolesList.some((r) => r.slug === "approver" && r.tier === "CUSTOM" && r.isBuiltIn && !r.isSystemScope),
      "Approver role is classified with CUSTOM tier, isBuiltIn: true, isSystemScope: false"
    );

    const fetchedSuperAdmin = await getRoleById(callerSuperAdmin, superAdminRole.id);
    assert(fetchedSuperAdmin.id === superAdminRole.id, "getRoleById correctly retrieves role details");

    const catalog = await listPermissionCatalog(callerSuperAdmin);
    assert(catalog.length >= 34, `Permission catalog reports code-enforced capabilities (found: ${catalog.length})`);
    assert(
      catalog.some((p) => p.code === "posts.publish"),
      "Permission catalog includes posts.publish"
    );
    assert(
      catalog.some((p) => p.code === "documents.publish"),
      "Permission catalog includes documents.publish"
    );
    assert(
      catalog.some((p) => p.code === "jobs.publish"),
      "Permission catalog includes jobs.publish"
    );
    assert(
      !catalog.some((p) => p.code === "services.create"),
      "Permission catalog DOES NOT contain unexpected services.create permission"
    );

    // -------------------------------------------------------------
    // Test 4: Role Metadata Update Safety
    // -------------------------------------------------------------
    console.log("\n4. Role Metadata Update Safety");
    const updatedRole = await updateRole(callerSuperAdmin, tempTestRole.id, {
      name: `${tempTestRole.name} Renamed`,
      description: "Updated description for custom role",
      expectedUpdatedAt: tempTestRole.updatedAt.toISOString(),
    });

    assert(
      updatedRole.name === `${tempTestRole.name} Renamed`,
      "Role display label updated"
    );
    assert(
      updatedRole.tier === RoleTier.CUSTOM,
      "Role tier remains unchanged despite display label edit"
    );
    assert(
      updatedRole.slug === tempTestRole.slug,
      "Role slug remains strictly immutable"
    );

    // -------------------------------------------------------------
    // Test 5: Optimistic Concurrency Protection (409 Conflict)
    // -------------------------------------------------------------
    console.log("\n5. Optimistic Concurrency Protection (409 Conflict)");
    let staleUpdateConflict = false;
    try {
      await updateRole(callerSuperAdmin, tempTestRole.id, {
        name: "Stale Role Name",
        expectedUpdatedAt: tempTestRole.updatedAt.toISOString(), // Stale timestamp!
      });
    } catch (e: unknown) {
      staleUpdateConflict = e instanceof RoleError && e.statusCode === 409;
    }
    assert(staleUpdateConflict, "Stale role update returns 409 Conflict");

    // -------------------------------------------------------------
    // Test 6: Invalid Permission Codes Rejected
    // -------------------------------------------------------------
    console.log("\n6. Invalid Permission Codes Rejected");
    const refreshedTempRole = await prisma.role.findUniqueOrThrow({ where: { id: tempTestRole.id } });
    let invalidCodeRejected = false;
    try {
      await updateRolePermissions(
        callerSuperAdmin,
        tempTestRole.id,
        ["posts.view", "invented.fake.permission"],
        refreshedTempRole.updatedAt.toISOString()
      );
    } catch (e: unknown) {
      invalidCodeRejected =
        e instanceof RoleError &&
        e.statusCode === 400 &&
        e.message.includes("invalid permission codes");
    }
    assert(invalidCodeRejected, "Attempting to assign non-existent permission codes is strictly rejected");

    // -------------------------------------------------------------
    // Test 7: Last-Admin Protection on SYSTEM_ADMIN Role
    // -------------------------------------------------------------
    console.log("\n7. Last-Admin Protection on SYSTEM_ADMIN Role");
    assert(
      CRITICAL_SYSTEM_PERMISSIONS.length === 7,
      "CRITICAL_SYSTEM_PERMISSIONS defines exactly 7 coherent capabilities"
    );

    const superAdminFresh = await prisma.role.findUniqueOrThrow({
      where: { id: superAdminRole.id },
      include: { permissions: { include: { permission: true } } },
    });
    const allSuperAdminPerms = superAdminFresh.permissions.map((p) => p.permission.code);

    // Test stripping all critical permissions
    let stripAllCriticalDenied = false;
    try {
      await updateRolePermissions(
        callerSuperAdmin,
        superAdminRole.id,
        ["posts.view"], // Strips users.*, offices.*, settings.manage
        superAdminFresh.updatedAt.toISOString()
      );
    } catch (e: unknown) {
      stripAllCriticalDenied =
        e instanceof RoleError &&
        e.statusCode === 400 &&
        e.message.includes("critical administrative permissions");
    }
    assert(stripAllCriticalDenied, "Cannot strip all critical administrative permissions from the System Administrator role");

    // Test stripping each critical permission individually
    for (const criticalPerm of CRITICAL_SYSTEM_PERMISSIONS) {
      const strippedList = allSuperAdminPerms.filter((p) => p !== criticalPerm);
      let individualStripDenied = false;
      try {
        await updateRolePermissions(
          callerSuperAdmin,
          superAdminRole.id,
          strippedList,
          superAdminFresh.updatedAt.toISOString()
        );
      } catch (e: unknown) {
        individualStripDenied =
          e instanceof RoleError &&
          e.statusCode === 400 &&
          e.message.includes(criticalPerm);
      }
      assert(
        individualStripDenied,
        `Cannot remove critical administrative permission (${criticalPerm}) from System Administrator role`
      );
    }

    // -------------------------------------------------------------
    // Test 8: Transactional Permission Assignment & Session Revocation
    // -------------------------------------------------------------
    console.log("\n8. Transactional Permission Assignment & Session Revocation");
    // Seed active session for user in temp role
    await prisma.session.create({
      data: {
        userId: userInTempRole.id,
        tokenHash: `token-hash-role-test-${ts}`,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const sessionBefore = await prisma.session.findFirst({
      where: { userId: userInTempRole.id, revokedAt: null },
    });
    assert(sessionBefore !== null, "Active session exists for role user before permission update");

    const roleForPerms = await prisma.role.findUniqueOrThrow({ where: { id: tempTestRole.id } });
    await updateRolePermissions(
      callerSuperAdmin,
      tempTestRole.id,
      ["posts.view", "posts.create"],
      roleForPerms.updatedAt.toISOString()
    );

    const sessionAfter = await prisma.session.findFirst({
      where: { userId: userInTempRole.id, revokedAt: null },
    });
    assert(sessionAfter === null, "Updating role permissions immediately revokes all active sessions for assigned users");

    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId: tempTestRole.id },
      include: { permission: true },
    });
    const assignedCodes = rolePerms.map((rp) => rp.permission.code).sort();
    assert(
      assignedCodes.length === 2 && assignedCodes.includes("posts.view") && assignedCodes.includes("posts.create"),
      "New permissions assigned atomically in database transaction"
    );

    // Confirm audit event recorded
    const auditEvent = await prisma.auditLog.findFirst({
      where: {
        action: "ROLE_PERMISSIONS_CHANGED",
        userId: callerSuperAdmin.id,
      },
    });
    assert(auditEvent !== null, "ROLE_PERMISSIONS_CHANGED audit event was recorded in audit log");

  } finally {
    console.log("\nCleaning up test records...");
    await prisma.session.deleteMany({
      where: { userId: userInTempRole.id },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: callerSuperAdmin.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [callerSuperAdmin.id, userInTempRole.id] } },
    });
    await prisma.rolePermission.deleteMany({
      where: { roleId: tempTestRole.id },
    });
    await prisma.role.deleteMany({
      where: { id: tempTestRole.id },
    });
    console.log("Cleanup complete.");
  }

  console.log("\n=======================================================");
  console.log(`ROLE ADMINISTRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runRoleAdministrationTests().catch((err) => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});
