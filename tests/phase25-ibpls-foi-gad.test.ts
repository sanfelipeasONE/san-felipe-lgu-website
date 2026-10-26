import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { NAV_DROPDOWN_ITEMS } from "@/config/site";
import { ADMIN_NAV_CONFIG, getVisibleNavSections } from "@/config/admin-navigation";
import { VERIFIED_MUNICIPAL_OFFICES, getCanonicalOffices } from "@/config/offices-data";
import { DOCUMENT_CATEGORIES } from "@/lib/validation/documents";
import { NEWS_CATEGORIES } from "@/lib/validation/news";
import { PERMISSIONS } from "@/server/authz/permissions";

console.log("===============================================================");
console.log("SAN FELIPE LGU PHASE 25: iBPLS, FOI & GAD CORNER TEST SUITE");
console.log("===============================================================");

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(description: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ✗ FAIL: ${description}`);
      console.error(`    ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Client-Approved Assets
  // ---------------------------------------------------------------------------
  console.log("\n--- 1. Client-Approved Image Assets ---");

  test("ibpls-500x117.png exists in public/images and is non-empty", () => {
    const p = path.join(process.cwd(), "public/images/ibpls-500x117.png");
    assert(fs.existsSync(p), "ibpls-500x117.png must exist");
    assert(fs.statSync(p).size > 0, "ibpls-500x117.png must not be empty");
  });

  test("foi-logo-160x160.png exists in public/images and is non-empty", () => {
    const p = path.join(process.cwd(), "public/images/foi-logo-160x160.png");
    assert(fs.existsSync(p), "foi-logo-160x160.png must exist");
    assert(fs.statSync(p).size > 0, "foi-logo-160x160.png must not be empty");
  });

  test("gad-logo.png exists in public/images and is non-empty", () => {
    const p = path.join(process.cwd(), "public/images/gad-logo.png");
    assert(fs.existsSync(p), "gad-logo.png must exist");
    assert(fs.statSync(p).size > 0, "gad-logo.png must not be empty");
  });

  // ---------------------------------------------------------------------------
  // 2. Homepage Programs & Online Services Section
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Homepage Programs & Online Services Section ---");

  const homePageContent = fs.readFileSync("src/app/(public)/page.tsx", "utf8");
  const progComponentContent = fs.readFileSync("src/components/home/government-programs.tsx", "utf8");

  test("Homepage imports and renders GovernmentPrograms section", () => {
    assert(homePageContent.includes("GovernmentPrograms"), "HomePage must import GovernmentPrograms");
    assert(homePageContent.includes("<GovernmentPrograms />") || homePageContent.includes("<GovernmentPrograms"), "HomePage must render <GovernmentPrograms />");
  });

  test("GovernmentPrograms section has official heading and clean design", () => {
    assert(progComponentContent.includes("Government Programs &amp; Online Services") || progComponentContent.includes("Government Programs & Online Services"), "Must render official section title");
    assert(progComponentContent.includes("object-contain"), "Logos must use object-contain to preserve natural aspect ratio");
    assert(!progComponentContent.includes("carousel"), "Must not use a carousel");
  });

  test("GovernmentPrograms renders clean directory titles and descriptors", () => {
    assert(progComponentContent.includes("Quick access to government programs and online services."), "Must render concise neutral description");
    assert(progComponentContent.includes("iBPLS"), "Must render iBPLS title");
    assert(progComponentContent.includes("Business Permits &amp; Licensing") || progComponentContent.includes("Business Permits & Licensing"), "Must render iBPLS descriptor");
    assert(progComponentContent.includes("Freedom of Information"), "Must render Freedom of Information title");
    assert(progComponentContent.includes("FOI Philippines"), "Must render FOI descriptor");
    assert(progComponentContent.includes("GAD Corner"), "Must render GAD Corner title");
    assert(progComponentContent.includes("News &amp; Resources") || progComponentContent.includes("News & Resources"), "Must render GAD descriptor");
  });

  test("GovernmentPrograms has NO dashboard pills, action bars, or SaaS card labels", () => {
    assert(!progComponentContent.includes("ONLINE BUSINESS PORTAL"), "Must NOT render ONLINE BUSINESS PORTAL badge");
    assert(!progComponentContent.includes("NATIONAL TRANSPARENCY"), "Must NOT render NATIONAL TRANSPARENCY badge");
    assert(!progComponentContent.includes("MUNICIPAL PROGRAM"), "Must NOT render MUNICIPAL PROGRAM badge");
    assert(!progComponentContent.includes("Access Online Portal"), "Must NOT render Access Online Portal CTA");
    assert(!progComponentContent.includes("Open National Portal"), "Must NOT render Open National Portal CTA");
    assert(!progComponentContent.includes("View GAD News & Resources"), "Must NOT render View GAD News & Resources CTA");
  });

  test("iBPLS card has exact URL, target='_blank', rel='noopener noreferrer', and accessible name", () => {
    assert(progComponentContent.includes("https://bpbc.ibpls.com/sanfelipezambales/login"), "iBPLS must point to exact portal URL");
    assert(progComponentContent.includes('target="_blank"'), "iBPLS must open in new tab");
    assert(progComponentContent.includes('rel="noopener noreferrer"'), "iBPLS must have rel='noopener noreferrer'");
    assert(progComponentContent.includes('aria-label="Open San Felipe iBPLS Business Permit Portal"'), "iBPLS must have exact accessible name");
    assert(progComponentContent.includes("/images/ibpls-500x117.png"), "iBPLS must use supplied asset");
  });

  test("FOI card has exact URL, target='_blank', rel='noopener noreferrer', and accessible name", () => {
    assert(progComponentContent.includes("https://www.foi.gov.ph/"), "FOI must point to exact portal URL");
    assert(progComponentContent.includes('target="_blank"'), "FOI must open in new tab");
    assert(progComponentContent.includes('rel="noopener noreferrer"'), "FOI must have rel='noopener noreferrer'");
    assert(progComponentContent.includes('aria-label="Open Freedom of Information Philippines"'), "FOI must have exact accessible name");
    assert(progComponentContent.includes("/images/foi-logo-160x160.png"), "FOI must use supplied asset");
  });

  test("GAD card has internal /gad link, NO target='_blank', and accessible name", () => {
    assert(progComponentContent.includes('href="/gad"'), "GAD must link to /gad");
    assert(!progComponentContent.includes('<Link\n              href="/gad"\n              target="_blank"'), "GAD must not open in a new tab");
    assert(progComponentContent.includes('aria-label="Open Gender and Development (GAD) Corner"'), "GAD must have exact accessible name");
    assert(progComponentContent.includes("/images/gad-logo.png"), "GAD must use supplied asset");
  });

  // ---------------------------------------------------------------------------
  // 3. Business Permits Presentation & Actions
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Business Permits Presentation & Actions ---");

  const bpViewContent = fs.readFileSync("src/components/services/business-permits-view.tsx", "utf8");
  const bpPageContent = fs.readFileSync("src/app/(public)/services/business-permits/page.tsx", "utf8");

  test("Business Permits page contains required PRESENT elements", () => {
    assert(bpPageContent.includes("Business Permits"), "Must contain 'Business Permits' title");
    assert(bpPageContent.includes("/images/ibpls-500x117.png"), "Must render supplied iBPLS logo");
    assert(bpPageContent.includes("https://bpbc.ibpls.com/sanfelipezambales/login"), "Must link to exact iBPLS URL");
    assert(bpPageContent.includes('target="_blank"'), "Must include target='_blank'");
    assert(bpPageContent.includes('rel="noopener noreferrer"'), "Must include rel='noopener noreferrer'");
    assert(bpPageContent.includes("Online Business Permit Portal"), "Must render 'Online Business Permit Portal' heading");
    assert(
      bpPageContent.includes("Apply for or renew a business permit through the Integrated Business Permits and Licensing System (iBPLS)."),
      "Must render concise iBPLS portal description"
    );
    assert(bpPageContent.includes("Open iBPLS Portal"), "Must render primary 'Open iBPLS Portal' action");
  });

  test("Business Permits page renders exactly ONE primary iBPLS portal presentation", () => {
    const logoMatches = (bpPageContent.match(/\/images\/ibpls-500x117\.png/g) || []).length;
    assert.strictEqual(logoMatches, 1, "Must have exactly ONE iBPLS logo in BusinessPermitsPage");
    assert(!bpViewContent.includes("/images/ibpls-500x117.png"), "BusinessPermitsView must NOT duplicate iBPLS portal presentation");
  });

  test("Business Permits iBPLS logo itself is clickable with target='_blank', rel='noopener noreferrer', and exact URL", () => {
    assert(bpPageContent.includes("https://bpbc.ibpls.com/sanfelipezambales/login"), "Must point to exact iBPLS URL");
    assert(bpPageContent.includes('target="_blank"'), "Must open in new tab");
    assert(bpPageContent.includes('rel="noopener noreferrer"'), "Must have rel='noopener noreferrer'");
    assert(bpPageContent.includes('aria-label="Open San Felipe iBPLS Business Permit Portal"'), "Must have accessible name");
  });

  test("Business Permits page strictly excludes legacy ABSENT elements", () => {
    const combinedContent = bpPageContent + "\n" + bpViewContent;

    assert(
      !combinedContent.toLowerCase().includes("business permit guidelines are pending publication"),
      "'Business permit guidelines are pending publication' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("view municipal offices directory"),
      "'VIEW MUNICIPAL OFFICES DIRECTORY' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("go to downloadable forms"),
      "'GO TO DOWNLOADABLE FORMS' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("in-person assistance & public inquiries") &&
      !combinedContent.toLowerCase().includes("in-person assistance &amp; public inquiries"),
      "'IN-PERSON ASSISTANCE & PUBLIC INQUIRIES' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("downloadable forms integration"),
      "'Downloadable Forms Integration' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("browse official municipal form templates"),
      "'Browse official municipal form templates' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("new business application"),
      "'New Business Application' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("business permit renewal"),
      "'Business Permit Renewal' must be absent"
    );
    assert(
      !combinedContent.toLowerCase().includes("official online licensing portal"),
      "'OFFICIAL ONLINE LICENSING PORTAL' eyebrow must be absent"
    );
  });

  test("Business Permits preserves published CMS content view architecture", () => {
    assert(bpPageContent.includes("hasPublishedContent && publishedPage"), "Must render published CMS content when present");
    assert(bpPageContent.includes("<BusinessPermitsView />"), "Must render BusinessPermitsView as fallback");
  });

  // ---------------------------------------------------------------------------
  // 4. Public GAD Corner Page
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Public GAD Corner Page (/gad) ---");

  const gadPageContent = fs.readFileSync("src/app/(public)/gad/page.tsx", "utf8");

  test("GAD public route exists at src/app/(public)/gad/page.tsx", () => {
    assert(fs.existsSync("src/app/(public)/gad/page.tsx"), "/gad page.tsx must exist");
  });

  test("GAD public page renders supplied /images/gad-logo.png", () => {
    assert(gadPageContent.includes("/images/gad-logo.png"), "Must render /images/gad-logo.png");
  });

  test("GAD public page contains NO RA 9710, Magna Carta, or legal mandate copy", () => {
    assert(!gadPageContent.includes("9710"), "Must NOT contain RA 9710 citation");
    assert(!gadPageContent.toLowerCase().includes("magna carta"), "Must NOT contain Magna Carta reference");
    assert(!gadPageContent.includes("Focal Point System"), "Must NOT claim Focal Point System");
    assert(!gadPageContent.includes("Statutory Framework"), "Must NOT claim statutory framework");
  });

  test("GAD public page contains concise neutral introduction", () => {
    assert(
      gadPageContent.includes("News, announcements, resources, and official GAD documents from the Municipal Government of San Felipe"),
      "Must contain approved neutral municipal introduction"
    );
  });

  test("GAD public page contains distinct GAD News and GAD Resources headings", () => {
    assert(gadPageContent.includes("GAD News"), "Must have GAD News section");
    assert(gadPageContent.includes("GAD Resources"), "Must have GAD Resources section");
  });

  test("GAD public page contains NO dashboard metric boxes, eyebrows, or counters", () => {
    assert(!gadPageContent.includes("GAD News ("), "Must NOT render GAD News metric box");
    assert(!gadPageContent.includes("GAD Resources ("), "Must NOT render GAD Resources metric box");
    assert(!gadPageContent.includes("published article"), "Must NOT render published articles counter");
    assert(!gadPageContent.includes("published file"), "Must NOT render published files counter");
    assert(!gadPageContent.includes("GOVERNMENT PROGRAMS"), "Must NOT render GOVERNMENT PROGRAMS eyebrow");
    assert(!gadPageContent.includes("ADVISORIES & HIGHLIGHTS") && !gadPageContent.includes("ADVISORIES &amp; HIGHLIGHTS"), "Must NOT render ADVISORIES & HIGHLIGHTS eyebrow");
    assert(!gadPageContent.includes("PUBLICATIONS & DISCLOSURES") && !gadPageContent.includes("PUBLICATIONS &amp; DISCLOSURES"), "Must NOT render PUBLICATIONS & DISCLOSURES eyebrow");
  });

  test("GAD public page contains simple neutral empty state text without giant boxes or icons", () => {
    assert(gadPageContent.includes("No GAD news has been published yet."), "Must contain clean empty news text");
    assert(gadPageContent.includes("No GAD resources have been published yet."), "Must contain clean empty resources text");
    assert(!gadPageContent.includes("rounded-full bg-slate-100"), "Must NOT render circular empty-state icon containers");
  });

  test("GAD public page queries strictly PUBLISHED news and documents", () => {
    assert(gadPageContent.includes("getPublicPublishedNews"), "Must use published news query");
    assert(gadPageContent.includes("GENDER AND DEVELOPMENT (GAD)"), "Must filter by GAD category");
    assert(gadPageContent.includes("getPublishedDocuments"), "Must use getPublishedDocuments query");
    assert(gadPageContent.includes("OTHER_PUBLIC_DOCUMENT"), "Must query OTHER_PUBLIC_DOCUMENT purpose");
    assert(gadPageContent.includes("Gender and Development (GAD)"), "Must query Gender and Development (GAD) category");
  });

  test("GAD public page uses secure document routes /documents/[id]/view and /download", () => {
    assert(gadPageContent.includes("/documents/${doc.id}/view") || gadPageContent.includes("/documents/"), "Must use secure view route");
    assert(gadPageContent.includes("/documents/${doc.id}/download") || gadPageContent.includes("/download"), "Must use secure download route");
    assert(!gadPageContent.includes("res.cloudinary.com"), "Must not expose raw Cloudinary URLs directly");
  });

  // ---------------------------------------------------------------------------
  // 5. GAD CMS Management & Classification Locks
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. GAD CMS (/admin/gad) & Classification Locks ---");

  const adminGadPageContent = fs.readFileSync("src/app/(cms)/admin/gad/page.tsx", "utf8");
  const adminDocFormContent = fs.readFileSync("src/components/admin/document-form.tsx", "utf8");
  const adminNewsFormContent = fs.readFileSync("src/components/admin/news-form.tsx", "utf8");
  const docActionsContent = fs.readFileSync("src/app/(cms)/admin/documents/actions.ts", "utf8");
  const newsActionsContent = fs.readFileSync("src/app/(cms)/admin/news/actions.ts", "utf8");

  test("GAD CMS route exists at src/app/(cms)/admin/gad/page.tsx", () => {
    assert(fs.existsSync("src/app/(cms)/admin/gad/page.tsx"), "/admin/gad page.tsx must exist");
  });

  test("GAD CMS landing page enforces RBAC for both posts.view and documents.view", () => {
    assert(adminGadPageContent.includes("canViewNews"), "Must check canViewNews");
    assert(adminGadPageContent.includes("canViewDocs"), "Must check canViewDocs");
    assert(adminGadPageContent.includes("!canViewNews && !canViewDocs"), "Must deny access if user has neither permission");
  });

  test("GAD CMS landing page tab routing respects isolated permissions", () => {
    assert(adminGadPageContent.includes('activeTab === "news" && !canViewNews'), "Must prevent unauthorized news tab access");
    assert(adminGadPageContent.includes('activeTab === "resources" && !canViewDocs'), "Must prevent unauthorized resources tab access");
  });

  test("GAD CMS sidebar navigation supports OR permission for posts.view or documents.view", () => {
    const contentSection = ADMIN_NAV_CONFIG.find((s) => s.key === "content");
    const gadItem = contentSection?.items.find((i) => i.id === "gad-corner");
    assert(gadItem, "gad-corner must exist in ADMIN_NAV_CONFIG");
    assert(
      gadItem.requiredAnyPermission?.includes("posts.view") &&
      gadItem.requiredAnyPermission?.includes("documents.view"),
      "gad-corner must specify requiredAnyPermission with posts.view and documents.view"
    );

    // Test getVisibleNavSections behavior
    const postsOnlyUser = { permissions: ["posts.view"], isSystemScope: false };
    const docsOnlyUser = { permissions: ["documents.view"], isSystemScope: false };
    const neitherUser = { permissions: ["other.view"], isSystemScope: false };

    const postsSections = getVisibleNavSections(postsOnlyUser);
    const postsHasGad = postsSections.some((s) => s.items.some((i) => i.id === "gad-corner"));
    assert(postsHasGad, "Posts-only user must see GAD Corner in sidebar");

    const docsSections = getVisibleNavSections(docsOnlyUser);
    const docsHasGad = docsSections.some((s) => s.items.some((i) => i.id === "gad-corner"));
    assert(docsHasGad, "Docs-only user must see GAD Corner in sidebar");

    const neitherSections = getVisibleNavSections(neitherUser);
    const neitherHasGad = neitherSections.some((s) => s.items.some((i) => i.id === "gad-corner"));
    assert(!neitherHasGad, "Neither-permission user must NOT see GAD Corner in sidebar");
  });

  test("GAD Document workflow locks category and purpose on client and server", () => {
    assert(adminDocFormContent.includes("isGadFlow"), "DocumentForm must support isGadFlow");
    assert(docActionsContent.includes('returnTo === "gad"'), "createDocumentAction must check returnTo=gad");
    assert(docActionsContent.includes('category = "Gender and Development (GAD)"'), "Must enforce GAD category server-side");
    assert(docActionsContent.includes('purpose = "OTHER_PUBLIC_DOCUMENT"'), "Must enforce OTHER_PUBLIC_DOCUMENT purpose server-side");
  });

  test("GAD News workflow locks category on client and server", () => {
    assert(adminNewsFormContent.includes("isGadFlow"), "NewsForm must support isGadFlow");
    assert(newsActionsContent.includes('returnTo === "gad"'), "createNewsAction must check returnTo=gad");
    assert(newsActionsContent.includes('effectiveInput.category = "GENDER AND DEVELOPMENT (GAD)"'), "Must enforce GAD category server-side");
  });

  test("Zero hardcoded GAD responsible office assigned in code", () => {
    assert(!adminGadPageContent.includes("officeId:"), "GAD CMS page must not hardcode officeId");
    assert(!gadPageContent.includes("MSWDO"), "Public GAD page must not hardcode MSWDO");
  });

  // ---------------------------------------------------------------------------
  // 6. Navigation Integrity
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Navigation Dropdowns & Sidebar ---");

  test("Government dropdown contains exactly 4 entries in authoritative order", () => {
    const gov = NAV_DROPDOWN_ITEMS["Government"];
    assert(gov && gov.length === 4, "Government dropdown must have exactly 4 items");
    assert.strictEqual(gov[0].title, "Municipal Officials");
    assert.strictEqual(gov[0].href, "/government/officials");
    assert.strictEqual(gov[1].title, "All Municipal Offices");
    assert.strictEqual(gov[1].href, "/offices");
    assert.strictEqual(gov[2].title, "Barangay Emergency Hotlines");
    assert.strictEqual(gov[2].href, "/emergency-hotlines/barangays");
    assert.strictEqual(gov[3].title, "GAD Corner");
    assert.strictEqual(gov[3].href, "/gad");
  });

  // ---------------------------------------------------------------------------
  // 7. Canonical Offices Decoupling & Regression Safety
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Canonical Safety & Regression Checks ---");

  test("Canonical offices count remains strictly 18", () => {
    assert.strictEqual(VERIFIED_MUNICIPAL_OFFICES.length, 18, "VERIFIED_MUNICIPAL_OFFICES must be 18");
    assert.strictEqual(getCanonicalOffices().length, 18, "getCanonicalOffices() must return 18");
  });

  test("GAD is NOT a row in VERIFIED_MUNICIPAL_OFFICES", () => {
    const hasGad = VERIFIED_MUNICIPAL_OFFICES.some(
      (o) => o.name.toLowerCase().includes("gad") || o.name.toLowerCase().includes("gender")
    );
    assert(!hasGad, "GAD must not be in canonical offices list");
  });

  test("BAC is NOT in canonical offices list", () => {
    const hasBac = VERIFIED_MUNICIPAL_OFFICES.some((o) => o.name.toLowerCase().includes("bac"));
    assert(!hasBac, "BAC must not be in canonical offices list");
  });

  test("Legacy ICTO remains excluded from canonical offices list", () => {
    const hasIcto = VERIFIED_MUNICIPAL_OFFICES.some((o) => o.name.toLowerCase().includes("icto"));
    assert(!hasIcto, "ICTO must not be in canonical offices list");
  });

  test("DOCUMENT_CATEGORIES includes controlled GAD, BAC, and Procurement categories", () => {
    const docCats: readonly string[] = DOCUMENT_CATEGORIES;
    assert(docCats.includes("Gender and Development (GAD)"), "Must include GAD category");
    assert(docCats.includes("Bids and Awards Committee (BAC)"), "Must include BAC category");
    assert(docCats.includes("Procurement"), "Must include Procurement category");
  });

  test("NEWS_CATEGORIES includes controlled GAD category", () => {
    const newsCats: readonly string[] = NEWS_CATEGORIES;
    assert(newsCats.includes("GENDER AND DEVELOPMENT (GAD)"), "Must include GAD category in NEWS_CATEGORIES");
  });

  test("Zero gad.* permissions exist in PERMISSIONS registry", () => {
    const allPerms = Object.values(PERMISSIONS);
    const hasGadPerms = allPerms.some((p) => p.startsWith("gad."));
    assert(!hasGadPerms, "Zero gad.* permissions must exist; existing permissions are reused");
  });

  // ---------------------------------------------------------------------------
  // 8. Public Downloadable Forms Search Removal & Invariants
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Public Downloadable Forms Search Removal ---");

  const dfViewContent = fs.readFileSync("src/components/services/downloadable-forms-view.tsx", "utf8");
  const dfPageContent = fs.readFileSync("src/app/(public)/services/downloadable-forms/page.tsx", "utf8");
  const adminDocsContent = fs.readFileSync("src/app/(cms)/admin/documents/page.tsx", "utf8");

  test("Public Downloadable Forms page contains required PRESENT elements", () => {
    assert(dfPageContent.includes("Downloadable Forms"), "Page must have 'Downloadable Forms' title");
    assert(dfPageContent.includes("getPublishedDocuments()"), "Page must load published documents");
    assert(dfPageContent.includes("<DownloadableFormsView forms={forms} />"), "Page must render DownloadableFormsView");
    assert(dfViewContent.includes("form.title"), "View must render document/form titles");
    assert(dfViewContent.includes("/documents/${form.id}/view"), "View must render secure first-party view route");
    assert(dfViewContent.includes("/documents/${form.id}/download"), "View must render secure first-party download route");
  });

  test("Public Downloadable Forms strictly excludes search UI elements", () => {
    assert(!dfViewContent.includes("<input"), "Must NOT render public search input element");
    assert(!dfViewContent.includes("Search\n") && !dfViewContent.includes("Search className") && !dfViewContent.includes("Search,"), "Must NOT import or render Lucide Search icon");
    assert(!dfViewContent.includes("searchQuery"), "Must NOT have searchQuery state");
    assert(!dfViewContent.includes("setSearchQuery"), "Must NOT have setSearchQuery updater");
    assert(!dfViewContent.includes("matchesSearch"), "Must NOT have matchesSearch text filtering");
    assert(!dfViewContent.includes("Search forms by title"), "Must NOT have search placeholder");
    assert(!dfViewContent.toLowerCase().includes("no search results"), "Must NOT have 'no search results' copy");
    assert(!dfViewContent.toLowerCase().includes("try another search"), "Must NOT have 'try another search' copy");
    assert(!dfViewContent.toLowerCase().includes("clear your search"), "Must NOT have 'clear your search' copy");
  });

  test("Downloadable Forms preserves Category and Issuing Office filters", () => {
    assert(dfViewContent.includes("FORM_CATEGORIES"), "Must preserve FORM_CATEGORIES");
    assert(dfViewContent.includes("selectedCategory"), "Must preserve category filter state");
    assert(dfViewContent.includes("selectedOffice"), "Must preserve office filter state");
    assert(dfViewContent.includes("getCanonicalOffices()"), "Must load canonical offices for filter dropdown");
  });

  test("DOWNLOADABLE_FORM filtering and Charter document exclusion remain strictly intact in service", () => {
    const docServiceContent = fs.readFileSync("src/server/documents/service.ts", "utf8");
    assert(
      docServiceContent.includes('purpose: (filters?.purpose as PrismaDocumentPurpose) ?? "DOWNLOADABLE_FORM"'),
      "getPublishedDocuments default purpose must strictly be DOWNLOADABLE_FORM"
    );
    assert(
      docServiceContent.includes("getEligiblePublicDocument"),
      "getEligiblePublicDocument must be implemented for first-party route access"
    );
    assert(
      docServiceContent.includes("getEligiblePublicCharterDocument"),
      "Citizen's Charter must use dedicated isolated resolver"
    );
  });

  test("CMS Document Management retains administrative search and filter functionality", () => {
    assert(adminDocsContent.includes("searchPlaceholder="), "CMS Documents page must retain searchPlaceholder");
    assert(adminDocsContent.includes("searchValue={search}"), "CMS Documents page must retain searchValue");
    assert(adminDocsContent.includes("getAdminDocumentsList"), "CMS Documents page must query with search parameter");
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log(`PHASE 25 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Unhandled error in test runner:", e);
  process.exit(1);
});
