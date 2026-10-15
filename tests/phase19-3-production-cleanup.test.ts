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

async function runPhase193TestSuite() {
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
  console.log("SAN FELIPE LGU CMS PRODUCTION CLEANUP & LIFECYCLE (PHASE 19.3)");
  console.log("=====================================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const { CANONICAL_PRODUCTION_ROLES } = await import("../src/server/roles/service");
  const {
    createUser,
    updateUser,
    UserError,
  } = await import("../src/server/users/service");
  const {
    deleteNewsArticle,
    NewsError,
  } = await import("../src/server/news/service");
  const {
    deleteDocument,
    getPublishedDocuments,
    DocumentError,
  } = await import("../src/server/documents/service");
  const {
    deleteJobOpportunity,
  } = await import("../src/server/jobs/service");
  const {
    updateServicePage,
    getPublishedServicePage,
  } = await import("../src/server/services/service");
  const { ADMIN_NAV_CONFIG } = await import("../src/config/admin-navigation");
  const { PERMISSIONS } = await import("../src/server/authz/permissions");
  const { AUDIT_ACTIONS } = await import("../src/server/audit/constants");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (detail) console.error(`    Detail: ${detail}`);
      failed++;
    }
  }

  // Fetch reference roles from seed
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "super-admin" } });
  const officeAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "office-admin" } });
  const staffRole = await prisma.role.findUniqueOrThrow({ where: { slug: "staff" } });
  const approverRole = await prisma.role.findUnique({ where: { slug: "approver" } });

  const mpdoOffice = await prisma.office.findFirstOrThrow({
    where: { slug: "municipal-planning-and-development-office", status: "ACTIVE" },
  });
  const mhoOffice = await prisma.office.findFirstOrThrow({
    where: { slug: "municipal-health-office", status: "ACTIVE" },
  });

  const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$fakehashfakehashfakehash$fakehashfakehashfakehash";

  // Upsert valid test database users so auditLog foreign keys succeed
  const dbSuperAdmin = await prisma.user.upsert({
    where: { email: "test.superadmin.p193@sanfelipe.gov.ph" },
    update: { roleId: superAdminRole.id, status: "ACTIVE" },
    create: {
      name: "Test Super Admin",
      email: "test.superadmin.p193@sanfelipe.gov.ph",
      passwordHash: dummyHash,
      roleId: superAdminRole.id,
      officeId: null,
      status: "ACTIVE",
    },
  });

  const dbMpdoAdmin = await prisma.user.upsert({
    where: { email: "test.mpdoadmin.p193@sanfelipe.gov.ph" },
    update: { roleId: officeAdminRole.id, officeId: mpdoOffice.id, status: "ACTIVE" },
    create: {
      name: "Test MPDO Admin",
      email: "test.mpdoadmin.p193@sanfelipe.gov.ph",
      passwordHash: dummyHash,
      roleId: officeAdminRole.id,
      officeId: mpdoOffice.id,
      status: "ACTIVE",
    },
  });

  const dbMhoAdmin = await prisma.user.upsert({
    where: { email: "test.mhoadmin.p193@sanfelipe.gov.ph" },
    update: { roleId: officeAdminRole.id, officeId: mhoOffice.id, status: "ACTIVE" },
    create: {
      name: "Test MHO Admin",
      email: "test.mhoadmin.p193@sanfelipe.gov.ph",
      passwordHash: dummyHash,
      roleId: officeAdminRole.id,
      officeId: mhoOffice.id,
      status: "ACTIVE",
    },
  });

  const dbMpdoStaff = await prisma.user.upsert({
    where: { email: "test.mpdostaff.p193@sanfelipe.gov.ph" },
    update: { roleId: staffRole.id, officeId: mpdoOffice.id, status: "ACTIVE" },
    create: {
      name: "Test MPDO Staff",
      email: "test.mpdostaff.p193@sanfelipe.gov.ph",
      passwordHash: dummyHash,
      roleId: staffRole.id,
      officeId: mpdoOffice.id,
      status: "ACTIVE",
    },
  });

  // Mock Session Users with valid DB IDs
  const superAdminUser: SessionUser = {
    id: dbSuperAdmin.id,
    name: dbSuperAdmin.name,
    email: dbSuperAdmin.email,
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
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DISABLE,
      PERMISSIONS.POSTS_VIEW,
      PERMISSIONS.POSTS_CREATE,
      PERMISSIONS.POSTS_UPDATE,
      PERMISSIONS.POSTS_PUBLISH,
      PERMISSIONS.POSTS_ARCHIVE,
      PERMISSIONS.POSTS_DELETE,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.DOCUMENTS_UPDATE,
      PERMISSIONS.DOCUMENTS_PUBLISH,
      PERMISSIONS.DOCUMENTS_ARCHIVE,
      PERMISSIONS.DOCUMENTS_DELETE,
      PERMISSIONS.JOBS_VIEW,
      PERMISSIONS.JOBS_CREATE,
      PERMISSIONS.JOBS_UPDATE,
      PERMISSIONS.JOBS_PUBLISH,
      PERMISSIONS.JOBS_ARCHIVE,
      PERMISSIONS.JOBS_DELETE,
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.SERVICES_UPDATE,
      PERMISSIONS.SERVICES_PUBLISH,
    ],
    status: "ACTIVE",
    sessionId: "sess-p193-superadmin",
  };

  const mpdoAdminUser: SessionUser = {
    id: dbMpdoAdmin.id,
    name: dbMpdoAdmin.name,
    email: dbMpdoAdmin.email,
    roleId: officeAdminRole.id,
    role: {
      id: officeAdminRole.id,
      name: officeAdminRole.name,
      slug: officeAdminRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    officeId: mpdoOffice.id,
    office: {
      id: mpdoOffice.id,
      name: mpdoOffice.name,
      slug: mpdoOffice.slug,
      shortName: mpdoOffice.shortName,
    },
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DISABLE,
      PERMISSIONS.POSTS_VIEW,
      PERMISSIONS.POSTS_CREATE,
      PERMISSIONS.POSTS_UPDATE,
      PERMISSIONS.POSTS_PUBLISH,
      PERMISSIONS.POSTS_ARCHIVE,
      PERMISSIONS.POSTS_DELETE,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.DOCUMENTS_UPDATE,
      PERMISSIONS.DOCUMENTS_PUBLISH,
      PERMISSIONS.DOCUMENTS_ARCHIVE,
      PERMISSIONS.DOCUMENTS_DELETE,
      PERMISSIONS.JOBS_VIEW,
      PERMISSIONS.JOBS_CREATE,
      PERMISSIONS.JOBS_UPDATE,
      PERMISSIONS.JOBS_PUBLISH,
      PERMISSIONS.JOBS_ARCHIVE,
      PERMISSIONS.JOBS_DELETE,
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.SERVICES_UPDATE,
      PERMISSIONS.SERVICES_PUBLISH,
    ],
    status: "ACTIVE",
    sessionId: "sess-p193-mpdo-admin",
  };

  const mhoAdminUser: SessionUser = {
    id: dbMhoAdmin.id,
    name: dbMhoAdmin.name,
    email: dbMhoAdmin.email,
    roleId: officeAdminRole.id,
    role: {
      id: officeAdminRole.id,
      name: officeAdminRole.name,
      slug: officeAdminRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    officeId: mhoOffice.id,
    office: {
      id: mhoOffice.id,
      name: mhoOffice.name,
      slug: mhoOffice.slug,
      shortName: mhoOffice.shortName,
    },
    permissions: mpdoAdminUser.permissions,
    status: "ACTIVE",
    sessionId: "sess-p193-mho-admin",
  };

  const mpdoStaffUser: SessionUser = {
    id: dbMpdoStaff.id,
    name: dbMpdoStaff.name,
    email: dbMpdoStaff.email,
    roleId: staffRole.id,
    role: {
      id: staffRole.id,
      name: staffRole.name,
      slug: staffRole.slug,
      isSystemScope: false,
    },
    isSystemScope: false,
    officeId: mpdoOffice.id,
    office: {
      id: mpdoOffice.id,
      name: mpdoOffice.name,
      slug: mpdoOffice.slug,
      shortName: mpdoOffice.shortName,
    },
    permissions: [
      PERMISSIONS.POSTS_VIEW,
      PERMISSIONS.POSTS_CREATE,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.JOBS_VIEW,
      PERMISSIONS.JOBS_CREATE,
      // NO delete permissions
      // NO user permissions
    ],
    status: "ACTIVE",
    sessionId: "sess-p193-mpdo-staff",
  };

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: Canonical Production Roles & Safe Role Retirement
    // -------------------------------------------------------------------------
    console.log("TEST GROUP 1: Canonical Roles & Safe Role Retirement");

    assert(
      CANONICAL_PRODUCTION_ROLES.length === 3 &&
        CANONICAL_PRODUCTION_ROLES.includes("super-admin") &&
        CANONICAL_PRODUCTION_ROLES.includes("office-admin") &&
        CANONICAL_PRODUCTION_ROLES.includes("staff"),
      "CANONICAL_PRODUCTION_ROLES contains exactly super-admin, office-admin, and staff"
    );

    // Attempting to create user with retired role (approver) must fail
    if (approverRole) {
      let rejected = false;
      try {
        await createUser(superAdminUser, {
          name: "Test Retired User",
          email: `test.retired.${Date.now()}@sanfelipe.gov.ph`,
          password: "SecurePassword123!@",
          roleId: approverRole.id,
          officeId: mpdoOffice.id,
        });
      } catch (err: unknown) {
        if (err instanceof UserError && err.statusCode === 400 && err.message.includes("retired")) {
          rejected = true;
        }
      }
      assert(rejected, "createUser rejects assigning retired role (approver) with 400 error");
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Office Admin Staff Account Management Hardening
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 2: Office Admin Staff Account Management");

    // Office Admin creates staff account: office and role are strictly derived server-side
    const testStaffEmail = `staff.mpdo.${Date.now()}@sanfelipe.gov.ph`;
    const createdStaff = await createUser(mpdoAdminUser, {
      name: "MPDO New Staff",
      email: testStaffEmail,
      password: "StrongStaffPass123!@",
      // Attempt to forge MHO office and super-admin role
      officeId: mhoOffice.id,
      roleId: superAdminRole.id,
    });

    assert(
      createdStaff.officeId === mpdoOffice.id,
      "Server overrides forged officeId with Office Admin's authenticated office (MPDO)",
      `Expected ${mpdoOffice.id}, got ${createdStaff.officeId}`
    );

    assert(
      createdStaff.roleId === staffRole.id,
      "Server overrides forged roleId with canonical Staff role",
      `Expected ${staffRole.id}, got ${createdStaff.roleId}`
    );

    // Office Admin cannot manage system administrator
    let forbiddenSysAdmin = false;
    try {
      await updateUser(mpdoAdminUser, superAdminUser.id, {
        name: "Hacked SuperAdmin",
        email: superAdminUser.email,
      });
    } catch (err: unknown) {
      if (err instanceof UserError && err.statusCode === 403) {
        forbiddenSysAdmin = true;
      }
    }
    assert(forbiddenSysAdmin, "Office Admin is strictly forbidden from modifying system accounts (403)");

    // Office Admin Staff Status Management Tests
    const testStaff2 = await prisma.user.create({
      data: {
        name: "MPDO Subordinate Staff",
        email: `subordinate.${Date.now()}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: staffRole.id,
        officeId: mpdoOffice.id,
        status: "ACTIVE",
      },
    });

    // Create an active session in DB for this staff user
    const staffSession = await prisma.session.create({
      data: {
        userId: testStaff2.id,
        tokenHash: `tokenhash-test-p193-${Date.now()}`,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });

    // 1. Office Admin disables own Staff
    const disabledStaff = await updateUser(mpdoAdminUser, testStaff2.id, {
      name: testStaff2.name,
      email: testStaff2.email,
      status: "INACTIVE",
    });
    assert(disabledStaff.status === "INACTIVE", "Office Admin can disable own-office Staff account");

    // Verify session was revoked in database
    const sessionAfterDisable = await prisma.session.findUnique({
      where: { id: staffSession.id },
    });
    assert(sessionAfterDisable?.revokedAt !== null, "Disabling Staff account immediately revokes all active database sessions");

    // Verify audit log exists
    const disableAudit = await prisma.auditLog.findFirst({
      where: {
        action: AUDIT_ACTIONS.USER_DISABLED,
        details: { path: ["targetUserId"], equals: testStaff2.id },
      },
    });
    assert(Boolean(disableAudit), "Office Admin disabling Staff generates USER_DISABLED audit log");

    // 2. Office Admin re-activates own Staff
    const activatedStaff = await updateUser(mpdoAdminUser, testStaff2.id, {
      name: testStaff2.name,
      email: testStaff2.email,
      status: "ACTIVE",
    });
    assert(activatedStaff.status === "ACTIVE", "Office Admin can reactivate own-office Staff account");

    // 3. Office Admin cannot change status of Staff in another office
    const otherOfficeStaff = await prisma.user.create({
      data: {
        name: "MHO Staff Member",
        email: `mhostaff.${Date.now()}@sanfelipe.gov.ph`,
        passwordHash: dummyHash,
        roleId: staffRole.id,
        officeId: mhoOffice.id,
        status: "ACTIVE",
      },
    });

    let crossOfficeStatusBlocked = false;
    try {
      await updateUser(mpdoAdminUser, otherOfficeStaff.id, {
        name: otherOfficeStaff.name,
        email: otherOfficeStaff.email,
        status: "INACTIVE",
      });
    } catch (err: unknown) {
      if (err instanceof UserError && err.statusCode === 403) {
        crossOfficeStatusBlocked = true;
      }
    }
    assert(crossOfficeStatusBlocked, "Office Admin cannot change status of Staff in another office (403)");

    // 4. Office Admin cannot change status of another Office Admin
    let adminStatusBlocked = false;
    try {
      await updateUser(mpdoAdminUser, dbMhoAdmin.id, {
        name: dbMhoAdmin.name,
        email: dbMhoAdmin.email,
        status: "INACTIVE",
      });
    } catch (err: unknown) {
      if (err instanceof UserError && err.statusCode === 403) {
        adminStatusBlocked = true;
      }
    }
    assert(adminStatusBlocked, "Office Admin cannot change status of another Office Admin (403)");

    // 5. Office Admin cannot change status of Super Admin
    let superAdminStatusBlocked = false;
    try {
      await updateUser(mpdoAdminUser, dbSuperAdmin.id, {
        name: dbSuperAdmin.name,
        email: dbSuperAdmin.email,
        status: "INACTIVE",
      });
    } catch (err: unknown) {
      if (err instanceof UserError && err.statusCode === 403) {
        superAdminStatusBlocked = true;
      }
    }
    assert(superAdminStatusBlocked, "Office Admin cannot change status of Super Admin (403)");

    // 6. Ordinary Staff cannot change user status
    let staffChangeStatusBlocked = false;
    try {
      await updateUser(mpdoStaffUser, testStaff2.id, {
        name: testStaff2.name,
        email: testStaff2.email,
        status: "INACTIVE",
      });
    } catch (err: unknown) {
      if (err instanceof UserError && (err.statusCode === 403 || err.statusCode === 401)) {
        staffChangeStatusBlocked = true;
      }
    }
    assert(staffChangeStatusBlocked, "Ordinary Staff cannot manage account status (403)");

    // Clean up test staff
    await prisma.user.deleteMany({
      where: { id: { in: [testStaff2.id, otherOfficeStaff.id] } },
    });

    // Cleanup test created user
    await prisma.user.delete({ where: { id: createdStaff.id } });

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Controlled Permanent Delete Matrix (News, Documents, Jobs)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 3: Controlled Permanent Delete Authorization Matrix");

    // Create a News Article in MPDO
    const mpdoNews = await prisma.newsArticle.create({
      data: {
        title: "MPDO Notice for Permanent Delete Test",
        slug: `mpdo-delete-test-${Date.now()}`,
        excerpt: "Test excerpt",
        body: "<p>Test article content for delete</p>",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
        status: "DRAFT",
      },
    });

    // Staff cannot delete News
    let staffDeleteBlocked = false;
    try {
      await deleteNewsArticle(mpdoStaffUser, mpdoNews.id);
    } catch (err: unknown) {
      if (err instanceof NewsError && err.statusCode === 403) {
        staffDeleteBlocked = true;
      }
    }
    assert(staffDeleteBlocked, "Staff is denied permanent deletion of News (403)");

    // Office Admin of MHO cannot delete MPDO News (cross-office protection)
    let crossOfficeNewsBlocked = false;
    try {
      await deleteNewsArticle(mhoAdminUser, mpdoNews.id);
    } catch (err: unknown) {
      if (err instanceof NewsError && err.statusCode === 403) {
        crossOfficeNewsBlocked = true;
      }
    }
    assert(crossOfficeNewsBlocked, "Office Admin cannot permanently delete News belonging to another office (403)");

    // MPDO Office Admin can delete MPDO News
    const deletedNewsRes = await deleteNewsArticle(mpdoAdminUser, mpdoNews.id);
    assert(deletedNewsRes.id === mpdoNews.id, "Office Admin can permanently delete News belonging to own office");

    const verifyNewsDeleted = await prisma.newsArticle.findUnique({ where: { id: mpdoNews.id } });
    assert(verifyNewsDeleted === null, "News record is completely removed from database");

    // Verify durable audit log exists for news deletion
    const newsAudit = await prisma.auditLog.findFirst({
      where: {
        action: AUDIT_ACTIONS.POST_DELETED,
        details: { path: ["articleId"], equals: mpdoNews.id },
      },
    });
    assert(Boolean(newsAudit), "Permanent delete creates durable audit log with POST_DELETED action");

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Document Dependency Protection (Section M)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 4: Document Dependency Protection");

    // Create a test Document
    const testDoc = await prisma.document.create({
      data: {
        title: "Official Vacancy Notice PDF",
        originalFilename: "vacancy-notice.pdf",
        storagePublicId: "san-felipe-lgu/documents/test-dependency-doc",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-dependency-doc.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 102400,
        purpose: "JOB_ATTACHMENT",
        status: "PUBLISHED",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    // Create a Job Opportunity linking this Document
    const testJob = await prisma.jobOpportunity.create({
      data: {
        title: "Senior Planning Officer",
        slug: `planning-officer-${Date.now()}`,
        officeId: mpdoOffice.id,
        description: "<p>Lead municipal development planning</p>",
        status: "PUBLISHED",
        attachmentDocumentId: testDoc.id,
        createdById: dbSuperAdmin.id,
      },
    });

    // Attempt to delete Document while referenced by Job
    let docDeleteBlockedByJob = false;
    let jobDependencyErrorMessage = "";
    try {
      await deleteDocument(superAdminUser, testDoc.id);
    } catch (err: unknown) {
      if (err instanceof DocumentError && err.statusCode === 400) {
        docDeleteBlockedByJob = true;
        jobDependencyErrorMessage = err.message;
      }
    }

    assert(docDeleteBlockedByJob, "Document deletion is blocked when referenced by a Job Opportunity (400)");
    assert(
      jobDependencyErrorMessage.includes("cannot be permanently deleted because it is currently used"),
      "Returns exact actionable dependency error message required by Section M"
    );

    // Verify Job attachment was NOT silently deleted or detached
    const verifyJobIntact = await prisma.jobOpportunity.findUnique({ where: { id: testJob.id } });
    assert(
      verifyJobIntact?.attachmentDocumentId === testDoc.id,
      "Referencing Job Opportunity is preserved without cascading destruction or silent detaching"
    );

    // Test Citizen's Charter ServicePage Document Dependency Protection
    const charterDoc = await prisma.document.create({
      data: {
        title: "Official San Felipe Citizen's Charter 2026",
        originalFilename: "citizens-charter-2026.pdf",
        storagePublicId: "san-felipe-lgu/documents/test-charter-doc",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-charter-doc.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 204800,
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    // Link charterDoc to citizens-charter ServicePage
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: { charterDocumentId: charterDoc.id },
    });

    let docDeleteBlockedByCharter = false;
    try {
      await deleteDocument(superAdminUser, charterDoc.id);
    } catch (err: unknown) {
      if (err instanceof DocumentError && err.statusCode === 400) {
        docDeleteBlockedByCharter = true;
      }
    }
    assert(docDeleteBlockedByCharter, "Document deletion is blocked when referenced by Citizen's Charter ServicePage (400)");

    // Detach from ServicePage and verify clean deletion
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: { charterDocumentId: null },
    });

    const deletedCharterDocRes = await deleteDocument(superAdminUser, charterDoc.id);
    assert(deletedCharterDocRes.id === charterDoc.id, "Unreferenced Citizen's Charter Document can be permanently deleted");

    // Clean up test job and testDoc
    await deleteJobOpportunity(superAdminUser, testJob.id);
    const deletedJobDocRes = await deleteDocument(superAdminUser, testDoc.id);
    assert(deletedJobDocRes.id === testDoc.id, "Document can be permanently deleted once Job reference is removed");

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Document Purpose & Downloadable Forms Separation
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 5: Document Purpose & Downloadable Forms Separation");

    // Create a DOWNLOADABLE_FORM document
    const formDoc = await prisma.document.create({
      data: {
        title: "Locational Clearance Application Form",
        originalFilename: "locational-clearance.pdf",
        storagePublicId: "san-felipe-lgu/documents/locational-clearance",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/locational-clearance.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 51200,
        purpose: "DOWNLOADABLE_FORM",
        category: "Building & Engineering",
        status: "PUBLISHED",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    // Create a CITIZENS_CHARTER document
    const charterDoc2 = await prisma.document.create({
      data: {
        title: "Municipal Citizen's Charter Handbook",
        originalFilename: "citizens-charter-handbook.pdf",
        storagePublicId: "san-felipe-lgu/documents/charter-handbook",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/charter-handbook.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1048576,
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    // getPublishedDocuments defaults to DOWNLOADABLE_FORM
    const publicForms = await getPublishedDocuments();
    const hasFormDoc = publicForms.some((d) => d.id === formDoc.id);
    const hasCharterDoc = publicForms.some((d) => d.id === charterDoc2.id);

    assert(hasFormDoc, "Downloadable Forms query returns document with purpose DOWNLOADABLE_FORM");
    assert(!hasCharterDoc, "Downloadable Forms query excludes document with purpose CITIZENS_CHARTER");

    // Cleanup test docs
    await deleteDocument(superAdminUser, formDoc.id);
    await deleteDocument(superAdminUser, charterDoc2.id);

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Citizen's Charter Managed PDF Public Integration
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 6: Citizen's Charter Managed PDF Public Integration");

    // Associate a published Citizen's Charter Document with citizens-charter ServicePage
    const officialCharterDoc = await prisma.document.create({
      data: {
        title: "Official San Felipe Citizen's Charter",
        originalFilename: "san-felipe-charter.pdf",
        storagePublicId: "san-felipe-lgu/documents/official-charter",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/official-charter.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 5242880,
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    await updateServicePage(superAdminUser, "citizens-charter", {
      title: "Citizen's Charter",
      charterDocumentId: officialCharterDoc.id,
      sections: [
        {
          title: "Service Standards Overview",
          content: "<p>Municipal service standards under RA 11032.</p>",
          sortOrder: 0,
        },
      ],
    });

    // Publish service page
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: { status: "PUBLISHED" },
    });

    const publicCharterPage = await getPublishedServicePage("citizens-charter");
    assert(
      publicCharterPage?.charterDocument?.id === officialCharterDoc.id,
      "Published Citizen's Charter page includes the linked charterDocument metadata"
    );
    assert(
      publicCharterPage?.charterDocument?.storageUrl === officialCharterDoc.storageUrl,
      "Published Citizen's Charter page provides valid storageUrl for View PDF"
    );

    // Citizen's Charter Association Hardening Tests:
    // 1. Attempt to attach charterDocumentId to business-permits
    let nonCharterPageBlocked = false;
    try {
      await updateServicePage(superAdminUser, "business-permits", {
        title: "Business Permits & Licensing",
        sections: [],
        charterDocumentId: officialCharterDoc.id,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Citizen's Charter")) {
        nonCharterPageBlocked = true;
      }
    }
    assert(nonCharterPageBlocked, "Attaching charterDocumentId to non-citizens-charter service page (business-permits) is rejected with 400");

    // 2. Attempt to attach charterDocumentId to downloadable-forms
    let downloadableFormsCharterBlocked = false;
    try {
      await updateServicePage(superAdminUser, "downloadable-forms", {
        title: "Downloadable Forms",
        sections: [],
        charterDocumentId: officialCharterDoc.id,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Citizen's Charter")) {
        downloadableFormsCharterBlocked = true;
      }
    }
    assert(downloadableFormsCharterBlocked, "Attaching charterDocumentId to downloadable-forms is rejected with 400");

    // 3. Attempt to attach charterDocumentId to job-opportunities
    let jobOpportunitiesCharterBlocked = false;
    try {
      await updateServicePage(superAdminUser, "job-opportunities", {
        title: "Job Opportunities",
        sections: [],
        charterDocumentId: officialCharterDoc.id,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Citizen's Charter")) {
        jobOpportunitiesCharterBlocked = true;
      }
    }
    assert(jobOpportunitiesCharterBlocked, "Attaching charterDocumentId to job-opportunities is rejected with 400");

    // 4. Attempt to attach a document with purpose != CITIZENS_CHARTER
    const nonCharterPurposeDoc = await prisma.document.create({
      data: {
        title: "Regular Form Document",
        originalFilename: "form.pdf",
        storagePublicId: "san-felipe-lgu/documents/test-non-charter",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-non-charter.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        purpose: "DOWNLOADABLE_FORM",
        status: "PUBLISHED",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    let invalidPurposeBlocked = false;
    try {
      await updateServicePage(superAdminUser, "citizens-charter", {
        title: "Citizen's Charter",
        sections: [],
        charterDocumentId: nonCharterPurposeDoc.id,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("purpose")) {
        invalidPurposeBlocked = true;
      }
    }
    assert(invalidPurposeBlocked, "Attaching document with purpose DOWNLOADABLE_FORM as Citizen's Charter is rejected with 400");
    await deleteDocument(superAdminUser, nonCharterPurposeDoc.id);

    // 5. Attempt to attach a DRAFT Citizen's Charter document
    const draftCharterDoc = await prisma.document.create({
      data: {
        title: "Draft Charter Document",
        originalFilename: "draft-charter.pdf",
        storagePublicId: "san-felipe-lgu/documents/test-draft-charter",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-draft-charter.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        purpose: "CITIZENS_CHARTER",
        status: "DRAFT",
        officeId: mpdoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    let draftCharterBlocked = false;
    try {
      await updateServicePage(superAdminUser, "citizens-charter", {
        title: "Citizen's Charter",
        sections: [],
        charterDocumentId: draftCharterDoc.id,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("PUBLISHED")) {
        draftCharterBlocked = true;
      }
    }
    assert(draftCharterBlocked, "Attaching DRAFT Citizen's Charter document is rejected with 400");
    await deleteDocument(superAdminUser, draftCharterDoc.id);

    // 6. Cross-office Citizen's Charter document attachment by Office Admin
    const mhoCharterDoc = await prisma.document.create({
      data: {
        title: "MHO Specific Charter Document",
        originalFilename: "mho-charter.pdf",
        storagePublicId: "san-felipe-lgu/documents/test-mho-charter",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-mho-charter.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        officeId: mhoOffice.id,
        createdById: dbSuperAdmin.id,
      },
    });

    // Assign citizens-charter temporarily to MPDO so MPDO admin is authorized on the page
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: { officeId: mpdoOffice.id },
    });

    let crossOfficeCharterBlocked = false;
    try {
      await updateServicePage(mpdoAdminUser, "citizens-charter", {
        title: "Citizen's Charter",
        sections: [],
        charterDocumentId: mhoCharterDoc.id,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("another municipal office")) {
        crossOfficeCharterBlocked = true;
      }
    }
    assert(crossOfficeCharterBlocked, "Office Admin cannot attach Citizen's Charter document belonging to another office (403)");
    await deleteDocument(superAdminUser, mhoCharterDoc.id);

    // Clean up
    await prisma.serviceSection.deleteMany({
      where: { servicePage: { serviceKey: "citizens-charter" } },
    });
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: { charterDocumentId: null, officeId: null, status: "DRAFT" },
    });
    await deleteDocument(superAdminUser, officialCharterDoc.id);

    // -------------------------------------------------------------------------
    // TEST GROUP 7: Obsolete CMS Navigation Cleanup
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 7: Obsolete CMS Navigation Cleanup");

    const contentMgmtGroup = ADMIN_NAV_CONFIG.find((g) => g.title === "Content Management");
    assert(Boolean(contentMgmtGroup), "Content Management section exists in ADMIN_NAV_CONFIG");

    const contentItemHrefs = contentMgmtGroup?.items.map((i) => i.href) || [];
    assert(
      contentItemHrefs.includes("/admin/news") &&
        contentItemHrefs.includes("/admin/services") &&
        contentItemHrefs.includes("/admin/documents") &&
        contentItemHrefs.includes("/admin/jobs") &&
        contentItemHrefs.length === 4,
      "Content Management navigation contains exactly News, Services, Documents, and Jobs",
      `Got items: ${contentItemHrefs.join(", ")}`
    );

    const documentsNavItem = contentMgmtGroup?.items.find((i) => i.href === "/admin/documents");
    assert(documentsNavItem?.id === "documents", "CMS navigation item ID is 'documents'");
    assert(documentsNavItem?.label === "Documents", "CMS navigation item label is 'Documents'");

    const allNavItems = ADMIN_NAV_CONFIG.flatMap((g) => g.items);
    const hasEmergencyHotlinesInCMS = allNavItems.some((i) => i.href.includes("emergency-hotlines"));
    assert(!hasEmergencyHotlinesInCMS, "Emergency Hotlines is completely removed from CMS navigation");

    const hasUpcomingBadges = allNavItems.some((i) => !i.isImplemented || Boolean(i.phaseLabel));
    assert(!hasUpcomingBadges, "No CMS navigation item contains an UPCOMING badge");

    // -------------------------------------------------------------------------
    // TEST GROUP 8: Super Admin Credentials Preservation
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 8: Super Admin Credentials Preservation (Section D)");

    const superAdminInDb = await prisma.user.findFirst({
      where: { role: { slug: "super-admin" }, email: { not: dbSuperAdmin.email } },
      select: { id: true, email: true, status: true, passwordHash: true },
    });

    assert(Boolean(superAdminInDb), "Super Admin production user exists in database");
    assert(
      superAdminInDb?.status === "ACTIVE",
      "Super Admin account status is ACTIVE"
    );
    assert(
      Boolean(superAdminInDb?.passwordHash && superAdminInDb.passwordHash.startsWith("$argon2id$")),
      "Super Admin password hash is preserved and hashed with Argon2id"
    );

  } catch (err) {
    console.error("FATAL UNEXPECTED ERROR IN TEST SUITE:", err);
    failed++;
  } finally {
    // Clean up test users and restore canonical service state
    await prisma.serviceSection.deleteMany({
      where: { servicePage: { serviceKey: "citizens-charter" } },
    });
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: { charterDocumentId: null, officeId: null, status: "DRAFT" },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: {
        id: { in: [dbSuperAdmin.id, dbMpdoAdmin.id, dbMhoAdmin.id, dbMpdoStaff.id] },
      },
    });
    await prisma.$disconnect();
  }

  console.log("\n=====================================================================");
  console.log(`PHASE 19.3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase193TestSuite().catch((err) => {
  console.error("Fatal runner error:", err);
  process.exit(1);
});
