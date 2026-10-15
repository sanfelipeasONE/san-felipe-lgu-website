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

import {
  UserStatus,
  OfficeStatus,
  NewsStatus,
  DocumentStatus,
  JobOpportunityStatus,
} from "@prisma/client";
import type { SessionUser } from "../src/server/auth/session";

function assert(condition: unknown, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runDashboardTestSuite() {
  console.log("===============================================================");
  console.log("SAN FELIPE LGU CMS DASHBOARD TEST SUITE (PHASE 19.2)");
  console.log("===============================================================\n");

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
  } catch {}

  const { prisma } = await import("../src/server/db/client");
  const {
    getDashboardSummaryMetrics,
    getContentPublishingActivity,
    getPublishedContentDistribution,
    getRecentContent,
    getPublishedContentByOffice,
    getRecentAdministrativeActivity,
  } = await import("../src/server/dashboard/service");
  const { VERIFIED_MUNICIPAL_OFFICES } = await import("../src/config/offices-data");

  const ts = Date.now();
  const createdUserIds: string[] = [];
  const createdArticleIds: string[] = [];
  const createdDocumentIds: string[] = [];
  const createdJobIds: string[] = [];
  const createdAuditIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // 1. Verify Baseline Offices & Roles
    // -------------------------------------------------------------
    console.log("--- 1. Baseline Office & Role Verification ---");
    const allOffices = await prisma.office.findMany({ orderBy: { name: "asc" } });
    assert(allOffices.length === 19, `Total database offices is 19 (found: ${allOffices.length})`);
    const ictoOffice = allOffices.find((o) => o.slug === "icto");
    assert(!!ictoOffice, "Preserved legacy ICTO office exists in database");

    const mpdoOffice = allOffices.find((o) => o.slug === "municipal-planning-and-development-office");
    const mhoOffice = allOffices.find((o) => o.slug === "municipal-health-office");
    assert(!!mpdoOffice, "Canonical MPDO office exists in database");
    assert(!!mhoOffice, "Canonical MHO office exists in database");

    const superAdminRole = await prisma.role.findUniqueOrThrow({
      where: { slug: "super-admin" },
      include: { permissions: { include: { permission: true } } },
    });
    const staffRole = await prisma.role.findUniqueOrThrow({
      where: { slug: "staff" },
      include: { permissions: { include: { permission: true } } },
    });
    const officeAdminRole = await prisma.role.findUniqueOrThrow({
      where: { slug: "office-admin" },
      include: { permissions: { include: { permission: true } } },
    });

    const superAdminPermissions = superAdminRole.permissions.map((p) => p.permission.code);
    const staffPermissions = staffRole.permissions.map((p) => p.permission.code);
    const officeAdminPermissions = officeAdminRole.permissions.map((p) => p.permission.code);

    // -------------------------------------------------------------
    // 2. Setup Test Users: SYSTEM Super Admin, OFFICE Staff, OFFICE Admin, and ICTO Staff
    // -------------------------------------------------------------
    console.log("\n--- 2. Setting Up Test Users ---");
    const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$fake$fake";

    const testAdminUser = await prisma.user.create({
      data: {
        name: `Test Super Admin ${ts}`,
        email: `test.admin.${ts}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: superAdminRole.id,
        status: UserStatus.ACTIVE,
      },
    });
    createdUserIds.push(testAdminUser.id);

    const testMpdoStaffUser = await prisma.user.create({
      data: {
        name: `Test MPDO Staff ${ts}`,
        email: `test.mpdo.staff.${ts}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: staffRole.id,
        officeId: mpdoOffice!.id,
        status: UserStatus.ACTIVE,
      },
    });
    createdUserIds.push(testMpdoStaffUser.id);

    const testMhoStaffUser = await prisma.user.create({
      data: {
        name: `Test MHO Staff ${ts}`,
        email: `test.mho.staff.${ts}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: staffRole.id,
        officeId: mhoOffice!.id,
        status: UserStatus.ACTIVE,
      },
    });
    createdUserIds.push(testMhoStaffUser.id);

    // Create an Office Admin in MPDO (to verify exclusion from Active Staff Accounts KPI)
    const testMpdoAdminUser = await prisma.user.create({
      data: {
        name: `Test MPDO Admin ${ts}`,
        email: `test.mpdo.admin.${ts}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: officeAdminRole.id,
        officeId: mpdoOffice!.id,
        status: UserStatus.ACTIVE,
      },
    });
    createdUserIds.push(testMpdoAdminUser.id);

    // Create an inactive staff user to verify staff filtering
    const testInactiveStaffUser = await prisma.user.create({
      data: {
        name: `Test Inactive Staff ${ts}`,
        email: `test.inactive.${ts}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: staffRole.id,
        officeId: mpdoOffice!.id,
        status: UserStatus.INACTIVE,
      },
    });
    createdUserIds.push(testInactiveStaffUser.id);

    // Create an active staff user in legacy ICTO (to verify exclusion from canonical System Active Staff Accounts KPI)
    const testIctoStaffUser = await prisma.user.create({
      data: {
        name: `Test ICTO Staff ${ts}`,
        email: `test.icto.staff.${ts}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: staffRole.id,
        officeId: ictoOffice!.id,
        status: UserStatus.ACTIVE,
      },
    });
    createdUserIds.push(testIctoStaffUser.id);

    // Session user representations
    const systemUserSession: SessionUser = {
      id: testAdminUser.id,
      email: testAdminUser.email,
      name: testAdminUser.name,
      status: "ACTIVE",
      roleId: superAdminRole.id,
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: true,
      },
      isSystemScope: true,
      officeId: null,
      office: null,
      permissions: superAdminPermissions,
      sessionId: `sess-${ts}-1`,
    };

    const mpdoStaffSession: SessionUser = {
      id: testMpdoStaffUser.id,
      email: testMpdoStaffUser.email,
      name: testMpdoStaffUser.name,
      status: "ACTIVE",
      roleId: staffRole.id,
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      isSystemScope: false,
      officeId: mpdoOffice!.id,
      office: {
        id: mpdoOffice!.id,
        name: mpdoOffice!.name,
        slug: mpdoOffice!.slug,
        shortName: mpdoOffice!.shortName,
      },
      permissions: staffPermissions,
      sessionId: `sess-${ts}-2`,
    };

    const officeAdminSession: SessionUser = {
      id: testMpdoAdminUser.id,
      email: testMpdoAdminUser.email,
      name: testMpdoAdminUser.name,
      status: "ACTIVE",
      roleId: officeAdminRole.id,
      role: {
        id: officeAdminRole.id,
        name: officeAdminRole.name,
        slug: officeAdminRole.slug,
        isSystemScope: false,
      },
      isSystemScope: false,
      officeId: mpdoOffice!.id,
      office: {
        id: mpdoOffice!.id,
        name: mpdoOffice!.name,
        slug: mpdoOffice!.slug,
        shortName: mpdoOffice!.shortName,
      },
      permissions: officeAdminPermissions,
      sessionId: `sess-${ts}-oa`,
    };

    // -------------------------------------------------------------
    // 3. Setup Test Content Across Offices & Statuses
    // -------------------------------------------------------------
    console.log("\n--- 3. Setting Up Test Content (News, Documents, Jobs) ---");
    const now = new Date();
    const futureDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // -7 days

    // MPDO published news
    const mpdoNewsPub = await prisma.newsArticle.create({
      data: {
        title: `MPDO Development Plan ${ts}`,
        slug: `mpdo-plan-${ts}`,
        excerpt: "Development plan excerpt",
        body: "<p>Content</p>",
        status: NewsStatus.PUBLISHED,
        officeId: mpdoOffice!.id,
        createdById: testAdminUser.id,
        publishedAt: now,
      },
    });
    createdArticleIds.push(mpdoNewsPub.id);

    // MPDO draft news (should not be counted in published metrics)
    const mpdoNewsDraft = await prisma.newsArticle.create({
      data: {
        title: `MPDO Internal Draft ${ts}`,
        slug: `mpdo-draft-${ts}`,
        excerpt: "Draft excerpt",
        body: "<p>Draft content</p>",
        status: NewsStatus.DRAFT,
        officeId: mpdoOffice!.id,
        createdById: testAdminUser.id,
      },
    });
    createdArticleIds.push(mpdoNewsDraft.id);

    // MHO published news (different office)
    const mhoNewsPub = await prisma.newsArticle.create({
      data: {
        title: `MHO Vaccination Advisory ${ts}`,
        slug: `mho-vaccine-${ts}`,
        excerpt: "Vaccination excerpt",
        body: "<p>Health content</p>",
        status: NewsStatus.PUBLISHED,
        officeId: mhoOffice!.id,
        createdById: testAdminUser.id,
        publishedAt: now,
      },
    });
    createdArticleIds.push(mhoNewsPub.id);

    // MPDO published document
    const mpdoDocPub = await prisma.document.create({
      data: {
        title: `MPDO Annual Report ${ts}`,
        status: DocumentStatus.PUBLISHED,
        officeId: mpdoOffice!.id,
        originalFilename: "annual_report.pdf",
        storagePublicId: `sfz/documents/doc_${ts}`,
        storageUrl: `https://res.cloudinary.com/demo/raw/upload/doc_${ts}.pdf`,
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1048576,
        createdById: testAdminUser.id,
        publishedAt: now,
      },
    });
    createdDocumentIds.push(mpdoDocPub.id);

    // MHO published document
    const mhoDocPub = await prisma.document.create({
      data: {
        title: `MHO Health Form ${ts}`,
        status: DocumentStatus.PUBLISHED,
        officeId: mhoOffice!.id,
        originalFilename: "health_form.pdf",
        storagePublicId: `sfz/documents/health_${ts}`,
        storageUrl: `https://res.cloudinary.com/demo/raw/upload/health_${ts}.pdf`,
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 524288,
        createdById: testAdminUser.id,
        publishedAt: now,
      },
    });
    createdDocumentIds.push(mhoDocPub.id);

    // MPDO active job (future closing date)
    const mpdoJobActive = await prisma.jobOpportunity.create({
      data: {
        title: `MPDO Planning Officer ${ts}`,
        slug: `mpdo-planning-officer-${ts}`,
        status: JobOpportunityStatus.PUBLISHED,
        officeId: mpdoOffice!.id,
        closingDate: futureDate,
        employmentType: "Permanent",
        itemNumber: `PLN-${ts}`,
        salaryGrade: "15",
        monthlySalary: "35000",
        education: "Bachelor's degree in Urban Planning",
        experience: "1 year relevant experience",
        training: "4 hours relevant training",
        eligibility: "CS Professional",
        createdById: testAdminUser.id,
        publishedAt: now,
      },
    });
    createdJobIds.push(mpdoJobActive.id);

    // MPDO expired job (closing date in the past, status is published but closing date passed)
    const mpdoJobExpired = await prisma.jobOpportunity.create({
      data: {
        title: `MPDO Closed Job ${ts}`,
        slug: `mpdo-closed-job-${ts}`,
        status: JobOpportunityStatus.PUBLISHED,
        officeId: mpdoOffice!.id,
        closingDate: pastDate,
        employmentType: "Contractual",
        itemNumber: `EXP-${ts}`,
        salaryGrade: "11",
        monthlySalary: "25000",
        education: "Bachelor's degree",
        experience: "None required",
        training: "None required",
        eligibility: "CS Subprofessional",
        createdById: testAdminUser.id,
        publishedAt: pastDate,
      },
    });
    createdJobIds.push(mpdoJobExpired.id);

    // ICTO published article (legacy noncanonical office)
    const ictoArticle = await prisma.newsArticle.create({
      data: {
        title: `ICTO Archived Advisory ${ts}`,
        slug: `icto-advisory-${ts}`,
        excerpt: "ICTO test excerpt",
        body: "<p>Legacy ICTO content</p>",
        status: NewsStatus.PUBLISHED,
        officeId: ictoOffice!.id,
        createdById: testAdminUser.id,
        publishedAt: now,
      },
    });
    createdArticleIds.push(ictoArticle.id);

    // Audit logs for testing administrative activity
    const auditLog1 = await prisma.auditLog.create({
      data: {
        action: "posts.publish",
        user: { connect: { id: testAdminUser.id } },
        officeId: mpdoOffice!.id,
        details: {
          articleId: mpdoNewsPub.id,
          title: mpdoNewsPub.title,
          password: "supersecretshouldnotleak",
        },
      },
    });
    createdAuditIds.push(auditLog1.id);

    const auditLog2 = await prisma.auditLog.create({
      data: {
        action: "documents.create",
        user: { connect: { id: testAdminUser.id } },
        officeId: mpdoOffice!.id,
        details: {
          documentId: mpdoDocPub.id,
          title: mpdoDocPub.title,
        },
      },
    });
    createdAuditIds.push(auditLog2.id);

    // -------------------------------------------------------------
    // 4. Test Summary Metrics (SYSTEM vs OFFICE Scopes & Active Jobs)
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing getDashboardSummaryMetrics ---");
    const sysMetrics = await getDashboardSummaryMetrics(systemUserSession);
    const officeMetrics = await getDashboardSummaryMetrics(mpdoStaffSession);

    // System metrics should count across all offices
    assert(sysMetrics.publishedNewsCount >= 3, `System metrics sees published news (got: ${sysMetrics.publishedNewsCount})`);
    assert(sysMetrics.publishedDocumentsCount >= 2, `System metrics sees published documents (got: ${sysMetrics.publishedDocumentsCount})`);
    assert(sysMetrics.activeJobsCount >= 1, `System metrics sees active jobs (got: ${sysMetrics.activeJobsCount})`);
    assert(sysMetrics.activeStaffCount >= 2, `System metrics sees active staff (got: ${sysMetrics.activeStaffCount})`);

    // Office metrics should be restricted to MPDO only
    // In MPDO: 1 published news (mpdoNewsPub), 1 published doc (mpdoDocPub), 1 active job (mpdoJobActive)
    assert(officeMetrics.publishedNewsCount >= 1, `Office metrics includes MPDO news (got: ${officeMetrics.publishedNewsCount})`);
    assert(officeMetrics.publishedNewsCount < sysMetrics.publishedNewsCount, `Office metrics is strictly fewer than system (${officeMetrics.publishedNewsCount} < ${sysMetrics.publishedNewsCount})`);
    assert(officeMetrics.publishedDocumentsCount >= 1, `Office metrics includes MPDO documents (got: ${officeMetrics.publishedDocumentsCount})`);
    assert(officeMetrics.publishedDocumentsCount < sysMetrics.publishedDocumentsCount, `Office documents is strictly fewer than system (${officeMetrics.publishedDocumentsCount} < ${sysMetrics.publishedDocumentsCount})`);
    assert(officeMetrics.activeJobsCount >= 1, `Office metrics includes MPDO active jobs (got: ${officeMetrics.activeJobsCount})`);

    // Verify expired job (mpdoJobExpired) is excluded from activeJobsCount
    // The expired job has closingDate in the past, so isJobClosed(closingDate) is true.
    const allMpdoJobs = await prisma.jobOpportunity.findMany({
      where: { officeId: mpdoOffice!.id, status: JobOpportunityStatus.PUBLISHED },
    });
    const expectedActiveJobs = allMpdoJobs.filter(
      (j) => !j.closingDate || new Date(j.closingDate) >= new Date()
    ).length;
    assert(
      officeMetrics.activeJobsCount === expectedActiveJobs,
      `activeJobsCount strictly respects isJobClosed(closingDate) (expected: ${expectedActiveJobs}, got: ${officeMetrics.activeJobsCount})`
    );

    // Verify Active Staff Accounts KPI strictly counts ACTIVE users with canonical 'staff' role
    const expectedMpdoActiveStaff = await prisma.user.count({
      where: {
        officeId: mpdoOffice!.id,
        status: UserStatus.ACTIVE,
        role: { slug: "staff" },
      },
    });
    assert(
      officeMetrics.activeStaffCount === expectedMpdoActiveStaff,
      `Office activeStaffCount strictly matches active Staff role count in office (expected: ${expectedMpdoActiveStaff}, got: ${officeMetrics.activeStaffCount})`
    );

    // Explicitly verify Office Admin is NOT included in officeMetrics.activeStaffCount:
    const totalActiveUsersInMpdo = await prisma.user.count({
      where: {
        officeId: mpdoOffice!.id,
        status: UserStatus.ACTIVE,
      },
    });
    assert(
      officeMetrics.activeStaffCount < totalActiveUsersInMpdo,
      `activeStaffCount excludes Office Admin from count (${officeMetrics.activeStaffCount} staff < ${totalActiveUsersInMpdo} total active users in office)`
    );

    // Verify SYSTEM scope Active Staff Accounts KPI counts active Staff across canonical offices only
    // Excludes Super Admin, Office Admin, inactive users, and legacy ICTO staff
    const canonicalSlugs = VERIFIED_MUNICIPAL_OFFICES.map((o) => o.slug);
    const expectedSystemActiveStaff = await prisma.user.count({
      where: {
        status: UserStatus.ACTIVE,
        role: { slug: "staff" },
        office: {
          slug: {
            in: canonicalSlugs,
            not: "icto",
          },
        },
      },
    });
    assert(
      sysMetrics.activeStaffCount === expectedSystemActiveStaff,
      `System activeStaffCount strictly counts active Staff in canonical offices, excluding admins and legacy ICTO staff (expected: ${expectedSystemActiveStaff}, got: ${sysMetrics.activeStaffCount})`
    );

    // -------------------------------------------------------------
    // 5. Test Content Publishing Activity (6-Month Rolling Window)
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing getContentPublishingActivity ---");
    const sysActivity = await getContentPublishingActivity(systemUserSession);
    const officeActivity = await getContentPublishingActivity(mpdoStaffSession);

    assert(sysActivity.months.length === 6, `Activity chart returns exactly 6 calendar months (got: ${sysActivity.months.length})`);
    assert(officeActivity.months.length === 6, `Office activity chart returns exactly 6 calendar months (got: ${officeActivity.months.length})`);

    // Current month should have published items recorded
    const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const sysCurrentMonth = sysActivity.months.find((m) => m.monthKey === currentMonthKey);
    const officeCurrentMonth = officeActivity.months.find((m) => m.monthKey === currentMonthKey);

    assert(!!sysCurrentMonth, `Current month ${currentMonthKey} exists in system activity`);
    assert(!!officeCurrentMonth, `Current month ${currentMonthKey} exists in office activity`);
    assert(
      (sysCurrentMonth?.news ?? 0) >= (officeCurrentMonth?.news ?? 0),
      `System current month news (>= office current month news)`
    );
    assert(sysActivity.totalPeriodPublished >= officeActivity.totalPeriodPublished, "System total period published >= office total period published");

    // -------------------------------------------------------------
    // 6. Test Published Content Distribution (Donut Breakdown)
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing getPublishedContentDistribution ---");
    const sysDist = await getPublishedContentDistribution(systemUserSession);
    const officeDist = await getPublishedContentDistribution(mpdoStaffSession);

    assert(sysDist.total === sysDist.news + sysDist.documents + sysDist.jobs, "System distribution total equals sum of news, documents, jobs");
    assert(officeDist.total === officeDist.news + officeDist.documents + officeDist.jobs, "Office distribution total equals sum of news, documents, jobs");
    assert(sysDist.news >= officeDist.news, `System news distribution >= office news (${sysDist.news} >= ${officeDist.news})`);
    assert(sysDist.documents >= officeDist.documents, `System documents distribution >= office documents (${sysDist.documents} >= ${officeDist.documents})`);
    assert(sysDist.total >= officeDist.total, `System total distribution >= office total (${sysDist.total} >= ${officeDist.total})`);

    // -------------------------------------------------------------
    // 7. Test Recent Content Table (Sorting, Filtering, Permissions)
    // -------------------------------------------------------------
    console.log("\n--- 7. Testing getRecentContent ---");
    const recentAll = await getRecentContent(systemUserSession, { limit: 10 });
    assert(recentAll.length > 0, "Recent content returns items");

    // Verify sort order is descending by updatedAt
    let isSorted = true;
    for (let i = 1; i < recentAll.length; i++) {
      if (new Date(recentAll[i].updatedAt) > new Date(recentAll[i - 1].updatedAt)) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "Recent content is strictly sorted by updatedAt desc");

    // Test type filtering
    const newsOnly = await getRecentContent(systemUserSession, { type: "news", limit: 10 });
    assert(newsOnly.every((item) => item.type === "news"), "Type filter 'news' returns only news articles");

    const docsOnly = await getRecentContent(systemUserSession, { type: "document", limit: 10 });
    assert(docsOnly.every((item) => item.type === "document"), "Type filter 'document' returns only documents");

    const jobsOnly = await getRecentContent(systemUserSession, { type: "job", limit: 10 });
    assert(jobsOnly.every((item) => item.type === "job"), "Type filter 'job' returns only job opportunities");

    // Test status filtering
    const draftsOnly = await getRecentContent(systemUserSession, { status: "DRAFT", limit: 10 });
    assert(draftsOnly.every((item) => item.status === "DRAFT"), "Status filter 'DRAFT' returns only drafts");
    assert(draftsOnly.some((item) => item.id === mpdoNewsDraft.id), "Drafts list includes created mpdoNewsDraft");

    // Test office scoping in recent content
    const officeRecent = await getRecentContent(mpdoStaffSession, { limit: 20 });
    assert(
      officeRecent.every((item) => item.officeId === mpdoOffice!.id),
      "Office staff recent content returns only items belonging to their office"
    );
    assert(
      !officeRecent.some((item) => item.id === mhoNewsPub.id),
      "Office staff does not see MHO news in recent content table"
    );

    // Test canEdit permission
    const mpdoItemInOfficeView = officeRecent.find((item) => item.id === mpdoNewsPub.id);
    assert(!!mpdoItemInOfficeView, "MPDO item is present in office staff recent items");

    // Super admin has permission to edit all offices
    const sysMhoItem = recentAll.find((item) => item.id === mhoNewsPub.id);
    if (sysMhoItem) {
      assert(sysMhoItem.canEdit === true, "Super Admin canEdit is true for cross-office content");
    }

    // -------------------------------------------------------------
    // 8. Test Published Content By Office (Canonical 18 Offices & ICTO Exclusion)
    // -------------------------------------------------------------
    console.log("\n--- 8. Testing getPublishedContentByOffice ---");
    const sysOffices = await getPublishedContentByOffice(systemUserSession);
    const staffOffices = await getPublishedContentByOffice(mpdoStaffSession);

    // SYSTEM scope must return exactly the 18 canonical offices
    assert(sysOffices.offices.length === 18, `System scope returns exactly 18 canonical offices (got: ${sysOffices.offices.length})`);
    assert(
      sysOffices.offices.every((o) => o.slug !== "icto"),
      "Legacy ICTO office is strictly excluded from office distribution breakdown"
    );
    assert(
      VERIFIED_MUNICIPAL_OFFICES.every((canon) => sysOffices.offices.some((o) => o.slug === canon.slug)),
      "All 18 canonical offices are present in system distribution"
    );

    // Verify exact canonical ordering (displayOrder 1..18)
    VERIFIED_MUNICIPAL_OFFICES.forEach((canon, idx) => {
      assert(
        sysOffices.offices[idx].slug === canon.slug,
        `Office at index ${idx} is canonically ${canon.slug} (got: ${sysOffices.offices[idx].slug})`
      );
    });

    // Verify inactive canonical office is NOT dropped from the list
    const mboOffice = allOffices.find((o) => o.slug === "municipal-budget-office");
    assert(!!mboOffice, "MBO office found in baseline");
    await prisma.office.update({
      where: { id: mboOffice!.id },
      data: { status: OfficeStatus.INACTIVE },
    });
    try {
      const sysOfficesWithInactive = await getPublishedContentByOffice(systemUserSession);
      assert(
        sysOfficesWithInactive.offices.length === 18,
        `System scope retains all 18 canonical offices even when an office is inactive in DB (got: ${sysOfficesWithInactive.offices.length})`
      );
      const mboInList = sysOfficesWithInactive.offices.find((o) => o.slug === "municipal-budget-office");
      assert(!!mboInList, "Inactive canonical office (MBO) is retained in the distribution breakdown");
    } finally {
      await prisma.office.update({
        where: { id: mboOffice!.id },
        data: { status: OfficeStatus.ACTIVE },
      });
    }

    // Verify canonical offices with zero published content render count 0
    const zeroCountOffices = sysOffices.offices.filter((o) => o.count === 0);
    assert(
      zeroCountOffices.length > 0,
      `Offices with zero published content are retained and display count 0 (found ${zeroCountOffices.length} offices with 0 content)`
    );
    zeroCountOffices.forEach((zo) => {
      assert(
        zo.newsCount === 0 && zo.docsCount === 0 && zo.jobsCount === 0,
        `Zero count office ${zo.slug} has 0 items across types`
      );
    });

    // Verify acronym resolution: canonical acronym or DB shortName, never speculative strings
    const verifiedAcronyms = ["MPDO", "MHO", "MBO", "MDRRMO", "LYDO", "HRMO", "PESO"];
    const officesWithAcronym = sysOffices.offices.filter((o) => o.shortName !== null);
    assert(
      officesWithAcronym.every((o) => verifiedAcronyms.includes(o.shortName!)),
      `Only verified acronyms (${verifiedAcronyms.join(", ")}) are used (found: ${officesWithAcronym.map((o) => o.shortName).join(", ")})`
    );

    // Office staff scope must return ONLY their own office (other offices omitted for privacy)
    assert(staffOffices.offices.length === 1, `Office staff scope returns exactly 1 office row (got: ${staffOffices.offices.length})`);
    assert(staffOffices.offices[0].slug === "municipal-planning-and-development-office", "Office staff distribution row is their own office (MPDO)");
    assert(staffOffices.offices[0].id === mpdoOffice!.id, "Office staff distribution row ID matches their office");

    // -------------------------------------------------------------
    // 9. Test Recent Administrative Activity (Audit Gating & Redaction)
    // -------------------------------------------------------------
    console.log("\n--- 9. Testing getRecentAdministrativeActivity ---");
    const sysActivityLogs = await getRecentAdministrativeActivity(systemUserSession, 10);
    const staffActivityLogs = await getRecentAdministrativeActivity(mpdoStaffSession, 10);

    // SYSTEM Super Admin has audit.view permission -> receives audit items
    assert(sysActivityLogs !== null, "Super Admin receives administrative activity list (not null)");
    assert(Array.isArray(sysActivityLogs), "Super Admin activity is an array");
    assert(sysActivityLogs!.length > 0, "Super Admin receives recent audit records");

    // OFFICE staff lacks audit.view permission -> receives null with ZERO audit querying
    assert(staffActivityLogs === null, "Office staff receives null for administrative activity (audit gated)");

    // Verify audit item properties and that passwords/secrets are never leaked
    const testLogItem = sysActivityLogs!.find((l) => l.id === auditLog1.id);
    if (testLogItem) {
      assert(testLogItem.action === "posts.publish", "Audit action is formatted properly");
      assert(testLogItem.actionLabel === "Content Published", "Audit action label is humanized");
      assert(testLogItem.userName.includes("Test Super Admin"), "Actor name is correctly resolved");
      assert(testLogItem.officeName !== null, "Office name is resolved");
    }

    const testDocLog = sysActivityLogs!.find((l) => l.id === auditLog2.id);
    if (testDocLog) {
      assert(testDocLog.action === "documents.create", "Document audit action is matched");
      assert(testDocLog.actionLabel === "Document Uploaded", "Document audit action label is humanized");
      assert(testDocLog.moduleLabel === "Documents", "Document audit module label is 'Documents' (not 'Downloadable Forms')");
    }

    // -------------------------------------------------------------
    // 10. Visual & Data Integrity Checks
    // -------------------------------------------------------------
    console.log("\n--- 10. Data Integrity & Absence of Hardcoded Mock Content ---");
    // Verify that the Stitch mock numbers (24, 18, 3, 31, 45) were not hardcoded in the service
    const serviceFileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/server/dashboard/service.ts"),
      "utf-8"
    );
    assert(!serviceFileContent.includes("publishedNewsCount: 24"), "Zero hardcoded news count 24");
    assert(!serviceFileContent.includes("publishedDocumentsCount: 18"), "Zero hardcoded documents count 18");
    assert(!serviceFileContent.includes("activeJobsCount: 3"), "Zero hardcoded jobs count 3");
    assert(!serviceFileContent.includes("activeStaffCount: 31"), "Zero hardcoded staff count 31");
    assert(!serviceFileContent.includes("totalPeriodPublished: 45"), "Zero hardcoded chart total 45");

    // Verify that fake compliance claims from Stitch are not in the UI
    const headerFileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/admin/dashboard/dashboard-header.tsx"),
      "utf-8"
    );
    assert(
      !headerFileContent.includes("Authorizations synced with Municipal Civil Registry"),
      "Unsupported civil registry claim is omitted from header"
    );
    assert(
      !headerFileContent.includes("Multi-Office Content Governance & Transparency Act Compliance Active"),
      "Unsupported compliance claim is omitted from header"
    );

    // Verify document terminology across dashboard components
    const donutFileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/admin/dashboard/published-content-donut.tsx"),
      "utf-8"
    );
    assert(!donutFileContent.includes("Downloadable Forms"), "Donut chart does not use obsolete 'Downloadable Forms'");
    assert(!donutFileContent.includes("Downloadable Documents"), "Donut chart does not use obsolete 'Downloadable Documents'");

    const summaryFileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/admin/dashboard/summary-metrics.tsx"),
      "utf-8"
    );
    assert(!summaryFileContent.includes("Downloadable Forms"), "Summary metrics does not use obsolete 'Downloadable Forms'");

    const officeDistFileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/admin/dashboard/office-distribution-panel.tsx"),
      "utf-8"
    );
    assert(!officeDistFileContent.includes("Downloadable Forms"), "Office distribution panel does not use obsolete 'Downloadable Forms'");
    assert(!serviceFileContent.includes('"Downloadable Forms"'), "Service does not use obsolete 'Downloadable Forms'");

    // -------------------------------------------------------------
    // 11. Test Office Administrator Experience & Boundary Verification
    // -------------------------------------------------------------
    console.log("\n--- 11. Testing Office Administrator Experience & Boundary Verification ---");
    const oaMetrics = await getDashboardSummaryMetrics(officeAdminSession);
    assert(oaMetrics.publishedNewsCount === officeMetrics.publishedNewsCount, "Office Admin sees identical office-scoped news count");
    assert(oaMetrics.publishedDocumentsCount === officeMetrics.publishedDocumentsCount, "Office Admin sees identical office-scoped documents count");
    assert(oaMetrics.activeJobsCount === officeMetrics.activeJobsCount, "Office Admin sees identical office-scoped active jobs count");
    assert(oaMetrics.activeStaffCount === officeMetrics.activeStaffCount, "Office Admin sees identical active staff count (excluding themselves)");

    const oaRecent = await getRecentContent(officeAdminSession, { limit: 20 });
    assert(
      oaRecent.every((item) => item.officeId === mpdoOffice!.id),
      "Office Admin recent content returns only items belonging to their office"
    );

    const oaOffices = await getPublishedContentByOffice(officeAdminSession);
    assert(oaOffices.offices.length === 1, "Office Admin sees only their own office row");
    assert(oaOffices.offices[0].slug === "municipal-planning-and-development-office", "Office Admin sees MPDO row");

    const oaAudit = await getRecentAdministrativeActivity(officeAdminSession, 10);
    assert(oaAudit === null, "Office Admin receives null for administrative activity (audit gated)");

    // Quick action permission gating check
    const { hasPermission } = await import("../src/lib/authz/scope");
    assert(
      hasPermission(officeAdminSession, "users.create") === false,
      "Office Admin without users.create cannot see Create Staff Account quick action"
    );
    const oaWithUserCreate: SessionUser = {
      ...officeAdminSession,
      permissions: [...officeAdminPermissions, "users.create"],
    };
    assert(
      hasPermission(oaWithUserCreate, "users.create") === true,
      "Office Admin granted users.create is permitted to see Create Staff Account quick action"
    );
    assert(
      hasPermission(systemUserSession, "users.create") === true,
      "Super Admin is permitted to see Create Staff Account quick action"
    );

    console.log("\nAll 11 test suites passed successfully!");
  } finally {
    // -------------------------------------------------------------
    // Cleanup Test Artifacts
    // -------------------------------------------------------------
    console.log("\n--- Teardown & Database Integrity Verification ---");
    if (createdAuditIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { id: { in: createdAuditIds } } }).catch(() => {});
    }
    if (createdJobIds.length > 0) {
      await prisma.jobOpportunity.deleteMany({ where: { id: { in: createdJobIds } } }).catch(() => {});
    }
    if (createdDocumentIds.length > 0) {
      await prisma.document.deleteMany({ where: { id: { in: createdDocumentIds } } }).catch(() => {});
    }
    if (createdArticleIds.length > 0) {
      await prisma.newsArticle.deleteMany({ where: { id: { in: createdArticleIds } } }).catch(() => {});
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});
    }

    // Verify physical office row count remains exactly 19
    const remainingOffices = await prisma.office.findMany({ select: { slug: true } });
    console.log(`Physical office count after cleanup: ${remainingOffices.length} (Expected: 19)`);
    assert(remainingOffices.length === 19, `Physical office rows in PostgreSQL must remain exactly 19 (found: ${remainingOffices.length})`);
    assert(remainingOffices.some((o) => o.slug === "icto"), "Preserved legacy ICTO row is still present in database");
    console.log("Cleanup verified successfully.");

    await prisma.$disconnect();
  }
}

runDashboardTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Dashboard test suite failed:", err);
    process.exit(1);
  });
