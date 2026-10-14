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

async function runDocumentManagementTestSuite() {
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
  console.log("SAN FELIPE LGU DOCUMENT MANAGEMENT TEST SUITE (PHASE 14)");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    createDocument,
    updateDocument,
    publishDocument,
    archiveDocument,
    getAdminDocumentsList,
    getAdminDocumentById,
    getPublishedDocuments,
    DocumentError,
  } = await import("../src/server/documents/service");
  const {
    validateDocumentFile,
    sanitizeFilename,
    MAX_DOCUMENT_FILE_SIZE_BYTES,
  } = await import("../src/lib/validation/documents");
  const {
    deleteCloudinaryDocument,
    getDocumentDownloadUrl,
  } = await import("../src/server/media/cloudinary-documents");
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

  const createdDocumentIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup Test Offices
    // -------------------------------------------------------------------------
    const officeBPLO = await prisma.office.upsert({
      where: { slug: "test-bplo-p14" },
      update: { name: "Business Permits & Licensing Office", status: "ACTIVE" },
      create: {
        name: "Business Permits & Licensing Office",
        shortName: "BPLO",
        slug: "test-bplo-p14",
        status: "ACTIVE",
      },
    });

    const officeMHO = await prisma.office.upsert({
      where: { slug: "test-mho-p14" },
      update: { name: "Municipal Health Office", status: "ACTIVE" },
      create: {
        name: "Municipal Health Office",
        shortName: "MHO",
        slug: "test-mho-p14",
        status: "ACTIVE",
      },
    });

    const inactiveOffice = await prisma.office.upsert({
      where: { slug: "test-inactive-p14" },
      update: { name: "Inactive Department", status: "INACTIVE" },
      create: {
        name: "Inactive Department",
        shortName: "INACT",
        slug: "test-inactive-p14",
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
      where: { email: "test.superadmin.p14@sanfelipe.gov.ph" },
      update: { officeId: officeBPLO.id, roleId: superAdminRole.id },
      create: {
        name: "Test Super Admin",
        email: "test.superadmin.p14@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: officeBPLO.id,
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
    });

    const dbBploStaff = await prisma.user.upsert({
      where: { email: "test.bplo.staff.p14@sanfelipe.gov.ph" },
      update: { officeId: officeBPLO.id, roleId: staffRole.id },
      create: {
        name: "Test BPLO Staff",
        email: "test.bplo.staff.p14@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        officeId: officeBPLO.id,
        roleId: staffRole.id,
        status: "ACTIVE",
      },
    });

    const dbMhoStaff = await prisma.user.upsert({
      where: { email: "test.mho.staff.p14@sanfelipe.gov.ph" },
      update: { officeId: officeMHO.id, roleId: staffRole.id },
      create: {
        name: "Test MHO Staff",
        email: "test.mho.staff.p14@sanfelipe.gov.ph",
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
      sessionId: "mock-super-admin-session",
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: true,
      },
      officeId: officeBPLO.id,
      status: "ACTIVE",
      permissions: [
        "documents.view",
        "documents.create",
        "documents.update",
        "documents.publish",
        "documents.archive",
        "documents.delete",
      ],
    };

    const bploStaffUser: SessionUser = {
      id: dbBploStaff.id,
      name: dbBploStaff.name,
      email: dbBploStaff.email,
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-bplo-staff-session",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: officeBPLO.id,
      status: "ACTIVE",
      permissions: [
        "documents.view",
        "documents.create",
        "documents.update",
        "documents.publish",
        "documents.archive",
      ],
    };

    const mhoStaffUser: SessionUser = {
      id: dbMhoStaff.id,
      name: dbMhoStaff.name,
      email: dbMhoStaff.email,
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-mho-staff-session",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: officeMHO.id,
      status: "ACTIVE",
      permissions: [
        "documents.view",
        "documents.create",
        "documents.update",
        "documents.publish",
        "documents.archive",
      ],
    };

    const unassignedUser: SessionUser = {
      id: "unassigned-user-id",
      name: "Unassigned Staff",
      email: "unassigned@sanfelipe.gov.ph",
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-unassigned-session",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: null,
      status: "ACTIVE",
      permissions: ["documents.view", "documents.create", "documents.update"],
    };

    const viewerUser: SessionUser = {
      id: "viewer-user-id",
      name: "View-only User",
      email: "viewer@sanfelipe.gov.ph",
      isSystemScope: false,
      roleId: staffRole.id,
      office: null,
      sessionId: "mock-viewer-session",
      role: {
        id: staffRole.id,
        name: staffRole.name,
        slug: staffRole.slug,
        isSystemScope: false,
      },
      officeId: officeBPLO.id,
      status: "ACTIVE",
      permissions: ["documents.view"], // lacks create, update, publish, archive
    };

    // -------------------------------------------------------------------------
    // 1. File Validation & Prohibited Types Tests
    // -------------------------------------------------------------------------
    console.log("1. Document File Validation & Security Controls");

    const validPdf = validateDocumentFile({
      filename: "application-form.pdf",
      size: 1024 * 50,
      mimeType: "application/pdf",
    });
    assert(validPdf.valid && validPdf.extension === "pdf", "Valid PDF file is accepted");

    const validDocx = validateDocumentFile({
      filename: "guidelines.docx",
      size: 1024 * 100,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    assert(validDocx.valid && validDocx.extension === "docx", "Valid DOCX file is accepted");

    const validXlsx = validateDocumentFile({
      filename: "fee_schedule.xlsx",
      size: 1024 * 200,
    });
    assert(validXlsx.valid && validXlsx.extension === "xlsx", "Valid XLSX file is accepted");

    // Prohibited dangerous files
    const prohibitedExe = validateDocumentFile({
      filename: "setup.exe",
      size: 1024,
    });
    assert(!prohibitedExe.valid, "Prohibited executable .exe is rejected");

    const prohibitedZip = validateDocumentFile({
      filename: "forms.zip",
      size: 1024,
    });
    assert(!prohibitedZip.valid, "Prohibited archive .zip is rejected");

    const prohibitedBat = validateDocumentFile({
      filename: "script.bat",
      size: 50,
    });
    assert(!prohibitedBat.valid, "Prohibited script .bat is rejected");

    const prohibitedHtml = validateDocumentFile({
      filename: "payload.html",
      size: 500,
    });
    assert(!prohibitedHtml.valid, "Prohibited markup .html is rejected");

    // Oversized and empty files
    const emptyFile = validateDocumentFile({
      filename: "empty.pdf",
      size: 0,
    });
    assert(!emptyFile.valid, "Empty file (0 bytes) is rejected");

    const oversizedFile = validateDocumentFile({
      filename: "large.pdf",
      size: MAX_DOCUMENT_FILE_SIZE_BYTES + 1024,
    });
    assert(!oversizedFile.valid, "File exceeding 15 MB limit is rejected");

    // Filename sanitization
    const sanitizedTraverse = sanitizeFilename("../../etc/passwd/permit.pdf");
    assert(sanitizedTraverse === "permit.pdf", "Path traversal delimiters are stripped from filename");

    const sanitizedSpecial = sanitizeFilename('business<form>:2026*"test"?.pdf');
    assert(!sanitizedSpecial.includes("<") && !sanitizedSpecial.includes(":"), "Dangerous characters are sanitized in filename");

    // -------------------------------------------------------------------------
    // 1b. Deep File Content Validation & Spoofed File Detection
    // -------------------------------------------------------------------------
    console.log("\n1b. Deep Content Inspection & Anti-Spoofing Tests");

    // Plain text disguised as PDF
    const textAsPdf = validateDocumentFile({
      filename: "disguised-text.pdf",
      size: 500,
      buffer: Buffer.from("Hello world, this is plain text masquerading as a PDF."),
    });
    assert(!textAsPdf.valid, "Plain text renamed to .pdf fails magic bytes verification");

    // Windows PE Executable disguised as PDF
    const exeAsPdf = validateDocumentFile({
      filename: "malware.pdf",
      size: 1024,
      buffer: Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF"),
    });
    assert(!exeAsPdf.valid, "Windows PE executable (.exe) renamed to .pdf is rejected");

    // Linux ELF binary disguised as PDF
    const elfAsPdf = validateDocumentFile({
      filename: "exploit.pdf",
      size: 1024,
      buffer: Buffer.from("\x7FELF\x02\x01\x01\x00\x00\x00\x00\x00"),
    });
    assert(!elfAsPdf.valid, "Linux ELF binary renamed to .pdf is rejected");

    // Shell script disguised as PDF
    const shAsPdf = validateDocumentFile({
      filename: "script.pdf",
      size: 100,
      buffer: Buffer.from("#!/bin/bash\nrm -rf /"),
    });
    assert(!shAsPdf.valid, "Shell script disguised as .pdf is rejected");

    // Plain text disguised as DOCX
    const textAsDocx = validateDocumentFile({
      filename: "document.docx",
      size: 500,
      buffer: Buffer.from("This is not a zip or docx archive."),
    });
    assert(!textAsDocx.valid, "Plain text renamed to .docx fails ZIP magic verification");

    // Arbitrary ZIP archive disguised as DOCX (has PK\x03\x04 but lacks OpenXML word/ directory)
    const fakeZipDocx = validateDocumentFile({
      filename: "fake-archive.docx",
      size: 1024,
      buffer: Buffer.from("PK\x03\x04some_random_zipped_payload_without_openxml"),
    });
    assert(!fakeZipDocx.valid, "Arbitrary ZIP archive renamed to .docx without OpenXML word/ is rejected");

    // Arbitrary ZIP archive disguised as XLSX (has PK\x03\x04 but lacks OpenXML xl/ directory)
    const fakeZipXlsx = validateDocumentFile({
      filename: "fake-sheet.xlsx",
      size: 1024,
      buffer: Buffer.from("PK\x03\x04some_random_zipped_payload_without_openxml"),
    });
    assert(!fakeZipXlsx.valid, "Arbitrary ZIP archive renamed to .xlsx without OpenXML xl/ is rejected");

    // Valid OpenXML DOCX structure
    const validDocxBuffer = Buffer.from(
      "PK\x03\x04\x14\x00\x00\x00[Content_Types].xml...word/document.xml...PK\x05\x06"
    );
    const validDocxResult = validateDocumentFile({
      filename: "real-document.docx",
      size: validDocxBuffer.length,
      buffer: validDocxBuffer,
    });
    assert(validDocxResult.valid, "Valid OpenXML DOCX container structure is verified and accepted");

    // Valid OpenXML XLSX structure
    const validXlsxBuffer = Buffer.from(
      "PK\x03\x04\x14\x00\x00\x00[Content_Types].xml...xl/workbook.xml...PK\x05\x06"
    );
    const validXlsxResult = validateDocumentFile({
      filename: "real-sheet.xlsx",
      size: validXlsxBuffer.length,
      buffer: validXlsxBuffer,
    });
    assert(validXlsxResult.valid, "Valid OpenXML XLSX container structure is verified and accepted");

    // Valid OLE Compound Binary (CFBF) DOC
    const validOleDocBuffer = Buffer.concat([
      Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]),
      Buffer.from("WordDocumentStream"),
    ]);
    const validOleDocResult = validateDocumentFile({
      filename: "legacy-form.doc",
      size: validOleDocBuffer.length,
      buffer: validOleDocBuffer,
    });
    assert(validOleDocResult.valid, "Valid OLE CFBF binary legacy DOC header is accepted");

    // -------------------------------------------------------------------------
    // 2. Permission & Scope Authorization Checks
    // -------------------------------------------------------------------------
    console.log("\n2. Permission & Scope Authorization Checks");

    const dummyBuffer = Buffer.from("%PDF-1.4\nTest Document Content\n%%EOF");

    // Rejection when lacking create permission
    let lackedCreate = false;
    try {
      await createDocument(viewerUser, {
        input: { title: "Unauthorized Test Doc" },
        fileBuffer: dummyBuffer,
        filename: "test.pdf",
        size: dummyBuffer.length,
      });
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 403) {
        lackedCreate = true;
      }
    }
    assert(lackedCreate, "createDocument rejects user lacking documents.create permission");

    // Office-scoped user cannot forge office ownership
    const createdByStaff = await createDocument(bploStaffUser, {
      input: {
        title: "BPLO Citizen Application Form",
        description: "Official form for new business registration",
        category: "Business & Licensing",
        officeId: officeMHO.id, // Attacking by attempting to assign to MHO!
      },
      fileBuffer: dummyBuffer,
      filename: "bplo-form.pdf",
      size: dummyBuffer.length,
    });
    createdDocumentIds.push(createdByStaff.id);

    assert(
      createdByStaff.officeId === officeBPLO.id,
      "OFFICE-scoped user document officeId is strictly bound to user.officeId (forgery prevented)"
    );
    assert(createdByStaff.status === "DRAFT", "Newly created document defaults to DRAFT status");
    assert(createdByStaff.format === "pdf", "Document file format is saved");
    assert(createdByStaff.storagePublicId.length > 0, "Cloudinary storagePublicId is stored");

    // Unassigned user cannot create document
    let unassignedFailed = false;
    try {
      await createDocument(unassignedUser, {
        input: { title: "Unassigned Doc" },
        fileBuffer: dummyBuffer,
        filename: "test.pdf",
        size: dummyBuffer.length,
      });
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 403) {
        unassignedFailed = true;
      }
    }
    assert(unassignedFailed, "Office-scoped user without assigned office cannot create documents");

    // SYSTEM scope user creating document for MHO
    const createdByAdmin = await createDocument(superAdminUser, {
      input: {
        title: "MHO Health Sanitary Clearance Template",
        description: "Required for food establishment health cards",
        category: "Civil Registry",
        officeId: officeMHO.id,
      },
      fileBuffer: dummyBuffer,
      filename: "sanitary-form.pdf",
      size: dummyBuffer.length,
    });
    createdDocumentIds.push(createdByAdmin.id);

    assert(
      createdByAdmin.officeId === officeMHO.id,
      "SYSTEM-scoped user can assign document to specified active office"
    );

    // SYSTEM scope user cannot assign to INACTIVE office
    let inactiveOfficeFailed = false;
    try {
      await createDocument(superAdminUser, {
        input: {
          title: "Inactive Office Document",
          officeId: inactiveOffice.id,
        },
        fileBuffer: dummyBuffer,
        filename: "inactive.pdf",
        size: dummyBuffer.length,
      });
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 400) {
        inactiveOfficeFailed = true;
      }
    }
    assert(inactiveOfficeFailed, "SYSTEM-scoped user cannot assign document to inactive office");

    // -------------------------------------------------------------------------
    // 3. Cross-Office Isolation & Listing Scope
    // -------------------------------------------------------------------------
    console.log("\n3. Cross-Office Isolation & Listing Scope");

    // BPLO staff should see only BPLO documents
    const bploList = await getAdminDocumentsList(bploStaffUser);
    const bploHasOnlyBplo = bploList.documents.every((d) => d.officeId === officeBPLO.id);
    assert(bploHasOnlyBplo, "BPLO staff document list contains only BPLO documents");
    assert(
      !bploList.documents.some((d) => d.id === createdByAdmin.id),
      "BPLO staff cannot see MHO document in admin list"
    );

    // MHO staff attempting to read BPLO document by ID
    let crossOfficeReadBlocked = false;
    try {
      await getAdminDocumentById(mhoStaffUser, createdByStaff.id);
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 403) {
        crossOfficeReadBlocked = true;
      }
    }
    assert(crossOfficeReadBlocked, "MHO staff is denied reading BPLO document by ID (cross-office denial)");

    // MHO staff attempting to update BPLO document
    let crossOfficeUpdateBlocked = false;
    try {
      await updateDocument(mhoStaffUser, createdByStaff.id, {
        input: { title: "Malicious Cross-Office Update" },
      });
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 403) {
        crossOfficeUpdateBlocked = true;
      }
    }
    assert(crossOfficeUpdateBlocked, "MHO staff is denied updating BPLO document (cross-office denial)");

    // Super Admin can view documents from all offices
    const adminList = await getAdminDocumentsList(superAdminUser);
    const adminSeesBoth =
      adminList.documents.some((d) => d.id === createdByStaff.id) &&
      adminList.documents.some((d) => d.id === createdByAdmin.id);
    assert(adminSeesBoth, "SYSTEM-scoped user can view documents across all offices");

    // -------------------------------------------------------------------------
    // 4. Safe Replacement Semantics
    // -------------------------------------------------------------------------
    console.log("\n4. Safe File Replacement Semantics");

    const oldPublicId = createdByStaff.storagePublicId;
    const replacementBuffer = Buffer.from("%PDF-1.4\nReplaced Document Version 2\n%%EOF");

    const replacedDoc = await updateDocument(bploStaffUser, createdByStaff.id, {
      input: {
        title: "BPLO Citizen Application Form (Revised 2026)",
        description: "Updated form with revised schedule",
        category: "Business & Licensing",
        expectedUpdatedAt: createdByStaff.updatedAt.toISOString(),
      },
      file: {
        fileBuffer: replacementBuffer,
        filename: "bplo-form-v2.pdf",
        size: replacementBuffer.length,
      },
    });

    assert(
      replacedDoc.storagePublicId !== oldPublicId,
      "Replacement file has a new unique storagePublicId"
    );
    assert(
      replacedDoc.originalFilename === "bplo-form-v2.pdf",
      "Document metadata updated with replacement originalFilename"
    );

    // -------------------------------------------------------------------------
    // 5. Lifecycle Management & Public Isolation
    // -------------------------------------------------------------------------
    console.log("\n5. Document Lifecycle & Public Isolation");

    // DRAFT document must NOT appear publicly
    const publicDocsInitial = await getPublishedDocuments();
    const draftAppearsPublicly = publicDocsInitial.some((d) => d.id === createdByStaff.id);
    assert(!draftAppearsPublicly, "DRAFT document is strictly excluded from public Downloadable Forms");

    // Publish document
    const publishedDoc = await publishDocument(
      bploStaffUser,
      createdByStaff.id,
      replacedDoc.updatedAt.toISOString()
    );
    assert(publishedDoc.status === "PUBLISHED", "Document transitions to PUBLISHED status");
    assert(Boolean(publishedDoc.publishedAt), "Publication timestamp is recorded");

    // -------------------------------------------------------------------------
    // 5b. Published Document Edit & Replacement Preservation
    // -------------------------------------------------------------------------
    console.log("\n5b. Published Document Edit & Replacement Preservation");

    // 1) Metadata edit of PUBLISHED document preserves PUBLISHED status
    const editedPublishedDoc = await updateDocument(bploStaffUser, createdByStaff.id, {
      input: {
        title: "BPLO Citizen Application Form (Revised 2026 - Published Edit)",
        category: "Business & Licensing",
        expectedUpdatedAt: publishedDoc.updatedAt.toISOString(),
      },
    });
    assert(
      editedPublishedDoc.status === "PUBLISHED",
      "Metadata update on PUBLISHED document preserves PUBLISHED status"
    );

    // 2) File replacement of PUBLISHED document preserves PUBLISHED status
    const replacementBufferV3 = Buffer.from("%PDF-1.4\nReplaced Document Version 3 (Published)\n%%EOF");
    const replacedPublishedDoc = await updateDocument(bploStaffUser, createdByStaff.id, {
      input: {
        title: "BPLO Citizen Application Form (Revised 2026 - V3 File)",
        category: "Business & Licensing",
        expectedUpdatedAt: editedPublishedDoc.updatedAt.toISOString(),
      },
      file: {
        fileBuffer: replacementBufferV3,
        filename: "bplo-form-v3.pdf",
        size: replacementBufferV3.length,
      },
    });
    assert(
      replacedPublishedDoc.status === "PUBLISHED",
      "File replacement on PUBLISHED document preserves PUBLISHED status"
    );
    assert(
      replacedPublishedDoc.originalFilename === "bplo-form-v3.pdf",
      "Replacement on PUBLISHED document updates originalFilename"
    );

    // Now it MUST appear publicly
    const publicDocsAfterPublish = await getPublishedDocuments();
    const publishedAppearsPublicly = publicDocsAfterPublish.some((d) => d.id === createdByStaff.id);
    assert(publishedAppearsPublicly, "PUBLISHED document appears in public Downloadable Forms");

    const publicItem = publicDocsAfterPublish.find((d) => d.id === createdByStaff.id);
    assert(
      Boolean(publicItem?.downloadUrl.includes("fl_attachment:")),
      "Public download URL includes fl_attachment flag for secure file download"
    );

    // Verify download URL syntax: fl_attachment flag does NOT contain file extension
    const sampleDownloadUrl = getDocumentDownloadUrl("municipality/sfz/documents/test_id", "application-form.pdf");
    assert(
      sampleDownloadUrl.includes("/fl_attachment:application-form/"),
      "getDocumentDownloadUrl strips file extension from fl_attachment flag"
    );
    assert(
      !sampleDownloadUrl.includes("/fl_attachment:application-form.pdf/"),
      "getDocumentDownloadUrl avoids dot in fl_attachment to prevent Cloudinary 400 Bad Request"
    );

    // Live verification of download URL if Cloudinary is reachable
    if (publicItem?.downloadUrl) {
      try {
        const response = await fetch(publicItem.downloadUrl, { method: "HEAD" });
        if (response.ok) {
          const disposition = response.headers.get("content-disposition") || "";
          assert(
            disposition.includes("attachment") && disposition.includes(".pdf"),
            `Cloudinary raw asset returns attachment Content-Disposition header (status: ${response.status})`
          );
        }
      } catch {
        console.log("  ℹ Note: External Cloudinary network check skipped or offline");
      }
    }

    // Archive document
    const archivedDoc = await archiveDocument(
      bploStaffUser,
      createdByStaff.id,
      replacedPublishedDoc.updatedAt.toISOString()
    );
    assert(archivedDoc.status === "ARCHIVED", "Document transitions to ARCHIVED status");
    assert(Boolean(archivedDoc.archivedAt), "Archive timestamp is recorded");
    assert(
      archivedDoc.storagePublicId === replacedPublishedDoc.storagePublicId,
      "Archiving does NOT delete the Cloudinary asset reference (preserved for records)"
    );

    // ARCHIVED document must NOT appear publicly
    const publicDocsAfterArchive = await getPublishedDocuments();
    const archivedAppearsPublicly = publicDocsAfterArchive.some((d) => d.id === createdByStaff.id);
    assert(!archivedAppearsPublicly, "ARCHIVED document is strictly excluded from public Downloadable Forms");

    // -------------------------------------------------------------------------
    // 6. Optimistic Concurrency Control
    // -------------------------------------------------------------------------
    console.log("\n6. Optimistic Concurrency Control");

    let concurrencyConflictCaught = false;
    try {
      await updateDocument(bploStaffUser, createdByStaff.id, {
        input: {
          title: "Stale Concurrency Update",
          expectedUpdatedAt: new Date(Date.now() - 60000).toISOString(), // Stale timestamp
        },
      });
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 409) {
        concurrencyConflictCaught = true;
      }
    }
    assert(concurrencyConflictCaught, "Update with stale expectedUpdatedAt throws 409 conflict");

    // -------------------------------------------------------------------------
    // 6b. Concurrency Race Condition during File Replacement (stale write rollback)
    // -------------------------------------------------------------------------
    console.log("\n6b. File Replacement Concurrency Race Simulation");

    // Fetch latest state of createdByAdmin
    const latestAdminDoc = await prisma.document.findUniqueOrThrow({
      where: { id: createdByAdmin.id },
    });

    // Simulate concurrent modification before replacement DB update:
    // User B updates document in DB, advancing updatedAt
    await prisma.document.update({
      where: { id: createdByAdmin.id },
      data: { description: "Intervening concurrent modification by another user" },
    });

    // User A attempts file replacement using old expectedUpdatedAt
    let raceConflictCaught = false;
    try {
      const raceBuffer = Buffer.from("%PDF-1.4\nRace Replacement PDF\n%%EOF");
      await updateDocument(superAdminUser, createdByAdmin.id, {
        input: {
          title: "Stale Race Document Title",
          expectedUpdatedAt: latestAdminDoc.updatedAt.toISOString(),
        },
        file: {
          fileBuffer: raceBuffer,
          filename: "race-doc.pdf",
          size: raceBuffer.length,
        },
      });
    } catch (e: unknown) {
      if (e instanceof DocumentError && e.statusCode === 409) {
        raceConflictCaught = true;
      }
    }
    assert(raceConflictCaught, "Intervening DB update causes atomic updateMany to fail and roll back with 409");

    // -------------------------------------------------------------------------
    // 7. Audit Trail Verification
    // -------------------------------------------------------------------------
    console.log("\n7. Audit Trail Verification");

    const auditEvents = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            AUDIT_ACTIONS.DOCUMENT_CREATED,
            AUDIT_ACTIONS.DOCUMENT_UPDATED,
            AUDIT_ACTIONS.DOCUMENT_FILE_REPLACED,
            AUDIT_ACTIONS.DOCUMENT_PUBLISHED,
            AUDIT_ACTIONS.DOCUMENT_ARCHIVED,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const hasCreatedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.DOCUMENT_CREATED);
    const hasReplacedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.DOCUMENT_FILE_REPLACED);
    const hasPublishedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.DOCUMENT_PUBLISHED);
    const hasArchivedAudit = auditEvents.some((a) => a.action === AUDIT_ACTIONS.DOCUMENT_ARCHIVED);

    assert(hasCreatedAudit, "DOCUMENT_CREATED audit event logged");
    assert(hasReplacedAudit, "DOCUMENT_FILE_REPLACED audit event logged");
    assert(hasPublishedAudit, "DOCUMENT_PUBLISHED audit event logged");
    assert(hasArchivedAudit, "DOCUMENT_ARCHIVED audit event logged");
  } catch (error) {
    console.error("Test execution exception:", error);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup Test Artifacts
    // -------------------------------------------------------------------------
    console.log("\nCleaning up test records...");
    for (const docId of createdDocumentIds) {
      try {
        const doc = await prisma.document.findUnique({ where: { id: docId } });
        if (doc?.storagePublicId) {
          await deleteCloudinaryDocument(doc.storagePublicId);
        }
      } catch (err) {
        console.warn(`Cleanup notice for Cloudinary asset on document ${docId}:`, err);
      }
    }

    try {
      // 1. Delete all documents created in test offices
      await prisma.document.deleteMany({
        where: {
          office: {
            slug: { in: ["test-bplo-p14", "test-mho-p14", "test-inactive-p14"] },
          },
        },
      });

      // 2. Delete all audit logs generated by test users
      await prisma.auditLog.deleteMany({
        where: {
          user: {
            email: {
              in: [
                "test.superadmin.p14@sanfelipe.gov.ph",
                "test.bplo.staff.p14@sanfelipe.gov.ph",
                "test.mho.staff.p14@sanfelipe.gov.ph",
              ],
            },
          },
        },
      });

      // 3. Delete test users
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "test.superadmin.p14@sanfelipe.gov.ph",
              "test.bplo.staff.p14@sanfelipe.gov.ph",
              "test.mho.staff.p14@sanfelipe.gov.ph",
            ],
          },
        },
      });

      // 4. Delete test offices
      await prisma.office.deleteMany({
        where: {
          slug: { in: ["test-bplo-p14", "test-mho-p14", "test-inactive-p14"] },
        },
      });
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr);
    }
  }

  console.log("\n=======================================================");
  console.log(`DOCUMENT MANAGEMENT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDocumentManagementTestSuite().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
