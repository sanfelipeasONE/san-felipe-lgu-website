import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  ALLOWED_EMPLOYMENT_TYPES,
  LEGACY_EMPLOYMENT_TYPES,
  jobOpportunityInputSchema,
} from "../src/lib/validation/jobs";
import { VERIFIED_MUNICIPAL_OFFICES } from "../src/config/offices-data";
import { PERMISSIONS } from "../src/server/authz/permissions";
import { DOCUMENT_CATEGORIES } from "../src/lib/validation/documents";

test("Phase 26: Job Classification & Transparency Seal Verification", async (t) => {
  // =========================================================================
  // 1. Transparency Seal Asset Verification
  // =========================================================================
  await t.test("Transparency Seal canonical asset exists and duplicate is removed", () => {
    const asset160 = path.join(process.cwd(), "public/images/transparency-seal-160x160.png");
    const assetStd = path.join(process.cwd(), "public/images/transparency-seal.png");

    assert(!fs.existsSync(asset160), "transparency-seal-160x160.png duplicate must be removed from repo");
    assert(fs.existsSync(assetStd), "transparency-seal.png canonical asset must exist in public/images/");

    const statStd = fs.statSync(assetStd);
    assert.strictEqual(statStd.size, 41552, "transparency-seal.png file size must match supplied asset exactly (41,552 bytes)");

    const buf = fs.readFileSync(assetStd);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert.strictEqual(width, 160, "Transparency Seal width must be exactly 160px");
    assert.strictEqual(height, 160, "Transparency Seal height must be exactly 160px");
  });

  // =========================================================================
  // 2. Job Classification Vocabulary & Schema Validation
  // =========================================================================
  await t.test("Job Opportunity classification vocabulary is strictly Government and Private", () => {
    assert.deepStrictEqual(
      [...ALLOWED_EMPLOYMENT_TYPES],
      ["Government", "Private"],
      "ALLOWED_EMPLOYMENT_TYPES must contain ONLY 'Government' and 'Private'"
    );

    const allowedStrings: readonly string[] = ALLOWED_EMPLOYMENT_TYPES;
    assert(
      !allowedStrings.includes("Permanent"),
      "Permanent must NOT be in ALLOWED_EMPLOYMENT_TYPES"
    );
    assert(
      !allowedStrings.includes("Contractual"),
      "Contractual must NOT be in ALLOWED_EMPLOYMENT_TYPES"
    );
    assert(
      !allowedStrings.includes("Casual"),
      "Casual must NOT be in ALLOWED_EMPLOYMENT_TYPES"
    );
    assert(
      !allowedStrings.includes("Co-Terminus"),
      "Co-Terminus must NOT be in ALLOWED_EMPLOYMENT_TYPES"
    );

    assert(
      LEGACY_EMPLOYMENT_TYPES.includes("Permanent"),
      "LEGACY_EMPLOYMENT_TYPES preserves Permanent for backward compatibility"
    );
  });

  await t.test("jobOpportunityInputSchema enforces Government and Private", () => {
    const govResult = jobOpportunityInputSchema.safeParse({
      title: "Municipal Accountant I",
      employmentType: "Government",
    });
    assert(govResult.success, "Schema must accept 'Government'");

    const privResult = jobOpportunityInputSchema.safeParse({
      title: "Private Sector Specialist",
      employmentType: "Private",
    });
    assert(privResult.success, "Schema must accept 'Private'");

    const blankResult = jobOpportunityInputSchema.safeParse({
      title: "Unspecified Classification",
      employmentType: "",
    });
    assert(blankResult.success, "Schema must accept optional/empty classification");

    const omittedResult = jobOpportunityInputSchema.safeParse({
      title: "Omitted Classification",
    });
    assert(omittedResult.success, "Schema must accept omitted classification");

    // Rejection of obsolete classifications
    const permResult = jobOpportunityInputSchema.safeParse({
      title: "Legacy Vacancy",
      employmentType: "Permanent",
    });
    assert(!permResult.success, "Schema must reject obsolete 'Permanent' classification");

    const contractResult = jobOpportunityInputSchema.safeParse({
      title: "Legacy Vacancy",
      employmentType: "Contractual",
    });
    assert(!contractResult.success, "Schema must reject obsolete 'Contractual' classification");

    const casualResult = jobOpportunityInputSchema.safeParse({
      title: "Legacy Vacancy",
      employmentType: "Casual",
    });
    assert(!casualResult.success, "Schema must reject obsolete 'Casual' classification");

    const coTermResult = jobOpportunityInputSchema.safeParse({
      title: "Legacy Vacancy",
      employmentType: "Co-Terminus",
    });
    assert(!coTermResult.success, "Schema must reject obsolete 'Co-Terminus' classification");
  });

  // =========================================================================
  // 3. CMS Job Opportunities Controls (List Filter & Forms)
  // =========================================================================
  await t.test("CMS Job Opportunities page has correct filter and row rendering", () => {
    const adminJobsPath = path.join(process.cwd(), "src/app/(cms)/admin/jobs/page.tsx");
    const adminJobsSrc = fs.readFileSync(adminJobsPath, "utf8");

    assert(adminJobsSrc.includes("ALLOWED_EMPLOYMENT_TYPES"), "Admin jobs page must use ALLOWED_EMPLOYMENT_TYPES");
    assert(adminJobsSrc.includes("All Classifications"), "Admin filter must offer 'All Classifications'");
    assert(
      !adminJobsSrc.includes('<option value="Permanent">'),
      "Admin jobs filter must NOT contain hardcoded Permanent option"
    );
    assert(
      !adminJobsSrc.includes('<option value="Contractual">'),
      "Admin jobs filter must NOT contain hardcoded Contractual option"
    );
    assert(
      !adminJobsSrc.includes('<option value="Casual">'),
      "Admin jobs filter must NOT contain hardcoded Casual option"
    );
    assert(
      !adminJobsSrc.includes('<option value="Co-Terminus">'),
      "Admin jobs filter must NOT contain hardcoded Co-Terminus option"
    );
    assert(
      !adminJobsSrc.includes('{job.employmentType || "Permanent"}'),
      "Admin jobs page must NOT fallback to 'Permanent' in table row"
    );
  });

  await t.test("CMS Job Form offers strictly Government and Private with legacy compatibility", () => {
    const formPath = path.join(process.cwd(), "src/components/admin/job-form.tsx");
    const formSrc = fs.readFileSync(formPath, "utf8");

    assert(formSrc.includes("ALLOWED_EMPLOYMENT_TYPES"), "JobForm must import ALLOWED_EMPLOYMENT_TYPES");
    assert(
      formSrc.includes("<select") && formSrc.includes('id="job-type"'),
      "JobForm must use a controlled select element for classification"
    );
    assert(
      !formSrc.includes('placeholder="e.g. Permanent, Casual, Contract of Service, or leave blank"'),
      "JobForm must NOT advertise obsolete classifications in placeholder"
    );
    assert(
      formSrc.includes("Legacy"),
      "JobForm must preserve readable legacy value option for backward compatibility"
    );
  });

  // =========================================================================
  // 4. Public Job Opportunities Integrity
  // =========================================================================
  await t.test("Public Job Opportunities preserves Phase 24 simplification and badge rendering", () => {
    const viewPath = path.join(process.cwd(), "src/components/services/job-opportunities-view.tsx");
    const viewSrc = fs.readFileSync(viewPath, "utf8");

    assert(!viewSrc.includes("<input"), "Public job view must NOT contain search input");
    assert(!viewSrc.includes("searchQuery"), "Public job view must NOT contain searchQuery state");
    assert(!viewSrc.includes("filter"), "Public job view must NOT contain search/filter bar");
    assert(viewSrc.includes("job.employmentType"), "Public job view must render job.employmentType badge");
  });

  // =========================================================================
  // 5. Public Transparency Landing Route (/transparency)
  // =========================================================================
  await t.test("Public /transparency route exposes Procurement as sole top-level card", () => {
    const transparencyPath = path.join(process.cwd(), "src/app/(public)/transparency/page.tsx");
    assert(fs.existsSync(transparencyPath), "src/app/(public)/transparency/page.tsx must exist");

    const transparencySrc = fs.readFileSync(transparencyPath, "utf8");
    assert(
      !transparencySrc.includes('redirect("/transparency/procurement")'),
      "/transparency must NOT blindly redirect to procurement"
    );
    assert(
      transparencySrc.includes("/transparency/procurement"),
      "/transparency must link to /transparency/procurement"
    );
    assert(
      !transparencySrc.includes('href="/transparency/bac"'),
      "/transparency must NOT feature BAC card (Phase 27 refinement)"
    );
    assert(
      transparencySrc.includes("Access municipal transparency resources and public disclosures."),
      "/transparency must render approved civic description"
    );
    assert(
      transparencySrc.includes("PageHeader"),
      "/transparency must use official PageHeader"
    );
  });

  await t.test("Public /transparency/bac removes introductory panel while preserving document listing", () => {
    const bacPath = path.join(process.cwd(), "src/app/(public)/transparency/bac/page.tsx");
    assert(fs.existsSync(bacPath), "src/app/(public)/transparency/bac/page.tsx must exist");

    const bacSrc = fs.readFileSync(bacPath, "utf8");

    // Intro panel elements must be ABSENT
    assert(
      !bacSrc.includes("PROCUREMENT TRANSPARENCY") && !bacSrc.includes("Procurement Transparency"),
      "Introductory badge 'Procurement Transparency' must be removed from /transparency/bac"
    );
    assert(
      !bacSrc.includes("Responsible Authority: Bids and Awards Committee (BAC)"),
      "'Responsible Authority: Bids and Awards Committee (BAC)' must be removed from /transparency/bac"
    );
    assert(
      !bacSrc.includes("Official Bids and Awards Committee notices, invitations to bid"),
      "Introductory description card must be removed from /transparency/bac"
    );

    // Document functionality must be PRESERVED
    assert(
      bacSrc.includes('purpose: "OTHER_PUBLIC_DOCUMENT"'),
      "BAC page must query purpose OTHER_PUBLIC_DOCUMENT"
    );
    assert(
      bacSrc.includes('category: "Bids and Awards Committee (BAC)"'),
      "BAC page must query category Bids and Awards Committee (BAC)"
    );
    assert(
      bacSrc.includes("/documents/${doc.id}/view"),
      "BAC page must preserve secure document view link"
    );
    assert(
      bacSrc.includes("/documents/${doc.id}/download"),
      "BAC page must preserve secure document download link"
    );
  });

  // =========================================================================
  // 6. Homepage Government Programs (Exact 4 Items & Enlarged Logos)
  // =========================================================================
  await t.test("Homepage GovernmentPrograms contains exactly 4 items with enlarged presentation", () => {
    const progPath = path.join(process.cwd(), "src/components/home/government-programs.tsx");
    const progSrc = fs.readFileSync(progPath, "utf8");

    // 4 items
    assert(progSrc.includes("iBPLS"), "Programs section must render iBPLS");
    assert(progSrc.includes("Freedom of Information"), "Programs section must render Freedom of Information");
    assert(progSrc.includes("GAD Corner"), "Programs section must render GAD Corner");
    assert(progSrc.includes("Transparency Seal"), "Programs section must render Transparency Seal");

    // Exact links
    assert(
      progSrc.includes("https://bpbc.ibpls.com/sanfelipezambales/login"),
      "iBPLS must link to official external URL"
    );
    assert(
      progSrc.includes("https://www.foi.gov.ph/"),
      "FOI must link to official external URL"
    );
    assert(
      progSrc.includes('href="/gad"'),
      "GAD Corner must link internally to /gad"
    );
    assert(
      progSrc.includes('href="/transparency/procurement"'),
      "Transparency Seal must link internally to /transparency/procurement (Phase 27 refinement)"
    );

    // Transparency Seal attributes: internal link, no target="_blank"
    const sealBlock = progSrc.slice(progSrc.indexOf("Transparency Seal") - 400, progSrc.indexOf("Transparency Seal") + 400);
    assert(!sealBlock.includes('target="_blank"'), "Transparency Seal must NOT open in target='_blank'");

    // Enlarged logo container
    assert(
      progSrc.includes("h-24 sm:h-28"),
      "Logo container height must be enlarged to h-24 sm:h-28"
    );

    // Square logos (FOI, GAD, Transparency Seal)
    assert(
      progSrc.includes("w-20 h-20 sm:w-24 sm:h-24"),
      "Square logos must use enlarged dimensions w-20 h-20 sm:w-24 sm:h-24"
    );

    // Horizontal logo (iBPLS)
    assert(
      progSrc.includes("w-48 sm:w-56 h-14 sm:h-16"),
      "iBPLS must use enlarged horizontal dimensions w-48 sm:w-56 h-14 sm:h-16"
    );

    // Aspect ratio preservation
    assert(
      progSrc.includes("object-contain"),
      "All logos must preserve aspect ratio with object-contain"
    );

    // Responsive 4-item grid
    assert(
      progSrc.includes("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"),
      "Grid must use responsive 4-column desktop, 2x2 tablet, stacked mobile"
    );
  });

  // =========================================================================
  // 7. Architectural Invariants & Anti-Regression Guards
  // =========================================================================
  await t.test("Canonical municipal offices invariant remains exactly 18", () => {
    assert.strictEqual(
      VERIFIED_MUNICIPAL_OFFICES.length,
      18,
      "Public canonical offices list must remain exactly 18"
    );

    const hasTransparencyOffice = VERIFIED_MUNICIPAL_OFFICES.some(
      (o) => o.name.toLowerCase().includes("transparency") || o.name.toLowerCase().includes("seal")
    );
    assert(!hasTransparencyOffice, "Zero Transparency Offices in canonical offices list");

    const hasBacOffice = VERIFIED_MUNICIPAL_OFFICES.some(
      (o) => o.name.toLowerCase().includes("bids and awards") || o.acronym?.toLowerCase() === "bac"
    );
    assert(!hasBacOffice, "Zero BAC Offices in canonical offices list");

    const hasGadOffice = VERIFIED_MUNICIPAL_OFFICES.some(
      (o) => o.name.toLowerCase().includes("gender") || o.name.toLowerCase().includes("gad")
    );
    assert(!hasGadOffice, "Zero GAD Offices in canonical offices list");
  });

  await t.test("Zero new Transparency permissions added", () => {
    const allPerms = Object.values(PERMISSIONS);
    const transparencyPerms = allPerms.filter((p) => p.startsWith("transparency."));
    assert.strictEqual(transparencyPerms.length, 0, "No new transparency.* permissions should exist");
  });

  await t.test("Controlled document categories include Procurement and BAC", () => {
    const categories: readonly string[] = DOCUMENT_CATEGORIES;
    assert(categories.includes("Procurement"), "DOCUMENT_CATEGORIES must contain Procurement");
    assert(
      categories.includes("Bids and Awards Committee (BAC)"),
      "DOCUMENT_CATEGORIES must contain Bids and Awards Committee (BAC)"
    );
    assert(
      categories.includes("Gender and Development (GAD)"),
      "DOCUMENT_CATEGORIES must contain Gender and Development (GAD)"
    );
  });

  await t.test("Migration #12 and Prisma schema authorize optional NewsArticle office", () => {
    const migrationsDir = path.join(process.cwd(), "prisma/migrations");
    const migrationDirs = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    assert([12, 13].includes(migrationDirs.length), "Migration count must be 12 (Phase 26) or 13 (Phase 27)");
    const migration12 = migrationDirs.find((d) => d.name.includes("make_news_article_office_optional"));
    assert(migration12, "Migration #12 (make_news_article_office_optional) must exist");

    const sqlPath = path.join(migrationsDir, migration12!.name, "migration.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    assert(
      sqlContent.includes('ALTER TABLE "news_articles" ALTER COLUMN "officeId" DROP NOT NULL;'),
      "Migration #12 SQL must drop NOT NULL on officeId"
    );

    const schemaPath = path.join(process.cwd(), "prisma/schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    assert(
      /officeId\s+String\?/.test(schemaContent),
      "prisma/schema.prisma must define officeId as optional String?"
    );
    assert(
      /office\s+Office\?\s+@relation\(fields:\s*\[officeId\]/.test(schemaContent),
      "prisma/schema.prisma must define office as optional Office?"
    );
  });

  await t.test("Single canonical Transparency Seal asset and duplicate cleanup", () => {
    const canonicalAsset = path.join(process.cwd(), "public/images/transparency-seal.png");
    const duplicateAsset = path.join(process.cwd(), "public/images/transparency-seal-160x160.png");

    assert(fs.existsSync(canonicalAsset), "Canonical transparency-seal.png must exist");
    assert(!fs.existsSync(duplicateAsset), "Duplicate transparency-seal-160x160.png must not exist");
  });

  await t.test("BAC public page intro panel is completely removed", () => {
    const bacPagePath = path.join(process.cwd(), "src/app/(public)/transparency/bac/page.tsx");
    const bacContent = fs.readFileSync(bacPagePath, "utf-8");

    assert(
      !bacContent.includes("PROCUREMENT TRANSPARENCY"),
      "BAC public page must not contain 'PROCUREMENT TRANSPARENCY' intro header"
    );
    assert(
      !bacContent.includes("Responsible Authority: Bids and Awards Committee (BAC)"),
      "BAC public page must not contain 'Responsible Authority: Bids and Awards Committee (BAC)'"
    );
  });

  await t.test("News CMS list and forms have no Publishing Office select/filter", () => {
    const newsListPagePath = path.join(process.cwd(), "src/app/(cms)/admin/news/page.tsx");
    const newsListContent = fs.readFileSync(newsListPagePath, "utf-8");
    assert(
      !newsListContent.includes('name="officeId"'),
      "News CMS list must not include officeId filter dropdown"
    );

    const newsFormPath = path.join(process.cwd(), "src/components/admin/news-form.tsx");
    const newsFormContent = fs.readFileSync(newsFormPath, "utf-8");
    assert(
      !newsFormContent.includes("Publishing Office"),
      "NewsForm must not contain Publishing Office selector panel"
    );
    assert(
      !newsFormContent.includes("selectedOfficeId"),
      "NewsForm must not contain selectedOfficeId state"
    );
  });
});
