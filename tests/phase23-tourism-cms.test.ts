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

async function runPhase23TourismTestSuite() {
  console.log("=======================================================");
  console.log("SAN FELIPE LGU TOURISM CMS TEST SUITE (PHASE 23)");
  console.log("=======================================================");

  const { prisma } = await import("../src/server/db/client");
  const {
    createTourismEntry,
    updateTourismEntry,
    publishTourismEntry,
    archiveTourismEntry,
    deleteTourismEntry,
    getAdminTourismList,
    getAdminTourismById,
    removeTourismFeaturedImage,
    getPublicPublishedTourismByCategory,
    getPublicPublishedTourismBySlug,
    getPublicOtherTourism,
    TourismError,
  } = await import("../src/server/tourism/service");
  const { sanitizeTourismHtml } = await import("../src/server/tourism/sanitize");
  const { generateUniqueTourismSlug, slugify } = await import("../src/server/tourism/slug");
  const {
    tourismDraftSchema,
    validateTourismForPublish,
    TOURISM_CATEGORIES,
    TOURISM_STATUSES,
  } = await import("../src/lib/validation/tourism");
  const { PERMISSIONS } = await import("../src/server/authz/permissions");
  const { AUDIT_ACTIONS } = await import("../src/server/audit/constants");

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

  // Track created test entry IDs for cleanup
  const createdEntryIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Enum and Constants Integrity
    // -------------------------------------------------------------------------
    console.log("\n--- 1. Enums and Constants Integrity ---");
    assert(
      TOURISM_CATEGORIES.length === 4 &&
        TOURISM_CATEGORIES.includes("ATTRACTIONS") &&
        TOURISM_CATEGORIES.includes("RESORTS") &&
        TOURISM_CATEGORIES.includes("CULTURE_AND_ARTS") &&
        TOURISM_CATEGORIES.includes("PRODUCTS"),
      "TOURISM_CATEGORIES defines exactly ATTRACTIONS, RESORTS, CULTURE_AND_ARTS, PRODUCTS"
    );

    assert(
      TOURISM_STATUSES.length === 3 &&
        TOURISM_STATUSES.includes("DRAFT") &&
        TOURISM_STATUSES.includes("PUBLISHED") &&
        TOURISM_STATUSES.includes("ARCHIVED"),
      "TOURISM_STATUSES defines exactly DRAFT, PUBLISHED, ARCHIVED"
    );

    assert(
      PERMISSIONS.TOURISM_VIEW === "tourism.view" &&
        PERMISSIONS.TOURISM_CREATE === "tourism.create" &&
        PERMISSIONS.TOURISM_UPDATE === "tourism.update" &&
        PERMISSIONS.TOURISM_PUBLISH === "tourism.publish" &&
        PERMISSIONS.TOURISM_ARCHIVE === "tourism.archive" &&
        PERMISSIONS.TOURISM_DELETE === "tourism.delete",
      "All 6 tourism permissions are declared with correct naming pattern"
    );

    assert(
      AUDIT_ACTIONS.TOURISM_CREATED === "TOURISM_CREATED" &&
        AUDIT_ACTIONS.TOURISM_UPDATED === "TOURISM_UPDATED" &&
        AUDIT_ACTIONS.TOURISM_PUBLISHED === "TOURISM_PUBLISHED" &&
        AUDIT_ACTIONS.TOURISM_ARCHIVED === "TOURISM_ARCHIVED" &&
        AUDIT_ACTIONS.TOURISM_DELETED === "tourism.delete" &&
        AUDIT_ACTIONS.TOURISM_IMAGE_REMOVED === "TOURISM_IMAGE_REMOVED",
      "All 6 tourism audit actions are declared with correct audit codes"
    );

    // -------------------------------------------------------------------------
    // 2. Slug Generation & Collision Resistance
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Slug Generation & Collision Resistance ---");
    const baseSlug = slugify("Liw-Liwa Surfing Beach & Eco-Camp!");
    assert(
      baseSlug === "liw-liwa-surfing-beach-eco-camp",
      "slugify properly normalizes text and removes non-word characters"
    );

    const uniqueSlug1 = await generateUniqueTourismSlug("Test Destination Unique Name 2026");
    assert(
      uniqueSlug1.startsWith("test-destination-unique-name-2026"),
      "generateUniqueTourismSlug produces clean valid slug"
    );

    // -------------------------------------------------------------------------
    // 3. HTML Sanitization
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Server-Side HTML Sanitization ---");
    const dirtyHtml = `
      <p>Welcome to San Felipe! <script>alert("XSS")</script></p>
      <a href="javascript:alert('steal')">Click here</a>
      <img src="https://example.com/pic.jpg" onerror="alert('hack')" />
      <div onclick="doBadThing()"><strong>Authentic culture</strong></div>
    `;
    const cleanHtml = sanitizeTourismHtml(dirtyHtml);
    assert(
      !cleanHtml.includes("<script>") && !cleanHtml.includes("alert("),
      "sanitizeTourismHtml strips dangerous <script> tags"
    );
    assert(
      !cleanHtml.includes("javascript:"),
      "sanitizeTourismHtml strips javascript: URL schemes"
    );
    assert(
      !cleanHtml.includes("onerror") && !cleanHtml.includes("onclick"),
      "sanitizeTourismHtml strips inline event handlers"
    );
    assert(
      cleanHtml.includes("<strong>Authentic culture</strong>") &&
        cleanHtml.includes("San Felipe!"),
      "sanitizeTourismHtml preserves valid text and safe formatting tags"
    );

    // -------------------------------------------------------------------------
    // 4. Zod Draft & Publish Validation
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Zod Draft & Publish Validation ---");
    const validDraft = tourismDraftSchema.safeParse({
      category: "ATTRACTIONS",
      title: "Century-Old Tree Park",
      summary: "A historic heritage tree park with centuries-old acacia canopies.",
      body: "<p>The Century-Old Tree Park provides natural shade and historical charm.</p>",
      location: "Barangay Sto. Niño, San Felipe",
      mapUrl: "https://maps.google.com/?q=San+Felipe",
      contactNumber: "0912-345-6789",
      email: "tourism@sanfelipe.gov.ph",
      websiteUrl: "https://sanfelipe.gov.ph",
      operatingHours: "Open Daily 6:00 AM - 6:00 PM",
    });
    assert(validDraft.success, "tourismDraftSchema accepts complete valid draft payload");

    const invalidEmailDraft = tourismDraftSchema.safeParse({
      category: "RESORTS",
      title: "Seaside Resort",
      email: "invalid-email-format",
    });
    assert(
      !invalidEmailDraft.success,
      "tourismDraftSchema rejects invalid email formats"
    );

    const invalidUrlDraft = tourismDraftSchema.safeParse({
      category: "PRODUCTS",
      title: "San Felipe Mangoes",
      websiteUrl: "not-a-valid-url",
    });
    assert(
      !invalidUrlDraft.success,
      "tourismDraftSchema rejects invalid web URLs"
    );

    const publishValidationSuccess = validateTourismForPublish({
      category: "ATTRACTIONS",
      title: "Century-Old Tree Park",
      summary: "A historic heritage tree park with centuries-old acacia canopies.",
      body: "<p>Detailed visitor guide and ecological information.</p>",
      location: "San Felipe, Zambales",
    });
    assert(
      publishValidationSuccess.valid,
      "validateTourismForPublish accepts valid publishable input"
    );

    const publishValidationMissingBody = validateTourismForPublish({
      category: "ATTRACTIONS",
      title: "Century-Old Tree Park",
      summary: "Short summary",
      body: "<p></p>", // Empty body
    });
    assert(
      !publishValidationMissingBody.valid,
      "validateTourismForPublish rejects entries with empty body"
    );

    // -------------------------------------------------------------------------
    // 5. Service & Database Integration (Local Dev DB)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Service & Database Integration ---");

    // Retrieve active user from database
    const testAdmin = await prisma.user.findFirst({
      where: { status: "ACTIVE" },
      include: {
        role: true,
      },
    });

    if (!testAdmin) {
      throw new Error("No active user found in local database for testing");
    }

    // Build session user with full permissions
    const sessionAdmin: SessionUser = {
      id: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      roleId: testAdmin.roleId,
      role: {
        id: testAdmin.role.id,
        name: testAdmin.role.name,
        slug: testAdmin.role.slug,
        isSystemScope: testAdmin.role.isSystemScope,
      },
      status: testAdmin.status,
      officeId: testAdmin.officeId,
      office: null,
      sessionId: "test-admin-session",
      isSystemScope: true, // Super admin scope inherits all permissions
      permissions: Object.values(PERMISSIONS),
    };

    // User without tourism permissions
    const unauthorizedUser: SessionUser = {
      id: testAdmin.id,
      email: "unauthorized@example.com",
      name: "Unauthorized Staff",
      roleId: testAdmin.roleId,
      role: {
        id: testAdmin.role.id,
        name: "Staff",
        slug: "staff",
        isSystemScope: false,
      },
      status: "ACTIVE",
      officeId: testAdmin.officeId,
      office: null,
      sessionId: "test-staff-session",
      isSystemScope: false,
      permissions: [],
    };

    // Test permission rejection on create
    let createDenied = false;
    try {
      await createTourismEntry(unauthorizedUser, {
        category: "ATTRACTIONS",
        title: "Unauthorized Entry",
        summary: "This should fail",
        body: "<p>Should fail</p>",
      });
    } catch (err) {
      if (err instanceof TourismError && err.statusCode === 403) {
        createDenied = true;
      }
    }
    assert(
      createDenied,
      "createTourismEntry rejects user lacking tourism.create permission (403)"
    );

    // Test successful creation of a draft entry
    const testTitle = `Test Attraction ${Date.now()}`;
    const created = await createTourismEntry(sessionAdmin, {
      category: "ATTRACTIONS",
      title: testTitle,
      summary: "A pristine coastal landscape for eco-tourists and outdoor travelers.",
      body: "<p>Detailed description of the attraction with visitor highlights.</p>",
      location: "Sitio Liwliwa, San Felipe",
      mapUrl: "https://maps.google.com/?q=Liwliwa",
      contactNumber: "0999-123-4567",
      email: "eco@sanfelipe.gov.ph",
      websiteUrl: "https://tourism.sanfelipe.gov.ph",
      operatingHours: "6:00 AM - 6:00 PM Daily",
    });
    createdEntryIds.push(created.id);

    assert(Boolean(created.id && created.slug), "createTourismEntry creates entry with generated slug");
    assert(created.status === "DRAFT", "createTourismEntry sets status to DRAFT by default");
    assert(
      created.category === "ATTRACTIONS",
      "createTourismEntry assigns correct category"
    );

    // Verify audit log for creation
    const createAudit = await prisma.auditLog.findFirst({
      where: {
        action: AUDIT_ACTIONS.TOURISM_CREATED,
        userId: sessionAdmin.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert(
      createAudit !== null && (createAudit.details as Record<string, unknown>)?.entryId === created.id,
      "createTourismEntry records audit log with action TOURISM_CREATED"
    );

    // Test getAdminTourismById
    const fetchedById = await getAdminTourismById(sessionAdmin, created.id);
    assert(
      fetchedById.id === created.id && fetchedById.title === testTitle,
      "getAdminTourismById retrieves draft entry by ID for CMS editing"
    );

    // Verify admin list returns the entry
    const adminList = await getAdminTourismList(sessionAdmin, {
      category: "ATTRACTIONS",
      search: testTitle,
    });
    assert(
      adminList.entries.some((e) => e.id === created.id),
      "getAdminTourismList returns draft entry under category filter"
    );

    // Verify public query DOES NOT return the draft entry
    const publicListBeforePublish = await getPublicPublishedTourismByCategory("ATTRACTIONS");
    assert(
      !publicListBeforePublish.entries.some((e) => e.id === created.id),
      "getPublicPublishedTourismByCategory strictly excludes DRAFT entries"
    );

    const publicSlugBeforePublish = await getPublicPublishedTourismBySlug(
      "ATTRACTIONS",
      created.slug
    );
    assert(
      publicSlugBeforePublish === null,
      "getPublicPublishedTourismBySlug strictly returns null for DRAFT entries"
    );

    // Test update with optimistic concurrency
    const updatedTitle = `${testTitle} (Updated)`;
    const updated = await updateTourismEntry(sessionAdmin, created.id, {
      category: "ATTRACTIONS",
      title: updatedTitle,
      summary: "Updated summary for the coastal eco-tourism spot.",
      body: "<p>Updated body with extensive travel guidelines.</p>",
      expectedUpdatedAt: created.updatedAt.toISOString(),
    });
    assert(
      updated.title === updatedTitle,
      "updateTourismEntry successfully updates entry title and metadata"
    );

    // Test optimistic concurrency conflict (stale updatedAt)
    let conflictOccurred = false;
    try {
      await updateTourismEntry(sessionAdmin, created.id, {
        category: "ATTRACTIONS",
        title: "Stale Update Attempt",
        summary: "This should throw a 409 conflict",
        body: "<p>Conflict attempt body</p>",
        expectedUpdatedAt: created.updatedAt.toISOString(), // stale timestamp
      });
    } catch (err) {
      if (err instanceof TourismError && err.statusCode === 409) {
        conflictOccurred = true;
      }
    }
    assert(
      conflictOccurred,
      "updateTourismEntry detects stale expectedUpdatedAt and throws 409 conflict"
    );

    // Test featured image update & removal service
    await prisma.tourismEntry.update({
      where: { id: created.id },
      data: {
        featuredImagePublicId: "san-felipe-lgu/tourism/2026/test_asset_123",
        featuredImageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        featuredImageAlt: "Scenic view",
      },
    });
    const removeImgResult = await removeTourismFeaturedImage(sessionAdmin, created.id);
    assert(removeImgResult.success, "removeTourismFeaturedImage returns success");

    const entryAfterImgRemove = await prisma.tourismEntry.findUniqueOrThrow({
      where: { id: created.id },
    });
    assert(
      entryAfterImgRemove.featuredImageUrl === null && entryAfterImgRemove.featuredImagePublicId === null,
      "removeTourismFeaturedImage clears featured image fields from database"
    );

    // Test publish entry
    const published = await publishTourismEntry(
      sessionAdmin,
      created.id,
      entryAfterImgRemove.updatedAt.toISOString()
    );
    assert(
      published.status === "PUBLISHED" && published.publishedAt !== null,
      "publishTourismEntry sets status to PUBLISHED and records publishedAt date"
    );

    // Verify audit log for publishing
    const publishAudit = await prisma.auditLog.findFirst({
      where: {
        action: AUDIT_ACTIONS.TOURISM_PUBLISHED,
        userId: sessionAdmin.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert(
      publishAudit !== null && (publishAudit.details as Record<string, unknown>)?.entryId === created.id,
      "publishTourismEntry records audit log with action TOURISM_PUBLISHED"
    );

    // Verify public queries NOW return the published entry
    const publicListAfterPublish = await getPublicPublishedTourismByCategory("ATTRACTIONS");
    assert(
      publicListAfterPublish.entries.some((e) => e.id === created.id),
      "getPublicPublishedTourismByCategory includes published entry"
    );

    const publicSlugAfterPublish = await getPublicPublishedTourismBySlug(
      "ATTRACTIONS",
      published.slug
    );
    assert(
      publicSlugAfterPublish !== null && publicSlugAfterPublish.id === created.id,
      "getPublicPublishedTourismBySlug retrieves published entry by slug and category"
    );

    // Test getPublicOtherTourism
    const otherTourism = await getPublicOtherTourism("ATTRACTIONS", published.slug, 3);
    assert(
      Array.isArray(otherTourism) && !otherTourism.some((e) => e.slug === published.slug),
      "getPublicOtherTourism excludes the active slug from the related sidebar results"
    );

    // Test Category Isolation: slug query with WRONG category returns null (triggers 404 on mismatched route)
    const mismatchedCategorySlug = await getPublicPublishedTourismBySlug(
      "RESORTS",
      published.slug
    );
    assert(
      mismatchedCategorySlug === null,
      "getPublicPublishedTourismBySlug returns null when category does not match URL category"
    );

    // Test Archive entry
    const archived = await archiveTourismEntry(
      sessionAdmin,
      created.id,
      published.updatedAt.toISOString()
    );
    assert(
      archived.status === "ARCHIVED",
      "archiveTourismEntry sets status to ARCHIVED"
    );

    // Verify audit log for archiving
    const archiveAudit = await prisma.auditLog.findFirst({
      where: {
        action: AUDIT_ACTIONS.TOURISM_ARCHIVED,
        userId: sessionAdmin.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert(
      archiveAudit !== null && (archiveAudit.details as Record<string, unknown>)?.entryId === created.id,
      "archiveTourismEntry records audit log with action TOURISM_ARCHIVED"
    );

    // Verify public queries DO NOT return the archived entry
    const publicListAfterArchive = await getPublicPublishedTourismByCategory("ATTRACTIONS");
    assert(
      !publicListAfterArchive.entries.some((e) => e.id === created.id),
      "getPublicPublishedTourismByCategory strictly excludes ARCHIVED entries"
    );

    const publicSlugAfterArchive = await getPublicPublishedTourismBySlug(
      "ATTRACTIONS",
      published.slug
    );
    assert(
      publicSlugAfterArchive === null,
      "getPublicPublishedTourismBySlug strictly returns null for ARCHIVED entries"
    );

    // Test Delete entry
    const deleteResult = await deleteTourismEntry(sessionAdmin, created.id);
    assert(deleteResult.success, "deleteTourismEntry successfully deletes entry");

    // Remove from tracking array since it is deleted
    const idx = createdEntryIds.indexOf(created.id);
    if (idx !== -1) createdEntryIds.splice(idx, 1);

    // Verify audit log for deletion
    const deleteAudit = await prisma.auditLog.findFirst({
      where: {
        action: AUDIT_ACTIONS.TOURISM_DELETED,
        userId: sessionAdmin.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert(
      deleteAudit !== null && (deleteAudit.details as Record<string, unknown>)?.entryId === created.id,
      "deleteTourismEntry records audit log with action tourism.delete"
    );

    // Verify database record is gone
    const entryInDb = await prisma.tourismEntry.findUnique({
      where: { id: created.id },
    });
    assert(entryInDb === null, "Tourism entry is completely removed from database");
  } catch (error) {
    console.error("\nUnexpected error during test execution:", error);
    failed++;
  } finally {
    // Cleanup any lingering test entries
    if (createdEntryIds.length > 0) {
      await prisma.tourismEntry.deleteMany({
        where: { id: { in: createdEntryIds } },
      });
      console.log(`Cleaned up ${createdEntryIds.length} test entry records.`);
    }
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  console.log(`PHASE 23 TOURISM TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase23TourismTestSuite().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
