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

async function runTests() {
  console.log("=================================================================");
  console.log("PHASE 33 — SANGGUNIANG BAYAN RESOLUTIONS & SCOPED ADMIN TESTS");
  console.log("=================================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    ensureSangguniangBayanRole,
    updateRolePermissions,
    SB_ADMIN_ROLE_SLUG,
    SB_OFFICE_SLUG,
    SB_RESOLUTION_PERMISSIONS,
    RoleError,
  } = await import("../src/server/roles/service");
  const { createUser, updateUser, UserError } = await import(
    "../src/server/users/service"
  );
  const {
    createResolution,
    updateResolution,
    publishResolution,
    unpublishResolution,
    archiveResolution,
    deleteResolution,
    getAdminResolutionsList,
    getAdminResolutionById,
    getPublishedResolutions,
    getEligiblePublicResolution,
    ResolutionError,
  } = await import("../src/server/resolutions/service");
  const { validateResolutionPdfFile } = await import(
    "../src/lib/validation/resolutions"
  );
  const { getVisibleNavSections } = await import(
    "../src/config/admin-navigation"
  );
  const { PERMISSIONS } = await import("../src/server/authz/permissions");
  const { getAdminDocumentsList } = await import(
    "../src/server/documents/service"
  );

  // Stub Cloudinary uploader so tests run deterministically offline without mutating real cloud assets
  const cloudinaryMod = await import("cloudinary");
  const originalUploadStream = cloudinaryMod.v2.uploader.upload_stream;
  const originalDestroy = cloudinaryMod.v2.uploader.destroy;
  const deletedPublicIds: string[] = [];

  (cloudinaryMod.v2.uploader as unknown as Record<string, unknown>).upload_stream = (
    options: { public_id?: string },
    cb: (err: unknown, res?: unknown) => void
  ) => {
    const chunks: Buffer[] = [];
    return {
      end: (buf: Buffer) => {
        chunks.push(buf);
        const pubId = options.public_id || `san-felipe-lgu/resolutions/test-${Date.now()}.pdf`;
        cb(null, {
          public_id: pubId,
          secure_url: `https://res.cloudinary.com/test/raw/upload/v1/${pubId}`,
          bytes: buf.length,
        });
      },
    };
  };
  (cloudinaryMod.v2.uploader as unknown as Record<string, unknown>).destroy = async (
    publicId: string
  ) => {
    deletedPublicIds.push(publicId);
    return { result: "ok" };
  };

  const createdUserIds: string[] = [];
  const createdResolutionIds: string[] = [];

  try {
    // 0. Ensure role & permissions exist
    console.log("[1] Ensuring Sangguniang Bayan role and canonical office...");
    const sbRole = await ensureSangguniangBayanRole();
    const sbOffice = await prisma.office.findUnique({
      where: { slug: SB_OFFICE_SLUG },
    });
    const otherOffice = await prisma.office.findFirst({
      where: { slug: { notIn: [SB_OFFICE_SLUG, "icto"] }, status: "ACTIVE" },
    });
    const superAdminRole = await prisma.role.findUnique({
      where: { slug: "super-admin" },
    });
    const superAdminUser = await prisma.user.findFirst({
      where: { role: { slug: "super-admin" }, status: "ACTIVE" },
    });

    assert(Boolean(sbRole && sbRole.slug === SB_ADMIN_ROLE_SLUG), "SB Admin role ensured");
    assert(Boolean(sbOffice && sbOffice.name === "Office of the Sangguniang Bayan"), "Canonical Office of the Sangguniang Bayan found");
    assert(Boolean(otherOffice), "Another active canonical office exists for boundary tests");
    assert(Boolean(superAdminUser && superAdminRole), "Active Super Admin user exists");

    if (!sbOffice || !otherOffice || !superAdminUser || !superAdminRole) {
      throw new Error("Missing baseline database fixtures for test.");
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

    const officeAdminCaller: SessionUser = {
      id: superAdminUser.id,
      name: "Non-Super Admin",
      email: "non-super@sanfelipe.gov.ph",
      status: "ACTIVE",
      officeId: otherOffice.id,
      roleId: sbRole.id,
      role: {
        id: sbRole.id,
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
      sessionId: "test-session-office",
    };

    // 1. Role Permission Boundary
    console.log("\n[2] Testing Role Permission Boundary...");
    const roleWithPerms = await prisma.role.findUnique({
      where: { id: sbRole.id },
      include: { permissions: { include: { permission: true } } },
    });
    const assignedCodes = (roleWithPerms?.permissions ?? []).map((rp) => rp.permission.code);
    assert(
      assignedCodes.length === SB_RESOLUTION_PERMISSIONS.length &&
        SB_RESOLUTION_PERMISSIONS.every((p) => assignedCodes.includes(p)),
      "SB Admin role has ONLY the 6 sb_resolutions.* permissions"
    );
    assert(
      !assignedCodes.some((c) => c.startsWith("documents.") || c.startsWith("posts.") || c.startsWith("users.")),
      "SB Admin role has zero documents.*, posts.*, or users.* permissions"
    );

    let rejectedExtraPerm = false;
    try {
      await updateRolePermissions(superAdminCaller, sbRole.id, [
        ...SB_RESOLUTION_PERMISSIONS,
        PERMISSIONS.DOCUMENTS_VIEW,
      ]);
    } catch (err) {
      rejectedExtraPerm = err instanceof RoleError && err.statusCode === 400;
    }
    assert(rejectedExtraPerm, "updateRolePermissions rejects adding documents.view to SB Admin role");

    // 2. Account Creation & Office Binding
    console.log("\n[3] Testing Super Admin Account Creation & Office Binding...");
    const testEmail = `sb.test.${Date.now()}@sanfelipe.gov.ph`;

    // Non-Super Admin cannot create SB Admin
    let nonSuperBlocked = false;
    try {
      await createUser(officeAdminCaller, {
        name: "Unauthorized SB",
        email: `unauth.${Date.now()}@sanfelipe.gov.ph`,
        password: "StrongPassword!123",
        roleId: sbRole.id,
        officeId: sbOffice.id,
      });
    } catch (err) {
      nonSuperBlocked = err instanceof UserError && err.statusCode === 403;
    }
    assert(nonSuperBlocked, "Non-Super Admin cannot create Sangguniang Bayan Admin account");

    // Forged other officeId on create is rejected
    let forgedOfficeCreateBlocked = false;
    try {
      await createUser(superAdminCaller, {
        name: "Forged Office SB",
        email: `forged.${Date.now()}@sanfelipe.gov.ph`,
        password: "StrongPassword!123",
        roleId: sbRole.id,
        officeId: otherOffice.id,
      });
    } catch (err) {
      forgedOfficeCreateBlocked = err instanceof UserError && err.statusCode === 400;
    }
    assert(forgedOfficeCreateBlocked, "Forged assignment of SB Admin to another office is rejected");

    // Super Admin creates SB Admin -> automatically bound to canonical SB office
    const createdSbUser = await createUser(superAdminCaller, {
      name: "SB Test Admin",
      email: testEmail,
      password: "StrongPassword!123",
      roleId: sbRole.id,
      officeId: null,
    });
    createdUserIds.push(createdSbUser.id);
    assert(
      createdSbUser.officeId === sbOffice.id && createdSbUser.roleId === sbRole.id,
      "Super Admin creates SB Admin auto-bound to canonical Office of the Sangguniang Bayan"
    );

    // Updating SB Admin to another office is rejected
    let forgedOfficeUpdateBlocked = false;
    try {
      await updateUser(superAdminCaller, createdSbUser.id, {
        name: "SB Test Admin",
        email: testEmail,
        officeId: otherOffice.id,
      });
    } catch (err) {
      forgedOfficeUpdateBlocked = err instanceof UserError && err.statusCode === 400;
    }
    assert(forgedOfficeUpdateBlocked, "Updating SB Admin officeId to another office is rejected");

    const sbAdminCaller: SessionUser = {
      id: createdSbUser.id,
      name: createdSbUser.name,
      email: createdSbUser.email,
      status: "ACTIVE",
      officeId: sbOffice.id,
      roleId: sbRole.id,
      role: {
        id: sbRole.id,
        name: sbRole.name,
        slug: sbRole.slug,
        isSystemScope: false,
      },
      isSystemScope: false,
      permissions: [...SB_RESOLUTION_PERMISSIONS],
      office: {
        id: sbOffice.id,
        name: sbOffice.name,
        shortName: sbOffice.shortName,
        slug: sbOffice.slug,
      },
      sessionId: "test-session-sb",
    };

    // 3. Navigation & Cross-Module Isolation
    console.log("\n[4] Testing Navigation & Cross-Module Isolation...");
    const visibleNav = getVisibleNavSections({
      permissions: sbAdminCaller.permissions,
      isSystemScope: false,
    });
    const visibleIds = visibleNav.flatMap((s) => s.items.map((i) => i.id));
    assert(
      visibleIds.includes("dashboard") &&
        visibleIds.includes("transparency-sb-resolutions") &&
        visibleIds.length === 2,
      "SB Admin sidebar shows ONLY Dashboard and Sangguniang Bayan Resolutions"
    );

    let docsBlocked = false;
    try {
      await getAdminDocumentsList(sbAdminCaller, {});
    } catch {
      docsBlocked = true;
    }
    assert(docsBlocked, "SB Admin is blocked from generic Document Management service");

    // Wrong office caller with SB permissions is blocked
    const forgedWrongOfficeSbCaller: SessionUser = {
      ...sbAdminCaller,
      officeId: otherOffice.id,
    };
    let wrongOfficeBlocked = false;
    try {
      await getAdminResolutionsList(forgedWrongOfficeSbCaller, {});
    } catch (err) {
      wrongOfficeBlocked = err instanceof ResolutionError && err.statusCode === 403;
    }
    assert(wrongOfficeBlocked, "Caller assigned to non-SB office is blocked from SB Resolutions");

    // Tourism user without sb_resolutions permissions is blocked
    const tourismCaller: SessionUser = {
      ...sbAdminCaller,
      officeId: null,
      permissions: [PERMISSIONS.TOURISM_VIEW, PERMISSIONS.TOURISM_CREATE],
    };
    let tourismBlocked = false;
    try {
      await getAdminResolutionsList(tourismCaller, {});
    } catch (err) {
      tourismBlocked = err instanceof ResolutionError && err.statusCode === 403;
    }
    assert(tourismBlocked, "Tourism user is blocked from SB Resolutions");

    // 4. PDF Validation Checks
    console.log("\n[5] Testing PDF Validation...");
    const validPdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
    const exeSpoofBytes = Buffer.from("MZ\x90\x00\x03\x00\x00\x00");

    assert(
      validateResolutionPdfFile({
        buffer: validPdfBytes,
        filename: "res-2025-001.pdf",
        mimeType: "application/pdf",
        size: validPdfBytes.length,
      }).valid === true,
      "Valid PDF passes validation"
    );
    assert(
      validateResolutionPdfFile({
        buffer: exeSpoofBytes,
        filename: "malware.pdf",
        mimeType: "application/pdf",
        size: exeSpoofBytes.length,
      }).valid === false,
      "Executable spoofed as .pdf is rejected"
    );
    assert(
      validateResolutionPdfFile({
        buffer: Buffer.from("hello"),
        filename: "notes.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 5,
      }).valid === false,
      "Non-PDF extension (.docx) is rejected"
    );

    // 5. Resolution Lifecycle: Draft -> Publish Gate -> Publish -> Public -> Unpublish -> Archive -> Delete
    console.log("\n[6] Testing Resolution CRUD, Publish Gate, and Public Visibility...");
    const uniqueNum1 = `SB-TEST-${Date.now()}-A`;
    const uniqueNum2 = `SB-TEST-${Date.now()}-B`;

    // Draft without PDF cannot be published
    const draftNoPdf = await createResolution(sbAdminCaller, {
      input: {
        resolutionNumber: uniqueNum1,
        title: "Test Resolution Without PDF",
        year: 2025,
        adoptedAt: "2025-02-15",
        summary: "Draft resolution summary",
      },
      file: null,
    });
    createdResolutionIds.push(draftNoPdf.id);
    assert(draftNoPdf.status === "DRAFT" && draftNoPdf.officeId === sbOffice.id, "Draft resolution created under SB Office");

    let publishWithoutPdfBlocked = false;
    try {
      await publishResolution(sbAdminCaller, draftNoPdf.id);
    } catch (err) {
      publishWithoutPdfBlocked = err instanceof ResolutionError && err.statusCode === 400;
    }
    assert(publishWithoutPdfBlocked, "Publishing resolution without PDF is blocked");

    // Draft is NOT public and NOT eligible for PDF view/download
    const pubBefore = await getPublishedResolutions({ search: uniqueNum1 });
    assert(pubBefore.resolutions.length === 0, "Draft resolution is excluded from public listing");
    assert((await getEligiblePublicResolution(draftNoPdf.id)) === null, "Draft resolution returns null from getEligiblePublicResolution");

    // Update draft with PDF and publish
    await updateResolution(sbAdminCaller, draftNoPdf.id, {
      input: {
        resolutionNumber: uniqueNum1,
        title: "Test Resolution With PDF",
        year: 2025,
        adoptedAt: "2025-02-15",
        summary: "Updated summary",
      },
      file: {
        buffer: validPdfBytes,
        filename: "res-2025-001.pdf",
        mimeType: "application/pdf",
        size: validPdfBytes.length,
      },
    });

    const published = await publishResolution(sbAdminCaller, draftNoPdf.id);
    assert(published.status === "PUBLISHED", "Resolution with PDF publishes successfully");

    const pubAfter = await getPublishedResolutions({ year: 2025, search: uniqueNum1 });
    assert(
      pubAfter.resolutions.length === 1 && pubAfter.resolutions[0].id === draftNoPdf.id,
      "Published resolution appears in public listing with year filter"
    );
    const eligiblePub = await getEligiblePublicResolution(draftNoPdf.id);
    assert(Boolean(eligiblePub && eligiblePub.storageUrl), "Published resolution is eligible for public PDF view/download");

    // Create & publish second resolution for year 2024 to test year filter
    const res2024 = await createResolution(sbAdminCaller, {
      input: {
        resolutionNumber: uniqueNum2,
        title: "Test 2024 Resolution",
        year: 2024,
        adoptedAt: "2024-11-10",
        summary: "2024 summary",
      },
      file: {
        buffer: validPdfBytes,
        filename: "res-2024-002.pdf",
        mimeType: "application/pdf",
        size: validPdfBytes.length,
      },
    });
    createdResolutionIds.push(res2024.id);
    await publishResolution(sbAdminCaller, res2024.id);

    const filter2025 = await getPublishedResolutions({ year: 2025, search: uniqueNum2 });
    assert(filter2025.resolutions.length === 0, "Year filter 2025 excludes 2024 resolution");
    const filter2024 = await getPublishedResolutions({ year: 2024, search: uniqueNum2 });
    assert(filter2024.resolutions.length === 1, "Year filter 2024 returns 2024 resolution");

    // Unpublish removes from public
    await unpublishResolution(sbAdminCaller, draftNoPdf.id);
    assert((await getEligiblePublicResolution(draftNoPdf.id)) === null, "Unpublished resolution is no longer eligible for public PDF");

    // Archive removes from public
    await archiveResolution(sbAdminCaller, res2024.id);
    assert((await getEligiblePublicResolution(res2024.id)) === null, "Archived resolution is no longer eligible for public PDF");

    // Delete cleans up DB and Cloudinary
    const pubIdToDelete = (await getAdminResolutionById(sbAdminCaller, res2024.id)).storagePublicId;
    await deleteResolution(sbAdminCaller, res2024.id);
    const afterDelete = await prisma.sangguniangBayanResolution.findUnique({ where: { id: res2024.id } });
    assert(afterDelete === null, "Deleted resolution is removed from database");
    assert(Boolean(pubIdToDelete && deletedPublicIds.includes(pubIdToDelete)), "Deleted resolution triggers Cloudinary asset cleanup");

    // 6. Verify public route & PDF route files exist without syntax issues
    const viewRoutePath = path.join(process.cwd(), "src/app/resolutions/[id]/view/route.ts");
    const downloadRoutePath = path.join(process.cwd(), "src/app/resolutions/[id]/download/route.ts");
    assert(fs.existsSync(viewRoutePath) && fs.existsSync(downloadRoutePath), "Public PDF view & download routes exist");

    // 7. Verify canonical offices count (18 active + icto untouched)
    const canonicalOfficesCount = await prisma.office.count({
      where: { slug: { not: "icto" } },
    });
    assert(canonicalOfficesCount === 18, `18 canonical offices remain intact (got ${canonicalOfficesCount})`);

    // 8. Super Admin (SYSTEM scope, officeId = null) WITHOUT explicit sb_resolutions.* permissions
    console.log("\n[7] Testing Super Admin Full Access Without Explicit sb_resolutions.* Permissions...");
    const superAdminWithoutSbPerms: SessionUser = {
      ...superAdminCaller,
      officeId: null,
      permissions: Object.values(PERMISSIONS).filter(
        (code) => !code.startsWith("sb_resolutions.")
      ),
    };

    const superNav = getVisibleNavSections({
      permissions: superAdminWithoutSbPerms.permissions,
      isSystemScope: true,
    });
    const superNavIds = superNav.flatMap((s) => s.items.map((i) => i.id));
    assert(
      superNavIds.includes("transparency-sb-resolutions"),
      "Super Admin sees Sangguniang Bayan Resolutions in sidebar without explicit sb_resolutions.view"
    );

    const superList = await getAdminResolutionsList(superAdminWithoutSbPerms, {});
    assert(Array.isArray(superList.resolutions), "Super Admin can list SB resolutions without sb_resolutions.view");

    const superResNum = `SB-SUPER-${Date.now()}`;
    const superCreated = await createResolution(superAdminWithoutSbPerms, {
      input: {
        resolutionNumber: superResNum,
        title: "Super Admin Created Resolution",
        year: 2025,
        adoptedAt: "2025-03-01",
        summary: "Created by Super Admin without explicit sb_resolutions.* permissions",
      },
      file: {
        buffer: validPdfBytes,
        filename: "super-admin-res.pdf",
        mimeType: "application/pdf",
        size: validPdfBytes.length,
      },
    });
    createdResolutionIds.push(superCreated.id);
    assert(Boolean(superCreated.id), "Super Admin can create SB resolution without sb_resolutions.create");

    const superFetched = await getAdminResolutionById(superAdminWithoutSbPerms, superCreated.id);
    assert(superFetched.id === superCreated.id, "Super Admin can view individual SB resolution without sb_resolutions.view");

    const superUpdated = await updateResolution(superAdminWithoutSbPerms, superCreated.id, {
      input: {
        resolutionNumber: superResNum,
        title: "Super Admin Updated Resolution",
        year: 2025,
        adoptedAt: "2025-03-01",
        summary: "Updated by Super Admin",
      },
      file: {
        buffer: validPdfBytes,
        filename: "super-admin-res-v2.pdf",
        mimeType: "application/pdf",
        size: validPdfBytes.length,
      },
    });
    assert(superUpdated.title === "Super Admin Updated Resolution", "Super Admin can update SB resolution and replace PDF without sb_resolutions.update");

    const superPublished = await publishResolution(superAdminWithoutSbPerms, superCreated.id);
    assert(superPublished.status === "PUBLISHED", "Super Admin can publish SB resolution without sb_resolutions.publish");

    const superUnpublished = await unpublishResolution(superAdminWithoutSbPerms, superCreated.id);
    assert(superUnpublished.status === "DRAFT", "Super Admin can unpublish SB resolution without sb_resolutions.publish");

    const superArchived = await archiveResolution(superAdminWithoutSbPerms, superCreated.id);
    assert(superArchived.status === "ARCHIVED", "Super Admin can archive SB resolution without sb_resolutions.archive");

    await deleteResolution(superAdminWithoutSbPerms, superCreated.id);
    const superDeleted = await prisma.sangguniangBayanResolution.findUnique({ where: { id: superCreated.id } });
    assert(superDeleted === null, "Super Admin can delete SB resolution without sb_resolutions.delete");

    // 9. Partial-permission SB Admin & Ordinary Role denials
    console.log("\n[8] Testing Partial-Permission SB Admin & Ordinary Role Denials...");
    const partialSbCaller: SessionUser = {
      ...sbAdminCaller,
      permissions: [PERMISSIONS.SB_RESOLUTIONS_VIEW, PERMISSIONS.SB_RESOLUTIONS_CREATE],
    };
    let partialPublishDenied = false;
    try {
      await publishResolution(partialSbCaller, draftNoPdf.id);
    } catch (err) {
      partialPublishDenied = err instanceof ResolutionError && err.statusCode === 403;
    }
    assert(partialPublishDenied, "SB Admin without sb_resolutions.publish is denied publishResolution (403)");

    let partialDeleteDenied = false;
    try {
      await deleteResolution(partialSbCaller, draftNoPdf.id);
    } catch (err) {
      partialDeleteDenied = err instanceof ResolutionError && err.statusCode === 403;
    }
    assert(partialDeleteDenied, "SB Admin without sb_resolutions.delete is denied deleteResolution (403)");

    const ordinaryStaffCaller: SessionUser = {
      ...officeAdminCaller,
      permissions: [PERMISSIONS.POSTS_VIEW, PERMISSIONS.DOCUMENTS_VIEW],
    };
    const staffNav = getVisibleNavSections({
      permissions: ordinaryStaffCaller.permissions,
      isSystemScope: false,
    });
    assert(
      !staffNav.flatMap((s) => s.items.map((i) => i.id)).includes("transparency-sb-resolutions"),
      "Ordinary role does NOT see Sangguniang Bayan Resolutions in sidebar"
    );
    let staffDenied = false;
    try {
      await getAdminResolutionsList(ordinaryStaffCaller, {});
    } catch (err) {
      staffDenied = err instanceof ResolutionError && err.statusCode === 403;
    }
    assert(staffDenied, "Ordinary role is denied access to SB Resolutions service (403)");
  } finally {
    // Restore mocked cloudinary functions
    (cloudinaryMod.v2.uploader as unknown as Record<string, unknown>).upload_stream = originalUploadStream;
    (cloudinaryMod.v2.uploader as unknown as Record<string, unknown>).destroy = originalDestroy;

    // Clean up test records
    if (createdResolutionIds.length > 0) {
      await prisma.sangguniangBayanResolution.deleteMany({
        where: { id: { in: createdResolutionIds } },
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
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`=================================================================`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
