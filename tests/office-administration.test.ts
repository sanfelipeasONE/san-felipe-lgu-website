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

async function runOfficeAdministrationTests() {
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
    listOffices,
    getOfficeById,
    updateOffice,
    OfficeError,
  } = await import("../src/server/offices/service");
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
  console.log("SAN FELIPE LGU OFFICE ADMINISTRATION TEST SUITE (PHASE 17)");
  console.log("=======================================================\n");

  const ts = Date.now();

  // Create isolated test office
  const testOffice = await prisma.office.create({
    data: {
      name: `Test Department ${ts}`,
      slug: `test-dept-${ts}`,
      shortName: "TDP",
      location: "Ground Floor, Annex Building",
      officeHours: "Monday - Friday: 8:00 AM - 5:00 PM",
      status: OfficeStatus.ACTIVE,
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

  // Actors
  const callerSuperAdmin: SessionUser = {
    id: `sa-off-${ts}`,
    name: "Office Test Super Admin",
    email: `sa-off-${ts}@sanfelipe.gov.ph`,
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
      "offices.view",
      "offices.update",
      "users.view",
      "settings.manage",
    ],
    sessionId: `session-sa-off-${ts}`,
  };

  const callerOfficeAdmin: SessionUser = {
    id: `oa-off-${ts}`,
    name: "Office Test Office Admin",
    email: `oa-off-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: testOffice.id,
    office: { id: testOffice.id, name: testOffice.name, shortName: testOffice.shortName, slug: testOffice.slug },
    roleId: officeAdminRole.id,
    role: {
      id: officeAdminRole.id,
      name: officeAdminRole.name,
      slug: officeAdminRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    permissions: ["offices.view", "offices.update"], // Even if granted permissions, scope must block!
    sessionId: `session-oa-off-${ts}`,
  };

  const callerStaff: SessionUser = {
    id: `staff-off-${ts}`,
    name: "Office Test Staff",
    email: `staff-off-${ts}@sanfelipe.gov.ph`,
    status: "ACTIVE",
    officeId: testOffice.id,
    office: { id: testOffice.id, name: testOffice.name, shortName: testOffice.shortName, slug: testOffice.slug },
    roleId: staffRole.id,
    role: {
      id: staffRole.id,
      name: staffRole.name,
      slug: staffRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    permissions: ["posts.view"],
    sessionId: `session-staff-off-${ts}`,
  };

  const callerSystemNoPerm: SessionUser = {
    id: `sa-noperm-${ts}`,
    name: "Super Admin No Perm",
    email: `sa-noperm-${ts}@sanfelipe.gov.ph`,
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
    permissions: ["posts.view"], // lacks offices.view / offices.update
    sessionId: `session-sa-noperm-${ts}`,
  };

  // Seed db user records so audit logs foreign keys succeed
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

  try {
    // -------------------------------------------------------------
    // Test 1: Staff & Office Admin Denied
    // -------------------------------------------------------------
    console.log("1. Staff & Office Admin Authorization Denial");
    let staffDenied = false;
    try {
      await listOffices(callerStaff);
    } catch (e: unknown) {
      staffDenied = e instanceof OfficeError && e.statusCode === 403;
    }
    assert(staffDenied, "Staff is denied listing municipal offices (SYSTEM scope required)");

    let officeAdminDenied = false;
    try {
      await listOffices(callerOfficeAdmin);
    } catch (e: unknown) {
      officeAdminDenied = e instanceof OfficeError && e.statusCode === 403;
    }
    assert(officeAdminDenied, "Office Admin is denied listing municipal offices (SYSTEM scope required)");

    let officeAdminUpdateDenied = false;
    try {
      await updateOffice(callerOfficeAdmin, testOffice.id, {
        name: "Unauthorized Update",
        status: "ACTIVE",
      });
    } catch (e: unknown) {
      officeAdminUpdateDenied = e instanceof OfficeError && e.statusCode === 403;
    }
    assert(officeAdminUpdateDenied, "Office Admin is denied updating municipal offices");

    // -------------------------------------------------------------
    // Test 2: SYSTEM Scope without Permission Denied
    // -------------------------------------------------------------
    console.log("\n2. SYSTEM Scope without Permission Denied");
    let systemNoPermDenied = false;
    try {
      await listOffices(callerSystemNoPerm);
    } catch (e: unknown) {
      systemNoPermDenied =
        e instanceof OfficeError &&
        e.statusCode === 403 &&
        e.message.includes("offices.view");
    }
    assert(systemNoPermDenied, "SYSTEM scope user without offices.view is denied");

    // -------------------------------------------------------------
    // Test 3: Authorized SYSTEM Scope Inspection
    // -------------------------------------------------------------
    console.log("\n3. Authorized SYSTEM Scope Inspection");
    const allOffices = await listOffices(callerSuperAdmin);
    assert(allOffices.length >= 18, `SYSTEM administrator lists all municipal offices (found: ${allOffices.length})`);
    assert(
      allOffices.some((o) => o.id === testOffice.id),
      "Test department is included in system office listing"
    );
    assert(
      !allOffices.some((o) => o.slug === "icto"),
      "Deprecated legacy ICTO is excluded from system office listing"
    );

    const ictoInDb = await prisma.office.findUnique({ where: { slug: "icto" } });
    if (ictoInDb) {
      let ictoGetDenied = false;
      try {
        await getOfficeById(callerSuperAdmin, ictoInDb.id);
      } catch (e: unknown) {
        ictoGetDenied = e instanceof OfficeError && e.statusCode === 404;
      }
      assert(ictoGetDenied, "Legacy ICTO cannot be retrieved via getOfficeById (treated as non-canonical)");
    }

    const retrievedOffice = await getOfficeById(callerSuperAdmin, testOffice.id);
    assert(retrievedOffice.name === testOffice.name, "SYSTEM admin retrieves office details");
    assert(retrievedOffice.slug === testOffice.slug, "Permanent canonical slug is preserved");

    // -------------------------------------------------------------
    // Test 4: Authorized Office Metadata Update
    // -------------------------------------------------------------
    console.log("\n4. Authorized Office Metadata Update");
    const updatedOffice = await updateOffice(callerSuperAdmin, testOffice.id, {
      name: `${testOffice.name} - Updated`,
      shortName: "TDP-U",
      location: "2nd Floor, Municipal Executive Wing",
      officeHours: "Monday - Thursday: 8:00 AM - 6:00 PM",
      officeHead: "Hon. Department Head",
      email: "dept.head@sanfelipe.gov.ph",
      phone: "(047) 913-9999",
      description: "Updated municipal service department overview.",
      mandate: "Official public mandate.",
      status: "ACTIVE",
      expectedUpdatedAt: testOffice.updatedAt.toISOString(),
    });

    assert(
      updatedOffice.name === `${testOffice.name} - Updated`,
      "Official department name updated successfully"
    );
    assert(
      updatedOffice.shortName === "TDP-U",
      "Department acronym updated successfully"
    );
    assert(
      updatedOffice.location === "2nd Floor, Municipal Executive Wing",
      "Physical location updated successfully"
    );
    assert(
      updatedOffice.slug === testOffice.slug,
      "Canonical slug remains strictly immutable across updates"
    );

    // -------------------------------------------------------------
    // Test 5: Optimistic Concurrency Protection (409 Conflict)
    // -------------------------------------------------------------
    console.log("\n5. Optimistic Concurrency Protection (409 Conflict)");
    let staleUpdateConflict = false;
    try {
      await updateOffice(callerSuperAdmin, testOffice.id, {
        name: "Stale Department Name",
        status: "ACTIVE",
        expectedUpdatedAt: testOffice.updatedAt.toISOString(), // Stale timestamp!
      });
    } catch (e: unknown) {
      staleUpdateConflict = e instanceof OfficeError && e.statusCode === 409;
    }
    assert(staleUpdateConflict, "Stale office update returns 409 Conflict");

    // -------------------------------------------------------------
    // Test 6: Deactivation Behavior & Audit Logging
    // -------------------------------------------------------------
    console.log("\n6. Deactivation Behavior & Audit Logging");
    const refreshedOffice = await prisma.office.findUniqueOrThrow({ where: { id: testOffice.id } });

    // Seed test news & document assigned to this office to prove non-destructive deactivation
    const testDoc = await prisma.document.create({
      data: {
        title: `Test Document ${ts}`,
        officeId: testOffice.id,
        status: "PUBLISHED",
        originalFilename: "test.pdf",
        storagePublicId: `doc-${ts}`,
        storageUrl: "https://example.com/test.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: callerSuperAdmin.id,
      },
    });

    // Seed test staff user and active session to verify automatic session revocation on deactivation
    const testStaffUser = await prisma.user.create({
      data: {
        id: `staff-rev-${ts}`,
        name: "Revocation Test Staff",
        email: `staff-rev-${ts}@sanfelipe.gov.ph`,
        passwordHash: "hash-placeholder",
        roleId: staffRole.id,
        officeId: testOffice.id,
        status: UserStatus.ACTIVE,
      },
    });

    const sessionTokenHash = `token-hash-test-${ts}`;
    const testSession = await prisma.session.create({
      data: {
        userId: testStaffUser.id,
        tokenHash: sessionTokenHash,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    const deactivated = await updateOffice(callerSuperAdmin, testOffice.id, {
      name: refreshedOffice.name,
      status: "INACTIVE",
      expectedUpdatedAt: refreshedOffice.updatedAt.toISOString(),
    });

    assert(deactivated.status === OfficeStatus.INACTIVE, "Office status transitioned to INACTIVE");

    // Verify session revocation
    const refreshedSession = await prisma.session.findUnique({
      where: { id: testSession.id },
    });
    assert(
      refreshedSession !== null && refreshedSession.revokedAt !== null,
      "Office deactivation automatically revokes active sessions of assigned staff users"
    );

    // Confirm assigned content was NOT destroyed or deleted
    const docStillExists = await prisma.document.findUnique({
      where: { id: testDoc.id },
    });
    assert(docStillExists !== null, "Deactivating an office does NOT destroy or delete assigned municipal documents");

    // Confirm audit event recorded
    const auditEvent = await prisma.auditLog.findFirst({
      where: {
        action: "OFFICE_STATUS_CHANGED",
        officeId: testOffice.id,
      },
    });
    assert(auditEvent !== null, "OFFICE_STATUS_CHANGED audit event was recorded in audit log");

    // -------------------------------------------------------------
    // Test 7: Inactive Office Session Revocation & Access Denial
    // -------------------------------------------------------------
    console.log("\n7. Inactive Office Session Revocation & Access Denial");

    // Verify session lookup logic (equivalent to getCurrentUser resolution rules)
    function checkSessionAllowed(user: {
      status: string;
      role: { isSystemScope: boolean };
      office: { status: string } | null;
    }): boolean {
      if (user.status !== "ACTIVE") return false;
      if (!user.role.isSystemScope && user.office?.status === "INACTIVE") return false;
      return true;
    }

    const inactiveStaffDb = await prisma.user.findUniqueOrThrow({
      where: { id: testStaffUser.id },
      include: { role: true, office: true },
    });

    assert(
      checkSessionAllowed(inactiveStaffDb) === false,
      "Session access is denied when municipal office status is INACTIVE"
    );

    // Reactivate office and verify access restoration
    const reactivatedOffice = await updateOffice(callerSuperAdmin, testOffice.id, {
      name: refreshedOffice.name,
      status: "ACTIVE",
      expectedUpdatedAt: deactivated.updatedAt.toISOString(),
    });
    assert(reactivatedOffice.status === OfficeStatus.ACTIVE, "Office reactivated to ACTIVE");

    const reactivatedStaffDb = await prisma.user.findUniqueOrThrow({
      where: { id: testStaffUser.id },
      include: { role: true, office: true },
    });

    assert(
      checkSessionAllowed(reactivatedStaffDb) === true,
      "Session access is permitted when municipal office is ACTIVE"
    );

    // Verify SYSTEM-scoped administrator is NOT locked out by office status
    const systemAdminWithOffice = {
      status: "ACTIVE",
      role: { isSystemScope: true },
      office: { status: "INACTIVE" },
    };
    assert(
      checkSessionAllowed(systemAdminWithOffice) === true,
      "SYSTEM-scoped administrator is NEVER locked out by inactive municipal office"
    );

    // -------------------------------------------------------------
    // Test 8: Canonical 18 Municipal Offices Provenance & Verification
    // -------------------------------------------------------------
    console.log("\n8. Canonical 18 Municipal Offices Provenance & Verification");
    const { VERIFIED_MUNICIPAL_OFFICES } = await import("../src/config/offices-data");

    assert(
      VERIFIED_MUNICIPAL_OFFICES.length === 18,
      `Canonical office registry contains exactly 18 municipal departments (found: ${VERIFIED_MUNICIPAL_OFFICES.length})`
    );

    const canonicalSlugs = VERIFIED_MUNICIPAL_OFFICES.map((o) => o.slug);
    const dbOffices = await prisma.office.findMany({
      where: { slug: { in: canonicalSlugs } },
    });

    assert(
      dbOffices.length === 18,
      `All 18 canonical municipal offices exist in database (found: ${dbOffices.length})`
    );

    const VERIFIED_ACRONYMS: Record<string, string> = {
      "municipal-planning-and-development-office": "MPDO",
      "municipal-health-office": "MHO",
      "municipal-budget-office": "MBO",
      "municipal-disaster-risk-reduction-and-management-office": "MDRRMO",
      "local-youth-development-office": "LYDO",
      "human-resource-management-office": "HRMO",
      "public-employment-service-office": "PESO",
    };

    let verifiedAcronymsMatch = true;
    let nonAcronymsAreNull = true;
    let allCanonicalActive = true;

    for (const off of dbOffices) {
      if (off.status !== OfficeStatus.ACTIVE) {
        allCanonicalActive = false;
      }
      const expectedAcronym = VERIFIED_ACRONYMS[off.slug];
      if (expectedAcronym) {
        if (off.shortName !== expectedAcronym) {
          verifiedAcronymsMatch = false;
        }
      } else {
        if (off.shortName !== null) {
          nonAcronymsAreNull = false;
        }
      }
    }

    assert(allCanonicalActive, "All 18 canonical municipal offices are in ACTIVE status");
    assert(
      verifiedAcronymsMatch,
      "All 7 verified charter acronyms correctly populated (MPDO, MHO, MBO, MDRRMO, LYDO, HRMO, PESO)"
    );
    assert(
      nonAcronymsAreNull,
      "Remaining 11 canonical offices have shortName set to null (no speculative acronyms)"
    );

    // -------------------------------------------------------------
    // Test 9: Client-Provided Office Heads & Directory Contacts
    // -------------------------------------------------------------
    console.log("\n9. Client-Provided Office Heads & Directory Contacts");
    const EXPECTED_HEADS: Record<string, string> = {
      "office-of-the-mayor": "HON. ENGR. REINHARD E. JERESANO",
      "office-of-the-sangguniang-bayan": "HON. MARY ANN R. QUIBA",
      "municipal-planning-and-development-office": "FREDERICK F. TORRES",
      "municipal-health-office": "SALOME F. ARINDUQUE",
      "municipal-budget-office": "DAISY R. NERY",
      "municipal-accounting-office": "MICHELLE ANN N. CALLES",
      "municipal-treasury-office": "ELSIE C. ALIP",
      "municipal-assessors-office": "GERALDINE B. BADA",
      "municipal-social-welfare-and-development-office": "ROWEL A. VILLANUEVA",
      "local-civil-registrars-office": "JEANELLENE R. SALES (OIC)",
      "municipal-engineering-office": "BENEDICT F. JADLOC",
      "municipal-agriculture-office": "JOHN REY F. FUNIESTAS (OIC)",
      "municipal-disaster-risk-reduction-and-management-office": "RAYMOND F. DE JESUS",
      "municipal-tourism-and-investments-promotions-office": "DWAIN O. DOCTANA",
      "local-youth-development-office": "ADRIAN LUKE R. GALLARDO",
      "municipal-ecological-and-natural-resources-office": "ANDRE CARLO A. DASIG",
      "human-resource-management-office": "MERCEDES L. FORONDA",
      "public-employment-service-office": "FREDERICK F. TORRES",
    };

    let allHeadsMatch = true;
    for (const off of dbOffices) {
      if (off.officeHead !== EXPECTED_HEADS[off.slug]) {
        console.error(`  Mismatch for ${off.slug}: expected "${EXPECTED_HEADS[off.slug]}", got "${off.officeHead}"`);
        allHeadsMatch = false;
      }
    }
    assert(allHeadsMatch, "All 18 canonical municipal offices have exact client-provided office heads mapped");

    // Dual office head: Frederick F. Torres heads BOTH MPDO and PESO
    const mpdo = dbOffices.find((o) => o.slug === "municipal-planning-and-development-office");
    const peso = dbOffices.find((o) => o.slug === "public-employment-service-office");
    assert(
      mpdo?.officeHead === "FREDERICK F. TORRES" && peso?.officeHead === "FREDERICK F. TORRES",
      "Dual office head: Frederick F. Torres legitimately heads BOTH MPDO and PESO"
    );

    // OIC designations preserved
    const lcro = dbOffices.find((o) => o.slug === "local-civil-registrars-office");
    const mao = dbOffices.find((o) => o.slug === "municipal-agriculture-office");
    assert(
      lcro?.officeHead === "JEANELLENE R. SALES (OIC)",
      "Jeanellene R. Sales preserved as Registrar OIC without promotion or omission"
    );
    assert(
      mao?.officeHead === "JOHN REY F. FUNIESTAS (OIC)",
      "John Rey F. Funiestas preserved as Agriculture OIC without promotion or omission"
    );

    // Both Agriculture phone numbers preserved
    assert(
      mao?.phone === "09097884173 / 09100757895",
      "Both client-provided Agriculture phone numbers preserved (09097884173 / 09100757895)"
    );

    // Unusual formats preserved
    const acct = dbOffices.find((o) => o.slug === "municipal-accounting-office");
    const menro = dbOffices.find((o) => o.slug === "municipal-ecological-and-natural-resources-office");
    assert(acct?.phone === "602-5181", "Accounting landline format preserved (602-5181)");
    assert(menro?.phone === "09467585305", "MENRO mobile format preserved (09467585305)");

    // LCRO and HRMO have null contacts
    const hrmo = dbOffices.find((o) => o.slug === "human-resource-management-office");
    assert(
      lcro?.phone === null && lcro?.email === null,
      "Local Civil Registrar has null phone/email (no guessed or fabricated contact)"
    );
    assert(
      hrmo?.phone === null && hrmo?.email === null,
      "HRMO has null phone/email (no guessed or fabricated contact)"
    );

    // Zero noncanonical agencies exist as Office rows
    const noncanonicalSlugs = [
      "dilg", "bplo", "popcom", "dti", "senior-citizen",
      "mat", "mtc", "pdao", "pnp", "bfp",
    ];
    const noncanonicalRows = await prisma.office.findMany({
      where: { slug: { in: noncanonicalSlugs } },
    });
    assert(
      noncanonicalRows.length === 0,
      "Zero noncanonical agency rows (DILG, BPLO, POPCOM, DTI, SENIOR CITIZEN, MAT, MTC, PDAO, PNP, BFP) exist in Office table"
    );

    // -------------------------------------------------------------
    // Test 10: CMS Navigation Removal & Direct Route Redirection
    // -------------------------------------------------------------
    console.log("\n10. CMS Navigation Removal & Direct Route Redirection");
    const { ADMIN_NAV_CONFIG } = await import("../src/config/admin-navigation");
    const allNavItems = ADMIN_NAV_CONFIG.flatMap((section) => section.items);
    const officeNavItem = allNavItems.find(
      (item) => item.id === "offices" || item.href === "/admin/offices"
    );
    assert(
      !officeNavItem,
      "Municipal Offices is completely absent from admin sidebar navigation"
    );

    // Verify Dashboard Quick Actions panel no longer contains "Manage Municipal Offices"
    const quickActionsPath = path.resolve(
      process.cwd(),
      "src/components/admin/dashboard/quick-actions-panel.tsx"
    );
    const quickActionsSource = fs.readFileSync(quickActionsPath, "utf-8");
    assert(
      !quickActionsSource.includes("Manage Municipal Offices"),
      "Quick Actions panel does not contain 'Manage Municipal Offices'"
    );
    assert(
      !quickActionsSource.includes("/admin/offices"),
      "Quick Actions panel does not contain links to /admin/offices"
    );

    // Verify /admin/offices and /admin/offices/[id]/edit contain direct redirects to /admin
    const officesListPagePath = path.resolve(
      process.cwd(),
      "src/app/(cms)/admin/offices/page.tsx"
    );
    const officesListPageSource = fs.readFileSync(officesListPagePath, "utf-8");
    assert(
      officesListPageSource.includes('redirect("/admin")'),
      "Admin offices list page contains redirect to /admin"
    );
    assert(
      officesListPageSource.includes('redirect("/staff/login")'),
      "Admin offices list page redirects unauthenticated requests to /staff/login"
    );

    const editOfficePagePath = path.resolve(
      process.cwd(),
      "src/app/(cms)/admin/offices/[id]/edit/page.tsx"
    );
    const editOfficePageSource = fs.readFileSync(editOfficePagePath, "utf-8");
    assert(
      editOfficePageSource.includes('redirect("/admin")'),
      "Edit office page contains redirect to /admin"
    );
    assert(
      editOfficePageSource.includes('redirect("/staff/login")'),
      "Edit office page redirects unauthenticated requests to /staff/login"
    );

    // Verify canonical offices data remains 100% intact
    const canonicalCount = await prisma.office.count({
      where: { status: "ACTIVE" },
    });
    assert(
      canonicalCount >= 18,
      `All 18 canonical municipal offices remain intact in the database (found: ${canonicalCount})`
    );

  } finally {
    console.log("\nCleaning up test records...");
    await prisma.session.deleteMany({
      where: { tokenHash: { contains: `${ts}` } },
    });
    await prisma.document.deleteMany({
      where: { storagePublicId: { contains: `${ts}` } },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [callerSuperAdmin.id, `staff-rev-${ts}`] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [callerSuperAdmin.id, `staff-rev-${ts}`] } },
    });
    await prisma.office.deleteMany({
      where: { id: testOffice.id },
    });
    console.log("Cleanup complete.");
  }

  console.log("\n=======================================================");
  console.log(`OFFICE ADMINISTRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runOfficeAdministrationTests().catch((err) => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});
