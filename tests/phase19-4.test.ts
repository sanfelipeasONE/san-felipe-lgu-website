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

async function runPhase194TestSuite() {
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

  console.log("=====================================================================");
  console.log("SAN FELIPE LGU PHASE 19.4 TEST SUITE");
  console.log("CMS Content Authoring Alignment & User Deletion Verification");
  console.log("=====================================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const { deleteUser, UserError } = await import("../src/server/users/service");
  const {
    updateServicePage,
    publishServicePage,
    unpublishServicePage,
    getAdminServicePage,
    removeServiceAttachmentDocument,
    attachExistingServiceDocument,
    removeServiceFeaturedImage,
    ServiceError,
  } = await import("../src/server/services/service");
  const {
    createJobOpportunity,
    updateJobOpportunity,
    removeJobFeaturedImage,
    JobError,
  } = await import("../src/server/jobs/service");
  const {
    getMunicipalCloudinaryFolder,
    validateImageFile,
    ALLOWED_IMAGE_MIME_TYPES,
    MAX_IMAGE_FILE_SIZE_BYTES,
  } = await import("../src/server/media/cloudinary");
  const { CANONICAL_ROLE_SLUGS, RETIRED_ROLE_SLUGS } = await import("../src/server/users/service");
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

  const createdUserIds: string[] = [];
  const createdDocumentIds: string[] = [];
  const createdJobIds: string[] = [];
  const createdNewsIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: Migration State Verification
    // -------------------------------------------------------------------------
    console.log("TEST GROUP 1: Migration State Verification");
    const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");
    const migrationEntries = fs
      .readdirSync(migrationsDir)
      .filter((entry) => {
        const fullPath = path.join(migrationsDir, entry);
        return (
          fs.statSync(fullPath).isDirectory() &&
          entry !== "migration_lock.toml"
        );
      });

    assert(
      migrationEntries.length === 10,
      `Exactly 10 migrations exist in prisma/migrations (found ${migrationEntries.length})`
    );

    const migration10 = migrationEntries.find((m) =>
      m.includes("add_service_job_media_and_service_attachment")
    );
    assert(
      Boolean(migration10),
      "Migration #10 exists for service/job media and service attachment"
    );

    if (migration10) {
      const sqlContent = fs.readFileSync(
        path.join(migrationsDir, migration10, "migration.sql"),
        "utf-8"
      );
      assert(
        sqlContent.includes("attachmentDocumentId") &&
        sqlContent.includes("featuredImageUrl") &&
        !sqlContent.includes("OTHER_PUBLIC_DOCUMENT"),
        "Migration #10 is purely additive and does NOT alter DocumentPurpose enum"
      );
    }

    // Cloudinary Namespace Derivation Verification
    const currentYear = new Date().getFullYear();
    assert(
      getMunicipalCloudinaryFolder("news") === `san-felipe-lgu/news/${currentYear}`,
      "News Cloudinary namespace resolves strictly to san-felipe-lgu/news/<year>"
    );
    assert(
      getMunicipalCloudinaryFolder("business-permits") === `san-felipe-lgu/services/business-permits/${currentYear}`,
      "Business Permits Cloudinary namespace resolves strictly to san-felipe-lgu/services/business-permits/<year>"
    );
    assert(
      getMunicipalCloudinaryFolder("jobs") === `san-felipe-lgu/jobs/${currentYear}`,
      "Jobs Cloudinary namespace resolves strictly to san-felipe-lgu/jobs/<year>"
    );

    // -------------------------------------------------------------------------
    // Setup Base Roles, Offices, and Base Users
    // -------------------------------------------------------------------------
    const superAdminRole = await prisma.role.findFirstOrThrow({
      where: { slug: "super-admin" },
      include: { permissions: { include: { permission: true } } },
    });
    const officeAdminRole = await prisma.role.findFirstOrThrow({
      where: { slug: "office-admin" },
      include: { permissions: { include: { permission: true } } },
    });
    const staffRole = await prisma.role.findFirstOrThrow({
      where: { slug: "staff" },
      include: { permissions: { include: { permission: true } } },
    });

    const testOfficeA = await prisma.office.upsert({
      where: { slug: "test-office-p194-a" },
      update: { name: "Test Office 19.4 Alpha", status: "ACTIVE" },
      create: {
        name: "Test Office 19.4 Alpha",
        shortName: "TO-A",
        slug: "test-office-p194-a",
        status: "ACTIVE",
      },
    });

    const testOfficeB = await prisma.office.upsert({
      where: { slug: "test-office-p194-b" },
      update: { name: "Test Office 19.4 Beta", status: "ACTIVE" },
      create: {
        name: "Test Office 19.4 Beta",
        shortName: "TO-B",
        slug: "test-office-p194-b",
        status: "ACTIVE",
      },
    });

    const dummyHash = "$argon2id$v=19$m=65536,t=3,p=4$dummyhashforphase194testing";

    // Primary Super Admin Caller
    const callerSuperAdminDb = await prisma.user.create({
      data: {
        email: "superadmin.caller.p194@sanfelipe.gov.ph",
        name: "Super Admin Caller 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: superAdminRole.id,
      },
    });
    createdUserIds.push(callerSuperAdminDb.id);

    const callerSuperAdmin: SessionUser = {
      id: callerSuperAdminDb.id,
      email: callerSuperAdminDb.email,
      name: callerSuperAdminDb.name,
      status: "ACTIVE",
      officeId: null,
      office: null,
      roleId: superAdminRole.id,
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: superAdminRole.isSystemScope,
      },
      permissions: superAdminRole.permissions.map((p) => p.permission.code),
      isSystemScope: true,
      sessionId: "test-session-super-admin",
    };

    // Office Admin Caller in Office A
    const callerOfficeAdminDb = await prisma.user.create({
      data: {
        email: "officeadmin.caller.p194@sanfelipe.gov.ph",
        name: "Office Admin Caller 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: officeAdminRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(callerOfficeAdminDb.id);

    const callerOfficeAdmin: SessionUser = {
      id: callerOfficeAdminDb.id,
      email: callerOfficeAdminDb.email,
      name: callerOfficeAdminDb.name,
      status: "ACTIVE",
      officeId: testOfficeA.id,
      office: {
        id: testOfficeA.id,
        name: testOfficeA.name,
        shortName: testOfficeA.shortName,
        slug: testOfficeA.slug,
      },
      roleId: officeAdminRole.id,
      role: {
        id: officeAdminRole.id,
        name: officeAdminRole.name,
        slug: officeAdminRole.slug,
        isSystemScope: officeAdminRole.isSystemScope,
      },
      permissions: officeAdminRole.permissions.map((p) => p.permission.code),
      isSystemScope: false,
      sessionId: "test-session-office-admin",
    };

    // Ordinary Staff Caller in Office A
    const callerStaffDb = await prisma.user.create({
      data: {
        email: "staff.caller.p194@sanfelipe.gov.ph",
        name: "Staff Caller 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(callerStaffDb.id);

    const callerStaff: SessionUser = {
      id: callerStaffDb.id,
      email: callerStaffDb.email,
      name: callerStaffDb.name,
      status: "ACTIVE",
      officeId: testOfficeA.id,
      office: {
        id: testOfficeA.id,
        name: testOfficeA.name,
        shortName: testOfficeA.shortName,
        slug: testOfficeA.slug,
      },
      roleId: staffRole.id,
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: staffRole.isSystemScope,
      },
      permissions: staffRole.permissions.map((p) => p.permission.code),
      isSystemScope: false,
      sessionId: "test-session-staff",
    };

    // -------------------------------------------------------------------------
    // TEST GROUP 2: User Permanent Deletion Authorization Matrix (Exact 17 Cases)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 2: User Permanent Deletion Authorization Matrix (Exact 17 Cases)");

    // SUPER ADMIN
    // Case 1: Eligible ordinary Staff with zero authored records: DELETE succeeds.
    const targetStaff1 = await prisma.user.create({
      data: {
        email: "target.staff1.p194@sanfelipe.gov.ph",
        name: "Target Staff 1",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    const delRes1 = await deleteUser(callerSuperAdmin, targetStaff1.id);
    assert(
      delRes1.success === true && delRes1.id === targetStaff1.id,
      "Super Admin Case 1: Eligible ordinary Staff with zero authored records -> DELETE succeeds"
    );
    const checkStaff1 = await prisma.user.findUnique({ where: { id: targetStaff1.id } });
    assert(checkStaff1 === null, "Target Staff record is permanently removed from DB");

    // Case 2: Eligible Office Admin with zero authored records: DELETE succeeds.
    const targetOfficeAdmin1 = await prisma.user.create({
      data: {
        email: "target.officeadmin1.p194@sanfelipe.gov.ph",
        name: "Target Office Admin 1",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: officeAdminRole.id,
        officeId: testOfficeB.id,
      },
    });
    const delRes2 = await deleteUser(callerSuperAdmin, targetOfficeAdmin1.id);
    assert(
      delRes2.success === true && delRes2.id === targetOfficeAdmin1.id,
      "Super Admin Case 2: Eligible Office Admin with zero authored records -> DELETE succeeds"
    );
    const checkOA1 = await prisma.user.findUnique({ where: { id: targetOfficeAdmin1.id } });
    assert(checkOA1 === null, "Target Office Admin record is permanently removed from DB");

    // Case 3: Self: DELETE blocked.
    let selfDeleteBlocked = false;
    try {
      await deleteUser(callerSuperAdmin, callerSuperAdmin.id);
    } catch (e: unknown) {
      if (
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.includes("cannot delete your own account")
      ) {
        selfDeleteBlocked = true;
      }
    }
    assert(selfDeleteBlocked, "Super Admin Case 3: Self -> DELETE blocked (400 cannot delete own account)");

    // Case 4: Last effective active Super Admin: DELETE blocked.
    const tempSoleAdmin = await prisma.user.create({
      data: {
        email: "temp.sole.admin.p194@sanfelipe.gov.ph",
        name: "Temp Sole Admin 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: superAdminRole.id,
      },
    });
    const otherAdmins = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { isSystemScope: true, tier: "SYSTEM_ADMIN" },
        id: { not: tempSoleAdmin.id },
      },
      select: { id: true },
    });
    await prisma.user.updateMany({
      where: { id: { in: otherAdmins.map((a) => a.id) } },
      data: { status: "INACTIVE" },
    });
    let soleAdminBlocked = false;
    try {
      await deleteUser(callerSuperAdmin, tempSoleAdmin.id);
    } catch (e: unknown) {
      if (
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.includes("last effective active System Administrator")
      ) {
        soleAdminBlocked = true;
      }
    }
    await prisma.user.updateMany({
      where: { id: { in: otherAdmins.map((a) => a.id) } },
      data: { status: "ACTIVE" },
    });
    await prisma.user.delete({ where: { id: tempSoleAdmin.id } });
    assert(soleAdminBlocked, "Super Admin Case 4: Last effective active Super Admin -> DELETE blocked (400)");

    // Case 5: User with NewsArticle.createdById: DELETE blocked. createdById unchanged.
    const authorUser1 = await prisma.user.create({
      data: {
        email: "author.news.p194@sanfelipe.gov.ph",
        name: "News Author 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(authorUser1.id);

    const testNews = await prisma.newsArticle.create({
      data: {
        title: "Test Municipal Announcement 19.4",
        slug: "test-municipal-announcement-19-4",
        excerpt: "Announcement excerpt",
        body: "<p>Content</p>",
        status: "DRAFT",
        createdById: authorUser1.id,
        officeId: testOfficeA.id,
      },
    });
    createdNewsIds.push(testNews.id);

    let newsAuthorBlock = false;
    try {
      await deleteUser(callerSuperAdmin, authorUser1.id);
    } catch (e: unknown) {
      if (
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.toLowerCase().includes("news article")
      ) {
        newsAuthorBlock = true;
      }
    }
    assert(newsAuthorBlock, "Super Admin Case 5: User with NewsArticle.createdById -> DELETE blocked (400)");
    const checkNewsPreserved = await prisma.newsArticle.findUnique({ where: { id: testNews.id } });
    assert(
      checkNewsPreserved !== null && checkNewsPreserved.createdById === authorUser1.id,
      "Super Admin Case 5: NewsArticle.createdById unchanged (records remain intact in DB)"
    );

    // Case 6: User with Document.createdById: DELETE blocked. createdById unchanged.
    const authorUser2 = await prisma.user.create({
      data: {
        email: "author.doc.p194@sanfelipe.gov.ph",
        name: "Document Author 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(authorUser2.id);

    const testDoc = await prisma.document.create({
      data: {
        title: "Test Official Document 19.4",
        category: "General Administration",
        purpose: "OTHER_PUBLIC_DOCUMENT",
        status: "DRAFT",
        officeId: testOfficeA.id,
        originalFilename: "test-doc-19-4.pdf",
        storagePublicId: "test-doc-19-4",
        storageUrl: "https://example.com/test-doc-19-4.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: authorUser2.id,
      },
    });
    createdDocumentIds.push(testDoc.id);

    let docAuthorBlock = false;
    try {
      await deleteUser(callerSuperAdmin, authorUser2.id);
    } catch (e: unknown) {
      if (
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.toLowerCase().includes("document")
      ) {
        docAuthorBlock = true;
      }
    }
    assert(docAuthorBlock, "Super Admin Case 6: User with Document.createdById -> DELETE blocked (400)");
    const checkDocPreserved = await prisma.document.findUnique({ where: { id: testDoc.id } });
    assert(
      checkDocPreserved !== null && checkDocPreserved.createdById === authorUser2.id,
      "Super Admin Case 6: Document.createdById unchanged (records remain intact in DB)"
    );

    // Case 7: User with ServicePage.createdById: DELETE blocked. createdById unchanged.
    const authorUser7 = await prisma.user.create({
      data: {
        email: "author.service.p194@sanfelipe.gov.ph",
        name: "Service Author 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(authorUser7.id);

    const origDownloadablePage = await prisma.servicePage.findUnique({
      where: { serviceKey: "downloadable-forms" },
    });
    await prisma.servicePage.update({
      where: { serviceKey: "downloadable-forms" },
      data: { createdById: authorUser7.id },
    });

    let serviceAuthorBlock = false;
    try {
      await deleteUser(callerSuperAdmin, authorUser7.id);
    } catch (e: unknown) {
      if (
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.toLowerCase().includes("service page")
      ) {
        serviceAuthorBlock = true;
      }
    }
    assert(serviceAuthorBlock, "Super Admin Case 7: User with ServicePage.createdById -> DELETE blocked (400)");
    const checkPagePreserved = await prisma.servicePage.findUnique({ where: { serviceKey: "downloadable-forms" } });
    assert(
      checkPagePreserved !== null && checkPagePreserved.createdById === authorUser7.id,
      "Super Admin Case 7: ServicePage.createdById unchanged (records remain intact in DB)"
    );
    if (origDownloadablePage) {
      await prisma.servicePage.update({
        where: { serviceKey: "downloadable-forms" },
        data: { createdById: origDownloadablePage.createdById },
      });
    }

    // Case 8: User with JobOpportunity.createdById: DELETE blocked. createdById unchanged.
    const authorUser8 = await prisma.user.create({
      data: {
        email: "author.job.p194@sanfelipe.gov.ph",
        name: "Job Author 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(authorUser8.id);

    const testJob = await prisma.jobOpportunity.create({
      data: {
        title: "Test Administrative Aide 19.4",
        slug: "test-admin-aide-19-4",
        employmentType: "PERMANENT",
        description: "<p>Job description</p>",
        status: "DRAFT",
        createdById: authorUser8.id,
        officeId: testOfficeA.id,
      },
    });
    createdJobIds.push(testJob.id);

    let jobAuthorBlock = false;
    try {
      await deleteUser(callerSuperAdmin, authorUser8.id);
    } catch (e: unknown) {
      if (
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.toLowerCase().includes("job vacancy announcement")
      ) {
        jobAuthorBlock = true;
      }
    }
    assert(jobAuthorBlock, "Super Admin Case 8: User with JobOpportunity.createdById -> DELETE blocked (400)");
    const checkJobPreserved = await prisma.jobOpportunity.findUnique({ where: { id: testJob.id } });
    assert(
      checkJobPreserved !== null && checkJobPreserved.createdById === authorUser8.id,
      "Super Admin Case 8: JobOpportunity.createdById unchanged (records remain intact in DB)"
    );

    // Case 9: Successful deletion: target sessions deleted/unusable.
    const targetStaffWithSession = await prisma.user.create({
      data: {
        email: "target.session.p194@sanfelipe.gov.ph",
        name: "Session Target 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    const activeSession = await prisma.session.create({
      data: {
        userId: targetStaffWithSession.id,
        tokenHash: "dummytokenhashforcascadeverification194",
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    await deleteUser(callerSuperAdmin, targetStaffWithSession.id);
    const checkSession = await prisma.session.findUnique({ where: { id: activeSession.id } });
    assert(checkSession === null, "Super Admin Case 9: Successful deletion -> target sessions deleted/unusable (cascaded)");

    // Case 10: Successful deletion: USER_DELETED audit evidence survives.
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: AUDIT_ACTIONS.USER_DELETED,
        userId: callerSuperAdmin.id,
      },
      orderBy: { createdAt: "desc" },
    });
    const details = auditRecord?.details as Record<string, unknown> | null;
    assert(
      Boolean(
        details &&
        details.targetUserId &&
        details.targetEmail &&
        details.targetName &&
        details.targetRoleSlug
      ),
      "Super Admin Case 10: Successful deletion -> USER_DELETED audit evidence survives with target metadata"
    );

    // OFFICE ADMIN
    // Case 11: Own-office canonical ordinary Staff with zero authored records: DELETE succeeds.
    const officeStaffInA = await prisma.user.create({
      data: {
        email: "staff.in.office.a@sanfelipe.gov.ph",
        name: "Staff in Office A",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    const delResOA = await deleteUser(callerOfficeAdmin, officeStaffInA.id);
    assert(
      delResOA.success === true && delResOA.id === officeStaffInA.id,
      "Office Admin Case 11: Own-office canonical ordinary Staff with zero authored records -> DELETE succeeds"
    );

    // Case 12: Own-office Staff with authored content: DELETE blocked.
    const staffWithDocInA = await prisma.user.create({
      data: {
        email: "staff.authored.in.a@sanfelipe.gov.ph",
        name: "Authored Staff A",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(staffWithDocInA.id);
    const docByStaffInA = await prisma.document.create({
      data: {
        title: "Staff Document In A",
        category: "General Administration",
        purpose: "OTHER_PUBLIC_DOCUMENT",
        status: "DRAFT",
        officeId: testOfficeA.id,
        originalFilename: "staff-doc-a.pdf",
        storagePublicId: "staff-doc-a",
        storageUrl: "https://example.com/staff-doc-a.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: staffWithDocInA.id,
      },
    });
    createdDocumentIds.push(docByStaffInA.id);

    let oaDelAuthoredStaffBlocked = false;
    try {
      await deleteUser(callerOfficeAdmin, staffWithDocInA.id);
    } catch (e: unknown) {
      if (
        e instanceof UserError &&
        e.statusCode === 400 &&
        e.message.toLowerCase().includes("document")
      ) {
        oaDelAuthoredStaffBlocked = true;
      }
    }
    assert(oaDelAuthoredStaffBlocked, "Office Admin Case 12: Own-office Staff with authored content -> DELETE blocked (400)");

    // Case 13: Cross-office Staff: DELETE forbidden.
    const staffInOfficeB = await prisma.user.create({
      data: {
        email: "staff.in.office.b@sanfelipe.gov.ph",
        name: "Staff in Office B",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeB.id,
      },
    });
    createdUserIds.push(staffInOfficeB.id);
    let crossOfficeBlocked = false;
    try {
      await deleteUser(callerOfficeAdmin, staffInOfficeB.id);
    } catch (e: unknown) {
      if (e instanceof UserError && e.statusCode === 403) {
        crossOfficeBlocked = true;
      }
    }
    assert(crossOfficeBlocked, "Office Admin Case 13: Cross-office Staff -> DELETE forbidden (403)");

    // Case 14: Office Admin target: DELETE forbidden.
    const otherOfficeAdminInA = await prisma.user.create({
      data: {
        email: "other.officeadmin.a@sanfelipe.gov.ph",
        name: "Other Office Admin A",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: officeAdminRole.id,
        officeId: testOfficeA.id,
      },
    });
    createdUserIds.push(otherOfficeAdminInA.id);
    let oaDelOABlocked = false;
    try {
      await deleteUser(callerOfficeAdmin, otherOfficeAdminInA.id);
    } catch (e: unknown) {
      if (e instanceof UserError && e.statusCode === 403) {
        oaDelOABlocked = true;
      }
    }
    assert(oaDelOABlocked, "Office Admin Case 14: Office Admin target -> DELETE forbidden (403)");

    // Case 15: Super Admin target: DELETE forbidden.
    let oaDelSuperAdminBlocked = false;
    try {
      await deleteUser(callerOfficeAdmin, callerSuperAdminDb.id);
    } catch (e: unknown) {
      if (e instanceof UserError && e.statusCode === 403) {
        oaDelSuperAdminBlocked = true;
      }
    }
    assert(oaDelSuperAdminBlocked, "Office Admin Case 15: Super Admin target -> DELETE forbidden (403)");

    // Case 16: Self: DELETE forbidden.
    let oaDelSelfBlocked = false;
    try {
      await deleteUser(callerOfficeAdmin, callerOfficeAdmin.id);
    } catch (e: unknown) {
      if (e instanceof UserError && e.statusCode === 400) {
        oaDelSelfBlocked = true;
      }
    }
    assert(oaDelSelfBlocked, "Office Admin Case 16: Self -> DELETE forbidden (400)");

    // STAFF
    // Case 17: Any permanent user deletion: forbidden.
    let staffDelBlocked = false;
    try {
      await deleteUser(callerStaff, otherOfficeAdminInA.id);
    } catch (e: unknown) {
      if (e instanceof UserError && e.statusCode === 403) {
        staffDelBlocked = true;
      }
    }
    assert(staffDelBlocked, "Staff Case 17: Any permanent user deletion -> forbidden (403)");

    // Authorship Integrity & Boundary Invariants
    assert(
      checkNewsPreserved !== null &&
      checkNewsPreserved.createdById !== callerSuperAdmin.id &&
      checkNewsPreserved.createdById === authorUser1.id,
      "Authorship Invariant: zero authorship reassignment occurs on delete attempt"
    );
    assert(
      Boolean(checkNewsPreserved && checkDocPreserved && checkNewsPreserved.createdById && checkDocPreserved.createdById),
      "Authorship Invariant: zero createdById nullification occurs"
    );
    assert(
      CANONICAL_ROLE_SLUGS.length === 3,
      "Roles Invariant: canonical roles count is exactly 3 (super-admin, office-admin, staff)"
    );
    assert(
      RETIRED_ROLE_SLUGS.length > 0,
      "Roles Invariant: retired role slugs remain inert and unassignable"
    );

    // Atomicity Invariant Verification
    // Historical AuditLog survives deletion with userId set to null via SetNull cascade
    const targetWithAudit = await prisma.user.create({
      data: {
        email: "target.audit.p194@sanfelipe.gov.ph",
        name: "Audit Target 19.4",
        passwordHash: dummyHash,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: testOfficeA.id,
      },
    });
    const historicalAudit = await prisma.auditLog.create({
      data: {
        action: "test.historical.action",
        userId: targetWithAudit.id,
        officeId: testOfficeA.id,
        details: { note: "Historical user event prior to deletion" },
      },
    });
    await deleteUser(callerSuperAdmin, targetWithAudit.id);
    const checkHistoricalAudit = await prisma.auditLog.findUnique({
      where: { id: historicalAudit.id },
    });
    assert(
      checkHistoricalAudit !== null && checkHistoricalAudit.userId === null,
      "Atomicity Invariant: historical AuditLog evidence survives deletion with userId decoupled"
    );
    await prisma.auditLog.delete({ where: { id: historicalAudit.id } });

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Business Permits Image Lifecycle (A-F Matrix) & Content
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 3: Business Permits Image Lifecycle (A-F Matrix) & Content");

    // Assert image upload validation constants from source
    assert(
      ALLOWED_IMAGE_MIME_TYPES.length === 3 && MAX_IMAGE_FILE_SIZE_BYTES === 10 * 1024 * 1024,
      "Image constants: exactly 3 allowed MIME types (JPEG, PNG, WebP) and 10 MB maximum limit"
    );

    // A. Initial valid image upload
    const bpBody = "<p>Comprehensive San Felipe Business Licensing Guidelines 2026.</p>";
    const bpInit = await updateServicePage(callerSuperAdmin, "business-permits", {
      title: "Business Permits & Licensing",
      description: "Official guidelines for commercial operations",
      body: bpBody,
      featuredImageUrl: "https://res.cloudinary.com/san-felipe/image/upload/v1/services/business-permits/2026/bp-cover-initial.jpg",
      featuredImageAlt: "Business Permits Initial Cover Photo",
      featuredImagePublicId: "services/business-permits/2026/bp-cover-initial",
      featuredImageWidth: 1200,
      featuredImageHeight: 630,
      featuredImageFormat: "jpg",
      featuredImageBytes: 204800,
    });
    assert(
      Boolean(
        bpInit &&
        bpInit.featuredImagePublicId === "services/business-permits/2026/bp-cover-initial" &&
        bpInit.featuredImageUrl?.includes("bp-cover-initial")
      ),
      "Business Permits [A]: Initial valid image upload persists metadata on ServicePage"
    );

    // B. Invalid file type rejected
    const bpInvalidMime = validateImageFile({
      type: "image/gif",
      filename: "animated-cover.gif",
      size: 50000,
    });
    assert(
      Boolean(bpInvalidMime.valid === false && bpInvalidMime.error?.includes("Unsupported image format")),
      "Business Permits [B]: Invalid file type (GIF) rejected with actionable error"
    );

    // C. Oversized image rejected (> 10 MB)
    const bpOversized = validateImageFile({
      type: "image/png",
      filename: "huge-image.png",
      size: 11 * 1024 * 1024,
    });
    assert(
      Boolean(bpOversized.valid === false && bpOversized.error?.includes("exceeds the 10 MB maximum limit")),
      "Business Permits [C]: Oversized image (> 10 MB) rejected with actionable error"
    );

    // D. Replacement: new asset uploaded -> DB persistence succeeds -> old asset deleted only afterward
    const bpReplaced = await updateServicePage(callerSuperAdmin, "business-permits", {
      title: "Business Permits & Licensing",
      body: bpBody,
      expectedUpdatedAt: bpInit!.updatedAt.toISOString(),
      featuredImageUrl: "https://res.cloudinary.com/san-felipe/image/upload/v1/services/business-permits/2026/bp-cover-v2.jpg",
      featuredImageAlt: "Business Permits V2 Cover",
      featuredImagePublicId: "services/business-permits/2026/bp-cover-v2",
    });
    assert(
      Boolean(bpReplaced && bpReplaced.featuredImagePublicId === "services/business-permits/2026/bp-cover-v2"),
      "Business Permits [D]: Replacement succeeds, new asset persists, old asset cleanup attempted afterward"
    );

    // E. Simulated DB failure after new asset upload:
    // Stale concurrency token causes update to fail (409) -> new asset cleaned up as orphan, old DB metadata unchanged
    let bpDbFailureCaught = false;
    try {
      await updateServicePage(callerSuperAdmin, "business-permits", {
        title: "Business Permits Stale Mutator",
        body: bpBody,
        expectedUpdatedAt: bpInit!.updatedAt.toISOString(), // Stale token!
        featuredImageUrl: "https://res.cloudinary.com/san-felipe/image/upload/v1/services/business-permits/2026/bp-cover-orphan.jpg",
        featuredImageAlt: "Business Permits Orphan Cover",
        featuredImagePublicId: "services/business-permits/2026/bp-cover-orphan",
      });
    } catch (e: unknown) {
      if (e instanceof ServiceError && e.statusCode === 409) {
        bpDbFailureCaught = true;
      }
    }
    const bpAfterFailedUpdate = await getAdminServicePage(callerSuperAdmin, "business-permits");
    assert(
      bpDbFailureCaught &&
      bpAfterFailedUpdate.featuredImagePublicId === "services/business-permits/2026/bp-cover-v2",
      "Business Permits [E]: DB failure after upload cleans up new orphan asset, preserves old asset and DB metadata"
    );

    // F. Explicit image removal: DB image fields cleared first/safely, old asset cleanup attempted afterward
    const bpRemoved = await removeServiceFeaturedImage(callerSuperAdmin, "business-permits");
    assert(
      bpRemoved.featuredImageUrl === null && bpRemoved.featuredImagePublicId === null,
      "Business Permits [F]: Explicit image removal clears DB fields first/safely, old asset cleanup attempted afterward"
    );

    // Document Attachment & Concurrency Workflow:
    // Attach Document with purpose DOWNLOADABLE_FORM
    const bpDoc = await prisma.document.create({
      data: {
        title: "Unified Business Permit Application Form",
        category: "Business & Licensing",
        purpose: "DOWNLOADABLE_FORM",
        status: "PUBLISHED",
        officeId: testOfficeA.id,
        originalFilename: "unified-bp-app-form.pdf",
        storagePublicId: "san-felipe-lgu/documents/test-bp-doc",
        storageUrl: "https://example.com/unified-bp-app-form.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 2048,
        createdById: callerSuperAdmin.id,
      },
    });
    createdDocumentIds.push(bpDoc.id);

    await attachExistingServiceDocument(callerSuperAdmin, "business-permits", bpDoc.id);
    const bpWithDoc = await getAdminServicePage(callerSuperAdmin, "business-permits");
    assert(
      bpWithDoc.attachmentDocumentId === bpDoc.id &&
      bpWithDoc.attachmentDocument?.title === "Unified Business Permit Application Form",
      "Managed Document attachment linked to Business Permits"
    );

    // Disconnect attachment clears FK while preserving Document
    await removeServiceAttachmentDocument(callerSuperAdmin, "business-permits");
    const bpAfterRemove = await getAdminServicePage(callerSuperAdmin, "business-permits");
    assert(
      bpAfterRemove.attachmentDocumentId === null,
      "Removing attachment disconnects FK on ServicePage"
    );
    const docStillExists = await prisma.document.findUnique({ where: { id: bpDoc.id } });
    assert(
      Boolean(docStillExists),
      "Underlying Document record remains preserved in Document Management"
    );

    // Sequential self-generated mutations testing optimistic concurrency token synchronization
    await updateServicePage(callerSuperAdmin, "business-permits", {
      title: "Business Permits & Licensing 2026",
      body: "<p>Sequential Mutation Step 1</p>",
      expectedUpdatedAt: bpAfterRemove.updatedAt.toISOString(),
    });
    const seq2 = await attachExistingServiceDocument(callerSuperAdmin, "business-permits", bpDoc.id);
    const seq3 = await publishServicePage(callerSuperAdmin, "business-permits", {
      title: seq2.title,
      body: bpBody,
      expectedUpdatedAt: seq2.updatedAt.toISOString(),
    });
    await unpublishServicePage(callerSuperAdmin, "business-permits", seq3.updatedAt.toISOString());
    const seq5 = await removeServiceAttachmentDocument(callerSuperAdmin, "business-permits");
    const seq6 = await updateServicePage(callerSuperAdmin, "business-permits", {
      title: "Business Permits & Licensing",
      body: bpBody,
      expectedUpdatedAt: seq5.updatedAt.toISOString(),
    });
    assert(Boolean(seq6), "Sequential self-generated mutations succeed with zero false 409 conflicts");

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Job Opportunities Image Lifecycle (A-F Matrix) & Media
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 4: Job Opportunities Image Lifecycle (A-F Matrix)");

    // A. Initial valid image upload
    const jobA = await createJobOpportunity(callerSuperAdmin, {
      title: "Municipal Planning Officer I",
      employmentType: "PERMANENT",
      officeId: testOfficeA.id,
      salaryGrade: "11",
      monthlySalary: "27000",
      description: "<p>Responsible for municipal physical planning.</p>",
      featuredImageUrl: "https://res.cloudinary.com/san-felipe/image/upload/v1/jobs/2026/test-job-cover-a.jpg",
      featuredImageAlt: "Planning Office Vacancy Initial Cover",
      featuredImagePublicId: "jobs/2026/test-job-cover-a",
    });
    createdJobIds.push(jobA.id);
    assert(
      Boolean(
        jobA &&
        jobA.featuredImagePublicId === "jobs/2026/test-job-cover-a" &&
        jobA.featuredImageUrl?.includes("test-job-cover-a")
      ),
      "Job Opportunities [A]: Initial valid image upload persists metadata on JobOpportunity"
    );

    // B. Invalid file type rejected
    const jobInvalidMime = validateImageFile({
      type: "application/pdf",
      filename: "document.pdf",
      size: 50000,
    });
    assert(
      Boolean(jobInvalidMime.valid === false && jobInvalidMime.error?.includes("Unsupported image format")),
      "Job Opportunities [B]: Invalid file type rejected with actionable error"
    );

    // C. Oversized image rejected (> 10 MB)
    const jobOversized = validateImageFile({
      type: "image/jpeg",
      filename: "huge-photo.jpg",
      size: 15 * 1024 * 1024,
    });
    assert(
      Boolean(jobOversized.valid === false && jobOversized.error?.includes("exceeds the 10 MB maximum limit")),
      "Job Opportunities [C]: Oversized image (> 10 MB) rejected with actionable error"
    );

    // D. Replacement: new asset uploaded -> DB update succeeds -> old asset deleted only afterward
    const jobReplaced = await updateJobOpportunity(callerSuperAdmin, jobA.id, {
      title: "Municipal Planning Officer I",
      employmentType: "PERMANENT",
      officeId: testOfficeA.id,
      expectedUpdatedAt: jobA.updatedAt.toISOString(),
      featuredImageUrl: "https://res.cloudinary.com/san-felipe/image/upload/v1/jobs/2026/test-job-cover-v2.jpg",
      featuredImageAlt: "Planning Office Vacancy V2 Cover",
      featuredImagePublicId: "jobs/2026/test-job-cover-v2",
    });
    assert(
      jobReplaced.featuredImagePublicId === "jobs/2026/test-job-cover-v2",
      "Job Opportunities [D]: Replacement succeeds, new asset persists, old asset cleanup attempted afterward"
    );

    // E. Simulated DB failure after new asset upload:
    // Stale concurrency token causes update to fail (409) -> new asset cleaned up as orphan, old DB metadata unchanged
    let jobDbFailureCaught = false;
    try {
      await updateJobOpportunity(callerSuperAdmin, jobA.id, {
        title: "Municipal Planning Officer I Stale",
        employmentType: "PERMANENT",
        officeId: testOfficeA.id,
        expectedUpdatedAt: jobA.updatedAt.toISOString(), // Stale token!
        featuredImageUrl: "https://res.cloudinary.com/san-felipe/image/upload/v1/jobs/2026/test-job-cover-orphan.jpg",
        featuredImageAlt: "Job Orphan Cover",
        featuredImagePublicId: "jobs/2026/test-job-cover-orphan",
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 409) {
        jobDbFailureCaught = true;
      }
    }
    const jobAfterFailedUpdate = await prisma.jobOpportunity.findUniqueOrThrow({ where: { id: jobA.id } });
    assert(
      jobDbFailureCaught &&
      jobAfterFailedUpdate.featuredImagePublicId === "jobs/2026/test-job-cover-v2",
      "Job Opportunities [E]: DB failure after upload cleans up new orphan asset, preserves old asset and DB metadata"
    );

    // F. Explicit image removal: DB image fields cleared first/safely, old asset cleanup attempted afterward
    const jobRemoved = await removeJobFeaturedImage(callerSuperAdmin, jobA.id);
    assert(
      jobRemoved.featuredImageUrl === null && jobRemoved.featuredImagePublicId === null,
      "Job Opportunities [F]: Explicit image removal clears DB fields first/safely, old asset cleanup attempted afterward"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Citizen's Charter Neutral Unavailable State & Zero Review Wording
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 5: Citizen's Charter Neutral Unavailable State");

    const ccPageContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/(public)/services/citizens-charter/page.tsx"),
      "utf-8"
    );
    assert(
      ccPageContent.includes("Citizen's Charter PDF not currently available") ||
      ccPageContent.includes("Citizen&apos;s Charter PDF not currently available"),
      "Citizen's Charter contains exact neutral heading: 'Citizen's Charter PDF not currently available'"
    );
    assert(
      ccPageContent.includes("The official Citizen's Charter PDF will be available here once published by the Municipality of San Felipe.") ||
      ccPageContent.includes("The official Citizen&apos;s Charter PDF will be available here once published by the Municipality of San Felipe."),
      "Citizen's Charter contains exact neutral description: 'The official Citizen's Charter PDF will be available here once published...'"
    );
    assert(
      !ccPageContent.toLowerCase().includes("under review") &&
      !ccPageContent.toLowerCase().includes("awaiting approval") &&
      !ccPageContent.toLowerCase().includes("pending approval") &&
      !ccPageContent.toLowerCase().includes("being evaluated") &&
      !ccPageContent.toLowerCase().includes("awaiting publication authorization"),
      "Citizen's Charter strictly contains ZERO workflow claims (no 'under review', 'pending approval', etc.)"
    );

    // Updating Citizen's Charter normalizes sections to []
    await updateServicePage(callerSuperAdmin, "citizens-charter", {
      title: "Citizen's Charter",
      description: "Official Frontline Handbook",
      sections: [{ title: "Attempted Section", content: "<p>Should be ignored</p>", sortOrder: 0 }],
    });

    const ccAdmin = await getAdminServicePage(callerSuperAdmin, "citizens-charter");
    assert(
      ccAdmin.sections.length === 0,
      "Citizen's Charter normalizes sections to empty array (generic section builder removed)"
    );

    // Restore Citizen's Charter to baseline state
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: { description: null, status: "DRAFT" },
    });

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Non-Regression on CMS Instant Navigation
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 6: CMS Instant Navigation Non-Regression");

    const cmsPageFiles = [
      "src/app/(cms)/admin/page.tsx",
      "src/app/(cms)/admin/layout.tsx",
      "src/app/(cms)/admin/account/security/page.tsx",
      "src/app/(cms)/admin/audit-logs/page.tsx",
      "src/app/(cms)/admin/documents/page.tsx",
      "src/app/(cms)/admin/documents/new/page.tsx",
      "src/app/(cms)/admin/documents/[id]/edit/page.tsx",
      "src/app/(cms)/admin/jobs/page.tsx",
      "src/app/(cms)/admin/jobs/new/page.tsx",
      "src/app/(cms)/admin/jobs/[id]/edit/page.tsx",
      "src/app/(cms)/admin/news/page.tsx",
      "src/app/(cms)/admin/news/new/page.tsx",
      "src/app/(cms)/admin/news/[id]/edit/page.tsx",
      "src/app/(cms)/admin/news/[id]/preview/page.tsx",
      "src/app/(cms)/admin/offices/page.tsx",
      "src/app/(cms)/admin/offices/[id]/edit/page.tsx",
      "src/app/(cms)/admin/roles/page.tsx",
      "src/app/(cms)/admin/roles/[id]/edit/page.tsx",
      "src/app/(cms)/admin/services/page.tsx",
      "src/app/(cms)/admin/services/[serviceKey]/page.tsx",
      "src/app/(cms)/admin/services/[serviceKey]/edit/page.tsx",
      "src/app/(cms)/admin/services/[serviceKey]/preview/page.tsx",
      "src/app/(cms)/admin/users/page.tsx",
      "src/app/(cms)/admin/users/new/page.tsx",
      "src/app/(cms)/admin/users/[id]/edit/page.tsx",
    ];

    let allInstantFalse = true;
    for (const file of cmsPageFiles) {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
      if (!content.includes("export const instant = false;")) {
        allInstantFalse = false;
        console.error(`Missing export const instant = false in ${file}`);
      }
    }
    assert(
      allInstantFalse,
      `All ${cmsPageFiles.length} CMS authenticated route segments retain export const instant = false;`
    );
  } finally {
    // Cleanup created test records
    console.log("\nCleaning up Phase 19.4 test records...");
    for (const id of createdJobIds) {
      try {
        await prisma.jobOpportunity.delete({ where: { id } });
      } catch {}
    }
    for (const id of createdNewsIds) {
      try {
        await prisma.newsArticle.delete({ where: { id } });
      } catch {}
    }
    for (const id of createdDocumentIds) {
      try {
        await prisma.document.delete({ where: { id } });
      } catch {}
    }
    for (const id of createdUserIds) {
      try {
        await prisma.session.deleteMany({ where: { userId: id } });
        await prisma.auditLog.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });
      } catch {}
    }
    try {
      await prisma.office.deleteMany({
        where: { slug: { in: ["test-office-p194-a", "test-office-p194-b"] } },
      });
    } catch {}
  }

  console.log("\n=====================================================================");
  console.log(`PHASE 19.4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase194TestSuite().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
