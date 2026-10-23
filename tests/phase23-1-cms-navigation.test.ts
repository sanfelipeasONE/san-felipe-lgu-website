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

import { PrismaClient } from "@prisma/client";
import type { SessionUser } from "../src/server/auth/session";

const prisma = new PrismaClient();

async function runPhase23_1TestSuite() {
  console.log("===============================================================");
  console.log("SAN FELIPE LGU CMS NAVIGATION & PROVISIONING TEST SUITE (PHASE 23.1)");
  console.log("===============================================================");

  const {
    provisionTourismPermissions,
    TOURISM_PERMISSIONS,
  } = await import("../scripts/provision-tourism-permissions");
  const {
    ADMIN_NAV_CONFIG,
    getVisibleNavSections,
  } = await import("../src/config/admin-navigation");
  const { PERMISSIONS } = await import("../src/server/authz/permissions");
  const {
    getAdminDocumentsList,
    getPublishedDocuments,
  } = await import("../src/server/documents/service");
  const { documentInputSchema } = await import("../src/lib/validation/documents");

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

  const createdDocIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Tourism Permission Definitions & Invariants
    // -------------------------------------------------------------------------
    console.log("\n--- 1. Tourism Permission Definitions & Invariants ---");

    assert(
      TOURISM_PERMISSIONS.length === 6,
      "TOURISM_PERMISSIONS defines exactly 6 granular permissions"
    );

    const expectedCodes = [
      "tourism.view",
      "tourism.create",
      "tourism.update",
      "tourism.publish",
      "tourism.archive",
      "tourism.delete",
    ];

    const allExpectedPresent = expectedCodes.every((code) =>
      TOURISM_PERMISSIONS.some((p) => p.code === code && p.module === "tourism")
    );
    assert(
      allExpectedPresent,
      "All 6 canonical permission codes belong to module 'tourism'"
    );

    // -------------------------------------------------------------------------
    // 2. Safe Provisioning Idempotency & DB Verification
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Safe Provisioning Idempotency & DB Verification ---");

    const result1 = await provisionTourismPermissions(prisma);
    assert(result1.success, "Provisioning execution succeeds");
    assert(
      result1.permissionsCreated === 0 && result1.permissionsExisting === 6,
      "Idempotent: 0 permissions created, 6 existing found"
    );
    assert(
      result1.rolePermissionsAssigned === 0 && result1.rolePermissionsExisting === 6,
      "Idempotent: 0 role permissions assigned, 6 existing found"
    );

    // Verify DB records
    const dbPermissions = await prisma.permission.findMany({
      where: { code: { startsWith: "tourism." } },
    });
    assert(
      dbPermissions.length === 6,
      "Database contains exactly 6 tourism permission records"
    );

    // Verify Super Admin assignment
    const superAdminRole = await prisma.role.findFirst({
      where: { slug: "super-admin", isSystemScope: true },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    assert(Boolean(superAdminRole), "Authoritative Super Admin role exists in DB");

    const superAdminTourismCodes = superAdminRole!.permissions
      .map((rp) => rp.permission.code)
      .filter((code) => code.startsWith("tourism."));

    assert(
      superAdminTourismCodes.length === 6 &&
        expectedCodes.every((c) => superAdminTourismCodes.includes(c)),
      "Super Admin role holds all 6 tourism permissions in DB"
    );

    // Check no duplicate RolePermission rows exist
    const rpCount = await prisma.rolePermission.count({
      where: {
        roleId: superAdminRole!.id,
        permission: { code: { startsWith: "tourism." } },
      },
    });
    assert(
      rpCount === 6,
      "No duplicate RolePermission rows exist for tourism permissions"
    );

    // Unrelated permissions untouched
    const userPerm = await prisma.permission.findUnique({
      where: { code: "users.view" },
    });
    const docPerm = await prisma.permission.findUnique({
      where: { code: "documents.view" },
    });
    assert(
      Boolean(userPerm) && Boolean(docPerm),
      "Unrelated system permissions (users.view, documents.view) are preserved"
    );

    // -------------------------------------------------------------------------
    // 3. Fail-Closed on Missing Super Admin Role
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Fail-Closed on Missing Super Admin Role ---");

    let failClosedCaught = false;
    // Create a mock Prisma client where findFirst for super-admin returns null
    const mockPrisma = {
      role: {
        findFirst: async () => null,
      },
      permission: prisma.permission,
      rolePermission: prisma.rolePermission,
      $disconnect: async () => {},
    } as unknown as PrismaClient;

    try {
      await provisionTourismPermissions(mockPrisma);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes("not found in database. Provisioning failed closed.")
      ) {
        failClosedCaught = true;
      }
    }
    assert(
      failClosedCaught,
      "Provisioning fails closed with error when Super Admin role is missing"
    );

    // -------------------------------------------------------------------------
    // 4. CMS Sidebar Navigation Structure & Tourism Item
    // -------------------------------------------------------------------------
    console.log("\n--- 4. CMS Sidebar Navigation Structure & Tourism Item ---");

    assert(
      PERMISSIONS.DOCUMENTS_VIEW === "documents.view" &&
        PERMISSIONS.DOCUMENTS_CREATE === "documents.create" &&
        PERMISSIONS.TOURISM_VIEW === "tourism.view",
      "PERMISSIONS constants define canonical DOCUMENTS and TOURISM codes"
    );

    const sectionKeys = ADMIN_NAV_CONFIG.map((s) => s.key);
    assert(
      sectionKeys[0] === "main" &&
        sectionKeys[1] === "content" &&
        sectionKeys[2] === "transparency" &&
        sectionKeys[3] === "administration" &&
        sectionKeys[4] === "system",
      "Sidebar sections ordered: main -> content -> transparency -> administration -> system"
    );

    // Tourism in Content section
    const contentSection = ADMIN_NAV_CONFIG.find((s) => s.key === "content")!;
    const tourismItem = contentSection.items.find((i) => i.id === "tourism");
    assert(Boolean(tourismItem), "Tourism item declared under content section");
    assert(
      tourismItem?.href === "/admin/tourism" &&
        tourismItem?.requiredPermission === "tourism.view" &&
        tourismItem?.isImplemented === true,
      "Tourism item targets /admin/tourism, requires tourism.view, isImplemented=true"
    );

    // Tourism sidebar visibility check with permission
    const userWithTourism = {
      permissions: ["tourism.view"],
      isSystemScope: true,
    };
    const visibleWithTourism = getVisibleNavSections(userWithTourism);
    const contentWithTourism = visibleWithTourism.find((s) => s.key === "content");
    assert(
      Boolean(contentWithTourism?.items.some((i) => i.id === "tourism")),
      "Tourism item is VISIBLE to user holding tourism.view"
    );

    // Tourism sidebar hidden without permission
    const userWithoutTourism = {
      permissions: ["posts.view", "documents.view"],
      isSystemScope: true,
    };
    const visibleWithoutTourism = getVisibleNavSections(userWithoutTourism);
    const contentWithoutTourism = visibleWithoutTourism.find((s) => s.key === "content");
    assert(
      !contentWithoutTourism?.items.some((i) => i.id === "tourism"),
      "Tourism item is HIDDEN from user lacking tourism.view"
    );

    // -------------------------------------------------------------------------
    // 5. CMS Transparency Navigation & Procurement Item
    // -------------------------------------------------------------------------
    console.log("\n--- 5. CMS Transparency Navigation & Procurement Item ---");

    const transparencySection = ADMIN_NAV_CONFIG.find((s) => s.key === "transparency");
    assert(
      Boolean(transparencySection),
      "Dedicated TRANSPARENCY section exists in ADMIN_NAV_CONFIG"
    );
    assert(
      transparencySection?.title === "Transparency",
      "Transparency section title is 'Transparency'"
    );

    const procurementItem = transparencySection?.items.find(
      (i) => i.id === "transparency-procurement"
    );
    assert(
      Boolean(procurementItem),
      "Procurement nav item exists under TRANSPARENCY section"
    );
    assert(
      procurementItem?.href === "/admin/transparency/procurement",
      "Procurement nav item href is /admin/transparency/procurement"
    );
    assert(
      procurementItem?.requiredPermission === "documents.view",
      "Procurement nav item is governed by documents.view permission"
    );
    assert(
      procurementItem?.isImplemented === true,
      "Procurement nav item has isImplemented=true"
    );

    // Procurement sidebar visibility with documents.view
    const userWithDocView = {
      permissions: ["documents.view"],
      isSystemScope: true,
    };
    const visibleWithDocs = getVisibleNavSections(userWithDocView);
    const transparencyVisible = visibleWithDocs.find((s) => s.key === "transparency");
    assert(
      Boolean(transparencyVisible?.items.some((i) => i.id === "transparency-procurement")),
      "Procurement item is VISIBLE to user holding documents.view"
    );

    // Procurement sidebar hidden without documents.view
    const userWithoutDocs = {
      permissions: ["posts.view", "tourism.view"],
      isSystemScope: true,
    };
    const visibleWithoutDocs = getVisibleNavSections(userWithoutDocs);
    const transparencyHidden = visibleWithoutDocs.find((s) => s.key === "transparency");
    assert(
      !transparencyHidden,
      "Transparency section is completely stripped when user lacks documents.view"
    );

    // -------------------------------------------------------------------------
    // 6. Procurement Query Isolation & Document Management Backend Reuse
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Procurement Query Isolation & Document Backend Reuse ---");

    // Fetch an active office and admin user for test records
    const activeOffice = await prisma.office.findFirst({
      where: { status: "ACTIVE" },
    });
    assert(Boolean(activeOffice), "Active municipal office found for document testing");

    const adminUserRecord = await prisma.user.findFirst({
      where: { status: "ACTIVE", role: { slug: "super-admin" } },
      include: {
        office: true,
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
    assert(Boolean(adminUserRecord), "Active super-admin user found for document testing");

    const mockAdminSession: SessionUser = {
      id: adminUserRecord!.id,
      name: adminUserRecord!.name,
      email: adminUserRecord!.email,
      status: "ACTIVE",
      officeId: null,
      office: null,
      roleId: adminUserRecord!.roleId,
      role: {
        id: adminUserRecord!.role.id,
        name: adminUserRecord!.role.name,
        slug: adminUserRecord!.role.slug,
        isSystemScope: true,
      },
      isSystemScope: true,
      permissions: adminUserRecord!.role.permissions.map((rp) => rp.permission.code),
      sessionId: "test-procurement-session",
    };

    // Create isolated test documents:
    // 1. Legitimate PUBLISHED Procurement document
    const docProcurementPublished = await prisma.document.create({
      data: {
        title: "TEST INVITATION TO BID: Municipal Drainage System (Phase 23.1)",
        description: "Official invitation to bid for Phase 23.1 drainage project.",
        category: "Procurement",
        purpose: "OTHER_PUBLIC_DOCUMENT",
        status: "PUBLISHED",
        officeId: activeOffice!.id,
        originalFilename: "itb-drainage-23-1.pdf",
        storagePublicId: "test-procurement-itb-23-1",
        storageUrl: "https://res.cloudinary.com/test/itb-drainage-23-1.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1048576,
        createdById: adminUserRecord!.id,
        publishedAt: new Date(),
      },
    });
    createdDocIds.push(docProcurementPublished.id);

    // 2. Legitimate DRAFT Procurement document
    const docProcurementDraft = await prisma.document.create({
      data: {
        title: "TEST DRAFT BID BULLETIN: Heavy Equipment Supply (Phase 23.1)",
        description: "Draft bid bulletin not yet published.",
        category: "Procurement",
        purpose: "OTHER_PUBLIC_DOCUMENT",
        status: "DRAFT",
        officeId: activeOffice!.id,
        originalFilename: "bid-bulletin-draft.pdf",
        storagePublicId: "test-procurement-bulletin-draft",
        storageUrl: "https://res.cloudinary.com/test/bid-bulletin-draft.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 524288,
        createdById: adminUserRecord!.id,
      },
    });
    createdDocIds.push(docProcurementDraft.id);

    // 3. Downloadable form with category Procurement (must NOT appear in dedicated Procurement route)
    const docDownloadableForm = await prisma.document.create({
      data: {
        title: "TEST DOWNLOADABLE FORM: Procurement Supplier Form (Phase 23.1)",
        category: "Procurement",
        purpose: "DOWNLOADABLE_FORM",
        status: "PUBLISHED",
        officeId: activeOffice!.id,
        originalFilename: "supplier-accreditation-form.pdf",
        storagePublicId: "test-procurement-supplier-form",
        storageUrl: "https://res.cloudinary.com/test/supplier-accreditation-form.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 262144,
        createdById: adminUserRecord!.id,
        publishedAt: new Date(),
      },
    });
    createdDocIds.push(docDownloadableForm.id);

    // 4. Citizen's Charter document (must NOT appear in Procurement route)
    const docCharter = await prisma.document.create({
      data: {
        title: "TEST CHARTER: BAC Frontline Service Standards (Phase 23.1)",
        category: "Procurement",
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        officeId: activeOffice!.id,
        originalFilename: "bac-charter-standards.pdf",
        storagePublicId: "test-procurement-bac-charter",
        storageUrl: "https://res.cloudinary.com/test/bac-charter-standards.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 3145728,
        createdById: adminUserRecord!.id,
        publishedAt: new Date(),
      },
    });
    createdDocIds.push(docCharter.id);

    // 5. Job attachment document (must NOT appear in Procurement route)
    const docJobAttachment = await prisma.document.create({
      data: {
        title: "TEST JOB ATTACHMENT: Procurement Officer TOR (Phase 23.1)",
        category: "Procurement",
        purpose: "JOB_ATTACHMENT",
        status: "PUBLISHED",
        officeId: activeOffice!.id,
        originalFilename: "procurement-officer-tor.pdf",
        storagePublicId: "test-procurement-job-tor",
        storageUrl: "https://res.cloudinary.com/test/procurement-officer-tor.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 131072,
        createdById: adminUserRecord!.id,
        publishedAt: new Date(),
      },
    });
    createdDocIds.push(docJobAttachment.id);

    // 6. Other Public Document with unrelated category (must NOT appear in Procurement route)
    const docOtherCategory = await prisma.document.create({
      data: {
        title: "TEST GENERAL DISCLOSURE: Municipal Annual Report (Phase 23.1)",
        category: "General Administration",
        purpose: "OTHER_PUBLIC_DOCUMENT",
        status: "PUBLISHED",
        officeId: activeOffice!.id,
        originalFilename: "annual-report-2025.pdf",
        storagePublicId: "test-procurement-annual-report",
        storageUrl: "https://res.cloudinary.com/test/annual-report-2025.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 4194304,
        createdById: adminUserRecord!.id,
        publishedAt: new Date(),
      },
    });
    createdDocIds.push(docOtherCategory.id);

    // Test CMS Procurement filtered list
    const cmsProcurementList = await getAdminDocumentsList(mockAdminSession, {
      category: "Procurement",
      purpose: "OTHER_PUBLIC_DOCUMENT",
    });

    const cmsIds = cmsProcurementList.documents.map((d) => d.id);

    assert(
      cmsIds.includes(docProcurementPublished.id),
      "CMS Procurement list INCLUDES legitimate published procurement document"
    );
    assert(
      cmsIds.includes(docProcurementDraft.id),
      "CMS Procurement list INCLUDES legitimate draft procurement document"
    );
    assert(
      !cmsIds.includes(docDownloadableForm.id),
      "CMS Procurement list EXCLUDES DOWNLOADABLE_FORM records"
    );
    assert(
      !cmsIds.includes(docCharter.id),
      "CMS Procurement list EXCLUDES CITIZENS_CHARTER records"
    );
    assert(
      !cmsIds.includes(docJobAttachment.id),
      "CMS Procurement list EXCLUDES JOB_ATTACHMENT records"
    );
    assert(
      !cmsIds.includes(docOtherCategory.id),
      "CMS Procurement list EXCLUDES non-Procurement OTHER_PUBLIC_DOCUMENT categories"
    );

    // -------------------------------------------------------------------------
    // 7. Public Procurement Isolation & Deterministic Status Filter
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Public Procurement Isolation & Deterministic Filter ---");

    const publicProcurementList = await getPublishedDocuments({
      purpose: "OTHER_PUBLIC_DOCUMENT",
      category: "Procurement",
    });

    const publicIds = publicProcurementList.map((d) => d.id);

    assert(
      publicIds.includes(docProcurementPublished.id),
      "Public Procurement INCLUDES published procurement document"
    );
    assert(
      !publicIds.includes(docProcurementDraft.id),
      "Public Procurement STRICTLY EXCLUDES draft procurement document"
    );
    assert(
      !publicIds.includes(docDownloadableForm.id),
      "Public Procurement EXCLUDES DOWNLOADABLE_FORM documents"
    );
    assert(
      !publicIds.includes(docCharter.id),
      "Public Procurement EXCLUDES CITIZENS_CHARTER documents"
    );
    assert(
      !publicIds.includes(docJobAttachment.id),
      "Public Procurement EXCLUDES JOB_ATTACHMENT documents"
    );
    assert(
      !publicIds.includes(docOtherCategory.id),
      "Public Procurement EXCLUDES non-Procurement documents"
    );

    // Secure URL Check: No raw Cloudinary URLs exposed
    const fs = await import("fs");
    const path = await import("path");
    const publicProcurementSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/transparency/procurement/page.tsx"),
      "utf-8"
    );

    assert(
      publicProcurementSource.includes('href={`/documents/${doc.id}/view`}') &&
        publicProcurementSource.includes('href={`/documents/${doc.id}/download`}') &&
        !publicProcurementSource.includes("doc.downloadUrl"),
      "Public Procurement page links strictly via first-party /documents/[id] routes without exposing raw Cloudinary URLs"
    );

    // -------------------------------------------------------------------------
    // 8. Procurement Validation & Classification Invariant
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Procurement Validation & Classification Invariant ---");

    const validProcurementInput = documentInputSchema.safeParse({
      title: "Invitation to Bid - Municipal Building Renovation",
      description: "Official bidding documents and terms of reference.",
      category: "Procurement",
      purpose: "OTHER_PUBLIC_DOCUMENT",
      officeId: activeOffice!.id,
    });
    assert(
      validProcurementInput.success,
      "documentInputSchema accepts valid Procurement document payload"
    );

    assert(
      validProcurementInput.success &&
        validProcurementInput.data.purpose === "OTHER_PUBLIC_DOCUMENT" &&
        validProcurementInput.data.category === "Procurement",
      "Procurement input preserves purpose=OTHER_PUBLIC_DOCUMENT and category=Procurement"
    );

    // -------------------------------------------------------------------------
    // 9. Neutral Empty State Resilience
    // -------------------------------------------------------------------------
    console.log("\n--- 9. Neutral Empty State Resilience ---");

    const nonExistentProcurement = await getPublishedDocuments({
      purpose: "OTHER_PUBLIC_DOCUMENT",
      category: "NonExistentCategory999",
    });
    assert(
      Array.isArray(nonExistentProcurement) && nonExistentProcurement.length === 0,
      "Empty state returns an empty array cleanly without throwing exceptions"
    );
  } finally {
    // Cleanup created test documents
    if (createdDocIds.length > 0) {
      await prisma.document.deleteMany({
        where: { id: { in: createdDocIds } },
      });
      console.log(`\nCleaned up ${createdDocIds.length} test documents.`);
    }
    await prisma.$disconnect();
  }

  console.log("\n===============================================================");
  console.log(`PHASE 23.1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase23_1TestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
