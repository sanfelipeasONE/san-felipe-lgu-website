import type { SessionUser } from "../src/server/auth/session";

// Mock `server-only` so server modules can be imported directly under `tsx`
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("=================================================================");
  console.log("PHASE 33 — PESO ADMIN & JOB CLASSIFICATION REGRESSION SUITE");
  console.log("=================================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    ensurePesoRole,
    updateRolePermissions,
    PESO_ADMIN_ROLE_SLUG,
    PESO_OFFICE_SLUG,
    PESO_JOB_PERMISSIONS,
    RoleError,
  } = await import("../src/server/roles/service");
  const { createUser, updateUser, UserError } = await import(
    "../src/server/users/service"
  );
  const {
    createJobOpportunity,
    updateJobOpportunity,
    publishJobOpportunity,
    unpublishJobOpportunity,
    archiveJobOpportunity,
    deleteJobOpportunity,
    getAdminJobsList,
    getAdminJobById,
    getPublishedJobOpportunities,
    JobError,
  } = await import("../src/server/jobs/service");
  const { jobOpportunityInputSchema } = await import(
    "../src/lib/validation/jobs"
  );
  const { getVisibleNavSections } = await import(
    "../src/config/admin-navigation"
  );
  const { PERMISSIONS } = await import("../src/server/authz/permissions");
  const { getAdminDocumentsList } = await import(
    "../src/server/documents/service"
  );
  const { getAdminResolutionsList } = await import(
    "../src/server/resolutions/service"
  );

  const createdUserIds: string[] = [];
  const createdJobIds: string[] = [];

  try {
    console.log("[1] Ensuring PESO Admin role and canonical PESO office...");
    const pesoRole = await ensurePesoRole();
    const pesoOffice = await prisma.office.findUnique({
      where: { slug: PESO_OFFICE_SLUG },
    });
    const otherOffice = await prisma.office.findFirst({
      where: { slug: { notIn: [PESO_OFFICE_SLUG, "icto"] }, status: "ACTIVE" },
    });
    const superAdminRole = await prisma.role.findUnique({
      where: { slug: "super-admin" },
    });
    const superAdminUser = await prisma.user.findFirst({
      where: { role: { slug: "super-admin" }, status: "ACTIVE" },
    });

    assert(Boolean(pesoRole && pesoRole.slug === PESO_ADMIN_ROLE_SLUG), "PESO Admin role ensured");
    assert(
      Boolean(pesoOffice && pesoOffice.name === "Public Employment Service Office"),
      "Canonical Public Employment Service Office found"
    );
    assert(Boolean(otherOffice), "Secondary active office found for boundary testing");
    assert(Boolean(superAdminUser && superAdminRole), "Active Super Admin user found");

    if (!pesoOffice || !otherOffice || !superAdminUser || !superAdminRole) {
      throw new Error("Missing baseline database fixtures for Phase 33 tests.");
    }

    const superAdminCaller: SessionUser = {
      id: superAdminUser.id,
      name: superAdminUser.name,
      email: superAdminUser.email,
      status: "ACTIVE",
      officeId: null,
      roleId: superAdminRole.id,
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: true,
      },
      isSystemScope: true,
      permissions: Object.values(PERMISSIONS),
      office: null,
      sessionId: "test-session-super",
    };

    const nonSuperCaller: SessionUser = {
      id: superAdminUser.id,
      name: "Non-Super Admin",
      email: "non-super@sanfelipe.gov.ph",
      status: "ACTIVE",
      officeId: otherOffice.id,
      roleId: pesoRole.id,
      role: {
        id: pesoRole.id,
        name: "Office Admin",
        slug: "office-admin",
        isSystemScope: false,
      },
      isSystemScope: false,
      permissions: [PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_VIEW],
      office: {
        id: otherOffice.id,
        name: otherOffice.name,
        shortName: otherOffice.shortName,
        slug: otherOffice.slug,
      },
      sessionId: "test-session-non-super",
    };

    // 2. Role Permission Boundary
    console.log("\n[2] Testing PESO Admin Role Permission Boundary...");
    const roleWithPerms = await prisma.role.findUnique({
      where: { id: pesoRole.id },
      include: { permissions: { include: { permission: true } } },
    });
    const assignedCodes = (roleWithPerms?.permissions ?? []).map((rp) => rp.permission.code);
    assert(
      assignedCodes.length === PESO_JOB_PERMISSIONS.length &&
        PESO_JOB_PERMISSIONS.every((p) => assignedCodes.includes(p)),
      "PESO Admin role holds ONLY the 6 jobs.* permissions"
    );

    let rejectedExtraPerm = false;
    try {
      await updateRolePermissions(superAdminCaller, pesoRole.id, [
        ...PESO_JOB_PERMISSIONS,
        PERMISSIONS.DOCUMENTS_VIEW,
      ]);
    } catch (err) {
      rejectedExtraPerm = err instanceof RoleError && err.statusCode === 400;
    }
    assert(rejectedExtraPerm, "updateRolePermissions rejects adding documents.view to PESO Admin");

    // 3. PESO Account Provisioning & Office Binding
    console.log("\n[3] Testing Super Admin Provisioning & PESO Office Binding...");
    let nonSuperBlocked = false;
    try {
      await createUser(nonSuperCaller, {
        name: "Unauthorized PESO",
        email: `unauth.peso.${Date.now()}@sanfelipe.gov.ph`,
        password: "StrongPassword!123",
        roleId: pesoRole.id,
        officeId: pesoOffice.id,
      });
    } catch (err) {
      nonSuperBlocked = err instanceof UserError && err.statusCode === 403;
    }
    assert(nonSuperBlocked, "Non-Super Admin cannot create PESO Admin account (403)");

    let forgedOfficeBlocked = false;
    try {
      await createUser(superAdminCaller, {
        name: "Forged PESO",
        email: `forged.peso.${Date.now()}@sanfelipe.gov.ph`,
        password: "StrongPassword!123",
        roleId: pesoRole.id,
        officeId: otherOffice.id,
      });
    } catch (err) {
      forgedOfficeBlocked = err instanceof UserError && err.statusCode === 400;
    }
    assert(forgedOfficeBlocked, "Forged assignment of PESO Admin to another office is rejected (400)");

    const pesoEmail = `peso.test.${Date.now()}@sanfelipe.gov.ph`;
    const createdPesoUser = await createUser(superAdminCaller, {
      name: "PESO Test Admin",
      email: pesoEmail,
      password: "StrongPassword!123",
      roleId: pesoRole.id,
      officeId: null,
    });
    createdUserIds.push(createdPesoUser.id);
    assert(
      createdPesoUser.officeId === pesoOffice.id && createdPesoUser.roleId === pesoRole.id,
      "Super Admin creates PESO Admin auto-bound to canonical PESO office"
    );

    let forgedOfficeUpdateBlocked = false;
    try {
      await updateUser(superAdminCaller, createdPesoUser.id, {
        name: "PESO Test Admin",
        email: pesoEmail,
        officeId: otherOffice.id,
      });
    } catch (err) {
      forgedOfficeUpdateBlocked = err instanceof UserError && err.statusCode === 400;
    }
    assert(forgedOfficeUpdateBlocked, "Updating PESO Admin officeId to another office is rejected (400)");

    const pesoAdminCaller: SessionUser = {
      id: createdPesoUser.id,
      name: createdPesoUser.name,
      email: createdPesoUser.email,
      status: "ACTIVE",
      officeId: pesoOffice.id,
      roleId: pesoRole.id,
      role: {
        id: pesoRole.id,
        name: pesoRole.name,
        slug: pesoRole.slug,
        isSystemScope: false,
      },
      isSystemScope: false,
      permissions: [...PESO_JOB_PERMISSIONS],
      office: {
        id: pesoOffice.id,
        name: pesoOffice.name,
        shortName: pesoOffice.shortName,
        slug: pesoOffice.slug,
      },
      sessionId: "test-session-peso",
    };

    // 4. Navigation & Cross-Module Isolation
    console.log("\n[4] Testing Navigation & Cross-Module Isolation...");
    const pesoNav = getVisibleNavSections({
      permissions: pesoAdminCaller.permissions,
      isSystemScope: false,
    });
    const pesoNavIds = pesoNav.flatMap((s) => s.items.map((i) => i.id));
    assert(
      pesoNavIds.includes("dashboard") &&
        pesoNavIds.includes("job-opportunities") &&
        pesoNavIds.length === 2,
      "PESO Admin sidebar shows ONLY Dashboard and Job Opportunities"
    );

    let docsDenied = false;
    try {
      await getAdminDocumentsList(pesoAdminCaller, {});
    } catch {
      docsDenied = true;
    }
    assert(docsDenied, "PESO Admin cannot access general Documents module");

    let sbDenied = false;
    try {
      await getAdminResolutionsList(pesoAdminCaller, {});
    } catch {
      sbDenied = true;
    }
    assert(sbDenied, "PESO Admin cannot access Sangguniang Bayan Resolutions module");

    // 5. Validation & Conditional Employer Name
    console.log("\n[5] Testing Classification & Employer Name Validation...");
    assert(
      !jobOpportunityInputSchema.safeParse({
        title: "Test Job",
        employmentClassification: "INVALID_TYPE",
        employerName: "Some Corp",
      }).success,
      "Invalid classification value is rejected by Zod schema"
    );
    assert(
      !jobOpportunityInputSchema.safeParse({
        title: "Government Clerk",
        employmentClassification: "GOVERNMENT",
        employerName: "",
      }).success,
      "Government vacancy without Government Agency / Office is rejected"
    );
    assert(
      !jobOpportunityInputSchema.safeParse({
        title: "Private Operator",
        employmentClassification: "PRIVATE",
        employerName: " ",
      }).success,
      "Private vacancy without Company Name is rejected"
    );

    // 6. PESO Admin Job Lifecycle + Cross-Office Boundary
    console.log("\n[6] Testing PESO Admin Job Lifecycle & Forged Office Boundary...");
    const govJob = await createJobOpportunity(pesoAdminCaller, {
      title: `Administrative Assistant ${Date.now()}`,
      officeId: otherOffice.id, // Forged other officeId must be ignored & forced to pesoOffice.id
      employmentClassification: "GOVERNMENT",
      employerName: "Municipal Government of San Felipe",
      description: "<p>Municipal administrative support role.</p>",
    });
    createdJobIds.push(govJob.id);
    assert(
      govJob.officeId === pesoOffice.id &&
        govJob.employmentClassification === "GOVERNMENT" &&
        govJob.employerName === "Municipal Government of San Felipe",
      "PESO Admin creates Government vacancy bound to PESO office (forged officeId ignored)"
    );

    const privJob = await createJobOpportunity(pesoAdminCaller, {
      title: `Production Operator ${Date.now()}`,
      officeId: pesoOffice.id,
      employmentClassification: "PRIVATE",
      employerName: "ABC Manufacturing Corporation",
      description: "<p>Manufacturing line operator.</p>",
    });
    createdJobIds.push(privJob.id);
    assert(
      privJob.employmentClassification === "PRIVATE" &&
        privJob.employerName === "ABC Manufacturing Corporation",
      "PESO Admin creates Private vacancy with Company Name"
    );

    // Publish both and verify public listing output
    await publishJobOpportunity(pesoAdminCaller, govJob.id);
    await publishJobOpportunity(pesoAdminCaller, privJob.id);

    const publicJobs = await getPublishedJobOpportunities();
    const pubGov = publicJobs.find((j) => j.id === govJob.id);
    const pubPriv = publicJobs.find((j) => j.id === privJob.id);
    assert(
      Boolean(
        pubGov &&
          pubGov.employmentClassification === "GOVERNMENT" &&
          pubGov.employerName === "Municipal Government of San Felipe"
      ),
      "Public listing exposes Government classification and Government Agency / Office"
    );
    assert(
      Boolean(
        pubPriv &&
          pubPriv.employmentClassification === "PRIVATE" &&
          pubPriv.employerName === "ABC Manufacturing Corporation"
      ),
      "Public listing exposes Private classification and Company Name"
    );

    // Unpublish & Archive remove from public
    await unpublishJobOpportunity(pesoAdminCaller, govJob.id);
    const afterUnpub = await getPublishedJobOpportunities();
    assert(!afterUnpub.some((j) => j.id === govJob.id), "Unpublished vacancy is hidden from public");

    await archiveJobOpportunity(pesoAdminCaller, privJob.id);
    const afterArch = await getPublishedJobOpportunities();
    assert(!afterArch.some((j) => j.id === privJob.id), "Archived vacancy is hidden from public");

    // Other-office vacancy cannot be viewed/modified/deleted by PESO Admin
    const otherOfficeJob = await createJobOpportunity(superAdminCaller, {
      title: `Other Office Vacancy ${Date.now()}`,
      officeId: otherOffice.id,
      employmentClassification: "GOVERNMENT",
      employerName: otherOffice.name,
    });
    createdJobIds.push(otherOfficeJob.id);

    let crossOfficeDenied = false;
    try {
      await getAdminJobById(pesoAdminCaller, otherOfficeJob.id);
    } catch (err) {
      crossOfficeDenied = err instanceof JobError && err.statusCode === 403;
    }
    assert(crossOfficeDenied, "PESO Admin cannot access another office's vacancy (403)");

    // 7. Super Admin Full Access WITHOUT explicit jobs.* permissions
    console.log("\n[7] Testing Super Admin Full Access Without Explicit jobs.* Permissions...");
    const superAdminWithoutJobPerms: SessionUser = {
      ...superAdminCaller,
      officeId: null,
      permissions: Object.values(PERMISSIONS).filter(
        (code) => !code.startsWith("jobs.")
      ),
    };

    const superNav = getVisibleNavSections({
      permissions: superAdminWithoutJobPerms.permissions,
      isSystemScope: true,
    });
    assert(
      superNav.flatMap((s) => s.items.map((i) => i.id)).includes("job-opportunities"),
      "Super Admin sees Job Opportunities in sidebar without explicit jobs.view"
    );

    const superList = await getAdminJobsList(superAdminWithoutJobPerms, {});
    assert(Array.isArray(superList.jobs), "Super Admin can list jobs without jobs.view");

    const superCreatedJob = await createJobOpportunity(superAdminWithoutJobPerms, {
      title: `Super Admin Job ${Date.now()}`,
      officeId: pesoOffice.id,
      employmentClassification: "PRIVATE",
      employerName: "Zambales Tech Corp",
    });
    createdJobIds.push(superCreatedJob.id);
    assert(Boolean(superCreatedJob.id), "Super Admin can create job without jobs.create");

    const superUpdatedJob = await updateJobOpportunity(
      superAdminWithoutJobPerms,
      superCreatedJob.id,
      {
        title: superCreatedJob.title,
        officeId: pesoOffice.id,
        employmentClassification: "GOVERNMENT",
        employerName: "Municipal Government of San Felipe",
      }
    );
    assert(
      superUpdatedJob.employmentClassification === "GOVERNMENT" &&
        superUpdatedJob.employerName === "Municipal Government of San Felipe",
      "Super Admin can update classification & employer without jobs.update"
    );

    await publishJobOpportunity(superAdminWithoutJobPerms, superCreatedJob.id);
    await unpublishJobOpportunity(superAdminWithoutJobPerms, superCreatedJob.id);
    await archiveJobOpportunity(superAdminWithoutJobPerms, superCreatedJob.id);
    await deleteJobOpportunity(superAdminWithoutJobPerms, superCreatedJob.id);
    const deletedCheck = await prisma.jobOpportunity.findUnique({
      where: { id: superCreatedJob.id },
    });
    assert(deletedCheck === null, "Super Admin can publish, unpublish, archive, and delete without jobs.*");

    // 8. Backward Compatibility: Historical job without classification/employerName
    console.log("\n[8] Testing Historical Job Backward Compatibility...");
    const legacyJob = await prisma.jobOpportunity.create({
      data: {
        title: `Historical Legacy Vacancy ${Date.now()}`,
        slug: `legacy-job-${Date.now()}`,
        officeId: otherOffice.id,
        employmentType: "Permanent",
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdById: superAdminUser.id,
      },
    });
    createdJobIds.push(legacyJob.id);

    const fetchedLegacy = await getAdminJobById(superAdminCaller, legacyJob.id);
    assert(
      fetchedLegacy.employmentClassification === null &&
        fetchedLegacy.employerName === null &&
        fetchedLegacy.employmentType === "Permanent",
      "Historical vacancy remains readable in CMS without fabricated employer data"
    );

    const pubLegacy = (await getPublishedJobOpportunities()).find(
      (j) => j.id === legacyJob.id
    );
    assert(
      Boolean(pubLegacy && pubLegacy.employerName === undefined && pubLegacy.employmentType === "Permanent"),
      "Historical vacancy remains safely renderable in public listing without fabricated employer data"
    );

    // Editing a historical "Permanent" job without selecting Government/Private (omitting employmentType)
    const legacySchemaCheck = jobOpportunityInputSchema.safeParse({
      title: `${legacyJob.title} (Updated)`,
      employmentType: undefined,
      employmentClassification: null,
      employerName: null,
    });
    assert(
      legacySchemaCheck.success,
      "Schema accepts editing a historical job when employmentType is omitted and classification is null"
    );

    const updatedLegacyPermanent = await updateJobOpportunity(
      superAdminCaller,
      legacyJob.id,
      {
        title: `${legacyJob.title} (Updated)`,
        officeId: legacyJob.officeId,
        employmentType: undefined,
        employmentClassification: null,
        employerName: null,
      }
    );
    assert(
      updatedLegacyPermanent.employmentType === "Permanent" &&
        updatedLegacyPermanent.employmentClassification === null &&
        updatedLegacyPermanent.employerName === null &&
        updatedLegacyPermanent.title.endsWith("(Updated)"),
      "Updating unrelated fields on historical Permanent job preserves Permanent, null classification, and null employer"
    );

    // Additional legacy value: Contractual
    const contractualJob = await prisma.jobOpportunity.create({
      data: {
        title: `Historical Contractual Vacancy ${Date.now()}`,
        slug: `legacy-contractual-${Date.now()}`,
        officeId: otherOffice.id,
        employmentType: "Contractual",
        status: "DRAFT",
        createdById: superAdminUser.id,
      },
    });
    createdJobIds.push(contractualJob.id);

    const updatedLegacyContractual = await updateJobOpportunity(
      superAdminCaller,
      contractualJob.id,
      {
        title: `${contractualJob.title} (Edited)`,
        officeId: contractualJob.officeId,
        employmentType: undefined,
        employmentClassification: null,
        employerName: null,
      }
    );
    assert(
      updatedLegacyContractual.employmentType === "Contractual" &&
        updatedLegacyContractual.employmentClassification === null &&
        updatedLegacyContractual.employerName === null,
      "Updating unrelated fields on historical Contractual job preserves Contractual, null classification, and null employer"
    );

    // Explicitly classifying a legacy job updates classification, employerName, and employmentType
    const classifiedLegacy = await updateJobOpportunity(
      superAdminCaller,
      contractualJob.id,
      {
        title: updatedLegacyContractual.title,
        officeId: contractualJob.officeId,
        employmentClassification: "PRIVATE",
        employerName: "ABC Manufacturing Corporation",
      }
    );
    assert(
      classifiedLegacy.employmentClassification === "PRIVATE" &&
        classifiedLegacy.employerName === "ABC Manufacturing Corporation" &&
        classifiedLegacy.employmentType === "Private",
      "Explicitly selecting Private on historical job updates classification, Company Name, and employmentType"
    );
  } finally {
    if (createdJobIds.length > 0) {
      await prisma.jobOpportunity.deleteMany({
        where: { id: { in: createdJobIds } },
      });
    }
    if (createdUserIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { userId: { in: createdUserIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    await prisma.$disconnect();
  }

  console.log(`\n=================================================================`);
  console.log(`PHASE 33 SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`=================================================================`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
