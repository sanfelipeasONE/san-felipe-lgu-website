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

async function runJobOpportunitiesTestSuite() {
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

  console.log("=======================================================");
  console.log("SAN FELIPE LGU JOB OPPORTUNITIES TEST SUITE (PHASE 15)");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    createJobOpportunity,
    updateJobOpportunity,
    publishJobOpportunity,
    archiveJobOpportunity,
    getAdminJobsList,
    getAdminJobById,
    getPublishedJobOpportunities,
    JobError,
  } = await import("../src/server/jobs/service");
  const {
    jobOpportunityInputSchema,
    generateJobSlug,
    isJobClosed,
    sanitizePlainText,
  } = await import("../src/lib/validation/jobs");
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

  const createdJobIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup Test Offices
    // -------------------------------------------------------------------------
    const officeBPLO = await prisma.office.upsert({
      where: { slug: "test-bplo-p15" },
      update: { name: "Business Permits & Licensing Office", status: "ACTIVE" },
      create: {
        name: "Business Permits & Licensing Office",
        shortName: "BPLO",
        slug: "test-bplo-p15",
        status: "ACTIVE",
      },
    });

    const officeMHO = await prisma.office.upsert({
      where: { slug: "test-mho-p15" },
      update: { name: "Municipal Health Office", status: "ACTIVE" },
      create: {
        name: "Municipal Health Office",
        shortName: "MHO",
        slug: "test-mho-p15",
        status: "ACTIVE",
      },
    });

    const inactiveOffice = await prisma.office.upsert({
      where: { slug: "test-inactive-p15" },
      update: { name: "Inactive Department", status: "INACTIVE" },
      create: {
        name: "Inactive Department",
        shortName: "INACT",
        slug: "test-inactive-p15",
        status: "INACTIVE",
      },
    });

    // -------------------------------------------------------------------------
    // Setup Test Users in Database
    // -------------------------------------------------------------------------
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "super-admin" } });
    const staffRole = await prisma.role.findUniqueOrThrow({ where: { slug: "staff" } });

    const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$fakehashfakehashfakehash$fakehashfakehashfakehash";

    const dbSuperAdmin = await prisma.user.upsert({
      where: { email: "test.superadmin.p15@sanfelipe.gov.ph" },
      update: { officeId: officeBPLO.id, roleId: superAdminRole.id },
      create: {
        name: "Test Super Admin",
        email: "test.superadmin.p15@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: officeBPLO.id,
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
    });

    const dbBploStaff = await prisma.user.upsert({
      where: { email: "test.bplo.staff.p15@sanfelipe.gov.ph" },
      update: { officeId: officeBPLO.id, roleId: staffRole.id },
      create: {
        name: "Test BPLO Staff",
        email: "test.bplo.staff.p15@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: officeBPLO.id,
        roleId: staffRole.id,
        status: "ACTIVE",
      },
    });

    const dbMhoStaff = await prisma.user.upsert({
      where: { email: "test.mho.staff.p15@sanfelipe.gov.ph" },
      update: { officeId: officeMHO.id, roleId: staffRole.id },
      create: {
        name: "Test MHO Staff",
        email: "test.mho.staff.p15@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: officeMHO.id,
        roleId: staffRole.id,
        status: "ACTIVE",
      },
    });

    // Mock Session Users
    const superAdminUser: SessionUser = {
      id: dbSuperAdmin.id,
      name: dbSuperAdmin.name,
      email: dbSuperAdmin.email,
      isSystemScope: true,
      roleId: superAdminRole.id,
      office: null,
      sessionId: "mock-super-admin-session-p15",
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: true,
      },
      officeId: officeBPLO.id,
      status: "ACTIVE",
      permissions: [
        "jobs.view",
        "jobs.create",
        "jobs.update",
        "jobs.publish",
        "jobs.archive",
        "documents.view",
      ],
    };

    const bploStaffUser: SessionUser = {
      id: dbBploStaff.id,
      name: dbBploStaff.name,
      email: dbBploStaff.email,
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-bplo-staff-session-p15",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: officeBPLO.id,
      status: "ACTIVE",
      permissions: [
        "jobs.view",
        "jobs.create",
        "jobs.update",
        "jobs.publish",
        "jobs.archive",
        "documents.view",
      ],
    };

    const bploStaffNoArchiveUser: SessionUser = {
      ...bploStaffUser,
      permissions: [
        "jobs.view",
        "jobs.create",
        "jobs.update",
        "jobs.publish",
        "documents.view",
      ], // Lacks jobs.archive
    };

    const bploStaffNoDocUser: SessionUser = {
      ...bploStaffUser,
      permissions: [
        "jobs.view",
        "jobs.create",
        "jobs.update",
        "jobs.publish",
        "jobs.archive",
      ], // Lacks documents.view
    };

    const mhoStaffUser: SessionUser = {
      id: dbMhoStaff.id,
      name: dbMhoStaff.name,
      email: dbMhoStaff.email,
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-mho-staff-session-p15",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: officeMHO.id,
      status: "ACTIVE",
      permissions: [
        "jobs.view",
        "jobs.create",
        "jobs.update",
        "jobs.publish",
        "jobs.archive",
        "documents.view",
      ],
    };

    const unassignedUser: SessionUser = {
      id: "unassigned-user-id-p15",
      name: "Unassigned Staff",
      email: "unassigned.p15@sanfelipe.gov.ph",
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-unassigned-session-p15",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: null,
      status: "ACTIVE",
      permissions: ["jobs.view", "jobs.create", "jobs.update"],
    };

    const viewerUser: SessionUser = {
      id: "viewer-user-id-p15",
      name: "View-only User",
      email: "viewer.p15@sanfelipe.gov.ph",
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-viewer-session-p15",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: officeBPLO.id,
      status: "ACTIVE",
      permissions: ["jobs.view"], // lacks create, update, publish, archive
    };

    // -------------------------------------------------------------------------
    // Setup Test Documents for Attachment Linking & Lifecycle Testing
    // -------------------------------------------------------------------------
    const docPublishedBPLO = await prisma.document.create({
      data: {
        title: "Official BPLO Application Notice",
        originalFilename: "bplo-notice.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 2048,
        storagePublicId: "raw/test-bplo-notice-p15",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-bplo-notice-p15.pdf",
        status: "PUBLISHED",
        officeId: officeBPLO.id,
        createdById: dbSuperAdmin.id,
      },
    });

    const docDraftBPLO = await prisma.document.create({
      data: {
        title: "Draft BPLO Internal Notes",
        originalFilename: "draft-notes.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        storagePublicId: "raw/test-draft-notes-p15",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-draft-notes-p15.pdf",
        status: "DRAFT",
        officeId: officeBPLO.id,
        createdById: dbSuperAdmin.id,
      },
    });

    const docArchivedBPLO = await prisma.document.create({
      data: {
        title: "Archived BPLO Old Policy",
        originalFilename: "archived-policy.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        storagePublicId: "raw/test-archived-policy-p15",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-archived-policy-p15.pdf",
        status: "ARCHIVED",
        officeId: officeBPLO.id,
        createdById: dbSuperAdmin.id,
      },
    });

    const docPublishedMHO = await prisma.document.create({
      data: {
        title: "MHO Health Form",
        originalFilename: "mho-form.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        storagePublicId: "raw/test-mho-form-p15",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/test-mho-form-p15.pdf",
        status: "PUBLISHED",
        officeId: officeMHO.id,
        createdById: dbSuperAdmin.id,
      },
    });

    // -------------------------------------------------------------------------
    // 1. Zod Validation & Sanitization Tests
    // -------------------------------------------------------------------------
    console.log("1. Zod Validation & Content Safety");

    const validParsed = jobOpportunityInputSchema.safeParse({
      title: "Administrative Aide VI",
      itemNumber: "MHO-001",
      employmentType: "Permanent",
      salaryGrade: "6",
      monthlySalary: "₱17,553.00",
      description: "Assists in departmental administrative tasks.",
      education: "Completion of two years studies in college",
      training: "None required",
      experience: "None required",
      eligibility: "Career Service (Subprofessional)",
      postingDate: "2026-10-01",
      closingDate: "2026-10-31",
    });
    assert(validParsed.success, "Valid job opportunity input is accepted by schema");

    const optionalEmploymentType = jobOpportunityInputSchema.safeParse({
      title: "Valid Title Without Employment Type",
    });
    assert(optionalEmploymentType.success, "employmentType is completely optional in Zod schema");

    const shortTitleParsed = jobOpportunityInputSchema.safeParse({
      title: "AB",
    });
    assert(!shortTitleParsed.success, "Position title under 3 characters is rejected");

    const invalidDateParsed = jobOpportunityInputSchema.safeParse({
      title: "Valid Title",
      postingDate: "not-a-date",
    });
    assert(!invalidDateParsed.success, "Invalid postingDate format is rejected");

    const invalidClosingDateParsed = jobOpportunityInputSchema.safeParse({
      title: "Valid Title",
      closingDate: "invalid-date",
    });
    assert(!invalidClosingDateParsed.success, "Invalid closingDate format is rejected");

    const reversedDatesParsed = jobOpportunityInputSchema.safeParse({
      title: "Valid Title",
      postingDate: "2026-10-30",
      closingDate: "2026-10-01", // earlier than postingDate!
    });
    assert(!reversedDatesParsed.success, "Closing date earlier than posting date is rejected");

    // Plain text sanitization
    const sanitizedHtml = sanitizePlainText("<script>alert('xss')</script>Hello World");
    assert(sanitizedHtml === "alert('xss')Hello World", "HTML tags are stripped by plain text sanitizer");

    // Slug generation
    const slug = generateJobSlug("Administrative Officer IV (HRMO II)", "test12");
    assert(slug.includes("administrative-officer-iv-hrmo-ii"), "Slug generation normalizes position title cleanly");

    // -------------------------------------------------------------------------
    // 2. Permission & Scope Authorization Checks
    // -------------------------------------------------------------------------
    console.log("\n2. Permission & Scope Authorization Checks");

    let lackedCreate = false;
    try {
      await createJobOpportunity(viewerUser, {
        title: "Unauthorized Vacancy",
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        lackedCreate = true;
      }
    }
    assert(lackedCreate, "createJobOpportunity rejects user lacking jobs.create permission");

    let lackedView = false;
    try {
      await getAdminJobsList({
        ...viewerUser,
        permissions: [],
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        lackedView = true;
      }
    }
    assert(lackedView, "getAdminJobsList rejects user lacking jobs.view permission");

    // -------------------------------------------------------------------------
    // 3. Office Ownership & Forgery Prevention
    // -------------------------------------------------------------------------
    console.log("\n3. Office Ownership & Isolation");

    // Office-scoped user cannot forge office ownership
    const createdByStaff = await createJobOpportunity(bploStaffUser, {
      title: "Licensing Officer II",
      itemNumber: "BPLO-2026-02",
      employmentType: "Permanent",
      salaryGrade: "15",
      description: "Assists in business licensing assessment and renewal.",
      education: "Bachelor's degree relevant to the job",
      officeId: officeMHO.id, // Malicious attack: Attempting to assign to MHO!
    });
    createdJobIds.push(createdByStaff.id);

    assert(
      createdByStaff.officeId === officeBPLO.id,
      "OFFICE-scoped user vacancy officeId is strictly bound to user.officeId (forgery prevented)"
    );
    assert(createdByStaff.status === "DRAFT", "Newly created vacancy defaults to DRAFT status");

    // Unassigned user cannot create vacancy
    let unassignedFailed = false;
    try {
      await createJobOpportunity(unassignedUser, {
        title: "Unassigned Staff Vacancy",
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        unassignedFailed = true;
      }
    }
    assert(unassignedFailed, "Office-scoped user without assigned office cannot create vacancies");

    // SYSTEM scope user creating vacancy for MHO
    const createdByAdmin = await createJobOpportunity(superAdminUser, {
      title: "Rural Health Physician",
      itemNumber: "MHO-2026-01",
      employmentType: "Permanent",
      salaryGrade: "24",
      description: "Provides primary clinical care and maternal health services.",
      officeId: officeMHO.id,
    });
    createdJobIds.push(createdByAdmin.id);

    assert(
      createdByAdmin.officeId === officeMHO.id,
      "SYSTEM-scoped user can assign vacancy to specified active office"
    );

    // SYSTEM scope user cannot assign to INACTIVE office
    let inactiveOfficeFailed = false;
    try {
      await createJobOpportunity(superAdminUser, {
        title: "Inactive Office Vacancy",
        officeId: inactiveOffice.id,
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 400) {
        inactiveOfficeFailed = true;
      }
    }
    assert(inactiveOfficeFailed, "SYSTEM-scoped user cannot assign vacancy to inactive office");

    // Creating vacancy with optional employmentType omitted
    const createdWithoutType = await createJobOpportunity(bploStaffUser, {
      title: "Clerk I (No Type Specified)",
    });
    createdJobIds.push(createdWithoutType.id);
    assert(createdWithoutType.employmentType === null, "Vacancy created without employmentType persists as null");

    // Creating vacancy with same-office attachment succeeds
    const createdWithValidAttachment = await createJobOpportunity(bploStaffUser, {
      title: "Revenue Officer I",
      attachmentDocumentId: docPublishedBPLO.id,
    });
    createdJobIds.push(createdWithValidAttachment.id);
    assert(
      createdWithValidAttachment.attachmentDocumentId === docPublishedBPLO.id,
      "Vacancy can be created with valid same-office attachment"
    );

    // Cross-office attachment rejection (Staff attempting cross-office document)
    let crossOfficeAttachmentRejected = false;
    try {
      await createJobOpportunity(bploStaffUser, {
        title: "Staff Cross-Office Attachment Attack",
        attachmentDocumentId: docPublishedMHO.id, // MHO document!
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 400) {
        crossOfficeAttachmentRejected = true;
      }
    }
    assert(crossOfficeAttachmentRejected, "Staff cannot attach document from another office (rejected with 400)");

    // Cross-office attachment rejection (SYSTEM user attaching cross-office document)
    let systemCrossOfficeRejected = false;
    try {
      await createJobOpportunity(superAdminUser, {
        title: "Admin Cross-Office Attachment",
        officeId: officeBPLO.id,
        attachmentDocumentId: docPublishedMHO.id,
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 400) {
        systemCrossOfficeRejected = true;
      }
    }
    assert(systemCrossOfficeRejected, "SYSTEM user cannot attach cross-office document to vacancy (default rule enforced)");

    // Nonexistent attachment document rejected
    let nonexistentDocRejected = false;
    try {
      await createJobOpportunity(bploStaffUser, {
        title: "Nonexistent Attachment Test",
        attachmentDocumentId: "non-existent-uuid-123",
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 400) {
        nonexistentDocRejected = true;
      }
    }
    assert(nonexistentDocRejected, "Nonexistent attachment document is rejected with 400");

    // Document permission coupling: User lacking documents.view cannot attach document
    let noDocPermRejected = false;
    try {
      await createJobOpportunity(bploStaffNoDocUser, {
        title: "No Doc Permission Test",
        attachmentDocumentId: docPublishedBPLO.id,
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        noDocPermRejected = true;
      }
    }
    assert(noDocPermRejected, "User without documents.view permission cannot attach document (rejected with 403)");

    // Cross-Office Read Blocked
    let crossOfficeReadBlocked = false;
    try {
      await getAdminJobById(mhoStaffUser, createdByStaff.id);
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        crossOfficeReadBlocked = true;
      }
    }
    assert(crossOfficeReadBlocked, "MHO staff is denied reading BPLO vacancy by ID (cross-office denial)");

    // Cross-Office Update Blocked
    let crossOfficeUpdateBlocked = false;
    try {
      await updateJobOpportunity(mhoStaffUser, createdByStaff.id, {
        title: "Malicious Cross-Office Update",
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        crossOfficeUpdateBlocked = true;
      }
    }
    assert(crossOfficeUpdateBlocked, "MHO staff is denied updating BPLO vacancy (cross-office denial)");

    // Cross-Office Publish Blocked
    let crossOfficePublishBlocked = false;
    try {
      await publishJobOpportunity(mhoStaffUser, createdByStaff.id);
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        crossOfficePublishBlocked = true;
      }
    }
    assert(crossOfficePublishBlocked, "MHO staff is denied publishing BPLO vacancy (cross-office denial)");

    // Cross-Office Archive Blocked
    let crossOfficeArchiveBlocked = false;
    try {
      await archiveJobOpportunity(mhoStaffUser, createdByStaff.id);
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        crossOfficeArchiveBlocked = true;
      }
    }
    assert(crossOfficeArchiveBlocked, "MHO staff is denied archiving BPLO vacancy (cross-office denial)");

    // Admin List Scoping
    const bploList = await getAdminJobsList(bploStaffUser);
    const bploOnlyBplo = bploList.jobs.every((j) => j.officeId === officeBPLO.id);
    assert(bploOnlyBplo, "BPLO staff vacancy list contains only BPLO vacancies");
    assert(
      !bploList.jobs.some((j) => j.id === createdByAdmin.id),
      "BPLO staff cannot see MHO vacancy in admin list"
    );

    const adminList = await getAdminJobsList(superAdminUser);
    const adminSeesBoth =
      adminList.jobs.some((j) => j.id === createdByStaff.id) &&
      adminList.jobs.some((j) => j.id === createdByAdmin.id);
    assert(adminSeesBoth, "SYSTEM-scoped user can view vacancies across all offices");

    // -------------------------------------------------------------------------
    // 4. Lifecycle & Direct Publishing Semantics
    // -------------------------------------------------------------------------
    console.log("\n4. Lifecycle & Direct Publishing Semantics");

    // DRAFT must NOT appear publicly
    const publicInitial = await getPublishedJobOpportunities();
    const draftAppearsPublicly = publicInitial.some((j) => j.id === createdByStaff.id);
    assert(!draftAppearsPublicly, "DRAFT vacancy is strictly excluded from public listing");

    // Direct Publish by Staff (No approval queue or approver step)
    const publishedJob = await publishJobOpportunity(
      bploStaffUser,
      createdByStaff.id,
      createdByStaff.updatedAt.toISOString()
    );
    assert(publishedJob.status === "PUBLISHED", "Staff can directly publish vacancy without approval step");
    assert(Boolean(publishedJob.publishedAt), "Server-controlled publishedAt timestamp is populated");

    // PUBLISHED vacancy appears publicly
    const publicAfterPublish = await getPublishedJobOpportunities();
    const publishedAppearsPublicly = publicAfterPublish.some((j) => j.id === createdByStaff.id);
    assert(publishedAppearsPublicly, "PUBLISHED vacancy appears in public listing");

    // Editing a PUBLISHED vacancy preserves PUBLISHED status
    const editedPublished = await updateJobOpportunity(bploStaffUser, createdByStaff.id, {
      title: "Licensing Officer II (Updated Qualifications)",
      experience: "2 years of relevant experience in government revenue assessment",
      expectedUpdatedAt: publishedJob.updatedAt.toISOString(),
    });
    assert(
      editedPublished.status === "PUBLISHED",
      "Editing a PUBLISHED vacancy preserves its PUBLISHED status (not demoted to draft)"
    );

    // Archiving vacancy
    const archivedJob = await archiveJobOpportunity(
      bploStaffUser,
      createdByStaff.id,
      editedPublished.updatedAt.toISOString()
    );
    assert(archivedJob.status === "ARCHIVED", "Vacancy transitions to ARCHIVED status");
    assert(Boolean(archivedJob.archivedAt), "Archived timestamp is recorded");

    // ARCHIVED vacancy must NOT appear publicly
    const publicAfterArchive = await getPublishedJobOpportunities();
    const archivedAppearsPublicly = publicAfterArchive.some((j) => j.id === createdByStaff.id);
    assert(!archivedAppearsPublicly, "ARCHIVED vacancy is strictly excluded from public listing");

    // ARCHIVED vacancy remains visible in CMS admin list
    const adminListAfterArchive = await getAdminJobsList(bploStaffUser);
    const archivedInCms = adminListAfterArchive.jobs.some((j) => j.id === createdByStaff.id);
    assert(archivedInCms, "ARCHIVED vacancy remains visible in CMS administrative management");

    // Direct publication without attachment is valid
    const vacancyWithoutAttachment = await createJobOpportunity(bploStaffUser, {
      title: "Community Affairs Officer I",
    });
    createdJobIds.push(vacancyWithoutAttachment.id);

    const publishedNoAttachment = await publishJobOpportunity(
      bploStaffUser,
      vacancyWithoutAttachment.id,
      vacancyWithoutAttachment.updatedAt.toISOString()
    );
    assert(
      publishedNoAttachment.status === "PUBLISHED" && !publishedNoAttachment.attachmentDocumentId,
      "Vacancy without attachment can publish directly"
    );

    // Publication with DRAFT attachment rejected
    const vacancyWithDraftDoc = await createJobOpportunity(bploStaffUser, {
      title: "Draft Document Attachment Test",
      attachmentDocumentId: docDraftBPLO.id,
    });
    createdJobIds.push(vacancyWithDraftDoc.id);

    let draftAttachmentPublishRejected = false;
    try {
      await publishJobOpportunity(
        bploStaffUser,
        vacancyWithDraftDoc.id,
        vacancyWithDraftDoc.updatedAt.toISOString()
      );
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 400) {
        draftAttachmentPublishRejected = true;
      }
    }
    assert(draftAttachmentPublishRejected, "Publishing vacancy with DRAFT attachment is rejected (status 400)");

    // Publication with ARCHIVED attachment rejected
    const vacancyWithArchivedDoc = await createJobOpportunity(bploStaffUser, {
      title: "Archived Document Attachment Test",
      attachmentDocumentId: docArchivedBPLO.id,
    });
    createdJobIds.push(vacancyWithArchivedDoc.id);

    let archivedAttachmentPublishRejected = false;
    try {
      await publishJobOpportunity(
        bploStaffUser,
        vacancyWithArchivedDoc.id,
        vacancyWithArchivedDoc.updatedAt.toISOString()
      );
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 400) {
        archivedAttachmentPublishRejected = true;
      }
    }
    assert(archivedAttachmentPublishRejected, "Publishing vacancy with ARCHIVED attachment is rejected (status 400)");

    // Publication with PUBLISHED attachment succeeds
    const publishedWithAttachment = await publishJobOpportunity(
      bploStaffUser,
      createdWithValidAttachment.id,
      createdWithValidAttachment.updatedAt.toISOString()
    );
    assert(
      publishedWithAttachment.status === "PUBLISHED",
      "Publishing vacancy with PUBLISHED attachment succeeds"
    );

    // Public listing exposes officialAttachmentUrl for published attachment
    const publicWithAttachment = await getPublishedJobOpportunities();
    const publicJobWithDoc = publicWithAttachment.find((j) => j.id === createdWithValidAttachment.id);
    assert(
      Boolean(publicJobWithDoc?.officialAttachmentUrl),
      "Public listing exposes officialAttachmentUrl when attached document is PUBLISHED"
    );

    // Later archiving the linked document causes attachment URL to disappear from public listing
    await prisma.document.update({
      where: { id: docPublishedBPLO.id },
      data: { status: "ARCHIVED" },
    });

    const publicAfterDocArchived = await getPublishedJobOpportunities();
    const publicJobDocArchived = publicAfterDocArchived.find((j) => j.id === createdWithValidAttachment.id);
    assert(
      publicJobDocArchived?.officialAttachmentUrl === undefined,
      "When attached document is later archived, officialAttachmentUrl dynamically disappears from public listing"
    );

    // Restore document to PUBLISHED status for test hygiene
    await prisma.document.update({
      where: { id: docPublishedBPLO.id },
      data: { status: "PUBLISHED" },
    });

    // Updating already-published vacancy with a DRAFT document rejected
    let updatePublishedWithDraftRejected = false;
    try {
      await updateJobOpportunity(bploStaffUser, publishedNoAttachment.id, {
        title: "Published Vacancy Adding Draft Doc",
        attachmentDocumentId: docDraftBPLO.id,
        expectedUpdatedAt: publishedNoAttachment.updatedAt.toISOString(),
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 400) {
        updatePublishedWithDraftRejected = true;
      }
    }
    assert(updatePublishedWithDraftRejected, "Attaching a DRAFT document to already-published vacancy is rejected (400)");

    // Staff Archive Permission Tests:
    // 1. Staff without jobs.archive cannot archive
    let staffNoArchiveRejected = false;
    try {
      await archiveJobOpportunity(
        bploStaffNoArchiveUser,
        publishedNoAttachment.id,
        publishedNoAttachment.updatedAt.toISOString()
      );
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 403) {
        staffNoArchiveRejected = true;
      }
    }
    assert(staffNoArchiveRejected, "Staff without jobs.archive cannot archive vacancy (403 Forbidden)");

    // 2. Staff with jobs.archive can archive own-office vacancy
    const staffArchived = await archiveJobOpportunity(
      bploStaffUser,
      publishedNoAttachment.id,
      publishedNoAttachment.updatedAt.toISOString()
    );
    assert(staffArchived.status === "ARCHIVED", "Staff with jobs.archive can archive own-office vacancy");

    // 3. Archive requires optimistic concurrency
    let archiveConcurrencyStale = false;
    try {
      await archiveJobOpportunity(
        bploStaffUser,
        createdWithValidAttachment.id,
        new Date(Date.now() - 120000).toISOString() // Stale timestamp!
      );
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 409) {
        archiveConcurrencyStale = true;
      }
    }
    assert(archiveConcurrencyStale, "Archiving with stale expectedUpdatedAt throws 409 conflict");

    // -------------------------------------------------------------------------
    // 5. Dates & Open/Closed Presentation State
    // -------------------------------------------------------------------------
    console.log("\n5. Dates & Open/Closed Presentation State");

    // Past closing date: derived isClosed = true
    const pastClosingDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    assert(isJobClosed(pastClosingDate), "Closing date in the past derives isClosed = true");

    // Future closing date: derived isClosed = false
    const futureClosingDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    assert(!isJobClosed(futureClosingDate), "Closing date in the future derives isClosed = false");

    // No closing date: derived isClosed = false
    assert(!isJobClosed(null), "Null closing date derives isClosed = false (open until filled)");

    // Manila calendar date boundaries
    const manilaFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const now = new Date();
    const todayManila = manilaFmt.format(now);

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayManila = manilaFmt.format(yesterdayDate);

    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowManila = manilaFmt.format(tomorrowDate);

    assert(
      !isJobClosed(todayManila),
      "Closing date = today Manila is OPEN throughout the calendar day"
    );
    assert(
      isJobClosed(yesterdayManila),
      "Closing date = yesterday Manila is CLOSED"
    );
    assert(
      !isJobClosed(tomorrowManila),
      "Closing date = tomorrow Manila is OPEN"
    );

    // Boundary moment at 23:59:59 Manila on closing day remains open
    const closingDateSample = "2026-10-15";
    const closingDayEnd = new Date("2026-10-15T23:59:59+08:00");
    assert(
      !isJobClosed(closingDateSample, closingDayEnd),
      "Vacancy remains OPEN at 23:59:59 Manila on the closing date"
    );

    // Boundary moment at 00:00:01 Manila on the day after closing date becomes closed
    const nextDayStart = new Date("2026-10-16T00:00:01+08:00");
    assert(
      isJobClosed(closingDateSample, nextDayStart),
      "Vacancy becomes CLOSED at 00:00:01 Manila on the day after closing date"
    );

    // -------------------------------------------------------------------------
    // 6. Optimistic Concurrency Control
    // -------------------------------------------------------------------------
    console.log("\n6. Optimistic Concurrency Control");

    let updateConcurrencyCaught = false;
    try {
      await updateJobOpportunity(superAdminUser, createdByAdmin.id, {
        title: "Stale Concurrency Update",
        expectedUpdatedAt: new Date(Date.now() - 60000).toISOString(),
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 409) {
        updateConcurrencyCaught = true;
      }
    }
    assert(updateConcurrencyCaught, "Update with stale expectedUpdatedAt throws 409 conflict");

    let publishConcurrencyCaught = false;
    try {
      await publishJobOpportunity(
        superAdminUser,
        createdByAdmin.id,
        new Date(Date.now() - 60000).toISOString()
      );
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 409) {
        publishConcurrencyCaught = true;
      }
    }
    assert(publishConcurrencyCaught, "Publish with stale expectedUpdatedAt throws 409 conflict");

    // Concurrency race condition simulation
    const latestAdminJob = await prisma.jobOpportunity.findUniqueOrThrow({
      where: { id: createdByAdmin.id },
    });

    // Intervening write
    await prisma.jobOpportunity.update({
      where: { id: createdByAdmin.id },
      data: { description: "Intervening modification by another administrator" },
    });

    let raceConflictCaught = false;
    try {
      await updateJobOpportunity(superAdminUser, createdByAdmin.id, {
        title: "Race Condition Overwrite",
        expectedUpdatedAt: latestAdminJob.updatedAt.toISOString(),
      });
    } catch (e: unknown) {
      if (e instanceof JobError && e.statusCode === 409) {
        raceConflictCaught = true;
      }
    }
    assert(raceConflictCaught, "Intervening DB write causes atomic updateMany to fail with 409");

    // -------------------------------------------------------------------------
    // 7. Audit Trail Verification
    // -------------------------------------------------------------------------
    console.log("\n7. Audit Trail Verification");

    const auditEvents = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            AUDIT_ACTIONS.JOB_CREATED,
            AUDIT_ACTIONS.JOB_UPDATED,
            AUDIT_ACTIONS.JOB_PUBLISHED,
            AUDIT_ACTIONS.JOB_ARCHIVED,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const hasCreatedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.JOB_CREATED);
    const hasUpdatedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.JOB_UPDATED);
    const hasPublishedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.JOB_PUBLISHED);
    const hasArchivedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.JOB_ARCHIVED);

    assert(hasCreatedAudit, "JOB_CREATED audit event logged");
    assert(hasUpdatedAudit, "JOB_UPDATED audit event logged");
    assert(hasPublishedAudit, "JOB_PUBLISHED audit event logged");
    assert(hasArchivedAudit, "JOB_ARCHIVED audit event logged");

    // -------------------------------------------------------------------------
    // 8. Phase Boundary Verification
    // -------------------------------------------------------------------------
    console.log("\n8. Phase Boundary Verification");

    // Verify Prisma schema has NO applicant or application tables
    const schemaContent = fs.readFileSync(path.resolve(process.cwd(), "prisma/schema.prisma"), "utf-8");
    assert(!schemaContent.includes("model Applicant"), "No Applicant model introduced (Phase 15 boundary preserved)");
    assert(!schemaContent.includes("model Application"), "No Application model introduced (Phase 15 boundary preserved)");
    assert(!schemaContent.includes("model Resume"), "No Resume model introduced (Phase 15 boundary preserved)");
    assert(!schemaContent.includes("PENDING_REVIEW"), "No PENDING_REVIEW approval status in JobOpportunityStatus");

  } catch (error) {
    console.error("Test execution exception:", error);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup Test Artifacts
    // -------------------------------------------------------------------------
    console.log("\nCleaning up test records...");
    try {
      await prisma.jobOpportunity.deleteMany({
        where: {
          office: {
            slug: { in: ["test-bplo-p15", "test-mho-p15", "test-inactive-p15"] },
          },
        },
      });

      await prisma.document.deleteMany({
        where: {
          storagePublicId: {
            in: [
              "raw/test-bplo-notice-p15",
              "raw/test-draft-notes-p15",
              "raw/test-archived-policy-p15",
              "raw/test-mho-form-p15",
            ],
          },
        },
      });

      await prisma.auditLog.deleteMany({
        where: {
          user: {
            email: {
              in: [
                "test.superadmin.p15@sanfelipe.gov.ph",
                "test.bplo.staff.p15@sanfelipe.gov.ph",
                "test.mho.staff.p15@sanfelipe.gov.ph",
              ],
            },
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "test.superadmin.p15@sanfelipe.gov.ph",
              "test.bplo.staff.p15@sanfelipe.gov.ph",
              "test.mho.staff.p15@sanfelipe.gov.ph",
            ],
          },
        },
      });

      await prisma.office.deleteMany({
        where: {
          slug: { in: ["test-bplo-p15", "test-mho-p15", "test-inactive-p15"] },
        },
      });
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr);
    }
  }

  console.log("\n=======================================================");
  console.log(`JOB OPPORTUNITIES TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runJobOpportunitiesTestSuite().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
