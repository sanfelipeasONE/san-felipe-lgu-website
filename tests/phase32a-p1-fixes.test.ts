import fs from "node:fs";
import path from "node:path";
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

async function runPhase32aTests() {
  console.log("=======================================================");
  console.log("PHASE 32A — P1 DOCUMENT & JOB IMAGE REGRESSION SUITE");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    publishDocument,
    getEligiblePublicDocument,
    DocumentError,
  } = await import("../src/server/documents/service");
  const {
    createJobOpportunity,
    updateJobOpportunity,
    JobError,
  } = await import("../src/server/jobs/service");

  const ts = Date.now();
  const createdDocIds: string[] = [];
  const createdJobIds: string[] = [];
  let inactiveOfficeId: string | null = null;

  // Locate active super-admin and an active office
  const superAdminDb = await prisma.user.findFirst({
    where: { status: "ACTIVE", role: { slug: "super-admin" } },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });
  const activeOffice = await prisma.office.findFirst({
    where: { status: "ACTIVE", slug: { not: "icto" } },
  });

  if (!superAdminDb || !activeOffice) {
    throw new Error("Active super-admin and active municipal office are required for test setup.");
  }

  const superAdminUser: SessionUser = {
    id: superAdminDb.id,
    name: superAdminDb.name,
    email: superAdminDb.email,
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: superAdminDb.roleId,
    role: {
      id: superAdminDb.role.id,
      name: superAdminDb.role.name,
      slug: superAdminDb.role.slug,
      isSystemScope: true,
    },
    isSystemScope: true,
    permissions: superAdminDb.role.permissions.map((rp) => rp.permission.code),
    sessionId: "test-phase32a-super-admin",
  };

  const officeUser: SessionUser = {
    id: superAdminDb.id,
    name: "Office Author",
    email: "office.author@test.local",
    status: "ACTIVE",
    officeId: activeOffice.id,
    office: { id: activeOffice.id, name: activeOffice.name, shortName: activeOffice.shortName, slug: activeOffice.slug },
    roleId: superAdminDb.roleId,
    role: {
      id: "office-role-mock",
      name: "Office Admin",
      slug: "office-admin",
      isSystemScope: false,
    },
    isSystemScope: false,
    permissions: ["documents.view", "documents.create", "documents.publish"],
    sessionId: "test-phase32a-office-user",
  };

  try {
    // Create temporary INACTIVE office for testing inactive-office rejections
    const inactiveOffice = await prisma.office.create({
      data: {
        name: `Test Inactive Office ${ts}`,
        slug: `test-inactive-office-${ts}`,
        status: "INACTIVE",
      },
    });
    inactiveOfficeId = inactiveOffice.id;

    // -------------------------------------------------------------------------
    // 1. BUG-01: Downloadable Forms View & Download Eligibility
    // -------------------------------------------------------------------------
    console.log("--- 1. BUG-01: Downloadable Forms Eligibility ---");

    const publishedForm = await prisma.document.create({
      data: {
        title: `Published Form ${ts}`,
        category: "Business Permits",
        purpose: "DOWNLOADABLE_FORM",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: activeOffice.id,
        originalFilename: "form.pdf",
        storagePublicId: `test/form-${ts}.pdf`,
        storageUrl: `https://example.invalid/form-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(publishedForm.id);

    const draftForm = await prisma.document.create({
      data: {
        title: `Draft Form ${ts}`,
        category: "Business Permits",
        purpose: "DOWNLOADABLE_FORM",
        status: "DRAFT",
        officeId: activeOffice.id,
        originalFilename: "draft.pdf",
        storagePublicId: `test/draft-${ts}.pdf`,
        storageUrl: `https://example.invalid/draft-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(draftForm.id);

    const archivedForm = await prisma.document.create({
      data: {
        title: `Archived Form ${ts}`,
        category: "Business Permits",
        purpose: "DOWNLOADABLE_FORM",
        status: "ARCHIVED",
        officeId: activeOffice.id,
        originalFilename: "archived.pdf",
        storagePublicId: `test/archived-${ts}.pdf`,
        storageUrl: `https://example.invalid/archived-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(archivedForm.id);

    const inactiveOfficeForm = await prisma.document.create({
      data: {
        title: `Inactive Office Form ${ts}`,
        category: "Business Permits",
        purpose: "DOWNLOADABLE_FORM",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: inactiveOffice.id,
        originalFilename: "inactive.pdf",
        storagePublicId: `test/inactive-${ts}.pdf`,
        storageUrl: `https://example.invalid/inactive-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(inactiveOfficeForm.id);

    const jobAttachment = await prisma.document.create({
      data: {
        title: `Job Attachment ${ts}`,
        category: "Civil Service",
        purpose: "JOB_ATTACHMENT",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: activeOffice.id,
        originalFilename: "job-att.pdf",
        storagePublicId: `test/job-att-${ts}.pdf`,
        storageUrl: `https://example.invalid/job-att-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(jobAttachment.id);

    const unlinkedCharter = await prisma.document.create({
      data: {
        title: `Unlinked Charter ${ts}`,
        category: "General Administration",
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: activeOffice.id,
        originalFilename: "charter.pdf",
        storagePublicId: `test/charter-${ts}.pdf`,
        storageUrl: `https://example.invalid/charter-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(unlinkedCharter.id);

    assert(
      (await getEligiblePublicDocument(publishedForm.id))?.id === publishedForm.id,
      "Published DOWNLOADABLE_FORM (active office) is eligible for view and download"
    );
    assert(
      (await getEligiblePublicDocument(draftForm.id)) === null,
      "Draft DOWNLOADABLE_FORM is rejected (returns null -> 404)"
    );
    assert(
      (await getEligiblePublicDocument(archivedForm.id)) === null,
      "Archived DOWNLOADABLE_FORM is rejected (returns null -> 404)"
    );
    assert(
      (await getEligiblePublicDocument(inactiveOfficeForm.id)) === null,
      "DOWNLOADABLE_FORM belonging to inactive office is rejected"
    );
    assert(
      (await getEligiblePublicDocument(jobAttachment.id)) === null,
      "JOB_ATTACHMENT remains ineligible via managed public document routes"
    );
    assert(
      (await getEligiblePublicDocument(unlinkedCharter.id)) === null,
      "Unlinked CITIZENS_CHARTER remains ineligible (existing charter rule preserved)"
    );

    // -------------------------------------------------------------------------
    // 2. BUG-02: BAC Document Publishing
    // -------------------------------------------------------------------------
    console.log("\n--- 2. BUG-02: BAC Document Publishing ---");

    const bacDraft = await prisma.document.create({
      data: {
        title: `BAC Resolution ${ts}`,
        category: "Bids and Awards Committee (BAC)",
        purpose: "OTHER_PUBLIC_DOCUMENT",
        status: "DRAFT",
        officeId: null,
        originalFilename: "bac.pdf",
        storagePublicId: `test/bac-${ts}.pdf`,
        storageUrl: `https://example.invalid/bac-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 2048,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(bacDraft.id);

    // Unauthorized office-scoped user cannot publish BAC document
    let officeBacRejected = false;
    try {
      await publishDocument(officeUser, bacDraft.id);
    } catch (err) {
      officeBacRejected = err instanceof DocumentError && err.statusCode === 403;
    }
    assert(officeBacRejected, "Unauthorized office-scoped user rejected from publishing BAC document (403)");

    // Authorized System Admin can publish valid BAC document with officeId === null
    const publishedBac = await publishDocument(superAdminUser, bacDraft.id);
    assert(
      publishedBac.status === "PUBLISHED" && publishedBac.officeId === null,
      "Valid BAC document with officeId === null publishes cleanly for Super Admin"
    );
    assert(
      (await getEligiblePublicDocument(publishedBac.id))?.id === publishedBac.id,
      "Published BAC document (officeId === null) is publicly eligible for view/download"
    );

    // Ordinary document with officeId === null must still be rejected on publish
    const orphanOrdinaryDoc = await prisma.document.create({
      data: {
        title: `Orphan Ordinary Doc ${ts}`,
        category: "Procurement",
        purpose: "OTHER_PUBLIC_DOCUMENT",
        status: "DRAFT",
        officeId: null,
        originalFilename: "orphan.pdf",
        storagePublicId: `test/orphan-${ts}.pdf`,
        storageUrl: `https://example.invalid/orphan-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(orphanOrdinaryDoc.id);

    let orphanRejected = false;
    try {
      await publishDocument(superAdminUser, orphanOrdinaryDoc.id);
    } catch (err) {
      orphanRejected = err instanceof DocumentError && err.statusCode === 400;
    }
    assert(orphanRejected, "Ordinary document with officeId === null is rejected on publish (400)");

    // Ordinary document with active office publishes normally
    const publishedOrdinary = await publishDocument(superAdminUser, draftForm.id);
    assert(publishedOrdinary.status === "PUBLISHED", "Ordinary document with active office publishes normally");

    // Ordinary document with inactive office is rejected
    const inactiveDraft = await prisma.document.create({
      data: {
        title: `Inactive Office Draft ${ts}`,
        category: "Business Permits",
        purpose: "DOWNLOADABLE_FORM",
        status: "DRAFT",
        officeId: inactiveOffice.id,
        originalFilename: "inactive-draft.pdf",
        storagePublicId: `test/inactive-draft-${ts}.pdf`,
        storageUrl: `https://example.invalid/inactive-draft-${ts}.pdf`,
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        createdById: superAdminUser.id,
      },
    });
    createdDocIds.push(inactiveDraft.id);

    let inactiveRejected = false;
    try {
      await publishDocument(superAdminUser, inactiveDraft.id);
    } catch (err) {
      inactiveRejected = err instanceof DocumentError && err.statusCode === 400;
    }
    assert(inactiveRejected, "Ordinary document belonging to inactive office is rejected on publish (400)");

    // -------------------------------------------------------------------------
    // 3. BUG-03: Job Featured Image Removal
    // -------------------------------------------------------------------------
    console.log("\n--- 3. BUG-03: Job Featured Image Removal ---");

    // Creation without an image still works
    const jobNoImg = await createJobOpportunity(superAdminUser, {
      title: `Administrative Aide No Image ${ts}`,
      officeId: activeOffice.id,
      employmentType: "Government",
    });
    createdJobIds.push(jobNoImg.id);
    assert(jobNoImg.featuredImagePublicId === null, "Job creation without an image succeeds");

    // Create job with image A
    const imgA = `san-felipe-lgu/jobs/2026/test-a-${ts}`;
    const imgB = `san-felipe-lgu/jobs/2026/test-b-${ts}`;
    const jobWithImg = await createJobOpportunity(superAdminUser, {
      title: `Engineer With Image ${ts}`,
      officeId: activeOffice.id,
      employmentType: "Government",
      featuredImagePublicId: imgA,
      featuredImageUrl: `https://example.invalid/${imgA}.jpg`,
      featuredImageAlt: "Initial job banner",
      featuredImageWidth: 1200,
      featuredImageHeight: 630,
      featuredImageFormat: "jpg",
      featuredImageBytes: 50000,
    });
    createdJobIds.push(jobWithImg.id);

    // 3a. Omitted image field preserves existing image and does NOT call deleteAsset
    const deletedCalls: string[] = [];
    const afterOmitted = await updateJobOpportunity(
      superAdminUser,
      jobWithImg.id,
      {
        title: `${jobWithImg.title} Edited`,
        officeId: activeOffice.id,
        employmentType: "Government",
        expectedUpdatedAt: jobWithImg.updatedAt.toISOString(),
      },
      {
        deleteAsset: async (id) => {
          deletedCalls.push(id);
          return true;
        },
      }
    );
    assert(
      afterOmitted.featuredImagePublicId === imgA && deletedCalls.length === 0,
      "Omitted image field preserves existing DB image and does not delete Cloudinary asset"
    );

    // 3b. Failed DB update (stale expectedUpdatedAt) does NOT delete existing Cloudinary asset
    let failedUpdate409 = false;
    try {
      await updateJobOpportunity(
        superAdminUser,
        jobWithImg.id,
        {
          title: "Stale Conflict Attempt",
          officeId: activeOffice.id,
          employmentType: "Government",
          featuredImagePublicId: null,
          featuredImageUrl: null,
          featuredImageAlt: null,
          expectedUpdatedAt: "2020-01-01T00:00:00.000Z",
        },
        {
          deleteAsset: async (id) => {
            deletedCalls.push(id);
            return true;
          },
        }
      );
    } catch (err) {
      failedUpdate409 = err instanceof JobError && err.statusCode === 409;
    }
    assert(
      failedUpdate409 && deletedCalls.length === 0,
      "Failed DB update (409) does NOT delete existing Cloudinary asset"
    );

    // 3c. Shared asset protection: another job referencing imgA prevents Cloudinary deletion
    const sharedRefJob = await createJobOpportunity(superAdminUser, {
      title: `Shared Image Job ${ts}`,
      officeId: activeOffice.id,
      employmentType: "Government",
      featuredImagePublicId: imgA,
      featuredImageUrl: `https://example.invalid/${imgA}.jpg`,
      featuredImageAlt: "Shared image",
    });
    createdJobIds.push(sharedRefJob.id);

    const afterRemovalWhileShared = await updateJobOpportunity(
      superAdminUser,
      jobWithImg.id,
      {
        title: afterOmitted.title,
        officeId: activeOffice.id,
        employmentType: "Government",
        featuredImagePublicId: null,
        featuredImageUrl: null,
        featuredImageAlt: null,
        featuredImageWidth: null,
        featuredImageHeight: null,
        featuredImageFormat: null,
        featuredImageBytes: null,
        expectedUpdatedAt: afterOmitted.updatedAt.toISOString(),
      },
      {
        deleteAsset: async (id) => {
          deletedCalls.push(id);
          return true;
        },
      }
    );
    assert(
      afterRemovalWhileShared.featuredImagePublicId === null &&
        afterRemovalWhileShared.featuredImageUrl === null &&
        deletedCalls.length === 0,
      "Explicit removal clears DB fields while preserving Cloudinary asset still referenced by another record"
    );

    // 3d. Replacement saves new image and cleans up unreferenced old image
    const afterReplace = await updateJobOpportunity(
      superAdminUser,
      sharedRefJob.id,
      {
        title: sharedRefJob.title,
        officeId: activeOffice.id,
        employmentType: "Government",
        featuredImagePublicId: imgB,
        featuredImageUrl: `https://example.invalid/${imgB}.jpg`,
        featuredImageAlt: "Replacement image",
        expectedUpdatedAt: sharedRefJob.updatedAt.toISOString(),
      },
      {
        deleteAsset: async (id) => {
          deletedCalls.push(id);
          return true;
        },
      }
    );
    assert(
      afterReplace.featuredImagePublicId === imgB &&
        deletedCalls.length === 1 &&
        deletedCalls[0] === imgA,
      "Replacement saves new image reference and deletes unreferenced old asset after DB commit"
    );

    // 3e. Cloudinary cleanup failure is handled gracefully without corrupting DB state
    const afterRemovalWithCloudinaryError = await updateJobOpportunity(
      superAdminUser,
      sharedRefJob.id,
      {
        title: afterReplace.title,
        officeId: activeOffice.id,
        employmentType: "Government",
        featuredImagePublicId: null,
        featuredImageUrl: null,
        featuredImageAlt: null,
        featuredImageWidth: null,
        featuredImageHeight: null,
        featuredImageFormat: null,
        featuredImageBytes: null,
        expectedUpdatedAt: afterReplace.updatedAt.toISOString(),
      },
      {
        deleteAsset: async () => {
          throw new Error("Simulated Cloudinary API outage");
        },
      }
    );
    assert(
      afterRemovalWithCloudinaryError.featuredImagePublicId === null,
      "Cloudinary cleanup failure does not throw or corrupt DB cleared state"
    );

    // 3f. Action FormData parsing contract verification
    const jobsActionSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(cms)/admin/jobs/actions.ts"),
      "utf8"
    );
    assert(
      jobsActionSrc.includes('const rawPublicId = formData.get("featuredImagePublicId")') &&
        jobsActionSrc.includes("rawPublicId === null") &&
        jobsActionSrc.includes("featuredImagePublicId === null"),
      "updateJobAction distinguishes omitted FormData key (undefined) from empty string removal (null)"
    );
  } finally {
    for (const id of createdJobIds) {
      await prisma.jobOpportunity.deleteMany({ where: { id } }).catch(() => {});
    }
    for (const id of createdDocIds) {
      await prisma.document.deleteMany({ where: { id } }).catch(() => {});
    }
    if (inactiveOfficeId) {
      await prisma.office.deleteMany({ where: { id: inactiveOfficeId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  console.log(`PHASE 32A P1 FIXES SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase32aTests().catch((err) => {
  console.error("FATAL ERROR IN PHASE 32A SUITE:", err);
  process.exit(1);
});
