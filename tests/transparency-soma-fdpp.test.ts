// Standalone test mock for server-only marker package
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  exports: {},
  loaded: true,
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import {
  DOCUMENT_CATEGORIES,
  validateSomaPdfFile,
} from "../src/lib/validation/documents";
import { ASSETS } from "../src/config/assets";
import { NAV_DROPDOWN_ITEMS } from "../src/config/site";
import { ADMIN_NAV_CONFIG } from "../src/config/admin-navigation";

async function runSomaFdppTestSuite() {
  console.log("================================================================================");
  console.log("TEST SUITE: FDPP Homepage Logo & SOMA Transparency PDF Specification");
  console.log("================================================================================");

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

  // =========================================================================
  // 1. FDPP Source Asset Integrity & Registry
  // =========================================================================
  console.log("\n--- 1. FDPP Source Asset Integrity & Registry ---");

  const fdppAssetPath = path.join(process.cwd(), "public", "images", "fdpp.png");
  assert(fs.existsSync(fdppAssetPath), "public/images/fdpp.png exists on disk");

  const fdppBuffer = fs.readFileSync(fdppAssetPath);
  const fdppSha256 = crypto.createHash("sha256").update(fdppBuffer).digest("hex");
  const expectedFdppSha256 = "80edc33379c7f01bdb7017b481fcc57925102dd071aac61f9a7a8780c778ae99";
  assert(
    fdppSha256 === expectedFdppSha256,
    `FDPP SHA-256 matches exact hash (${fdppSha256})`
  );

  const fdppSize = fdppBuffer.length;
  assert(fdppSize === 4197, `FDPP file size is exactly 4,197 bytes (actual: ${fdppSize})`);

  // PNG dimensions from IHDR chunk (bytes 16-24)
  const isPng =
    fdppBuffer[0] === 0x89 &&
    fdppBuffer[1] === 0x50 &&
    fdppBuffer[2] === 0x4e &&
    fdppBuffer[3] === 0x47;
  const width = fdppBuffer.readUInt32BE(16);
  const height = fdppBuffer.readUInt32BE(20);
  assert(isPng && width === 300 && height === 164, `FDPP is authentic PNG with dimensions 300x164 (actual: ${width}x${height})`);

  // Asset registry
  assert(
    ASSETS.programs.fdpp.src === "/images/fdpp.png",
    "ASSETS.programs.fdpp.src points to /images/fdpp.png"
  );
  assert(
    ASSETS.programs.fdpp.provenance === "VERIFIED_CLIENT_ASSET",
    "ASSETS.programs.fdpp provenance is VERIFIED_CLIENT_ASSET"
  );

  // =========================================================================
  // 2. FDPP Homepage Integration & Security
  // =========================================================================
  console.log("\n--- 2. FDPP Homepage Integration & Security ---");

  const govProgramsPath = path.join(
    process.cwd(),
    "src",
    "components",
    "home",
    "government-programs.tsx"
  );
  const govProgramsSource = fs.readFileSync(govProgramsPath, "utf8");

  // Check 5-column layout
  assert(
    govProgramsSource.includes("lg:grid-cols-5"),
    "Government Programs grid contains lg:grid-cols-5 for 5 cards"
  );

  // Check exact destination URL & filters
  const expectedFdppUrl =
    "https://fdpp.dilg.gov.ph/fdpp/report/index?document_filter=&region_filter=03&province_filter=071&lgu_filter=10&year_filter=";
  assert(
    govProgramsSource.includes(expectedFdppUrl),
    "FDPP link targets exact DILG portal URL with Region 03, Province 071, LGU 10"
  );

  assert(
    !govProgramsSource.includes("_csrf"),
    "FDPP link strictly does NOT include hardcoded _csrf token"
  );

  assert(
    govProgramsSource.includes('target="_blank"') &&
      govProgramsSource.includes('rel="noopener noreferrer"'),
    "FDPP link includes target='_blank' and rel='noopener noreferrer'"
  );

  assert(
    govProgramsSource.includes("object-contain"),
    "FDPP logo uses object-contain to preserve natural aspect ratio without distortion"
  );

  // =========================================================================
  // 3. SOMA Document Category & Strict PDF-Only Validation
  // =========================================================================
  console.log("\n--- 3. SOMA Document Category & Strict PDF-Only Validation ---");

  assert(
    DOCUMENT_CATEGORIES.includes("State of the Municipal Address (SOMA)"),
    "DOCUMENT_CATEGORIES includes exact title 'State of the Municipal Address (SOMA)'"
  );

  // Valid PDF validation
  const validPdfBytes = Buffer.from("%PDF-1.7\nSample authentic PDF stream content for testing");
  const validPdfFile = {
    name: "San-Felipe-SOMA-2024.pdf",
    size: validPdfBytes.length,
    arrayBuffer: async () => validPdfBytes.buffer,
  };
  const validResult = validateSomaPdfFile(validPdfFile);
  assert(validResult.valid === true, "validateSomaPdfFile accepts valid .pdf file with %PDF- header");

  // Non-PDF extension rejection
  const docxFile = {
    name: "San-Felipe-SOMA-2024.docx",
    size: 1024,
    arrayBuffer: async () => Buffer.from("dummy").buffer,
  };
  const docxResult = validateSomaPdfFile(docxFile);
  assert(
    docxResult.valid === false && Boolean(docxResult.error?.includes("Only PDF files (.pdf) are permitted")),
    "validateSomaPdfFile rejects non-PDF extension (.docx)"
  );

  // Spoofed PDF rejection (missing %PDF- header)
  const spoofedPdfBytes = Buffer.from("MZFakeExecutableNotAPdfContentHere1234567890");
  const spoofedPdfFile = {
    name: "San-Felipe-SOMA-Fake.pdf",
    size: spoofedPdfBytes.length,
    buffer: spoofedPdfBytes,
  };
  const spoofedResult = validateSomaPdfFile(spoofedPdfFile);
  assert(
    spoofedResult.valid === false &&
      Boolean(
        spoofedResult.error?.includes("MZ header") ||
          spoofedResult.error?.includes("%PDF-")
      ),
    "validateSomaPdfFile rejects spoofed binary with .pdf extension"
  );

  // Over-sized PDF rejection
  const oversizedFile = {
    name: "San-Felipe-SOMA-Huge.pdf",
    size: 16 * 1024 * 1024,
    arrayBuffer: async () => Buffer.from("%PDF-1.7").buffer,
  };
  const oversizedResult = validateSomaPdfFile(oversizedFile);
  assert(
    oversizedResult.valid === false && Boolean(oversizedResult.error?.includes("15 MB limit")),
    "validateSomaPdfFile rejects PDF exceeding 15 MB limit"
  );

  // =========================================================================
  // 4. Exclusion from Downloadable Forms & Service Constraints
  // =========================================================================
  console.log("\n--- 4. Exclusion from Downloadable Forms & Service Constraints ---");

  const servicePath = path.join(process.cwd(), "src", "server", "documents", "service.ts");
  const serviceSource = fs.readFileSync(servicePath, "utf8");

  // Confirm getPublishedDocuments defaults to DOWNLOADABLE_FORM
  assert(
    serviceSource.includes('purpose: (filters?.purpose as PrismaDocumentPurpose) ?? "DOWNLOADABLE_FORM"'),
    "getPublishedDocuments defaults purpose to DOWNLOADABLE_FORM (excluding SOMA from /services/downloadable-forms)"
  );

  // Confirm createDocument and updateDocument enforce SOMA PDF-only constraint
  assert(
    serviceSource.includes('category === "State of the Municipal Address (SOMA)"') &&
      serviceSource.includes('fileValidation.extension !== "pdf"'),
    "createDocument and updateDocument enforce strict PDF-only constraint for SOMA"
  );

  // Confirm getEligiblePublicDocument serves OTHER_PUBLIC_DOCUMENT
  assert(
    serviceSource.includes('document.purpose === "OTHER_PUBLIC_DOCUMENT"') &&
      serviceSource.includes("document.officeId && (!document.office || document.office.status !== \"ACTIVE\")"),
    "getEligiblePublicDocument correctly serves OTHER_PUBLIC_DOCUMENT records"
  );

  // =========================================================================
  // 5. Public Transparency & SOMA Routes
  // =========================================================================
  console.log("\n--- 5. Public Transparency & SOMA Routes ---");

  // Transparency landing page
  const transparencyLandingPath = path.join(
    process.cwd(),
    "src",
    "app",
    "(public)",
    "transparency",
    "page.tsx"
  );
  const transparencyLandingSource = fs.readFileSync(transparencyLandingPath, "utf8");

  assert(
    transparencyLandingSource.includes('href="/transparency/procurement"'),
    "Transparency landing page features Procurement card"
  );
  assert(
    transparencyLandingSource.includes('href="/transparency/soma"'),
    "Transparency landing page features SOMA card"
  );
  assert(
    transparencyLandingSource.includes("State of the Municipal Address (SOMA)"),
    "Transparency landing page has exact title 'State of the Municipal Address (SOMA)'"
  );
  assert(
    !transparencyLandingSource.includes('href="/transparency/bac"'),
    "Transparency landing page strictly excludes BAC card"
  );

  // SOMA dedicated public page
  const somaPagePath = path.join(
    process.cwd(),
    "src",
    "app",
    "(public)",
    "transparency",
    "soma",
    "page.tsx"
  );
  assert(fs.existsSync(somaPagePath), "src/app/(public)/transparency/soma/page.tsx exists");

  const somaPageSource = fs.readFileSync(somaPagePath, "utf8");
  assert(
    somaPageSource.includes('title="State of the Municipal Address (SOMA)"'),
    "SOMA page uses exact title 'State of the Municipal Address (SOMA)'"
  );
  assert(
    somaPageSource.includes('category: "State of the Municipal Address (SOMA)"'),
    "SOMA page queries category 'State of the Municipal Address (SOMA)'"
  );
  assert(
    somaPageSource.includes('purpose: "OTHER_PUBLIC_DOCUMENT"'),
    "SOMA page queries purpose 'OTHER_PUBLIC_DOCUMENT'"
  );
  assert(
    somaPageSource.includes("No State of the Municipal Address (SOMA) documents are currently published."),
    "SOMA page renders official empty state when no documents are published"
  );
  assert(
    somaPageSource.includes("/documents/${doc.id}/view") &&
      somaPageSource.includes("/documents/${doc.id}/download"),
    "SOMA page provides View (/documents/[id]/view) and Download (/documents/[id]/download) actions"
  );

  // =========================================================================
  // 6. Complete SOMA Navigation — Public Header & CMS Sidebar
  // =========================================================================
  console.log("\n--- 6. Complete SOMA Navigation — Public Header & CMS Sidebar ---");

  // Public Transparency dropdown
  const transparencyDropdown = NAV_DROPDOWN_ITEMS["Transparency"];
  assert(
    Boolean(transparencyDropdown && transparencyDropdown.length >= 2),
    "Public Transparency dropdown exists"
  );
  assert(
    Boolean(transparencyDropdown?.some((item) => item.title === "Procurement" && item.href === "/transparency/procurement")),
    "Public Transparency dropdown contains Procurement pointing to /transparency/procurement"
  );
  assert(
    Boolean(transparencyDropdown?.some((item) => item.title === "State of the Municipal Address (SOMA)" && item.href === "/transparency/soma")),
    "Public Transparency dropdown contains State of the Municipal Address (SOMA) pointing to /transparency/soma"
  );
  assert(
    Boolean(transparencyDropdown?.some((item) => item.title === "Journal and News" && item.href === "/news")),
    "Public Transparency dropdown preserves Journal and News pointing to /news"
  );

  // CMS Transparency sidebar
  const adminTransparencySection = ADMIN_NAV_CONFIG.find(
    (s) => s.key === "transparency" || s.title === "Transparency"
  );
  assert(
    Boolean(adminTransparencySection && adminTransparencySection.items.length === 2),
    "Admin CMS sidebar Transparency section contains exactly 2 items (Procurement and SOMA)"
  );
  assert(
    Boolean(adminTransparencySection?.items.some((item) => item.id === "transparency-procurement" && item.href === "/admin/transparency/procurement")),
    "Admin CMS sidebar contains Procurement pointing to /admin/transparency/procurement"
  );
  const somaAdminItem = adminTransparencySection?.items.find((item) => item.id === "transparency-soma");
  assert(
    Boolean(somaAdminItem && somaAdminItem.label === "State of the Municipal Address (SOMA)" && somaAdminItem.href === "/admin/transparency/soma"),
    "Admin CMS sidebar contains SOMA with label 'State of the Municipal Address (SOMA)' pointing to /admin/transparency/soma"
  );
  assert(
    somaAdminItem?.requiredPermission === "documents.view",
    "Admin CMS SOMA item requires 'documents.view' permission"
  );

  // SOMA CMS Management View
  const somaAdminPagePath = path.join(
    process.cwd(),
    "src",
    "app",
    "(cms)",
    "admin",
    "transparency",
    "soma",
    "page.tsx"
  );
  assert(fs.existsSync(somaAdminPagePath), "src/app/(cms)/admin/transparency/soma/page.tsx exists");

  const somaAdminPageSource = fs.readFileSync(somaAdminPagePath, "utf8");
  assert(
    somaAdminPageSource.includes('category: "State of the Municipal Address (SOMA)"'),
    "SOMA CMS view queries exact category 'State of the Municipal Address (SOMA)'"
  );
  assert(
    somaAdminPageSource.includes('purpose: "OTHER_PUBLIC_DOCUMENT"'),
    "SOMA CMS view queries purpose 'OTHER_PUBLIC_DOCUMENT'"
  );
  assert(
    somaAdminPageSource.includes("PERMISSIONS.DOCUMENTS_VIEW") &&
      somaAdminPageSource.includes('redirect("/admin")'),
    "SOMA CMS view redirects unauthorized users lacking DOCUMENTS_VIEW to /admin"
  );
  assert(
    somaAdminPageSource.includes("returnTo=soma"),
    "SOMA CMS view preserves returnTo=soma for workflow return links"
  );

  // Form Workflow Integration
  const docNewPageSource = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "(cms)", "admin", "documents", "new", "page.tsx"),
    "utf8"
  );
  assert(
    docNewPageSource.includes("isSoma") && docNewPageSource.includes("/admin/transparency/soma"),
    "CreateDocumentPage supports SOMA workflow with breadcrumbs and backHref"
  );

  const docEditPageSource = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "(cms)", "admin", "documents", "[id]", "edit", "page.tsx"),
    "utf8"
  );
  assert(
    docEditPageSource.includes("isSoma") && docEditPageSource.includes("/admin/transparency/soma"),
    "EditDocumentPage supports SOMA workflow with breadcrumbs and backHref"
  );

  const docFormSource = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "admin", "document-form.tsx"),
    "utf8"
  );
  assert(
    docFormSource.includes("isSomaFlow") && docFormSource.includes("/admin/transparency/soma"),
    "DocumentForm component supports isSomaFlow locking and back navigation"
  );

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSomaFdppTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
