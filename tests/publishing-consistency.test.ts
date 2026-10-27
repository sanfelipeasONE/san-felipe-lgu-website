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

async function runPublishingConsistencyTestSuite() {
  console.log("=======================================================");
  console.log("SAN FELIPE LGU PUBLISHING CONSISTENCY TEST SUITE (PHASE 16)");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const { PERMISSIONS } = await import("../src/server/authz/permissions");
  const { hasPermission, isSystemScoped, canManageOfficeContent } = await import("../src/lib/authz/scope");
  const {
    createNewsArticle,
    updateNewsArticle,
    publishNewsArticle,
    archiveNewsArticle,
    getPublicPublishedNews,
    getPublicPublishedNewsBySlug,
    NewsError,
  } = await import("../src/server/news/service");
  const {
    createDocument,
    updateDocument,
    publishDocument,
    archiveDocument,
    getPublishedDocuments,
    DocumentError,
  } = await import("../src/server/documents/service");
  const {
    createJobOpportunity,
    updateJobOpportunity,
    publishJobOpportunity,
    archiveJobOpportunity,
    getPublishedJobOpportunities,
    JobError,
  } = await import("../src/server/jobs/service");
  const {
    updateServicePage,
    publishServicePage,
    unpublishServicePage,
    getPublishedServicePage,
    ServiceError,
  } = await import("../src/server/services/service");

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

  // ---------------------------------------------------------------------------
  // 1. Canonical Permission Vocabulary & Syntax Invariants
  // ---------------------------------------------------------------------------
  console.log("1. Canonical Permission Vocabulary & Syntax Invariants");

  const permissionValues = Object.values(PERMISSIONS);

  assert(
    permissionValues.every((val) => typeof val === "string" && val.includes(".")),
    "All permission codes strictly adhere to dot notation (module.action)"
  );

  assert(
    permissionValues.every((val) => !val.includes(":")),
    "Zero permission codes contain colon syntax (no colon-style aliases)"
  );

  // Expected canonical permissions for all four content modules
  assert(PERMISSIONS.POSTS_VIEW === "posts.view", "Canonical POSTS_VIEW is 'posts.view'");
  assert(PERMISSIONS.POSTS_CREATE === "posts.create", "Canonical POSTS_CREATE is 'posts.create'");
  assert(PERMISSIONS.POSTS_UPDATE === "posts.update", "Canonical POSTS_UPDATE is 'posts.update'");
  assert(PERMISSIONS.POSTS_PUBLISH === "posts.publish", "Canonical POSTS_PUBLISH is 'posts.publish'");
  assert(PERMISSIONS.POSTS_ARCHIVE === "posts.archive", "Canonical POSTS_ARCHIVE is 'posts.archive'");

  assert(PERMISSIONS.SERVICES_VIEW === "services.view", "Canonical SERVICES_VIEW is 'services.view'");
  assert(PERMISSIONS.SERVICES_UPDATE === "services.update", "Canonical SERVICES_UPDATE is 'services.update'");
  assert(PERMISSIONS.SERVICES_PUBLISH === "services.publish", "Canonical SERVICES_PUBLISH is 'services.publish'");

  assert(PERMISSIONS.DOCUMENTS_VIEW === "documents.view", "Canonical DOCUMENTS_VIEW is 'documents.view'");
  assert(PERMISSIONS.DOCUMENTS_CREATE === "documents.create", "Canonical DOCUMENTS_CREATE is 'documents.create'");
  assert(PERMISSIONS.DOCUMENTS_UPDATE === "documents.update", "Canonical DOCUMENTS_UPDATE is 'documents.update'");
  assert(PERMISSIONS.DOCUMENTS_PUBLISH === "documents.publish", "Canonical DOCUMENTS_PUBLISH is 'documents.publish'");
  assert(PERMISSIONS.DOCUMENTS_ARCHIVE === "documents.archive", "Canonical DOCUMENTS_ARCHIVE is 'documents.archive'");

  assert(PERMISSIONS.JOBS_VIEW === "jobs.view", "Canonical JOBS_VIEW is 'jobs.view'");
  assert(PERMISSIONS.JOBS_CREATE === "jobs.create", "Canonical JOBS_CREATE is 'jobs.create'");
  assert(PERMISSIONS.JOBS_UPDATE === "jobs.update", "Canonical JOBS_UPDATE is 'jobs.update'");
  assert(PERMISSIONS.JOBS_PUBLISH === "jobs.publish", "Canonical JOBS_PUBLISH is 'jobs.publish'");
  assert(PERMISSIONS.JOBS_ARCHIVE === "jobs.archive", "Canonical JOBS_ARCHIVE is 'jobs.archive'");

  // ---------------------------------------------------------------------------
  // 2. Architectural Boundary: Non-Existence of Approval States & Review Queues
  // ---------------------------------------------------------------------------
  console.log("\n2. Architectural Boundary: No Approval Workflows or States");

  const { NewsStatus, ServiceStatus, DocumentStatus, JobOpportunityStatus } = await import("@prisma/client");

  const newsStatusValues = Object.values(NewsStatus) as string[];
  assert(
    !newsStatusValues.includes("PENDING_REVIEW") &&
    !newsStatusValues.includes("SUBMITTED") &&
    !newsStatusValues.includes("APPROVED") &&
    !newsStatusValues.includes("REJECTED"),
    "NewsStatus contains ZERO approval-workflow states"
  );
  assert(
    newsStatusValues.length === 3 &&
    newsStatusValues.includes("DRAFT") &&
    newsStatusValues.includes("PUBLISHED") &&
    newsStatusValues.includes("ARCHIVED"),
    "NewsStatus contains exactly: DRAFT, PUBLISHED, ARCHIVED"
  );

  const serviceStatusValues = Object.values(ServiceStatus);
  assert(
    serviceStatusValues.length === 2 &&
    serviceStatusValues.includes("DRAFT") &&
    serviceStatusValues.includes("PUBLISHED"),
    "ServiceStatus contains exactly: DRAFT, PUBLISHED (no approval queue)"
  );

  const documentStatusValues = Object.values(DocumentStatus);
  assert(
    documentStatusValues.length === 3 &&
    documentStatusValues.includes("DRAFT") &&
    documentStatusValues.includes("PUBLISHED") &&
    documentStatusValues.includes("ARCHIVED"),
    "DocumentStatus contains exactly: DRAFT, PUBLISHED, ARCHIVED (direct-publish)"
  );

  const jobStatusValues = Object.values(JobOpportunityStatus);
  assert(
    jobStatusValues.length === 3 &&
    jobStatusValues.includes("DRAFT") &&
    jobStatusValues.includes("PUBLISHED") &&
    jobStatusValues.includes("ARCHIVED"),
    "JobOpportunityStatus contains exactly: DRAFT, PUBLISHED, ARCHIVED (direct-publish)"
  );

  // Check that no review/approval models exist on prisma client
  const clientKeys = Object.keys(prisma);
  assert(!clientKeys.includes("approvalQueue"), "Prisma does not contain an ApprovalQueue model");
  assert(!clientKeys.includes("review"), "Prisma does not contain a Review model");
  assert(!clientKeys.includes("submission"), "Prisma does not contain a Submission model");
  assert(!clientKeys.includes("applicant"), "Prisma does not contain an Applicant model");
  assert(!clientKeys.includes("application"), "Prisma does not contain an Application model");

  // ---------------------------------------------------------------------------
  // Setup Test Fixtures in Database
  // ---------------------------------------------------------------------------
  const officeA = await prisma.office.upsert({
    where: { slug: "test-cons-office-a" },
    update: { name: "Audit Test Office A", status: "ACTIVE" },
    create: {
      name: "Audit Test Office A",
      shortName: "ATOA",
      slug: "test-cons-office-a",
      description: "Audit test office A",
      status: "ACTIVE",
    },
  });

  const officeB = await prisma.office.upsert({
    where: { slug: "test-cons-office-b" },
    update: { name: "Audit Test Office B", status: "ACTIVE" },
    create: {
      name: "Audit Test Office B",
      shortName: "ATOB",
      slug: "test-cons-office-b",
      description: "Audit test office B",
      status: "ACTIVE",
    },
  });

  const inactiveOffice = await prisma.office.upsert({
    where: { slug: "test-cons-office-inactive" },
    update: { name: "Audit Inactive Office", status: "INACTIVE" },
    create: {
      name: "Audit Inactive Office",
      shortName: "AIO",
      slug: "test-cons-office-inactive",
      description: "Audit test inactive office",
      status: "INACTIVE",
    },
  });

  // Test Roles
  const staffRole = await prisma.role.upsert({
    where: { slug: "test-cons-staff" },
    update: { name: "Audit Staff Role", isSystemScope: false },
    create: {
      name: "Audit Staff Role",
      slug: "test-cons-staff",
      description: "Audit staff role for testing",
      isSystemScope: false,
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { slug: "test-cons-super-admin" },
    update: { name: "Audit Super Admin Role", isSystemScope: true },
    create: {
      name: "Audit Super Admin Role",
      slug: "test-cons-super-admin",
      description: "Audit super admin role for testing",
      isSystemScope: true,
    },
  });

  // Test Users
  const userStaffA = await prisma.user.upsert({
    where: { email: "staff-a@audit.sanfelipe.gov.ph" },
    update: { status: "ACTIVE", officeId: officeA.id, roleId: staffRole.id },
    create: {
      email: "staff-a@audit.sanfelipe.gov.ph",
      name: "Staff User Office A",
      passwordHash: "dummy-hash",
      status: "ACTIVE",
      officeId: officeA.id,
      roleId: staffRole.id,
    },
  });

  const userStaffB = await prisma.user.upsert({
    where: { email: "staff-b@audit.sanfelipe.gov.ph" },
    update: { status: "ACTIVE", officeId: officeB.id, roleId: staffRole.id },
    create: {
      email: "staff-b@audit.sanfelipe.gov.ph",
      name: "Staff User Office B",
      passwordHash: "dummy-hash",
      status: "ACTIVE",
      officeId: officeB.id,
      roleId: staffRole.id,
    },
  });

  const userSuperAdmin = await prisma.user.upsert({
    where: { email: "super-admin@audit.sanfelipe.gov.ph" },
    update: { status: "ACTIVE", roleId: superAdminRole.id },
    create: {
      email: "super-admin@audit.sanfelipe.gov.ph",
      name: "Super Admin Audit",
      passwordHash: "dummy-hash",
      status: "ACTIVE",
      roleId: superAdminRole.id,
    },
  });

  const allPermissionsList = [
    "posts.view", "posts.create", "posts.update", "posts.publish", "posts.archive",
    "services.view", "services.update", "services.publish",
    "documents.view", "documents.create", "documents.update", "documents.publish", "documents.archive",
    "jobs.view", "jobs.create", "jobs.update", "jobs.publish", "jobs.archive",
  ];

  const sessionStaffA: SessionUser = {
    id: userStaffA.id,
    name: userStaffA.name,
    email: userStaffA.email,
    status: "ACTIVE",
    officeId: officeA.id,
    office: { id: officeA.id, name: officeA.name, shortName: officeA.shortName, slug: officeA.slug },
    roleId: staffRole.id,
    role: { id: staffRole.id, name: staffRole.name, slug: staffRole.slug, isSystemScope: false },
    isSystemScope: false,
    permissions: allPermissionsList,
    sessionId: "sess-staff-a",
  };

  const sessionStaffB: SessionUser = {
    id: userStaffB.id,
    name: userStaffB.name,
    email: userStaffB.email,
    status: "ACTIVE",
    officeId: officeB.id,
    office: { id: officeB.id, name: officeB.name, shortName: officeB.shortName, slug: officeB.slug },
    roleId: staffRole.id,
    role: { id: staffRole.id, name: staffRole.name, slug: staffRole.slug, isSystemScope: false },
    isSystemScope: false,
    permissions: allPermissionsList,
    sessionId: "sess-staff-b",
  };

  const sessionSuperAdmin: SessionUser = {
    id: userSuperAdmin.id,
    name: userSuperAdmin.name,
    email: userSuperAdmin.email,
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: superAdminRole.id,
    role: { id: superAdminRole.id, name: superAdminRole.name, slug: superAdminRole.slug, isSystemScope: true },
    isSystemScope: true,
    permissions: allPermissionsList,
    sessionId: "sess-super-admin",
  };

  // Scope & Permission helper verification
  assert(hasPermission(sessionStaffA, "posts.publish"), "hasPermission verifies granted permission on session");
  assert(isSystemScoped(sessionSuperAdmin), "isSystemScoped identifies system-scoped administrator");
  assert(!isSystemScoped(sessionStaffA), "isSystemScoped identifies office-scoped staff");
  assert(canManageOfficeContent(sessionStaffA, officeA.id, "posts.publish"), "canManageOfficeContent allows own-office publication");
  assert(!canManageOfficeContent(sessionStaffA, officeB.id, "posts.publish"), "canManageOfficeContent denies cross-office publication");

  // ---------------------------------------------------------------------------
  // 3. Direct Staff Publishing Invariant (All 4 Modules)
  // ---------------------------------------------------------------------------
  console.log("\n3. Direct Staff Publishing Invariant (No Approval Queue)");

  // 3A. News: Staff directly publishes own-office News
  const newsDraft = await createNewsArticle(sessionStaffA, {
    title: "Audit Direct Publish News",
    excerpt: "Direct publication test excerpt",
    body: "<p>Direct publication test body content for municipal audit.</p>",
    type: "news",
    category: "GENERAL",
  });
  assert(newsDraft.status === "DRAFT", "News article initially created as DRAFT");

  const newsPublished = await publishNewsArticle(sessionStaffA, newsDraft.id);
  assert(newsPublished.status === "PUBLISHED", "Staff with posts.publish directly publishes own-office News");
  assert(Boolean(newsPublished.publishedAt), "Directly published News records publishedAt timestamp");

  // 3B. Documents: Staff directly publishes own-office Document
  const docBuffer = Buffer.from("%PDF-1.4 Mock PDF content for publishing audit test");
  const docDraft = await createDocument(sessionStaffA, {
    input: {
      title: "Audit Direct Publish Document",
      description: "Direct document publication description",
      category: "FORMS",
    },
    fileBuffer: docBuffer,
    filename: "audit-direct-pub.pdf",
    mimeType: "application/pdf",
    size: docBuffer.length,
  });
  assert(docDraft.status === "DRAFT", "Document initially created as DRAFT");

  const docPublished = await publishDocument(sessionStaffA, docDraft.id);
  assert(docPublished.status === "PUBLISHED", "Staff with documents.publish directly publishes own-office Document");
  assert(Boolean(docPublished.publishedAt), "Directly published Document records publishedAt timestamp");

  // 3C. Jobs: Staff directly publishes own-office Vacancy
  const jobDraft = await createJobOpportunity(sessionStaffA, {
    title: "Audit Direct Publish Position",
    itemNumber: "AUDIT-01",
    employmentType: "Permanent",
    salaryGrade: "SG 12",
    monthlySalary: "₱29,165.00",
    description: "Audit position description",
    postingDate: "2026-10-15",
    closingDate: "2026-11-15",
    attachmentDocumentId: docPublished.id,
  });
  assert(jobDraft.status === "DRAFT", "Job Opportunity initially created as DRAFT");

  const jobPublished = await publishJobOpportunity(sessionStaffA, jobDraft.id);
  assert(jobPublished.status === "PUBLISHED", "Staff with jobs.publish directly publishes own-office Vacancy");
  assert(Boolean(jobPublished.publishedAt), "Directly published Vacancy records publishedAt timestamp");

  // 3D. Services: Authorized OFFICE user directly publishes assigned own-office ServicePage
  // Temporarily assign citizens-charter to officeA for this test
  await prisma.servicePage.update({
    where: { serviceKey: "citizens-charter" },
    data: {
      officeId: officeA.id,
      title: "Citizen's Charter - Audit Test",
      description: "Official frontline service standards description",
    },
  });
  await prisma.serviceSection.create({
    data: {
      servicePageId: (await prisma.servicePage.findUniqueOrThrow({ where: { serviceKey: "citizens-charter" } })).id,
      title: "Service Procedure Section",
      content: "<p>Step-by-step procedure content.</p>",
      sortOrder: 0,
    },
  });

  const servicePublished = await publishServicePage(sessionStaffA, "citizens-charter");
  assert(servicePublished.status === "PUBLISHED", "Staff with services.publish directly publishes assigned own-office ServicePage");
  assert(Boolean(servicePublished.publishedAt), "Directly published ServicePage records publishedAt timestamp");

  // Revert citizens-charter to unassigned DRAFT baseline
  await unpublishServicePage(sessionStaffA, "citizens-charter");
  await prisma.serviceSection.deleteMany({
    where: { servicePage: { serviceKey: "citizens-charter" } },
  });
  await prisma.servicePage.update({
    where: { serviceKey: "citizens-charter" },
    data: { officeId: null, description: null, status: "DRAFT" },
  });

  // ---------------------------------------------------------------------------
  // 4. Cross-Office Denial Invariants (All 4 Modules)
  // ---------------------------------------------------------------------------
  console.log("\n4. Cross-Office Denial Invariants");

  // 4A. News cross-office denial
  let newsCrossOfficeFailed = false;
  try {
    await updateNewsArticle(sessionStaffB, newsDraft.id, {
      title: "Illicit cross-office update",
      excerpt: "Illicit excerpt",
      body: "<p>Hacked</p>",
      type: "news",
      category: "GENERAL",
    });
  } catch (err) {
    if (err instanceof NewsError && err.statusCode === 403) {
      newsCrossOfficeFailed = true;
    }
  }
  assert(newsCrossOfficeFailed, "Cross-office News mutation strictly rejected with 403");

  // 4B. Documents cross-office denial
  let docCrossOfficeFailed = false;
  try {
    await updateDocument(sessionStaffB, docDraft.id, {
      input: { title: "Illicit cross-office doc update" },
    });
  } catch (err) {
    if (err instanceof DocumentError && err.statusCode === 403) {
      docCrossOfficeFailed = true;
    }
  }
  assert(docCrossOfficeFailed, "Cross-office Document mutation strictly rejected with 403");

  // 4C. Jobs cross-office denial
  let jobCrossOfficeFailed = false;
  try {
    await updateJobOpportunity(sessionStaffB, jobDraft.id, {
      title: "Illicit cross-office job update",
    });
  } catch (err) {
    if (err instanceof JobError && err.statusCode === 403) {
      jobCrossOfficeFailed = true;
    }
  }
  assert(jobCrossOfficeFailed, "Cross-office Vacancy mutation strictly rejected with 403");

  // ---------------------------------------------------------------------------
  // 5. Special Services Ownership: Unassigned Pages are SYSTEM-Only
  // ---------------------------------------------------------------------------
  console.log("\n5. Special Services Ownership: Unassigned Pages (officeId === null)");

  let serviceOfficeClaimFailed = false;
  try {
    // Attempt to update unassigned business-permits as office-scoped staff
    await updateServicePage(sessionStaffA, "business-permits", {
      title: "Illicit Office Claim on Unassigned Page",
      description: "Description",
      sections: [],
    });
  } catch (err) {
    if (err instanceof ServiceError && err.statusCode === 403) {
      serviceOfficeClaimFailed = true;
    }
  }
  assert(serviceOfficeClaimFailed, "OFFICE user cannot claim or update unassigned ServicePage (rejected with 403)");

  let serviceSuperAdminUpdateSucceeded = false;
  try {
    // SYSTEM scoped user CAN manage unassigned page
    await updateServicePage(sessionSuperAdmin, "business-permits", {
      title: "Business Permits & Licensing System",
      description: null,
      sections: [],
    });
    serviceSuperAdminUpdateSucceeded = true;
  } catch {
    serviceSuperAdminUpdateSucceeded = false;
  }
  assert(serviceSuperAdminUpdateSucceeded, "SYSTEM user can manage unassigned ServicePage");

  // ---------------------------------------------------------------------------
  // 6. Public Lifecycle Isolation (Drafts & Archived Hidden)
  // ---------------------------------------------------------------------------
  console.log("\n6. Public Lifecycle Isolation (Drafts & Archived Hidden)");

  // Create isolated draft records
  const isolatedNewsDraft = await createNewsArticle(sessionStaffA, {
    title: "Isolated Secret News Draft",
    excerpt: "Secret excerpt",
    body: "<p>Secret draft content</p>",
    type: "news",
    category: "GENERAL",
  });
  const publicNewsBySlug = await getPublicPublishedNewsBySlug(isolatedNewsDraft.slug);
  assert(publicNewsBySlug === null, "Public News query by slug returns null for DRAFT article");

  const publicNewsArchive = await getPublicPublishedNews();
  assert(
    !publicNewsArchive.articles.some((a) => a.id === isolatedNewsDraft.id),
    "Public News listing strictly excludes DRAFT articles"
  );

  const isolatedDocDraft = await createDocument(sessionStaffA, {
    input: { title: "Isolated Secret Document Draft" },
    fileBuffer: docBuffer,
    filename: "secret-draft.pdf",
    mimeType: "application/pdf",
    size: docBuffer.length,
  });
  const publicDocs = await getPublishedDocuments();
  assert(
    !publicDocs.some((d) => d.id === isolatedDocDraft.id),
    "Public Downloadable Forms listing strictly excludes DRAFT documents"
  );

  const isolatedJobDraft = await createJobOpportunity(sessionStaffA, {
    title: "Isolated Secret Job Draft",
  });
  const publicJobs = await getPublishedJobOpportunities();
  assert(
    !publicJobs.some((j) => j.id === isolatedJobDraft.id),
    "Public Job Opportunities listing strictly excludes DRAFT vacancies"
  );

  const publicServicePage = await getPublishedServicePage("downloadable-forms");
  assert(publicServicePage === null, "Public Service Page query returns null for DRAFT service page");

  // Archive records and verify public exclusion
  await archiveNewsArticle(sessionStaffA, newsPublished.id);
  const archivedNewsBySlug = await getPublicPublishedNewsBySlug(newsPublished.slug);
  assert(archivedNewsBySlug === null, "Public News query by slug returns null for ARCHIVED article");

  await archiveDocument(sessionStaffA, docPublished.id);
  const publicDocsAfterArchive = await getPublishedDocuments();
  assert(
    !publicDocsAfterArchive.some((d) => d.id === docPublished.id),
    "Public Downloadable Forms listing strictly excludes ARCHIVED documents"
  );

  await archiveJobOpportunity(sessionStaffA, jobPublished.id);
  const publicJobsAfterArchive = await getPublishedJobOpportunities();
  assert(
    !publicJobsAfterArchive.some((j) => j.id === jobPublished.id),
    "Public Job Opportunities listing strictly excludes ARCHIVED vacancies"
  );

  // ---------------------------------------------------------------------------
  // 7. Active Office Enforcement
  // ---------------------------------------------------------------------------
  console.log("\n7. Active Office Enforcement");

  let newsInactiveOfficeFailed = false;
  try {
    const sessionInactiveStaff: SessionUser = {
      ...sessionStaffA,
      officeId: inactiveOffice.id,
      office: inactiveOffice,
    };
    await createNewsArticle(sessionInactiveStaff, {
      title: "News for Inactive Office",
      excerpt: "Excerpt",
      body: "<p>Content</p>",
      type: "news",
      category: "GENERAL",
    });
  } catch (err) {
    if (err instanceof NewsError && err.statusCode === 400) {
      newsInactiveOfficeFailed = true;
    }
  }
  assert(newsInactiveOfficeFailed, "News creation for INACTIVE office is rejected with 400");

  let docInactiveOfficeFailed = false;
  try {
    await createDocument(sessionSuperAdmin, {
      input: {
        title: "Document for Inactive Office",
        officeId: inactiveOffice.id,
      },
      fileBuffer: docBuffer,
      filename: "inactive-doc.pdf",
      mimeType: "application/pdf",
      size: docBuffer.length,
    });
  } catch (err) {
    if (err instanceof DocumentError && err.statusCode === 400) {
      docInactiveOfficeFailed = true;
    }
  }
  assert(docInactiveOfficeFailed, "Document creation for INACTIVE office is rejected with 400");

  let jobInactiveOfficeFailed = false;
  try {
    await createJobOpportunity(sessionSuperAdmin, {
      title: "Job for Inactive Office",
      officeId: inactiveOffice.id,
    });
  } catch (err) {
    if (err instanceof JobError && err.statusCode === 400) {
      jobInactiveOfficeFailed = true;
    }
  }
  assert(jobInactiveOfficeFailed, "Job Opportunity creation for INACTIVE office is rejected with 400");

  // ---------------------------------------------------------------------------
  // 8. Optimistic Concurrency Invariants
  // ---------------------------------------------------------------------------
  console.log("\n8. Optimistic Concurrency Invariants");

  const concurrencyDoc = await createDocument(sessionStaffA, {
    input: { title: "Concurrency Test Document" },
    fileBuffer: docBuffer,
    filename: "concurrency.pdf",
    mimeType: "application/pdf",
    size: docBuffer.length,
  });

  let docStaleWriteFailed = false;
  try {
    await updateDocument(sessionStaffA, concurrencyDoc.id, {
      input: {
        title: "Updated Title",
        expectedUpdatedAt: new Date(Date.now() - 60000).toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof DocumentError && err.statusCode === 409) {
      docStaleWriteFailed = true;
    }
  }
  assert(docStaleWriteFailed, "Document update with stale expectedUpdatedAt throws 409 Conflict");

  const concurrencyJob = await createJobOpportunity(sessionStaffA, {
    title: "Concurrency Test Job",
  });

  let jobStaleWriteFailed = false;
  try {
    await updateJobOpportunity(sessionStaffA, concurrencyJob.id, {
      title: "Updated Title",
      expectedUpdatedAt: new Date(Date.now() - 60000).toISOString(),
    });
  } catch (err) {
    if (err instanceof JobError && err.statusCode === 409) {
      jobStaleWriteFailed = true;
    }
  }
  assert(jobStaleWriteFailed, "Job update with stale expectedUpdatedAt throws 409 Conflict");

  // ---------------------------------------------------------------------------
  // 9. Published Edit Semantics: Editing PUBLISHED content preserves PUBLISHED
  // ---------------------------------------------------------------------------
  console.log("\n9. Published Edit Semantics");

  // Publish a document then update metadata
  await publishDocument(sessionStaffA, concurrencyDoc.id);
  const updatedPublishedDoc = await updateDocument(sessionStaffA, concurrencyDoc.id, {
    input: { title: "Updated Concurrency Document Title" },
  });
  assert(updatedPublishedDoc.status === "PUBLISHED", "Editing a PUBLISHED document preserves PUBLISHED status");

  // Publish a job then update metadata
  await publishJobOpportunity(sessionStaffA, concurrencyJob.id);
  const updatedPublishedJob = await updateJobOpportunity(sessionStaffA, concurrencyJob.id, {
    title: "Updated Concurrency Job Title",
  });
  assert(updatedPublishedJob.status === "PUBLISHED", "Editing a PUBLISHED job preserves PUBLISHED status");

  // ---------------------------------------------------------------------------
  // Cleanup Test Records
  // ---------------------------------------------------------------------------
  console.log("\nCleaning up test records...");
  await prisma.newsArticle.deleteMany({
    where: {
      OR: [
        { officeId: { in: [officeA.id, officeB.id, inactiveOffice.id] } },
        { createdById: { in: [userStaffA.id, userStaffB.id, userSuperAdmin.id] } },
      ],
    },
  });
  await prisma.jobOpportunity.deleteMany({
    where: { officeId: { in: [officeA.id, officeB.id, inactiveOffice.id] } },
  });
  await prisma.document.deleteMany({
    where: { officeId: { in: [officeA.id, officeB.id, inactiveOffice.id] } },
  });
  await prisma.auditLog.deleteMany({
    where: { userId: { in: [userStaffA.id, userStaffB.id, userSuperAdmin.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [userStaffA.id, userStaffB.id, userSuperAdmin.id] } },
  });
  await prisma.office.deleteMany({
    where: { id: { in: [officeA.id, officeB.id, inactiveOffice.id] } },
  });
  await prisma.role.deleteMany({
    where: { id: { in: [staffRole.id, superAdminRole.id] } },
  });

  console.log("Cleanup complete.");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`PUBLISHING CONSISTENCY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPublishingConsistencyTestSuite().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
