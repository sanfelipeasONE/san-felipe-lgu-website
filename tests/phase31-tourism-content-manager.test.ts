// Standalone test mock for server-only marker package
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

import type { SessionUser } from "../src/server/auth/session";

async function runPhase31TourismTestSuite() {
  console.log("================================================================================");
  console.log("SAN FELIPE LGU CMS — PHASE 31: TOURISM CONTENT MANAGER TEST SUITE");
  console.log("================================================================================");

  const { prisma } = await import("../src/server/db/client");
  const {
    ensureTourismRole,
    TOURISM_ROLE_SLUG,
    TOURISM_PERMISSIONS,
    CANONICAL_PRODUCTION_ROLES,
    updateRolePermissions,
    listRoles,
    RoleError,
  } = await import("../src/server/roles/service");
  const {
    createUser,
    updateUser,
    deleteUser,
    listUsers,
    getUserById,
    UserError,
  } = await import("../src/server/users/service");
  const {
    createTourismEntry,
    updateTourismEntry,
    publishTourismEntry,
    archiveTourismEntry,
    deleteTourismEntry,
    getAdminTourismList,
    getAdminTourismById,
    TourismError,
  } = await import("../src/server/tourism/service");
  const { getTourismDashboardData } = await import("../src/server/dashboard/tourism");
  const { getVisibleNavSections } = await import("../src/config/admin-navigation");
  const { getAuthoritySummary, hasPermission } = await import("../src/lib/authz/scope");
  const { PERMISSIONS } = await import("../src/server/authz/permissions");
  const { verifyPassword } = await import("../src/server/auth/password");
  const { listAuditLogs } = await import("../src/server/audit/query");
  type TourismCategory = import("@prisma/client").TourismCategory;

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

  const cleanupUserIds: string[] = [];
  const cleanupEntryIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup: Ensure Tourism Role Exists
    // -------------------------------------------------------------------------
    console.log("\n[SETUP] Ensuring Tourism Content Manager role and baseline Super Admin...");
    const tourismRole = await ensureTourismRole();
    assert(!!tourismRole && tourismRole.slug === TOURISM_ROLE_SLUG, "ensureTourismRole creates or retrieves canonical role");
    assert(tourismRole.isSystemScope === false, "Tourism role has isSystemScope === false");
    assert(tourismRole.tier === "CUSTOM", "Tourism role tier is CUSTOM");
    assert(CANONICAL_PRODUCTION_ROLES.length === 3, "Baseline canonical roles remain 3");

    // Fetch Super Admin role
    const superAdminRole = await prisma.role.findUnique({
      where: { slug: "super-admin" },
      include: {
        permissions: { select: { permission: { select: { code: true } } } },
      },
    });
    if (!superAdminRole) {
      throw new Error("Super Admin role must exist in the database.");
    }

    // Query or mock Super Admin Session User
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        status: "ACTIVE",
        role: { slug: "super-admin" },
      },
      include: {
        role: {
          include: {
            permissions: { select: { permission: { select: { code: true } } } },
          },
        },
      },
    });

    const superAdminUser: SessionUser = existingSuperAdmin
      ? {
          id: existingSuperAdmin.id,
          name: existingSuperAdmin.name,
          email: existingSuperAdmin.email,
          status: "ACTIVE",
          officeId: null,
          office: null,
          roleId: existingSuperAdmin.role.id,
          role: {
            id: existingSuperAdmin.role.id,
            name: existingSuperAdmin.role.name,
            slug: existingSuperAdmin.role.slug,
            isSystemScope: true,
          },
          isSystemScope: true,
          permissions: existingSuperAdmin.role.permissions.map((rp) => rp.permission.code),
          sessionId: "test-super-admin-session",
        }
      : {
          id: "test-super-admin-id",
          name: "Test Super Administrator",
          email: "superadmin.test@sanfelipe.gov.ph",
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
          permissions: superAdminRole.permissions.map((rp) => rp.permission.code),
          sessionId: "test-super-admin-session",
        };

    // -------------------------------------------------------------------------
    // TEST 1: Super Admin can provision Tourism Content Manager account
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Provisioning Tourism Content Manager account via Super Admin...");
    const testTourismEmail = `tourism.officer.${Date.now()}@sanfelipe.gov.ph`;
    const testTourismPassword = "ValidPassword123!@#";

    const createdTourismUser = await createUser(superAdminUser, {
      name: "Maria Santos (Tourism Officer)",
      email: testTourismEmail,
      password: testTourismPassword,
      roleId: tourismRole.id,
      status: "ACTIVE",
    });

    cleanupUserIds.push(createdTourismUser.id);
    assert(!!createdTourismUser.id, "1.1 Super Admin creates Tourism Content Manager account");
    assert(createdTourismUser.email === testTourismEmail, "1.2 Email is correctly normalized and saved");
    assert(createdTourismUser.officeId === null, "1.3 Tourism Content Manager has officeId === null (municipal-wide)");
    assert(createdTourismUser.roleId === tourismRole.id, "1.4 Assigned role matches tourism-content-manager");

    // Forged office check
    let forgedOfficeThrew = false;
    try {
      await createUser(superAdminUser, {
        name: "Forged Office Officer",
        email: `forged.${Date.now()}@sanfelipe.gov.ph`,
        password: testTourismPassword,
        roleId: tourismRole.id,
        officeId: "some-department-id",
        status: "ACTIVE",
      });
    } catch (err) {
      forgedOfficeThrew = true;
      assert(err instanceof UserError, "1.5 Attempting to assign office to Tourism Content Manager throws UserError");
    }
    assert(forgedOfficeThrew, "1.6 Office assignment rejection enforced for Tourism Content Manager");

    // -------------------------------------------------------------------------
    // TEST 2: Tourism account credentials and password verification (Sign-in)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Verifying credentials and password policy...");
    const dbTourismUser = await prisma.user.findUnique({
      where: { id: createdTourismUser.id },
      include: {
        role: {
          include: {
            permissions: { select: { permission: { select: { code: true } } } },
          },
        },
      },
    });
    if (!dbTourismUser) {
      throw new Error("Created tourism user not found in DB.");
    }

    const passwordMatches = await verifyPassword(testTourismPassword, dbTourismUser.passwordHash);
    assert(passwordMatches, "2.1 Password verified via Argon2id hash");

    const badPasswordMatches = await verifyPassword("WrongPassword123!", dbTourismUser.passwordHash);
    assert(!badPasswordMatches, "2.2 Invalid password correctly rejected");

    const tourismPermissions = dbTourismUser.role.permissions.map((rp) => rp.permission.code);
    assert(tourismPermissions.length === 6, "2.3 Exactly 6 permissions assigned to Tourism role");
    for (const code of TOURISM_PERMISSIONS) {
      assert(tourismPermissions.includes(code), `2.4 Holds canonical permission ${code}`);
    }

    // Mock Tourism Session User
    const tourismSessionUser: SessionUser = {
      id: dbTourismUser.id,
      name: dbTourismUser.name,
      email: dbTourismUser.email,
      status: "ACTIVE",
      officeId: null,
      office: null,
      roleId: dbTourismUser.role.id,
      role: {
        id: dbTourismUser.role.id,
        name: dbTourismUser.role.name,
        slug: dbTourismUser.role.slug,
        isSystemScope: false,
      },
      isSystemScope: false,
      permissions: tourismPermissions,
      sessionId: "test-tourism-session-id",
    };

    // -------------------------------------------------------------------------
    // TEST 3: Navigation and Authority Summary for Tourism Content Manager
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Navigation and Authority UI Scoping...");
    const visibleSections = getVisibleNavSections(tourismSessionUser);
    const visibleItemIds = visibleSections.flatMap((s) => s.items.map((i) => i.id));

    assert(visibleItemIds.includes("dashboard"), "3.1 Dashboard link is visible");
    assert(visibleItemIds.includes("tourism"), "3.2 Tourism link is visible");
    assert(!visibleItemIds.includes("news"), "3.3 News link is hidden from Tourism user");
    assert(!visibleItemIds.includes("documents"), "3.4 Documents link is hidden from Tourism user");
    assert(!visibleItemIds.includes("services"), "3.5 Services link is hidden from Tourism user");
    assert(!visibleItemIds.includes("job-opportunities"), "3.6 Jobs link is hidden from Tourism user");
    assert(!visibleItemIds.includes("users"), "3.7 Accounts link is hidden from Tourism user");
    assert(!visibleItemIds.includes("roles"), "3.8 Roles link is hidden from Tourism user");
    assert(!visibleItemIds.includes("audit-logs"), "3.9 Audit Logs link is hidden from Tourism user");
    assert(!visibleItemIds.includes("transparency-procurement"), "3.10 Transparency link is hidden");

    const authoritySummary = getAuthoritySummary(tourismSessionUser);
    assert(authoritySummary.levelLabel === "Tourism Content Manager", "3.11 Authority label is Tourism Content Manager");
    assert(authoritySummary.scopeLabel === "Municipal Tourism Scope", "3.12 Scope label is Municipal Tourism Scope");

    // -------------------------------------------------------------------------
    // TEST 4: Dedicated Tourism Dashboard Data
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Tourism Dashboard Data Retrieval...");
    const dashboardData = await getTourismDashboardData(tourismSessionUser);
    assert(typeof dashboardData.metrics.total === "number", "4.1 Dashboard metrics total returned");
    assert(typeof dashboardData.metrics.published === "number", "4.2 Dashboard metrics published returned");
    assert(typeof dashboardData.metrics.draft === "number", "4.3 Dashboard metrics draft returned");
    assert(typeof dashboardData.metrics.archived === "number", "4.4 Dashboard metrics archived returned");
    assert(typeof dashboardData.categories.attractions === "number", "4.5 Attractions count returned");
    assert(typeof dashboardData.categories.resorts === "number", "4.6 Resorts count returned");
    assert(Array.isArray(dashboardData.recentEntries), "4.7 Recent entries list returned");

    // -------------------------------------------------------------------------
    // TEST 5: Complete Tourism CRUD Workflow by Tourism Content Manager
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Full Tourism Lifecycle (Create, Edit, Publish, Archive, Delete)...");
    // Create draft
    const testTitle = `Liwliwa Beach Haven ${Date.now()}`;
    const newEntry = await createTourismEntry(tourismSessionUser, {
      title: testTitle,
      category: "ATTRACTIONS",
      summary: "A pristine coastal attraction with surfing breaks and golden sunsets in San Felipe.",
      body: "<p>Liwliwa is one of the premier surfing destinations in Central Luzon, offering vibrant coastal hospitality.</p>",
      location: "Sitio Liwliwa, Barangay Santo Niño",
      contactNumber: "+63 912 345 6789",
      operatingHours: "Open Daily 6:00 AM - 10:00 PM",
      featuredImageUrl: "https://res.cloudinary.com/san-felipe/image/upload/v1/tourism/liwliwa-beach.jpg",
      featuredImagePublicId: "tourism/liwliwa-beach",
      featuredImageAlt: "Liwliwa beach shoreline at sunset",
    });
    cleanupEntryIds.push(newEntry.id);

    assert(!!newEntry.id, "5.1 Tourism user creates new entry draft");
    assert(newEntry.status === "DRAFT", "5.2 Entry initializes in DRAFT status");
    assert(newEntry.createdById === tourismSessionUser.id, "5.3 Entry createdById matches Tourism user");

    // Read single
    const fetched = await getAdminTourismById(tourismSessionUser, newEntry.id);
    assert(fetched.id === newEntry.id && fetched.title === testTitle, "5.4 Tourism user can read entry by ID");

    let nonExistentThrew = false;
    try {
      await getAdminTourismById(tourismSessionUser, "non-existent-tourism-id");
    } catch (err) {
      nonExistentThrew = err instanceof TourismError;
    }
    assert(nonExistentThrew, "5.4.1 TourismError thrown on non-existent entry ID");

    // Read list
    const listResult = await getAdminTourismList(tourismSessionUser, { search: "Liwliwa" });
    assert(listResult.entries.some((e) => e.id === newEntry.id), "5.5 Tourism user can search and list entries");

    // Update entry
    const updatedTitle = `${testTitle} (Updated)`;
    const updated = await updateTourismEntry(tourismSessionUser, newEntry.id, {
      title: updatedTitle,
      category: "ATTRACTIONS",
      summary: "Updated pristine coastal surfing destination.",
      body: "<p>Updated content body describing accommodation and amenities.</p>",
      location: "Barangay Santo Niño, San Felipe, Zambales",
      expectedUpdatedAt: newEntry.updatedAt.toISOString(),
    });
    assert(updated.title === updatedTitle, "5.6 Tourism user updates entry successfully");

    // Publish entry
    const published = await publishTourismEntry(tourismSessionUser, newEntry.id, updated.updatedAt.toISOString());
    assert(published.status === "PUBLISHED", "5.7 Tourism user publishes entry live");
    assert(!!published.publishedAt, "5.8 Published timestamp is recorded");

    // Archive entry
    const archived = await archiveTourismEntry(tourismSessionUser, newEntry.id, published.updatedAt.toISOString());
    assert(archived.status === "ARCHIVED", "5.9 Tourism user archives entry");

    // Delete entry
    const deleted = await deleteTourismEntry(tourismSessionUser, newEntry.id, archived.updatedAt.toISOString());
    assert(deleted.id === newEntry.id, "5.10 Tourism user permanently deletes entry");
    cleanupEntryIds.pop(); // Already deleted from DB

    // -------------------------------------------------------------------------
    // TEST 6: Authorization Boundaries & Rejection of Unauthorized Modules
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Enforcing Module Isolation (users, settings, audit, news, docs)...");

    // 6.1 Cannot create users
    let createUserBlocked = false;
    try {
      await createUser(tourismSessionUser, {
        name: "Unauthorized Provisioning",
        email: "unauthorized@sanfelipe.gov.ph",
        password: "ValidPassword123!",
      });
    } catch (err) {
      createUserBlocked = true;
      assert(err instanceof UserError, "6.1.1 Tourism user blocked from createUser (throws UserError)");
    }
    assert(createUserBlocked, "6.1.2 Blocked from provisioning accounts");

    // 6.2 Cannot update users
    let updateUserBlocked = false;
    try {
      await updateUser(tourismSessionUser, superAdminUser.id, {
        name: "Hacked Super Admin",
        email: superAdminUser.email,
      });
    } catch (err) {
      updateUserBlocked = true;
      assert(err instanceof UserError, "6.2.1 Tourism user blocked from updateUser");
    }
    assert(updateUserBlocked, "6.2.2 Blocked from updating accounts");

    // 6.3 Cannot delete users
    let deleteUserBlocked = false;
    try {
      await deleteUser(tourismSessionUser, superAdminUser.id);
    } catch (err) {
      deleteUserBlocked = true;
      assert(err instanceof UserError, "6.3.1 Tourism user blocked from deleteUser");
    }
    assert(deleteUserBlocked, "6.3.2 Blocked from deleting accounts");

    // 6.4 Cannot access audit logs
    const hasAuditPerm = hasPermission(tourismSessionUser, PERMISSIONS.AUDIT_VIEW);
    assert(!hasAuditPerm, "6.4 Tourism user lacks audit.view permission");

    // 6.5 Cannot access roles & permissions
    const hasSettingsPerm = hasPermission(tourismSessionUser, PERMISSIONS.SETTINGS_MANAGE);
    assert(!hasSettingsPerm, "6.5 Tourism user lacks settings.manage permission");

    // 6.6 Cannot access News, Documents, Jobs, Services
    assert(!hasPermission(tourismSessionUser, PERMISSIONS.POSTS_CREATE), "6.6.1 Lacks posts.create");
    assert(!hasPermission(tourismSessionUser, PERMISSIONS.POSTS_VIEW), "6.6.2 Lacks posts.view");
    assert(!hasPermission(tourismSessionUser, PERMISSIONS.DOCUMENTS_CREATE), "6.6.3 Lacks documents.create");
    assert(!hasPermission(tourismSessionUser, PERMISSIONS.DOCUMENTS_VIEW), "6.6.4 Lacks documents.view");
    assert(!hasPermission(tourismSessionUser, PERMISSIONS.JOBS_CREATE), "6.6.5 Lacks jobs.create");
    assert(!hasPermission(tourismSessionUser, PERMISSIONS.SERVICES_UPDATE), "6.6.6 Lacks services.update");

    // 6.7 Direct service call rejections
    let listUsersBlocked = false;
    try {
      await listUsers(tourismSessionUser);
    } catch (err) {
      listUsersBlocked = err instanceof UserError;
    }
    assert(listUsersBlocked, "6.7 listUsers rejects Tourism Content Manager with UserError (403)");

    let getUserBlocked = false;
    try {
      await getUserById(tourismSessionUser, superAdminUser.id);
    } catch (err) {
      getUserBlocked = err instanceof UserError;
    }
    assert(getUserBlocked, "6.8 getUserById rejects Tourism Content Manager with UserError (403)");

    let listRolesBlocked = false;
    try {
      await listRoles(tourismSessionUser);
    } catch (err) {
      listRolesBlocked = err instanceof RoleError;
    }
    assert(listRolesBlocked, "6.9 listRoles rejects Tourism Content Manager with RoleError (403)");

    let updateRolesBlocked = false;
    try {
      await updateRolePermissions(tourismSessionUser, tourismRole.id, [...TOURISM_PERMISSIONS]);
    } catch (err) {
      updateRolesBlocked = err instanceof RoleError;
    }
    assert(updateRolesBlocked, "6.10 updateRolePermissions rejects Tourism Content Manager with RoleError (403)");

    let listAuditBlocked = false;
    try {
      await listAuditLogs(tourismSessionUser, {});
    } catch (err) {
      listAuditBlocked = err instanceof Error && err.message.includes("FORBIDDEN");
    }
    assert(listAuditBlocked, "6.11 listAuditLogs rejects Tourism Content Manager with Forbidden Error");

    // -------------------------------------------------------------------------
    // TEST 7: Self-Elevation Safeguard
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Self-Elevation Safeguards...");
    let selfElevationBlocked = false;
    try {
      await updateUser(tourismSessionUser, tourismSessionUser.id, {
        name: tourismSessionUser.name,
        email: tourismSessionUser.email,
        roleId: superAdminRole.id,
      });
    } catch (err) {
      selfElevationBlocked = true;
      assert(err instanceof UserError, "7.1 Self-elevation attempt threw UserError");
    }
    assert(selfElevationBlocked, "7.2 Tourism user cannot elevate self to Super Admin");

    // -------------------------------------------------------------------------
    // TEST 8: Super Admin Account Updates and Preserved Functionality
    // -------------------------------------------------------------------------
    console.log("\n[TEST 8] Super Admin can manage Tourism Content Manager account...");
    const updatedTourismUser = await updateUser(superAdminUser, createdTourismUser.id, {
      name: "Maria Santos-Reyes (Tourism Officer)",
      email: createdTourismUser.email,
    });
    assert(updatedTourismUser.name === "Maria Santos-Reyes (Tourism Officer)", "8.1 Super Admin can update Tourism Officer profile");

    // Super Admin cannot assign an office to Tourism Content Manager
    let assignOfficeThrew = false;
    try {
      await updateUser(superAdminUser, createdTourismUser.id, {
        name: createdTourismUser.name,
        email: createdTourismUser.email,
        officeId: "some-office-id",
      });
    } catch (err) {
      assignOfficeThrew = true;
      assert(err instanceof UserError, "8.2 Attempting to assign office to Tourism account throws UserError");
    }
    assert(assignOfficeThrew, "8.3 Office assignment rejection enforced on account update");

    // -------------------------------------------------------------------------
    // TEST 9: Public Tourism Portal Intact
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9] Public Tourism integration check...");
    const publicCategories: TourismCategory[] = ["ATTRACTIONS", "RESORTS", "CULTURE_AND_ARTS", "PRODUCTS"];
    for (const cat of publicCategories) {
      const count = await prisma.tourismEntry.count({
        where: { category: cat, status: "PUBLISHED" },
      });
      assert(typeof count === "number", `9.${cat} Public published count query intact`);
    }

    // -------------------------------------------------------------------------
    // TEST 10: Tourism Role Permission Expansion Safeguard & Self-Healing (Phase 31.1)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 10] Enforcing strict server-side boundary against Tourism role permission expansion...");

    // 10.1: Super Admin attempting to assign non-tourism permissions (e.g. posts.create) throws RoleError (400)
    let assignPostsCreateFailed = false;
    let assignPostsCreateMessage = "";
    try {
      await updateRolePermissions(superAdminUser, tourismRole.id, [
        PERMISSIONS.POSTS_CREATE,
        ...TOURISM_PERMISSIONS,
      ]);
    } catch (err) {
      if (err instanceof RoleError) {
        assignPostsCreateFailed = true;
        assignPostsCreateMessage = err.message;
      }
    }
    assert(assignPostsCreateFailed, "10.1 Super Admin rejected from assigning posts.create to Tourism role (RoleError 400)");
    assert(
      assignPostsCreateMessage.includes("strictly restricted to municipal tourism permissions") &&
      assignPostsCreateMessage.includes("posts.create"),
      "10.2 Error message explicitly identifies non-tourism permissions"
    );

    // 10.3: Super Admin attempting to assign administrative permissions (e.g. users.view) throws RoleError (400)
    let assignUsersViewFailed = false;
    try {
      await updateRolePermissions(superAdminUser, tourismRole.id, [
        PERMISSIONS.USERS_VIEW,
      ]);
    } catch (err) {
      assignUsersViewFailed = err instanceof RoleError;
    }
    assert(assignUsersViewFailed, "10.3 Super Admin rejected from assigning users.view to Tourism role (RoleError 400)");

    // 10.4: Super Admin updating tourism role within canonical tourism permissions succeeds
    const updateResult = await updateRolePermissions(
      superAdminUser,
      tourismRole.id,
      [...TOURISM_PERMISSIONS]
    );
    assert(
      updateResult.success === true,
      "10.4 Super Admin can update Tourism role within canonical tourism permissions"
    );

    // 10.5: Self-healing verification: extraneous permission artificially inserted into DB is pruned by ensureTourismRole()
    const usersViewPermission = await prisma.permission.findUnique({
      where: { code: PERMISSIONS.USERS_VIEW },
    });
    if (usersViewPermission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: tourismRole.id,
            permissionId: usersViewPermission.id,
          },
        },
        update: {},
        create: {
          roleId: tourismRole.id,
          permissionId: usersViewPermission.id,
        },
      });

      // Verify the extraneous permission was inserted for test setup
      const preCleanupPerms = await prisma.rolePermission.findMany({
        where: { roleId: tourismRole.id },
        include: { permission: true },
      });
      assert(
        preCleanupPerms.some((rp) => rp.permission.code === PERMISSIONS.USERS_VIEW),
        "10.5.1 Extraneous permission staged for self-healing verification"
      );

      // Call ensureTourismRole() to trigger runtime self-healing
      await ensureTourismRole();

      // Verify self-healing purged users.view and retained only canonical TOURISM_PERMISSIONS
      const postCleanupPerms = await prisma.rolePermission.findMany({
        where: { roleId: tourismRole.id },
        include: { permission: true },
      });
      const postCodes = postCleanupPerms.map((rp) => rp.permission.code);
      assert(
        !postCodes.includes(PERMISSIONS.USERS_VIEW),
        "10.5.2 ensureTourismRole() pruned extraneous users.view permission"
      );
      assert(
        postCodes.length === TOURISM_PERMISSIONS.length,
        "10.5.3 Exactly 6 canonical tourism permissions remain after self-healing"
      );
      for (const code of TOURISM_PERMISSIONS) {
        assert(postCodes.includes(code), `10.5.4 Role holds canonical permission ${code}`);
      }
    }

    console.log("\n================================================================================");
    console.log(`TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("================================================================================");
  } finally {
    // Teardown cleanup
    console.log("\n[CLEANUP] Removing test artifacts...");
    for (const id of cleanupEntryIds) {
      await prisma.tourismEntry.deleteMany({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupUserIds) {
      await prisma.user.deleteMany({ where: { id } }).catch(() => {});
    }
    console.log("  ✓ Cleanup complete.");
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase31TourismTestSuite().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
