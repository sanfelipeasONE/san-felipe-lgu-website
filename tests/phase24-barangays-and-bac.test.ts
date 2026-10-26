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

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runPhase24TestSuite() {
  console.log("===============================================================");
  console.log("SAN FELIPE LGU BARANGAY HOTLINES & BAC TEST SUITE (PHASE 24)");
  console.log("===============================================================");

  const {
    AUTHORITATIVE_BARANGAYS,
    AUTHORITATIVE_BARANGAY_COUNT,
    getAuthoritativeBarangays,
  } = await import("../src/config/barangays-data");
  const {
    EMERGENCY_DATA,
  } = await import("../src/config/homepage-data");
  const {
    NAV_DROPDOWN_ITEMS,
  } = await import("../src/config/site");
  const {
    DOCUMENT_CATEGORIES,
  } = await import("../src/lib/validation/documents");
  const {
    ADMIN_NAV_CONFIG,
  } = await import("../src/config/admin-navigation");
  const {
    VERIFIED_MUNICIPAL_OFFICES,
    getCanonicalOffices,
  } = await import("../src/config/offices-data");
  const { PERMISSIONS } = await import("../src/server/authz/permissions");

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

  try {
    const fs = await import("fs");

    // -------------------------------------------------------------------------
    // 1. Barangay Authoritative Directory & Invariants
    // -------------------------------------------------------------------------
    console.log("\n--- 1. Barangay Authoritative Directory & Invariants ---");

    // 1. exactly 10 barangays
    assert(
      AUTHORITATIVE_BARANGAYS.length === 10 && AUTHORITATIVE_BARANGAY_COUNT === 10,
      "AUTHORITATIVE_BARANGAYS defines exactly 10 barangays"
    );

    // 2. exact authoritative names
    const expectedBarangayNames = [
      "Amagna",
      "Apostol",
      "Balincaguing",
      "Feria",
      "Maloma",
      "Manglicmot",
      "Rosete",
      "San Rafael",
      "Sindol",
      "Sto. Niño",
    ];

    const allNamesMatch = expectedBarangayNames.every(
      (name, idx) => AUTHORITATIVE_BARANGAYS[idx]?.name === name
    );
    assert(
      allNamesMatch,
      "All 10 barangays match exact authoritative names in alphabetical order"
    );

    // 3. Sto. Niño spelling (strictly includes ñ)
    const stoNino = AUTHORITATIVE_BARANGAYS.find((b) => b.id === "sto-nino");
    assert(
      stoNino !== undefined && stoNino.name === "Sto. Niño" && stoNino.name.includes("ñ"),
      "Sto. Niño preserves exact spelling with 'ñ'"
    );

    // 4. no 11th barangay
    assert(
      AUTHORITATIVE_BARANGAYS.length !== 11 && getAuthoritativeBarangays().length === 10,
      "No 11th barangay exists in authoritative configuration"
    );

    // 5. no fabricated contact information
    const allContactsNotProvided = AUTHORITATIVE_BARANGAYS.every(
      (b) => b.isContactProvided === false && !b.phone && !b.mobile && !b.alternateNumbers
    );
    assert(
      allContactsNotProvided,
      "All 10 barangays have isContactProvided: false with zero fabricated numbers"
    );

    // 6. Barangay directory page table structure & presentation
    const barangayPageContent = fs.readFileSync(
      "src/app/(public)/emergency-hotlines/barangays/page.tsx",
      "utf8"
    );
    assert(
      barangayPageContent.includes("<table") &&
        !barangayPageContent.includes("grid-cols-") &&
        !barangayPageContent.includes("Barangay LGU") &&
        !barangayPageContent.includes("Barangay {brgy.name}"),
      "Barangay directory uses institutional row/column presentation without cards, badges, or subtitles"
    );

    // 7. Column headers: Barangay and Emergency Hotline
    const hasBarangayHeader = />\s*Barangay\s*<\/th>/.test(barangayPageContent);
    const hasHotlineHeader = />\s*Emergency Hotline\s*<\/th>/.test(barangayPageContent);
    assert(
      hasBarangayHeader && hasHotlineHeader,
      "Barangay directory defines exact column headers: 'Barangay' and 'Emergency Hotline'"
    );

    // 8. Every missing hotline displays concise 'Not yet provided'
    assert(
      barangayPageContent.includes("Not yet provided") &&
        !barangayPageContent.includes("Official hotline will be published upon endorsement"),
      "Missing emergency contacts display concise neutral 'Not yet provided'"
    );

    // 9. no tel: links for missing numbers
    assert(
      barangayPageContent.includes("brgy.isContactProvided && brgy.phone"),
      "Barangay UI strictly conditions tel: links on isContactProvided && phone"
    );

    // 10. Directory notes neutral language and top callout removal
    assert(
      barangayPageContent.includes("Barangay emergency contact information will be published here once officially provided") &&
        !barangayPageContent.includes("Liga ng mga Barangay") &&
        !barangayPageContent.includes("Barangay Councils") &&
        !barangayPageContent.includes("Immediate 24/7 Municipal Emergency Assistance") &&
        !barangayPageContent.includes("Directory Advisory:"),
      "Directory advisory notes use neutral language without unverified organizational claims or redundant top banners"
    );

    // -------------------------------------------------------------------------
    // 2. Homepage Hotlines & Single CTA
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Homepage Hotlines Preservation & Single CTA ---");

    const hotlinesComponentContent = fs.readFileSync(
      "src/components/home/emergency-hotlines.tsx",
      "utf8"
    );

    // 11. exactly ONE Browse Barangay Emergency Hotlines CTA
    const ctaMatches = (
      hotlinesComponentContent.match(/Browse Barangay Emergency Hotlines/g) || []
    ).length;
    assert(
      ctaMatches === 1,
      "Homepage emergency section contains exactly ONE 'Browse Barangay Emergency Hotlines' CTA"
    );

    // 12. that CTA points to /emergency-hotlines/barangays
    const linkMatches = (
      hotlinesComponentContent.match(/href="\/emergency-hotlines\/barangays"/g) || []
    ).length;
    assert(
      linkMatches === 1,
      "CTA links directly to '/emergency-hotlines/barangays'"
    );

    // 13. existing #emergency-hotlines anchor preserved
    assert(
      hotlinesComponentContent.includes('id="emergency-hotlines"'),
      "Homepage emergency section preserves id='emergency-hotlines'"
    );

    // 14. existing four municipal emergency contacts preserved
    assert(
      EMERGENCY_DATA.length === 4,
      "EMERGENCY_DATA preserves all 4 central municipal emergency agencies"
    );

    // 15. All four municipal hotline numbers byte-for-byte intact
    assert(
      EMERGENCY_DATA[0].numbers[0] === "0929-183-8441" &&
        EMERGENCY_DATA[1].numbers[0] === "0998-598-5509" &&
        EMERGENCY_DATA[2].numbers[0] === "0946-451-2121" &&
        EMERGENCY_DATA[3].numbers[0] === "0931-793-8035",
      "All 4 municipal emergency hotline numbers are byte-for-byte unchanged"
    );

    // -------------------------------------------------------------------------
    // 3. Navigation Integrity: Government & Services Dropdowns
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Navigation Dropdowns Integrity ---");

    // 16. Government dropdown contains Barangay Emergency Hotlines
    const govDropdown = NAV_DROPDOWN_ITEMS["Government"];
    assert(
      govDropdown !== undefined && govDropdown.length === 3,
      "Government dropdown contains exactly 3 entries"
    );
    assert(
      govDropdown[0].title === "Municipal Officials" &&
        govDropdown[0].href === "/government/officials",
      "Government dropdown contains 'Municipal Officials' -> /government/officials"
    );
    assert(
      govDropdown[1].title === "All Municipal Offices" &&
        govDropdown[1].href === "/offices",
      "Government dropdown contains 'All Municipal Offices' -> /offices"
    );
    assert(
      govDropdown[2].title === "Barangay Emergency Hotlines" &&
        govDropdown[2].href === "/emergency-hotlines/barangays",
      "Government dropdown contains 'Barangay Emergency Hotlines' -> /emergency-hotlines/barangays"
    );

    // 17. Services -> Emergency Hotlines remains /#emergency-hotlines
    const servicesDropdown = NAV_DROPDOWN_ITEMS["Services"];
    const servicesEmergencyItem = servicesDropdown?.find(
      (item) => item.title === "Emergency Hotlines"
    );
    assert(
      servicesEmergencyItem !== undefined &&
        servicesEmergencyItem.href === "/#emergency-hotlines",
      "Services dropdown preserves 'Emergency Hotlines' -> /#emergency-hotlines"
    );

    // 18. Mobile and Desktop navigation inherit NAV_DROPDOWN_ITEMS
    const desktopNavContent = fs.readFileSync(
      "src/components/layout/desktop-navigation.tsx",
      "utf8"
    );
    const mobileNavContent = fs.readFileSync(
      "src/components/layout/mobile-navigation.tsx",
      "utf8"
    );
    assert(
      desktopNavContent.includes("NAV_DROPDOWN_ITEMS") &&
        mobileNavContent.includes("NAV_DROPDOWN_ITEMS"),
      "Both desktop and mobile navigation inherit NAV_DROPDOWN_ITEMS with Government additions"
    );

    // -------------------------------------------------------------------------
    // 4. Public BAC Navigation & Route
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Public BAC Navigation & Route ---");

    // 19. BAC public Transparency navigation
    const transparencyDropdown = NAV_DROPDOWN_ITEMS["Transparency"];
    const bacNavItem = transparencyDropdown?.find(
      (item) => item.href === "/transparency/bac"
    );
    assert(
      bacNavItem !== undefined &&
        bacNavItem.title === "Bids and Awards Committee (BAC)",
      "Public Transparency navigation includes 'Bids and Awards Committee (BAC)'"
    );

    // 20. /transparency/bac page exists
    const bacPageContent = fs.readFileSync(
      "src/app/(public)/transparency/bac/page.tsx",
      "utf8"
    );
    assert(
      bacPageContent.includes("Bids and Awards Committee (BAC)"),
      "Public route /transparency/bac page is implemented"
    );

    // 21. neutral BAC content
    const forbiddenClaims = [
      "BAC Chairperson",
      "BAC Vice Chairperson",
      "Secretariat Head",
      "Member 1",
      "Member 2",
    ];
    const hasForbiddenClaims = forbiddenClaims.some((claim) =>
      bacPageContent.includes(claim)
    );
    assert(
      !hasForbiddenClaims &&
        bacPageContent.includes("No BAC documents are currently published"),
      "Public BAC page maintains neutral municipal statements without invented members"
    );

    // -------------------------------------------------------------------------
    // 5. BAC Document Classification & Queries
    // -------------------------------------------------------------------------
    console.log("\n--- 5. BAC Document Classification & Query Invariants ---");

    // 22. controlled category exactly: "Bids and Awards Committee (BAC)"
    const EXACT_BAC_CATEGORY = "Bids and Awards Committee (BAC)";
    const categoriesList = DOCUMENT_CATEGORIES as readonly string[];
    assert(
      categoriesList.includes(EXACT_BAC_CATEGORY),
      "DOCUMENT_CATEGORIES includes exact controlled category 'Bids and Awards Committee (BAC)'"
    );
    assert(
      !categoriesList.includes("BAC") &&
        !categoriesList.includes("Bids and Awards Committee"),
      "DOCUMENT_CATEGORIES does NOT include ambiguous alternates ('BAC' or 'Bids and Awards Committee')"
    );

    // 23. BAC public query restricted to PUBLISHED + OTHER_PUBLIC_DOCUMENT
    assert(
      bacPageContent.includes('purpose: "OTHER_PUBLIC_DOCUMENT"') &&
        bacPageContent.includes('category: "Bids and Awards Committee (BAC)"'),
      "Public BAC page strictly queries purpose: OTHER_PUBLIC_DOCUMENT and category: 'Bids and Awards Committee (BAC)'"
    );

    // -------------------------------------------------------------------------
    // 6. BAC CMS Navigation & Administration
    // -------------------------------------------------------------------------
    console.log("\n--- 6. BAC CMS Navigation & Administration ---");

    // 24. BAC CMS navigation
    const transparencySection = ADMIN_NAV_CONFIG.find(
      (sec) => sec.key === "transparency"
    );
    const bacAdminNav = transparencySection?.items.find(
      (item) => item.id === "transparency-bac"
    );
    assert(
      bacAdminNav !== undefined &&
        bacAdminNav.href === "/admin/transparency/bac" &&
        bacAdminNav.label === "Bids and Awards Committee (BAC)",
      "CMS sidebar defines 'Bids and Awards Committee (BAC)' under Transparency"
    );

    // 25. /admin/transparency/bac page exists
    const adminBacPageContent = fs.readFileSync(
      "src/app/(cms)/admin/transparency/bac/page.tsx",
      "utf8"
    );
    assert(
      adminBacPageContent.includes("AdminBacListPage") &&
        adminBacPageContent.includes('category: "Bids and Awards Committee (BAC)"'),
      "CMS route /admin/transparency/bac page is implemented and filtered"
    );

    // 26. documents.view authorization
    assert(
      bacAdminNav?.requiredPermission === "documents.view",
      "CMS BAC navigation requires 'documents.view' permission"
    );

    // -------------------------------------------------------------------------
    // 7. BAC Create/Edit Workflow & Return Behavior
    // -------------------------------------------------------------------------
    console.log("\n--- 7. BAC Workflow & Classification Locks ---");

    const docFormContent = fs.readFileSync(
      "src/components/admin/document-form.tsx",
      "utf8"
    );
    const newDocPageContent = fs.readFileSync(
      "src/app/(cms)/admin/documents/new/page.tsx",
      "utf8"
    );
    const editDocPageContent = fs.readFileSync(
      "src/app/(cms)/admin/documents/[id]/edit/page.tsx",
      "utf8"
    );

    // 27. BAC create workflow classification lock
    assert(
      newDocPageContent.includes('defaultCategory = isBac') &&
        newDocPageContent.includes('Bids and Awards Committee (BAC)') &&
        newDocPageContent.includes('lockPurpose = isBac || isProcurement') &&
        newDocPageContent.includes('lockCategory = isBac || isProcurement'),
      "Create workflow locks purpose to OTHER_PUBLIC_DOCUMENT and category to 'Bids and Awards Committee (BAC)'"
    );

    // 28. BAC edit workflow classification lock
    assert(
      editDocPageContent.includes('doc.category === "Bids and Awards Committee (BAC)"') &&
        editDocPageContent.includes('lockPurpose = isBac || isProcurement') &&
        editDocPageContent.includes('lockCategory = isBac || isProcurement'),
      "Edit workflow locks classification for BAC documents"
    );

    // 29. returnTo BAC behavior
    assert(
      docFormContent.includes("returnTo=bac") &&
        docFormContent.includes("/admin/transparency/bac") &&
        docFormContent.includes("isBacFlow") &&
        newDocPageContent.includes("/admin/transparency/bac") &&
        newDocPageContent.includes('returnTo = isBac ? "bac"'),
      "DocumentForm correctly navigates and redirects back to /admin/transparency/bac on isBacFlow"
    );

    // 30. BAC uses existing documents.* permissions
    assert(
      adminBacPageContent.includes("PERMISSIONS.DOCUMENTS_VIEW") &&
        adminBacPageContent.includes("PERMISSIONS.DOCUMENTS_CREATE") &&
        adminBacPageContent.includes("PERMISSIONS.DOCUMENTS_UPDATE"),
      "BAC CMS management strictly reuses existing documents.* permissions"
    );

    // 31. no bac.* permission requirement
    const allPermissions = Object.values(PERMISSIONS);
    const hasBacPermissions = allPermissions.some((p) => p.startsWith("bac."));
    assert(
      !hasBacPermissions,
      "Zero bac.* permissions exist in PERMISSIONS registry"
    );

    // -------------------------------------------------------------------------
    // 8. Responsible Office Decoupling & Canonical Safety
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Responsible Office Decoupling & Canonical Safety ---");

    // 32. BAC is not a canonical Office in VERIFIED_MUNICIPAL_OFFICES
    const bacInCanonical = VERIFIED_MUNICIPAL_OFFICES.some(
      (o) =>
        o.slug === "bac" ||
        o.name.includes("Bids and Awards") ||
        o.slug.includes("bids-and-awards")
    );
    assert(
      !bacInCanonical,
      "BAC is NOT listed in VERIFIED_MUNICIPAL_OFFICES"
    );

    // 33. /offices remains exactly 18
    const canonicalOffices = getCanonicalOffices();
    assert(
      canonicalOffices.length === 18 && VERIFIED_MUNICIPAL_OFFICES.length === 18,
      "Canonical municipal offices count is strictly 18"
    );

    // 34. ICTO remains excluded
    const ictoInCanonical = canonicalOffices.some((o) => o.slug === "icto");
    assert(
      !ictoInCanonical,
      "Legacy ICTO is strictly excluded from canonical offices"
    );

    // -------------------------------------------------------------------------
    // 9. Coexistence & Regression Preservation
    // -------------------------------------------------------------------------
    console.log("\n--- 9. Feature Coexistence & Regression Preservation ---");

    // 35. Procurement remains intact
    const procurementAdminNav = transparencySection?.items.find(
      (item) => item.id === "transparency-procurement"
    );
    const procurementPublicNav = transparencyDropdown?.find(
      (item) => item.href === "/transparency/procurement"
    );
    assert(
      procurementAdminNav !== undefined && procurementPublicNav !== undefined,
      "Procurement remains fully active in both CMS and public Transparency navigation"
    );

    // 36. Tourism remains intact
    const tourismSection = ADMIN_NAV_CONFIG.find((sec) => sec.key === "content");
    const tourismAdminNav = tourismSection?.items.find(
      (item) => item.id === "tourism"
    );
    const tourismDropdown = NAV_DROPDOWN_ITEMS["Tourism"];
    assert(
      tourismAdminNav !== undefined &&
        tourismDropdown !== undefined &&
        tourismDropdown.length === 4,
      "Tourism CMS and public navigation (4 categories) remain completely intact"
    );

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n===============================================================");
  console.log(`PHASE 24 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase24TestSuite();
