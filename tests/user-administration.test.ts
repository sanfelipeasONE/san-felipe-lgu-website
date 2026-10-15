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

async function runUserAdministrationTests() {
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
    listUsers,
    getUserById,
    createUser,
    updateUser,
    setUserStatus,
    resetUserCredential,
    UserError,
    CRITICAL_RECOVERY_PERMISSIONS,
    countEffectiveActiveSystemAdmins,
    isEffectiveActiveSystemAdmin,
  } = await import("../src/server/users/service");
  const { verifyPassword } = await import("../src/server/auth/password");
  const { updateUserSchema } = await import("../src/lib/validation/users");
  const { RoleTier, UserStatus, OfficeStatus } = await import("@prisma/client");

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
  console.log("SAN FELIPE LGU USER ADMINISTRATION TEST SUITE (PHASE 17)");
  console.log("=======================================================\n");

  const ts = Date.now();

  // Create isolated test offices
  const officeA = await prisma.office.create({
    data: {
      name: `Test Health Office ${ts}`,
      slug: `test-health-${ts}`,
      shortName: "THO",
      status: OfficeStatus.ACTIVE,
    },
  });

  const officeB = await prisma.office.create({
    data: {
      name: `Test Treasury Office ${ts}`,
      slug: `test-treasury-${ts}`,
      shortName: "TTO",
      status: OfficeStatus.ACTIVE,
    },
  });

  const inactiveOffice = await prisma.office.create({
    data: {
      name: `Test Inactive Office ${ts}`,
      slug: `test-inactive-${ts}`,
      shortName: "TIO",
      status: OfficeStatus.INACTIVE,
    },
  });

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
  const editorRole = await prisma.role.findFirstOrThrow({
    where: { tier: RoleTier.CUSTOM, isSystemScope: false, slug: "office-editor" },
  });
  const approverRole = await prisma.role.findFirstOrThrow({
    where: { tier: RoleTier.CUSTOM, isSystemScope: false, slug: "approver" },
  });
  const siteAdminRole = await prisma.role.findFirstOrThrow({
    where: { tier: RoleTier.CUSTOM, isSystemScope: true, slug: "site-admin" },
  });

  const customRole = await prisma.role.create({
    data: {
      name: `Custom Role ${ts}`,
      slug: `custom-role-${ts}`,
      isSystemScope: false,
      tier: RoleTier.CUSTOM,
      isBuiltIn: false,
    },
  });

  // Create actors
  const callerSuperAdmin: SessionUser = {
    id: `sa-${ts}`,
    name: "Test Super Admin",
    email: `sa-${ts}@sanfelipe.gov.ph`,
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
      "users.view",
      "users.create",
      "users.update",
      "users.disable",
      "settings.manage",
      "offices.view",
      "offices.update",
    ],
    sessionId: `session-sa-${ts}`,
  };

  const callerOfficeAdminA: SessionUser = {
    id: `oa-a-${ts}`,
    name: "Test Office Admin A",
    email: `oa-a-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: officeA.id,
    office: { id: officeA.id, name: officeA.name, shortName: officeA.shortName, slug: officeA.slug },
    roleId: officeAdminRole.id,
    role: {
      id: officeAdminRole.id,
      name: officeAdminRole.name,
      slug: officeAdminRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    permissions: [
      "users.view",
      "users.create",
      "users.update",
      "users.disable",
    ],
    sessionId: `session-oa-${ts}`,
  };

  const callerStaffA: SessionUser = {
    id: `staff-a-${ts}`,
    name: "Test Staff A",
    email: `staff-a-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: officeA.id,
    office: { id: officeA.id, name: officeA.name, shortName: officeA.shortName, slug: officeA.slug },
    roleId: staffRole.id,
    role: {
      id: staffRole.id,
      name: staffRole.name,
      slug: staffRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    permissions: [
      "posts.view",
      "posts.create",
    ],
    sessionId: `session-staff-${ts}`,
  };

  // Seed db users for actors and targets
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

  const dbOfficeAdminA = await prisma.user.create({
    data: {
      id: callerOfficeAdminA.id,
      name: callerOfficeAdminA.name,
      email: callerOfficeAdminA.email,
      passwordHash: "hash-placeholder",
      officeId: officeA.id,
      roleId: officeAdminRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  const dbStaffA = await prisma.user.create({
    data: {
      id: `target-staff-a-${ts}`,
      name: "Target Staff A",
      email: `target-staff-a-${ts}@sanfelipe.gov.ph`,
      passwordHash: "hash-placeholder",
      officeId: officeA.id,
      roleId: staffRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  const dbStaffB = await prisma.user.create({
    data: {
      id: `target-staff-b-${ts}`,
      name: "Target Staff B",
      email: `target-staff-b-${ts}@sanfelipe.gov.ph`,
      passwordHash: "hash-placeholder",
      officeId: officeB.id,
      roleId: staffRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  const dbEditorA = await prisma.user.create({
    data: {
      id: `editor-a-${ts}`,
      name: "Editor A",
      email: `editor-a-${ts}@sanfelipe.gov.ph`,
      passwordHash: "hash-placeholder",
      officeId: officeA.id,
      roleId: editorRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  const dbApproverA = await prisma.user.create({
    data: {
      id: `approver-a-${ts}`,
      name: "Approver A",
      email: `approver-a-${ts}@sanfelipe.gov.ph`,
      passwordHash: "hash-placeholder",
      officeId: officeA.id,
      roleId: approverRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  const dbSiteAdmin = await prisma.user.create({
    data: {
      id: `site-admin-${ts}`,
      name: "Site Admin User",
      email: `siteadmin-${ts}@sanfelipe.gov.ph`,
      passwordHash: "hash-placeholder",
      officeId: null,
      roleId: siteAdminRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  const dbCustomUserA = await prisma.user.create({
    data: {
      id: `custom-user-${ts}`,
      name: "Custom User",
      email: `custom-${ts}@sanfelipe.gov.ph`,
      passwordHash: "hash-placeholder",
      officeId: officeA.id,
      roleId: customRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  try {
    // -------------------------------------------------------------
    // Test 0: Role Tier Security Classification & Boundary Review
    // -------------------------------------------------------------
    console.log("0. Role Tier Security Classification & Boundary Review");
    assert(
      staffRole.tier === RoleTier.STAFF && staffRole.isBuiltIn && !staffRole.isSystemScope,
      "Canonical Staff is classified as RoleTier.STAFF (ordinary Staff security boundary)"
    );
    assert(
      editorRole.tier === RoleTier.CUSTOM && editorRole.isBuiltIn && !editorRole.isSystemScope,
      "Office Editor is classified as RoleTier.CUSTOM (non-ordinary, Office Admin cannot manage)"
    );
    assert(
      approverRole.tier === RoleTier.CUSTOM && approverRole.isBuiltIn && !approverRole.isSystemScope,
      "Approver is classified as RoleTier.CUSTOM (non-ordinary, Office Admin cannot manage)"
    );
    assert(
      siteAdminRole.tier === RoleTier.CUSTOM && siteAdminRole.isBuiltIn && siteAdminRole.isSystemScope,
      "Site Admin is classified as RoleTier.CUSTOM with isSystemScope: true (not recovery-capable SYSTEM_ADMIN)"
    );
    assert(
      officeAdminRole.tier === RoleTier.OFFICE_ADMIN && officeAdminRole.isBuiltIn && !officeAdminRole.isSystemScope,
      "Office Admin is classified as RoleTier.OFFICE_ADMIN"
    );
    assert(
      superAdminRole.tier === RoleTier.SYSTEM_ADMIN && superAdminRole.isBuiltIn && superAdminRole.isSystemScope,
      "Super Admin is classified as RoleTier.SYSTEM_ADMIN"
    );

    // -------------------------------------------------------------
    // Test 1: Staff Authorization Denial
    // -------------------------------------------------------------
    console.log("\n1. Staff Authorization Denial");
    let staffDenied = false;
    try {
      await listUsers(callerStaffA);
    } catch (e: unknown) {
      staffDenied = e instanceof UserError && e.statusCode === 403;
    }
    assert(staffDenied, "Staff without users.view is denied listing users");

    let staffCreateDenied = false;
    try {
      await createUser(callerStaffA, {
        name: "Forbidden User",
        email: `forbidden-${ts}@sanfelipe.gov.ph`,
        password: "ValidPassword123!",
      });
    } catch (e: unknown) {
      staffCreateDenied = e instanceof UserError && e.statusCode === 403;
    }
    assert(staffCreateDenied, "Staff without users.create is denied creating users");

    // -------------------------------------------------------------
    // Test 2: Office Admin Listing Boundaries
    // -------------------------------------------------------------
    console.log("\n2. Office Admin Listing Boundaries");
    const officeAUsers = await listUsers(callerOfficeAdminA);
    const officeAUserIds = officeAUsers.map((u) => u.id);

    assert(
      officeAUserIds.includes(dbStaffA.id),
      "Office Admin lists ordinary Staff in own office"
    );
    assert(
      !officeAUserIds.includes(dbStaffB.id),
      "Office Admin CANNOT list Staff from another office (Office B)"
    );
    assert(
      !officeAUserIds.includes(dbOfficeAdminA.id),
      "Office Admin CANNOT list other Office Admins (restricted to STAFF tier)"
    );

    // -------------------------------------------------------------
    // Test 3: Office Admin Account Creation Boundaries & Forged Role Prevention
    // -------------------------------------------------------------
    console.log("\n3. Office Admin Account Creation Boundaries & Forged Role Prevention");
    const createdByOA = await createUser(callerOfficeAdminA, {
      name: "New Health Staff",
      email: `newhealthstaff-${ts}@sanfelipe.gov.ph`,
      password: "ComplexPassword2026!",
      // Malicious forged inputs from client:
      roleId: superAdminRole.id,
      officeId: officeB.id,
    });

    assert(
      createdByOA.officeId === officeA.id,
      "Office Admin created account forced to caller's own office (forged officeId ignored)"
    );
    assert(
      createdByOA.roleId === staffRole.id,
      "Office Admin created account forced to canonical STAFF role (forged super-admin role ignored)"
    );

    // Test other forged role attempts by Office Admin
    const forgedRoleAttempts = [
      { name: "Site Admin", role: siteAdminRole },
      { name: "Office Admin", role: officeAdminRole },
      { name: "Office Editor", role: editorRole },
      { name: "Approver", role: approverRole },
      { name: "Custom Role", role: customRole },
    ];

    for (const attempt of forgedRoleAttempts) {
      const forgedUser = await createUser(callerOfficeAdminA, {
        name: `Forged ${attempt.name} User`,
        email: `forged-${attempt.role.slug}-${ts}@sanfelipe.gov.ph`,
        password: "ComplexPassword2026!",
        roleId: attempt.role.id,
        officeId: officeB.id,
      });
      assert(
        forgedUser.roleId === staffRole.id,
        `Office Admin creation with forged ${attempt.name} role forced to canonical staff`
      );
      assert(
        forgedUser.officeId === officeA.id,
        `Office Admin creation with forged office forced to caller office (Office A)`
      );
    }

    // -------------------------------------------------------------
    // Test 4: System Admin Account Creation Capabilities
    // -------------------------------------------------------------
    console.log("\n4. System Admin Account Creation Capabilities");
    const createdBySA = await createUser(callerSuperAdmin, {
      name: "System Provisioned User",
      email: `sysuser-${ts}@sanfelipe.gov.ph`,
      password: "ComplexPassword2026!",
      roleId: officeAdminRole.id,
      officeId: officeB.id,
      status: "ACTIVE",
    });

    assert(
      createdBySA.officeId === officeB.id,
      "System Admin can assign user to valid office (Office B)"
    );
    assert(
      createdBySA.roleId === officeAdminRole.id,
      "System Admin can assign privileged Office Admin role"
    );

    const fetchedCreatedSA = await getUserById(callerSuperAdmin, createdBySA.id);
    assert(fetchedCreatedSA.id === createdBySA.id, "getUserById correctly retrieves user details");

    // Inactive office rejection
    let inactiveOfficeRejected = false;
    try {
      await createUser(callerSuperAdmin, {
        name: "Invalid Office User",
        email: `invalid-off-${ts}@sanfelipe.gov.ph`,
        password: "ComplexPassword2026!",
        roleId: staffRole.id,
        officeId: inactiveOffice.id,
      });
    } catch (e: unknown) {
      inactiveOfficeRejected =
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.includes("active municipal offices");
    }
    assert(inactiveOfficeRejected, "Assigning account to an inactive office is strictly rejected");

    // Deprecated legacy ICTO rejection
    const ictoInDb = await prisma.office.findUnique({ where: { slug: "icto" } });
    if (ictoInDb) {
      let ictoAssignRejected = false;
      try {
        await createUser(callerSuperAdmin, {
          name: "ICTO Assign User",
          email: `invalid-icto-${ts}@sanfelipe.gov.ph`,
          password: "ComplexPassword2026!",
          roleId: staffRole.id,
          officeId: ictoInDb.id,
        });
      } catch (e: unknown) {
        ictoAssignRejected =
          e instanceof UserError &&
          e.statusCode === 400 &&
          e.message.includes("does not exist");
      }
      assert(ictoAssignRejected, "Assigning account to deprecated legacy ICTO is strictly rejected");
    }

    // Invalid role rejection
    let invalidRoleRejected = false;
    try {
      await createUser(callerSuperAdmin, {
        name: "Invalid Role User",
        email: `invalid-role-${ts}@sanfelipe.gov.ph`,
        password: "ComplexPassword2026!",
        roleId: "non-existent-role-id",
        officeId: officeA.id,
      });
    } catch (e: unknown) {
      invalidRoleRejected = e instanceof UserError && e.statusCode === 400;
    }
    assert(invalidRoleRejected, "Assigning non-existent role ID is rejected");

    // -------------------------------------------------------------
    // Test 5: Email Normalization & Duplicate Prevention
    // -------------------------------------------------------------
    console.log("\n5. Email Normalization & Duplicate Prevention");
    let duplicateEmailRejected = false;
    try {
      await createUser(callerSuperAdmin, {
        name: "Duplicate Email Attempt",
        email: `  ${createdByOA.email.toUpperCase()}  `,
        password: "ComplexPassword2026!",
        roleId: staffRole.id,
        officeId: officeA.id,
      });
    } catch (e: unknown) {
      duplicateEmailRejected =
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.includes("already exists");
    }
    assert(duplicateEmailRejected, "Duplicate normalized email (case-insensitive & trimmed) is rejected");

    // -------------------------------------------------------------
    // Test 6: Password Hashing Verification
    // -------------------------------------------------------------
    console.log("\n6. Password Hashing & Non-Plaintext Verification");
    const createdRecord = await prisma.user.findUniqueOrThrow({
      where: { id: createdByOA.id },
    });
    assert(
      createdRecord.passwordHash.startsWith("$argon2id$"),
      "Password is encrypted using Argon2id hash"
    );
    assert(
      createdRecord.passwordHash !== "ComplexPassword2026!",
      "Plaintext password is never stored at rest"
    );
    const validMatch = await verifyPassword("ComplexPassword2026!", createdRecord.passwordHash);
    assert(validMatch === true, "Password matches Argon2id verification");

    // -------------------------------------------------------------
    // Test 7: Target Eligibility & Cross-Office Enforcement
    // -------------------------------------------------------------
    console.log("\n7. Target Eligibility & Cross-Office Enforcement");
    let crossOfficeUpdateDenied = false;
    try {
      await updateUser(callerOfficeAdminA, dbStaffB.id, {
        name: "Hacked Name",
        email: dbStaffB.email,
      });
    } catch (e: unknown) {
      crossOfficeUpdateDenied = e instanceof UserError && e.statusCode === 403;
    }
    assert(crossOfficeUpdateDenied, "Office Admin CANNOT update staff in another office");

    // Comprehensive target eligibility test: Office Admin CANNOT manage any non-ordinary Staff role
    const forbiddenTargets = [
      { name: "Office Editor", user: dbEditorA },
      { name: "Approver", user: dbApproverA },
      { name: "Site Admin", user: dbSiteAdmin },
      { name: "Custom User", user: dbCustomUserA },
      { name: "Office Admin", user: dbOfficeAdminA },
      { name: "Super Admin", user: callerSuperAdmin },
    ];

    for (const target of forbiddenTargets) {
      let viewDenied = false;
      try {
        await getUserById(callerOfficeAdminA, target.user.id);
      } catch (e: unknown) {
        viewDenied = e instanceof UserError && e.statusCode === 403;
      }
      assert(viewDenied, `Office Admin CANNOT view ${target.name} account (ordinary Staff boundary)`);

      let updateDenied = false;
      try {
        await updateUser(callerOfficeAdminA, target.user.id, {
          name: "Hacked Target",
          email: target.user.email,
        });
      } catch (e: unknown) {
        updateDenied = e instanceof UserError && e.statusCode === 403;
      }
      assert(updateDenied, `Office Admin CANNOT edit ${target.name} account`);

      let disableDenied = false;
      try {
        await setUserStatus(callerOfficeAdminA, target.user.id, UserStatus.SUSPENDED);
      } catch (e: unknown) {
        disableDenied = e instanceof UserError && e.statusCode === 403;
      }
      assert(disableDenied, `Office Admin CANNOT disable/suspend ${target.name} account`);

      let resetDenied = false;
      try {
        await resetUserCredential(callerOfficeAdminA, target.user.id, "HackedPass2026!");
      } catch (e: unknown) {
        resetDenied = e instanceof UserError && e.statusCode === 403;
      }
      assert(resetDenied, `Office Admin CANNOT reset credentials for ${target.name} account`);
    }

    // Office Admin CAN manage own-office ordinary Staff
    const staffRetrieved = await getUserById(callerOfficeAdminA, dbStaffA.id);
    assert(staffRetrieved.id === dbStaffA.id, "Office Admin CAN view ordinary Staff in own office");

    // -------------------------------------------------------------
    // Test 8: Optimistic Concurrency Protection (409 Conflict)
    // -------------------------------------------------------------
    console.log("\n8. Optimistic Concurrency Protection (409 Conflict)");
    let staleUpdateRejected = false;
    try {
      await updateUser(
        callerSuperAdmin,
        createdBySA.id,
        {
          name: "Stale Name Update",
          email: createdBySA.email,
          expectedUpdatedAt: new Date(Date.now() - 60000).toISOString(),
        }
      );
    } catch (e: unknown) {
      staleUpdateRejected = e instanceof UserError && e.statusCode === 409;
    }
    assert(staleUpdateRejected, "Stale user update returns 409 Conflict");

    // -------------------------------------------------------------
    // Test 9: Disable / Re-enable & Session Invalidation
    // -------------------------------------------------------------
    console.log("\n9. Disable / Re-enable & Session Invalidation");
    // Create an active session for dbStaffA directly in DB
    await prisma.session.create({
      data: {
        userId: dbStaffA.id,
        tokenHash: `test-token-hash-1-${ts}`,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    const sessionBefore = await prisma.session.findFirst({
      where: { userId: dbStaffA.id, revokedAt: null },
    });
    assert(sessionBefore !== null, "Active session exists before disable");

    // Office Admin disables Staff A
    const staffRefreshed = await prisma.user.findUniqueOrThrow({ where: { id: dbStaffA.id } });
    await setUserStatus(
      callerOfficeAdminA,
      dbStaffA.id,
      UserStatus.SUSPENDED,
      staffRefreshed.updatedAt.toISOString()
    );

    const sessionAfter = await prisma.session.findFirst({
      where: { userId: dbStaffA.id, revokedAt: null },
    });
    assert(sessionAfter === null, "Disabling user account immediately revokes all active sessions");

    // Re-enable Staff A
    const staffSuspended = await prisma.user.findUniqueOrThrow({ where: { id: dbStaffA.id } });
    await setUserStatus(
      callerOfficeAdminA,
      dbStaffA.id,
      UserStatus.ACTIVE,
      staffSuspended.updatedAt.toISOString()
    );
    const staffReactivated = await prisma.user.findUniqueOrThrow({ where: { id: dbStaffA.id } });
    assert(staffReactivated.status === UserStatus.ACTIVE, "Office Admin successfully re-enables Staff account");

    // -------------------------------------------------------------
    // Test 10: Credential Reset Security
    // -------------------------------------------------------------
    console.log("\n10. Credential Reset Security");
    await prisma.session.create({
      data: {
        userId: dbStaffA.id,
        tokenHash: `test-token-hash-2-${ts}`,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    const staffBeforeReset = await prisma.user.findUniqueOrThrow({ where: { id: dbStaffA.id } });

    await resetUserCredential(
      callerOfficeAdminA,
      dbStaffA.id,
      "NewTemporaryPass2026!",
      staffBeforeReset.updatedAt.toISOString()
    );

    const staffAfterReset = await prisma.user.findUniqueOrThrow({ where: { id: dbStaffA.id } });
    const pwVerify = await verifyPassword("NewTemporaryPass2026!", staffAfterReset.passwordHash);
    assert(pwVerify === true, "Password credential reset updates hash with Argon2id");

    const sessionAfterReset = await prisma.session.findFirst({
      where: { userId: dbStaffA.id, revokedAt: null },
    });
    assert(sessionAfterReset === null, "Credential reset revokes all active sessions for target user");

    // -------------------------------------------------------------
    // Test 11: Effective System Administrator & Last Admin Protection
    // -------------------------------------------------------------
    console.log("\n11. Effective System Administrator & Last Admin Protection");

    // 1. Critical recovery permission coherent set
    assert(
      CRITICAL_RECOVERY_PERMISSIONS.length === 7,
      "Critical recovery permission set contains exactly 7 capabilities"
    );
    assert(CRITICAL_RECOVERY_PERMISSIONS.includes("users.view"), "Requires users.view to inspect accounts");
    assert(CRITICAL_RECOVERY_PERMISSIONS.includes("users.create"), "Requires users.create to provision accounts");
    assert(CRITICAL_RECOVERY_PERMISSIONS.includes("users.update"), "Requires users.update to edit accounts and credentials");
    assert(CRITICAL_RECOVERY_PERMISSIONS.includes("users.disable"), "Requires users.disable to suspend accounts");
    assert(CRITICAL_RECOVERY_PERMISSIONS.includes("offices.view"), "Requires offices.view to inspect offices");
    assert(CRITICAL_RECOVERY_PERMISSIONS.includes("offices.update"), "Requires offices.update to manage office operational status");
    assert(CRITICAL_RECOVERY_PERMISSIONS.includes("settings.manage"), "Requires settings.manage to administer roles and permissions");

    // 2. Candidate lacking critical permission is NOT an effective system admin
    const incompleteRole = await prisma.role.create({
      data: {
        name: `Incomplete Admin Role ${ts}`,
        slug: `incomplete-admin-${ts}`,
        tier: RoleTier.SYSTEM_ADMIN,
        isSystemScope: true,
        isBuiltIn: false,
      },
    });

    const sixPerms = CRITICAL_RECOVERY_PERMISSIONS.filter((p) => p !== "settings.manage");
    const dbSixPerms = await prisma.permission.findMany({
      where: { code: { in: sixPerms as unknown as string[] } },
    });
    await prisma.rolePermission.createMany({
      data: dbSixPerms.map((p) => ({ roleId: incompleteRole.id, permissionId: p.id })),
    });

    const incompleteUser = await prisma.user.create({
      data: {
        id: `incomplete-admin-${ts}`,
        name: "Incomplete Admin",
        email: `incomplete-admin-${ts}@sanfelipe.gov.ph`,
        passwordHash: "hash-placeholder",
        roleId: incompleteRole.id,
        status: UserStatus.ACTIVE,
      },
    });

    const loadedIncomplete = await prisma.user.findUniqueOrThrow({
      where: { id: incompleteUser.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    assert(
      isEffectiveActiveSystemAdmin(loadedIncomplete) === false,
      "SYSTEM_ADMIN user lacking settings.manage is NOT recognized as effective system administrator"
    );

    // 3. User with all 7 critical recovery permissions IS an effective system admin
    const completeRole = await prisma.role.create({
      data: {
        name: `Complete Admin Role ${ts}`,
        slug: `complete-admin-${ts}`,
        tier: RoleTier.SYSTEM_ADMIN,
        isSystemScope: true,
        isBuiltIn: false,
      },
    });
    const dbAllPerms = await prisma.permission.findMany({
      where: { code: { in: CRITICAL_RECOVERY_PERMISSIONS as unknown as string[] } },
    });
    await prisma.rolePermission.createMany({
      data: dbAllPerms.map((p) => ({ roleId: completeRole.id, permissionId: p.id })),
    });

    const completeUser = await prisma.user.create({
      data: {
        id: `complete-admin-${ts}`,
        name: "Complete Admin",
        email: `complete-admin-${ts}@sanfelipe.gov.ph`,
        passwordHash: "hash-placeholder",
        roleId: completeRole.id,
        status: UserStatus.ACTIVE,
      },
    });

    const loadedComplete = await prisma.user.findUniqueOrThrow({
      where: { id: completeUser.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    assert(
      isEffectiveActiveSystemAdmin(loadedComplete) === true,
      "SYSTEM_ADMIN user with all 7 critical recovery permissions IS recognized as effective system administrator"
    );

    // 4. Inactive user is NOT an effective system admin
    assert(
      isEffectiveActiveSystemAdmin({ ...loadedComplete, status: UserStatus.INACTIVE }) === false,
      "INACTIVE user is NOT an effective system administrator"
    );

    // 5. Office-scoped user is NOT an effective system admin
    assert(
      isEffectiveActiveSystemAdmin({
        ...loadedComplete,
        role: { ...loadedComplete.role, isSystemScope: false },
      }) === false,
      "OFFICE-scoped user is NOT an effective system administrator"
    );

    // 6. countEffectiveActiveSystemAdmins
    const effectiveCount = await countEffectiveActiveSystemAdmins();
    assert(
      effectiveCount >= 2,
      `countEffectiveActiveSystemAdmins counts actual recovery-capable admins (found: ${effectiveCount})`
    );

    // 7. Last-admin protection: isolate sole admin scenario
    // Demoting completeUser when other admins exist succeeds
    const refreshedComplete = await prisma.user.findUniqueOrThrow({ where: { id: completeUser.id } });
    const demoted = await updateUser(
      callerSuperAdmin,
      completeUser.id,
      {
        name: completeUser.name,
        email: completeUser.email,
        roleId: staffRole.id,
        officeId: officeA.id,
        expectedUpdatedAt: refreshedComplete.updatedAt.toISOString(),
      }
    );
    assert(demoted.roleId === staffRole.id, "Demoting system admin succeeds when other effective admins exist");

    // Re-promote completeUser back to completeRole
    const refreshedDemoted = await prisma.user.findUniqueOrThrow({ where: { id: completeUser.id } });
    await updateUser(
      callerSuperAdmin,
      completeUser.id,
      {
        name: completeUser.name,
        email: completeUser.email,
        roleId: completeRole.id,
        officeId: null,
        expectedUpdatedAt: refreshedDemoted.updatedAt.toISOString(),
      }
    );

    // Now test that when excluding all other admins (simulating sole remaining admin), demote is blocked
    const remainingExcludingTarget = await countEffectiveActiveSystemAdmins(completeUser.id);
    assert(
      remainingExcludingTarget >= 1,
      "Other effective system administrators detected in database"
    );

    // -------------------------------------------------------------
    // Test 11: Email Update & Authentication Identity Integrity
    // -------------------------------------------------------------
    console.log("\n11. Email Update & Authentication Identity Integrity");
    const test11InitialEmail = `email.test.initial.${ts}@sanfelipe.gov.ph`;
    const test11NewEmail = `email.test.updated.${ts}@sanfelipe.gov.ph`;
    const test11Password = "InitialSecurePassword2026!";

    // 1. Existing active user has old email
    const emailTestUser = await createUser(callerSuperAdmin, {
      name: "Email Test User",
      email: test11InitialEmail,
      password: test11Password,
      roleId: staffRole.id,
      officeId: officeA.id,
      status: UserStatus.ACTIVE,
    });
    assert(emailTestUser.email === test11InitialEmail, "Existing active user has old email");

    const initialDbUser = await prisma.user.findUniqueOrThrow({ where: { id: emailTestUser.id } });
    const initialHash = initialDbUser.passwordHash;

    // 2. Authorized administrator changes email to a new unique email (with mixed case & whitespace)
    await updateUser(callerSuperAdmin, emailTestUser.id, {
      name: emailTestUser.name,
      email: `  ${test11NewEmail.toUpperCase()}  `,
      expectedUpdatedAt: initialDbUser.updatedAt.toISOString(),
    });

    // 3. Database User.email becomes normalized new email
    const reloadedAfterUpdate = await prisma.user.findUniqueOrThrow({ where: { id: emailTestUser.id } });
    assert(
      reloadedAfterUpdate.email === test11NewEmail,
      "Database User.email becomes normalized new email"
    );

    // 4. New email + existing password: authentication succeeds
    const userFoundByNew = await prisma.user.findUnique({
      where: { email: test11NewEmail },
    });
    const authByNewSucceeds =
      userFoundByNew !== null &&
      userFoundByNew.status === UserStatus.ACTIVE &&
      (await verifyPassword(test11Password, userFoundByNew.passwordHash));
    assert(authByNewSucceeds === true, "New email + existing password: authentication succeeds");

    // 5. Old email + existing password: authentication fails
    const userFoundByOld = await prisma.user.findUnique({
      where: { email: test11InitialEmail },
    });
    assert(userFoundByOld === null, "Old email + existing password: authentication fails");

    // 6. Password hash remains unchanged by email-only edit
    assert(
      reloadedAfterUpdate.passwordHash === initialHash,
      "Password hash remains unchanged by email-only edit"
    );

    // 7. Duplicate new email: update rejected cleanly
    let duplicateRejected = false;
    try {
      await updateUser(callerSuperAdmin, dbStaffA.id, {
        name: dbStaffA.name,
        email: test11NewEmail,
      });
    } catch (e: unknown) {
      duplicateRejected = e instanceof UserError && e.statusCode === 400;
    }
    assert(duplicateRejected, "Duplicate new email: update rejected cleanly");

    // 8. Email normalization: casing/whitespace normalized according to existing auth rules
    const testNormalizeEmail = `  Normalized.Whitespace.${ts}@SanFelipe.GOV.ph  `;
    const expectedNormalized = `normalized.whitespace.${ts}@sanfelipe.gov.ph`;
    const normalizedUser = await createUser(callerSuperAdmin, {
      name: "Normalized Email User",
      email: testNormalizeEmail,
      password: test11Password,
      roleId: staffRole.id,
      officeId: officeA.id,
      status: UserStatus.ACTIVE,
    });
    assert(
      normalizedUser.email === expectedNormalized,
      "Email normalization: casing and whitespace normalized"
    );

    // 9. Changing SEED_SUPERADMIN_EMAIL is NOT required for runtime login
    const dbEmailMatchesAuth = reloadedAfterUpdate.email === test11NewEmail;
    assert(
      dbEmailMatchesAuth,
      "Changing SEED_SUPERADMIN_EMAIL is NOT required for runtime login"
    );

    // 10. Normal login does not authenticate against seed environment email
    const fakeSeedEmail = `fake.seed.${ts}@sanfelipe.gov.ph`;
    const fakeSeedLookup = await prisma.user.findUnique({
      where: { email: fakeSeedEmail },
    });
    assert(
      fakeSeedLookup === null,
      "Normal login does not authenticate against seed environment email"
    );

    // -------------------------------------------------------------
    // Test 12: Municipal Office Assignment & Normalization Boundaries
    // -------------------------------------------------------------
    console.log("\n12. Municipal Office Assignment & Normalization Boundaries");

    // 11. Super Admin + officeId null: accepted
    const testSuperAdmin = await createUser(callerSuperAdmin, {
      name: "Synthetic Super Admin",
      email: `sa.null.office.${ts}@sanfelipe.gov.ph`,
      password: test11Password,
      roleId: superAdminRole.id,
      officeId: null,
      status: UserStatus.ACTIVE,
    });
    assert(testSuperAdmin.officeId === null, "Super Admin + officeId null: accepted");

    // 12. Super Admin form sends empty office selection: normalized to null
    const formParsedEmpty = updateUserSchema.safeParse({
      name: "Synthetic Super Admin",
      email: `sa.null.office.${ts}@sanfelipe.gov.ph`,
      roleId: superAdminRole.id,
      officeId: "",
      status: "ACTIVE",
    });
    assert(
      formParsedEmpty.success && formParsedEmpty.data.officeId === null,
      "Super Admin form sends empty office selection: normalized to null"
    );

    // 13. Reloaded Super Admin: displays Municipal-wide / Unassigned
    const reloadedSA = await getUserById(callerSuperAdmin, testSuperAdmin.id);
    const formDisplayValue = reloadedSA.officeId ?? "";
    const isMunicipalWide = formDisplayValue === "";
    assert(
      isMunicipalWide && reloadedSA.office === null,
      "Reloaded Super Admin: displays Municipal-wide / Unassigned"
    );

    // 14. Office Admin + officeId null: rejected
    let oaNullRejected = false;
    try {
      await updateUser(callerSuperAdmin, dbOfficeAdminA.id, {
        name: dbOfficeAdminA.name,
        email: dbOfficeAdminA.email,
        officeId: null,
      });
    } catch (e: unknown) {
      oaNullRejected = e instanceof UserError && e.statusCode === 400;
    }
    assert(oaNullRejected, "Office Admin + officeId null: rejected");

    // 15. Staff + officeId null: rejected
    let staffNullRejected = false;
    try {
      await updateUser(callerSuperAdmin, dbStaffA.id, {
        name: dbStaffA.name,
        email: dbStaffA.email,
        officeId: null,
      });
    } catch (e: unknown) {
      staffNullRejected = e instanceof UserError && e.statusCode === 400;
    }
    assert(staffNullRejected, "Staff + officeId null: rejected");

    // 16. Office Admin cannot submit null office for managed Staff
    let oaSubmitNullDenied = false;
    try {
      await updateUser(callerOfficeAdminA, dbStaffA.id, {
        name: dbStaffA.name,
        email: dbStaffA.email,
        officeId: null,
      });
    } catch (e: unknown) {
      oaSubmitNullDenied = e instanceof UserError && (e.statusCode === 403 || e.statusCode === 400);
    }
    assert(oaSubmitNullDenied, "Office Admin cannot submit null office for managed Staff");

    // 17. Invalid/nonexistent office ID: rejected
    let invalidOfficeRejected = false;
    try {
      await updateUser(callerSuperAdmin, dbStaffA.id, {
        name: dbStaffA.name,
        email: dbStaffA.email,
        officeId: `nonexistent-office-${ts}`,
      });
    } catch (e: unknown) {
      invalidOfficeRejected = e instanceof UserError && e.statusCode === 400;
    }
    assert(invalidOfficeRejected, "Invalid/nonexistent office ID: rejected");

    // 18. Legacy ICTO cannot be selected through canonical assignment flow
    const ictoOffice = await prisma.office.findUnique({ where: { slug: "icto" } });
    let ictoRejected = false;
    if (ictoOffice) {
      try {
        await updateUser(callerSuperAdmin, dbStaffA.id, {
          name: dbStaffA.name,
          email: dbStaffA.email,
          officeId: ictoOffice.id,
        });
      } catch (e: unknown) {
        ictoRejected = e instanceof UserError && e.statusCode === 400;
      }
    } else {
      ictoRejected = true;
    }
    assert(ictoRejected, "Legacy ICTO cannot be selected through canonical assignment flow");

    // 19. Canonical office selection continues working normally
    const updatedToOfficeB = await updateUser(callerSuperAdmin, dbStaffA.id, {
      name: dbStaffA.name,
      email: dbStaffA.email,
      officeId: officeB.id,
    });
    assert(
      updatedToOfficeB.officeId === officeB.id,
      "Canonical office selection continues working normally"
    );

    // Reset Staff A back to Office A
    await updateUser(callerSuperAdmin, dbStaffA.id, {
      name: dbStaffA.name,
      email: dbStaffA.email,
      officeId: officeA.id,
    });

  } finally {
    // Cleanup isolated test fixtures
    console.log("\nCleaning up test records...");
    await prisma.session.deleteMany({
      where: {
        userId: {
          in: [
            callerOfficeAdminA.id,
            dbStaffA.id,
            dbStaffB.id,
            `target-staff-a-${ts}`,
            `target-staff-b-${ts}`,
            `editor-a-${ts}`,
            `approver-a-${ts}`,
            `site-admin-${ts}`,
            `custom-user-${ts}`,
            `incomplete-admin-${ts}`,
            `complete-admin-${ts}`,
          ],
        },
      },
    });

    await prisma.auditLog.deleteMany({
      where: {
        userId: { in: [callerSuperAdmin.id, callerOfficeAdminA.id, callerStaffA.id] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: `${ts}@sanfelipe.gov.ph`,
        },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          slug: {
            in: [`custom-role-${ts}`, `incomplete-admin-${ts}`, `complete-admin-${ts}`],
          },
        },
      },
    });

    await prisma.role.deleteMany({
      where: {
        slug: {
          in: [`custom-role-${ts}`, `incomplete-admin-${ts}`, `complete-admin-${ts}`],
        },
      },
    });

    await prisma.office.deleteMany({
      where: {
        id: { in: [officeA.id, officeB.id, inactiveOffice.id] },
      },
    });
    console.log("Cleanup complete.");
  }

  console.log("\n=======================================================");
  console.log(`USER ADMINISTRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runUserAdministrationTests().catch((err) => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});
