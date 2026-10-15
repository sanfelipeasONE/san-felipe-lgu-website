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

async function runPhase1931TestSuite() {
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
  console.log("SAN FELIPE LGU CITIZEN'S CHARTER PDF & NAVIGATION TEST (PHASE 19.3.1)");
  console.log("=====================================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    uploadAndAttachCharterPdf,
    removeCharterDocumentAssociation,
    attachExistingCharterDocument,
    getPublishedServicePage,
    ServiceError,
  } = await import("../src/server/services/service");
  const {
    deleteDocument,
    getPublishedDocuments,
    DocumentError,
  } = await import("../src/server/documents/service");
  const {
    validateCharterPdfFile,
    MAX_DOCUMENT_FILE_SIZE_BYTES,
  } = await import("../src/lib/validation/documents");
  const {
    ADMIN_NAV_CONFIG,
    getVisibleNavSections,
  } = await import("../src/config/admin-navigation");

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

  const createdDocumentIds: string[] = [];
  const createdCloudinaryPublicIds: string[] = [];

  // Authentic test PDF buffer containing official %PDF- magic bytes
  const authenticPdfBuffer = Buffer.from(
    "%PDF-1.4\n%San Felipe Zambales Citizen's Charter Official Test Handbook\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000010 00000 n \ntrailer\n<< /Root 1 0 R >>\nstartxref\n100\n%%EOF"
  );

  try {
    // -------------------------------------------------------------------------
    // Setup Test Roles, Offices, and Users
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

    const testOfficePrimary = await prisma.office.upsert({
      where: { slug: "test-icto-p1931" },
      update: { name: "ICT Office Test 19.3.1", status: "ACTIVE" },
      create: {
        name: "ICT Office Test 19.3.1",
        shortName: "ICTO-T",
        slug: "test-icto-p1931",
        status: "ACTIVE",
      },
    });

    const testOfficeSecondary = await prisma.office.upsert({
      where: { slug: "test-mho-p1931" },
      update: { name: "Health Office Test 19.3.1", status: "ACTIVE" },
      create: {
        name: "Health Office Test 19.3.1",
        shortName: "MHO-T",
        slug: "test-mho-p1931",
        status: "ACTIVE",
      },
    });

    const dummyHash = "$argon2id$v=19$m=65536,t=3,p=4$dummyhashforphase1931testing";

    const dbSuperAdmin = await prisma.user.upsert({
      where: { email: "super.admin.p1931@sanfelipe.gov.ph" },
      update: { officeId: testOfficePrimary.id, roleId: superAdminRole.id },
      create: {
        name: "Super Admin Tester 19.3.1",
        email: "super.admin.p1931@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: testOfficePrimary.id,
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
    });

    const dbOfficeAdmin = await prisma.user.upsert({
      where: { email: "office.admin.p1931@sanfelipe.gov.ph" },
      update: { officeId: testOfficeSecondary.id, roleId: officeAdminRole.id },
      create: {
        name: "Office Admin Tester 19.3.1",
        email: "office.admin.p1931@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: testOfficeSecondary.id,
        roleId: officeAdminRole.id,
        status: "ACTIVE",
      },
    });

    const dbStaffUser = await prisma.user.upsert({
      where: { email: "staff.p1931@sanfelipe.gov.ph" },
      update: { officeId: testOfficePrimary.id, roleId: staffRole.id },
      create: {
        name: "Staff Tester 19.3.1",
        email: "staff.p1931@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: testOfficePrimary.id,
        roleId: staffRole.id,
        status: "ACTIVE",
      },
    });

    const superAdminUser: SessionUser = {
      id: dbSuperAdmin.id,
      name: dbSuperAdmin.name,
      email: dbSuperAdmin.email,
      isSystemScope: true,
      roleId: superAdminRole.id,
      office: {
        id: testOfficePrimary.id,
        name: testOfficePrimary.name,
        slug: testOfficePrimary.slug,
        shortName: testOfficePrimary.shortName,
      },
      officeId: testOfficePrimary.id,
      status: "ACTIVE",
      sessionId: "sess-p1931-super-admin",
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: true,
      },
      permissions: superAdminRole.permissions.map((p) => p.permission.code),
    };

    const officeAdminUser: SessionUser = {
      id: dbOfficeAdmin.id,
      name: dbOfficeAdmin.name,
      email: dbOfficeAdmin.email,
      isSystemScope: false,
      roleId: officeAdminRole.id,
      office: {
        id: testOfficeSecondary.id,
        name: testOfficeSecondary.name,
        slug: testOfficeSecondary.slug,
        shortName: testOfficeSecondary.shortName,
      },
      officeId: testOfficeSecondary.id,
      status: "ACTIVE",
      sessionId: "sess-p1931-office-admin",
      role: {
        id: officeAdminRole.id,
        name: officeAdminRole.name,
        slug: officeAdminRole.slug,
        isSystemScope: false,
      },
      permissions: officeAdminRole.permissions.map((p) => p.permission.code),
    };

    const staffUser: SessionUser = {
      id: dbStaffUser.id,
      name: dbStaffUser.name,
      email: dbStaffUser.email,
      isSystemScope: false,
      roleId: staffRole.id,
      office: {
        id: testOfficePrimary.id,
        name: testOfficePrimary.name,
        slug: testOfficePrimary.slug,
        shortName: testOfficePrimary.shortName,
      },
      officeId: testOfficePrimary.id,
      status: "ACTIVE",
      sessionId: "sess-p1931-staff",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      permissions: staffRole.permissions.map((p) => p.permission.code),
    };

    // Ensure citizen's charter service page exists in clean state
    await prisma.servicePage.upsert({
      where: { serviceKey: "citizens-charter" },
      update: { charterDocumentId: null, status: "PUBLISHED" },
      create: {
        serviceKey: "citizens-charter",
        title: "Citizen's Charter",
        description: "Official service delivery standards and processing turnaround times.",
        status: "PUBLISHED",
        createdById: dbSuperAdmin.id,
      },
    });

    // -------------------------------------------------------------------------
    // TEST GROUP 1: PDF File Validation (Section AN)
    // -------------------------------------------------------------------------
    console.log("TEST GROUP 1: PDF File Validation & Security Checks (Section AN)");

    // 1. Valid authentic PDF
    const validPdfRes = validateCharterPdfFile({
      filename: "citizens-charter-2026.pdf",
      size: authenticPdfBuffer.length,
      mimeType: "application/pdf",
      buffer: authenticPdfBuffer,
    });
    assert(validPdfRes.valid, "Authentic PDF with %PDF- header signature is valid");

    // 2. Non-PDF rejected (.docx)
    const docxRes = validateCharterPdfFile({
      filename: "charter.docx",
      size: 1024,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    assert(!docxRes.valid, "Non-PDF file (.docx) is strictly rejected");

    // 3. Fake PDF (text file renamed to .pdf lacking %PDF-)
    const fakePdfRes = validateCharterPdfFile({
      filename: "fake-handbook.pdf",
      size: 200,
      mimeType: "application/pdf",
      buffer: Buffer.from("This is plain text with no PDF magic header."),
    });
    assert(!fakePdfRes.valid, "Renamed fake PDF without authentic %PDF- header is rejected");

    // 4. Executable header in PDF
    const exeAsPdfRes = validateCharterPdfFile({
      filename: "malicious.pdf",
      size: 512,
      mimeType: "application/pdf",
      buffer: Buffer.from("MZ\x90\x00\x03\x00\x00\x00%PDF-fake"),
    });
    assert(!exeAsPdfRes.valid, "Windows PE executable (MZ header) disguised as PDF is rejected");

    // 5. Linux ELF binary in PDF
    const elfAsPdfRes = validateCharterPdfFile({
      filename: "exploit.pdf",
      size: 512,
      mimeType: "application/pdf",
      buffer: Buffer.from("\x7FELF\x02\x01\x01\x00%PDF-fake"),
    });
    assert(!elfAsPdfRes.valid, "Linux ELF binary header disguised as PDF is rejected");

    // 6. Shell script header in PDF
    const shAsPdfRes = validateCharterPdfFile({
      filename: "script.pdf",
      size: 512,
      mimeType: "application/pdf",
      buffer: Buffer.from("#!/bin/bash\n%PDF-fake"),
    });
    assert(!shAsPdfRes.valid, "Shell script header disguised as PDF is rejected");

    // 7. Empty file (0 bytes)
    const emptyPdfRes = validateCharterPdfFile({
      filename: "empty.pdf",
      size: 0,
      buffer: Buffer.alloc(0),
    });
    assert(!emptyPdfRes.valid, "Empty 0-byte file is rejected");

    // 8. Oversized file (> 15 MB)
    const oversizedPdfRes = validateCharterPdfFile({
      filename: "giant.pdf",
      size: MAX_DOCUMENT_FILE_SIZE_BYTES + 1024,
      buffer: authenticPdfBuffer,
    });
    assert(!oversizedPdfRes.valid, "Oversized file exceeding 15 MB limit is rejected");

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Direct Upload & Automatic Association (Section AM & K)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 2: Direct Upload & Automatic Association (Section AM & K)");

    const uploadedCharter = await uploadAndAttachCharterPdf(
      superAdminUser,
      "citizens-charter",
      {
        fileBuffer: authenticPdfBuffer,
        filename: "official-citizens-charter-2026.pdf",
        mimeType: "application/pdf",
        size: authenticPdfBuffer.length,
        title: "Official Citizen's Charter 2026 Edition",
      }
    );
    createdDocumentIds.push(uploadedCharter.id);
    createdCloudinaryPublicIds.push(uploadedCharter.storagePublicId);

    assert(Boolean(uploadedCharter.id), "Direct upload creates a normal Document record");
    assert(
      uploadedCharter.purpose === "CITIZENS_CHARTER",
      "Document purpose is forced server-side to CITIZENS_CHARTER"
    );
    assert(
      uploadedCharter.status === "PUBLISHED",
      "Document status is automatically set to PUBLISHED"
    );
    assert(
      Boolean(uploadedCharter.publishedAt),
      "Document publishedAt timestamp is automatically assigned"
    );
    assert(
      uploadedCharter.format === "pdf",
      "Document format is saved as 'pdf'"
    );
    assert(
      uploadedCharter.resourceType === "raw",
      "Document resourceType is saved as 'raw'"
    );
    assert(
      Boolean(uploadedCharter.downloadUrl),
      "Managed download URL is returned"
    );

    // Verify automatic association to ServicePage
    const servicePageAfterUpload = await prisma.servicePage.findUnique({
      where: { serviceKey: "citizens-charter" },
      select: { charterDocumentId: true },
    });
    assert(
      servicePageAfterUpload?.charterDocumentId === uploadedCharter.id,
      "ServicePage.charterDocumentId automatically references the newly uploaded Document"
    );

    // Verify public query retrieves the associated document
    const publishedPublicPage = await getPublishedServicePage("citizens-charter");
    assert(
      publishedPublicPage?.charterDocument?.id === uploadedCharter.id,
      "Public getPublishedServicePage query returns the associated Citizen's Charter Document"
    );
    assert(
      publishedPublicPage?.charterDocument?.storageUrl === uploadedCharter.storageUrl,
      "Public query returns authoritative Cloudinary storageUrl for native PDF iframe viewer"
    );

    // Authorization check: User lacking permissions is blocked from uploading charter PDF
    const userWithoutPermissions: SessionUser = {
      ...staffUser,
      permissions: ["documents.view"],
    };
    let uploadWithoutPermsBlocked = false;
    try {
      await uploadAndAttachCharterPdf(userWithoutPermissions, "citizens-charter", {
        fileBuffer: authenticPdfBuffer,
        filename: "unauthorized.pdf",
        mimeType: "application/pdf",
        size: authenticPdfBuffer.length,
      });
    } catch (e: unknown) {
      if (e instanceof ServiceError && e.statusCode === 403) {
        uploadWithoutPermsBlocked = true;
      }
    }
    assert(uploadWithoutPermsBlocked, "Staff user lacking permissions is blocked with 403");

    // Route restriction: direct upload only permitted for citizens-charter
    let wrongKeyBlocked = false;
    try {
      await uploadAndAttachCharterPdf(superAdminUser, "business-permits", {
        fileBuffer: authenticPdfBuffer,
        filename: "wrong-service.pdf",
        mimeType: "application/pdf",
        size: authenticPdfBuffer.length,
      });
    } catch (e: unknown) {
      if (e instanceof ServiceError && e.statusCode === 400) {
        wrongKeyBlocked = true;
      }
    }
    assert(wrongKeyBlocked, "Direct upload to non-citizens-charter service is rejected with 400");

    // Office boundary check: Office Admin cannot upload to unassigned canonical service
    let officeAdminBlocked = false;
    try {
      await uploadAndAttachCharterPdf(officeAdminUser, "citizens-charter", {
        fileBuffer: authenticPdfBuffer,
        filename: "unauthorized-office.pdf",
        mimeType: "application/pdf",
        size: authenticPdfBuffer.length,
      });
    } catch (e: unknown) {
      if (e instanceof ServiceError && e.statusCode === 403) {
        officeAdminBlocked = true;
      }
    }
    assert(officeAdminBlocked, "Office Admin cannot upload charter PDF to unassigned canonical service (403)");

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Safe PDF Replacement (Section AP)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 3: Safe PDF Replacement (Section AP)");

    const previousDocId = uploadedCharter.id;
    const replacementPdfBuffer = Buffer.from(
      "%PDF-1.4\n%San Felipe Zambales Citizen's Charter Replacement PDF\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000010 00000 n \ntrailer\n<< /Root 1 0 R >>\nstartxref\n100\n%%EOF"
    );

    const replacedCharter = await uploadAndAttachCharterPdf(
      superAdminUser,
      "citizens-charter",
      {
        fileBuffer: replacementPdfBuffer,
        filename: "citizens-charter-2026-v2.pdf",
        mimeType: "application/pdf",
        size: replacementPdfBuffer.length,
        title: "Official Citizen's Charter 2026 (Revised)",
      }
    );
    createdDocumentIds.push(replacedCharter.id);
    createdCloudinaryPublicIds.push(replacedCharter.storagePublicId);

    // Verify service page now points to new document
    const servicePageAfterReplace = await prisma.servicePage.findUnique({
      where: { serviceKey: "citizens-charter" },
      select: { charterDocumentId: true },
    });
    assert(
      servicePageAfterReplace?.charterDocumentId === replacedCharter.id,
      "ServicePage.charterDocumentId is updated to the newly uploaded replacement Document"
    );

    // CRITICAL: Previous document is NOT deleted
    const previousDocInDb = await prisma.document.findUnique({
      where: { id: previousDocId },
    });
    assert(
      Boolean(previousDocInDb),
      "Previous Document record is PRESERVED in PostgreSQL after replacement (NOT deleted)"
    );
    assert(
      previousDocInDb?.status === "PUBLISHED",
      "Previous Document record retains its status in Document Management"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Association & Existing Document Selection (Section AO & L)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 4: Association Rules & Existing Document Selection (Section AO & L)");

    // 1. Cannot attach wrong-purpose document (e.g. DOWNLOADABLE_FORM)
    const downloadableFormDoc = await prisma.document.create({
      data: {
        title: "Business Tax Form",
        originalFilename: "tax-form.pdf",
        storagePublicId: "san-felipe-lgu/test/tax-form",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/tax-form.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        purpose: "DOWNLOADABLE_FORM",
        status: "PUBLISHED",
        officeId: testOfficePrimary.id,
        createdById: dbSuperAdmin.id,
      },
    });
    createdDocumentIds.push(downloadableFormDoc.id);

    let wrongPurposeBlocked = false;
    try {
      await attachExistingCharterDocument(
        superAdminUser,
        "citizens-charter",
        downloadableFormDoc.id
      );
    } catch (e: unknown) {
      if (e instanceof ServiceError && e.statusCode === 400) {
        wrongPurposeBlocked = true;
      }
    }
    assert(wrongPurposeBlocked, "Attaching a DOWNLOADABLE_FORM document as Citizen's Charter is rejected with 400");

    // 2. Cannot attach DRAFT document
    const draftCharterDoc = await prisma.document.create({
      data: {
        title: "Draft Handbook",
        originalFilename: "draft-handbook.pdf",
        storagePublicId: "san-felipe-lgu/test/draft-handbook",
        storageUrl: "https://res.cloudinary.com/test/raw/upload/draft-handbook.pdf",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        purpose: "CITIZENS_CHARTER",
        status: "DRAFT",
        officeId: testOfficePrimary.id,
        createdById: dbSuperAdmin.id,
      },
    });
    createdDocumentIds.push(draftCharterDoc.id);

    let draftDocBlocked = false;
    try {
      await attachExistingCharterDocument(
        superAdminUser,
        "citizens-charter",
        draftCharterDoc.id
      );
    } catch (e: unknown) {
      if (e instanceof ServiceError && e.statusCode === 400) {
        draftDocBlocked = true;
      }
    }
    assert(draftDocBlocked, "Attaching a DRAFT document as Citizen's Charter is rejected with 400");

    // 3. Cannot attach nonexistent document ID
    let nonexistentBlocked = false;
    try {
      await attachExistingCharterDocument(
        superAdminUser,
        "citizens-charter",
        "nonexistent-doc-id"
      );
    } catch (e: unknown) {
      if (e instanceof ServiceError && e.statusCode === 400) {
        nonexistentBlocked = true;
      }
    }
    assert(nonexistentBlocked, "Attaching a nonexistent document ID is rejected with 400");

    // 4. Can re-attach the previous valid PUBLISHED CITIZENS_CHARTER document
    const reattached = await attachExistingCharterDocument(
      superAdminUser,
      "citizens-charter",
      previousDocId
    );
    assert(
      reattached.charterDocumentId === previousDocId,
      "Authorized Super Admin can link existing PUBLISHED CITIZENS_CHARTER document"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Remove Association (Section AQ)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 5: Remove Association Workflow (Section AQ)");

    const unassociated = await removeCharterDocumentAssociation(
      superAdminUser,
      "citizens-charter"
    );
    assert(
      unassociated.charterDocumentId === null,
      "removeCharterDocumentAssociation sets ServicePage.charterDocumentId to null"
    );

    // Document in PostgreSQL is preserved
    const preservedDoc = await prisma.document.findUnique({
      where: { id: previousDocId },
    });
    assert(
      Boolean(preservedDoc),
      "Underlying Document record is NOT deleted when association is removed"
    );

    // Verify public page source strictly uses factual neutral empty state wording
    const ccPageSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/(public)/services/citizens-charter/page.tsx"),
      "utf-8"
    );
    assert(
      ccPageSource.includes("Citizen&apos;s Charter PDF not currently available") &&
      ccPageSource.includes("The official Citizen&apos;s Charter PDF will be available here once published by the Municipality of San Felipe."),
      "Public Citizen's Charter page renders factual neutral empty state wording"
    );
    assert(
      !ccPageSource.toLowerCase().includes("undergoing review") &&
      !ccPageSource.toLowerCase().includes("pending approval") &&
      !ccPageSource.toLowerCase().includes("coming soon") &&
      !ccPageSource.toLowerCase().includes("published shortly") &&
      !ccPageSource.toLowerCase().includes("expected soon"),
      "Public Citizen's Charter empty state contains zero speculative timing or workflow wording"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Dependency Protection (Section AC & V)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 6: Document Dependency Protection (Section AC & V)");

    // Re-link previous document
    await attachExistingCharterDocument(superAdminUser, "citizens-charter", previousDocId);

    // Attempt permanent deletion of referenced document
    let deletionBlocked = false;
    try {
      await deleteDocument(superAdminUser, previousDocId);
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 400) {
        deletionBlocked = true;
      }
    }
    assert(
      deletionBlocked,
      "Permanent deletion of Document is BLOCKED while referenced by ServicePage.charterDocumentId"
    );

    // Remove reference
    await removeCharterDocumentAssociation(superAdminUser, "citizens-charter");

    // Now permanent deletion succeeds
    const deleted = await deleteDocument(superAdminUser, previousDocId);
    assert(
      deleted.id === previousDocId,
      "Document is successfully permanently deleted after reference is removed"
    );
    // Remove from createdDocumentIds cleanup array since already deleted
    const idx = createdDocumentIds.indexOf(previousDocId);
    if (idx !== -1) createdDocumentIds.splice(idx, 1);

    // -------------------------------------------------------------------------
    // TEST GROUP 7: Public Downloadable Forms Isolation (Section AB & AR)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 7: Downloadable Forms Isolation & Public Query Rules (Section AB & AR)");

    const publicForms = await getPublishedDocuments();
    const charterInDownloadableForms = publicForms.some(
      (doc) => doc.purpose === "CITIZENS_CHARTER"
    );
    assert(
      !charterInDownloadableForms,
      "Official Citizen's Charter documents (purpose CITIZENS_CHARTER) are strictly excluded from Downloadable Forms"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 8: Navigation Discoverability & Shortcuts (Section AS, AD-AG)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 8: Navigation Discoverability & Shortcuts (Section AS, AD-AG)");

    const allConfigItems = ADMIN_NAV_CONFIG.flatMap((s) => s.items);
    const implementedItems = allConfigItems.filter((i) => i.isImplemented);

    assert(
      implementedItems.length === 9,
      "Primary implemented navigation routes remain exactly 9 (/admin, /admin/news, /admin/services, /admin/documents, /admin/jobs, /admin/offices, /admin/users, /admin/roles, /admin/audit-logs)"
    );

    const servicesNavItem = allConfigItems.find((i) => i.id === "services");
    assert(
      Boolean(servicesNavItem),
      "Municipal Services remains primary sidebar navigation item"
    );
    assert(
      Boolean(servicesNavItem?.children && servicesNavItem.children.length === 2),
      "Municipal Services contains exactly 2 subordinate shortcuts: Citizen's Charter and Business Permits"
    );

    const charterChild = servicesNavItem?.children?.find(
      (c) => c.id === "services-citizens-charter"
    );
    assert(
      charterChild?.href === "/admin/services/citizens-charter/edit",
      "Citizen's Charter shortcut links directly to /admin/services/citizens-charter/edit"
    );

    const permitsChild = servicesNavItem?.children?.find(
      (c) => c.id === "services-business-permits"
    );
    assert(
      permitsChild?.href === "/admin/services/business-permits/edit",
      "Business Permits shortcut links directly to /admin/services/business-permits/edit"
    );

    // Visible nav sections for Super Admin
    const superAdminNav = getVisibleNavSections(superAdminUser);
    const superServicesItem = superAdminNav
      .flatMap((s) => s.items)
      .find((i) => i.id === "services");
    assert(
      Boolean(superServicesItem?.children && superServicesItem.children.length === 2),
      "Super Admin receives subordinate shortcuts in visible navigation"
    );

    // User without services.view
    const userWithoutServices: SessionUser = {
      ...staffUser,
      permissions: ["news.view"],
    };
    const restrictedNav = getVisibleNavSections(userWithoutServices);
    const restrictedServicesItem = restrictedNav
      .flatMap((s) => s.items)
      .find((i) => i.id === "services");
    assert(
      !restrictedServicesItem,
      "User without services.view permission does NOT see Municipal Services or its shortcuts"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 9: CSP & Embedding Security (Section AA & T)
    // -------------------------------------------------------------------------
    console.log("\nTEST GROUP 9: CSP & Security Headers (Section AA & T)");

    const nextConfigContent = fs.readFileSync(
      path.resolve(process.cwd(), "next.config.ts"),
      "utf-8"
    );
    assert(
      nextConfigContent.includes("frame-src 'self' https://res.cloudinary.com"),
      "next.config.ts narrowly includes frame-src 'self' https://res.cloudinary.com for native PDF embedding"
    );
    assert(
      nextConfigContent.includes("frame-ancestors 'none'"),
      "next.config.ts preserves frame-ancestors 'none' to prevent clickjacking"
    );
    assert(
      nextConfigContent.includes("object-src 'none'"),
      "next.config.ts preserves object-src 'none'"
    );

  } catch (err) {
    console.error("FATAL UNEXPECTED ERROR IN TEST SUITE:", err);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup Test Records
    // -------------------------------------------------------------------------
    console.log("\nCleaning up test records...");

    try {
      // Reset citizen's charter to baseline status (DRAFT, null description, null charterDocumentId)
      await prisma.servicePage.updateMany({
        where: { serviceKey: "citizens-charter" },
        data: {
          charterDocumentId: null,
          status: "DRAFT",
          description: null,
          officeId: null,
        },
      });

      for (const docId of createdDocumentIds) {
        try {
          await prisma.document.delete({ where: { id: docId } });
        } catch {}
      }

      const testEmails = [
        "super.admin.p1931@sanfelipe.gov.ph",
        "office.admin.p1931@sanfelipe.gov.ph",
        "staff.p1931@sanfelipe.gov.ph",
      ];

      // Delete any documents created by test users
      await prisma.document.deleteMany({
        where: {
          createdBy: { email: { in: testEmails } },
        },
      });

      // Delete any audit logs generated by test users
      await prisma.auditLog.deleteMany({
        where: {
          user: { email: { in: testEmails } },
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: { in: testEmails },
        },
      });

      await prisma.office.deleteMany({
        where: {
          slug: {
            in: ["test-icto-p1931", "test-mho-p1931"],
          },
        },
      });
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr);
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n=====================================================================");
  console.log(`PHASE 19.3.1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=====================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1931TestSuite().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
