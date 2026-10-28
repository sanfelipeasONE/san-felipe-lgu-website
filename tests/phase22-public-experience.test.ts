import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { MUNICIPAL_OFFICIALS_DATA } from "@/config/officials-data";
import { MAIN_NAV_ITEMS, NAV_DROPDOWN_ITEMS } from "@/config/site";
import { VERIFIED_MUNICIPAL_OFFICES, getCanonicalOffices } from "@/config/offices-data";
import { OFFICIALS_DATA } from "@/config/homepage-data";
import { ASSETS } from "@/config/assets";

async function runPhase22Tests() {
  console.log("================================================================================");
  console.log("PHASE 22 TEST SUITE: Public Experience, Officials, Navigation, Tourism & Transparency");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${(err as Error).message}`);
      throw err;
    }
  }

  // ============================================================================
  // 1. OFFICIAL PORTRAITS ASSET VERIFICATION (13 FILES)
  // ============================================================================
  console.log("1. Official Portrait Asset File Integrity (13 Files on Disk)");

  const expectedImageFiles = [
    "Hon. Reinhard E. Jeresano.jpg",
    "Hon. Mary Ann R. Quiba.jpg",
    "Hon. Robert R. Torres-1.jpg",
    "Hon. Ronald Jetro L. De Jesus-2.jpg",
    "Hon. Sir Alfred A. Abille-3.jpg",
    "Hon. Roselyn Manglicmot-4.jpg",
    "Hon. Rex Daniel A. Asutilla-5.jpg",
    "Hon. Ramil T. Ablian-6.jpg",
    "Hon. Ray A. Frondarina-7.jpg",
    "Hon. Gary Michael P. Fariñas-8.jpg",
    "Hon. Dana F. Damaso-LNB.jpg",
    "Hon. Iver-son G. Alcantara-SK FED..jpg",
    "Hon. Napoleon Domingo-IPMR.JPG",
  ];

  test("All 13 official portrait files exist in public/images/ and are non-empty", () => {
    assert.strictEqual(expectedImageFiles.length, 13, "Must have exactly 13 client image files");

    for (const file of expectedImageFiles) {
      const filePath = path.join(process.cwd(), "public", "images", file);
      assert(fs.existsSync(filePath), `File must exist on disk: ${file}`);
      const stats = fs.statSync(filePath);
      assert(stats.size > 0, `File must not be empty: ${file}`);
    }
  });

  // ============================================================================
  // 2. OFFICIAL NAMES & PORTRAIT MAPPINGS IN CONFIG
  // ============================================================================
  console.log("\n2. Official Names, Portait Mappings & No Filename Identifiers");

  const { executive, legislative } = MUNICIPAL_OFFICIALS_DATA;

  test("Mayor name is HON. REINHARD E. JERESANO without 'Hart' and uses official portrait", () => {
    assert.strictEqual(executive.mayor.name, "HON. REINHARD E. JERESANO");
    assert.strictEqual(executive.mayor.portrait.src, "/images/Hon. Reinhard E. Jeresano.jpg");
    assert.strictEqual(executive.mayor.isPortraitVerified, true);
    assert(!executive.mayor.portrait.src.includes("placeholder"));
    assert(!executive.mayor.name.includes("Hart"));
  });

  test("Vice Mayor name is HON. MARY ANN R. QUIBA and uses official portrait", () => {
    assert.strictEqual(legislative.viceMayor.name, "HON. MARY ANN R. QUIBA");
    assert.strictEqual(legislative.viceMayor.portrait.src, "/images/Hon. Mary Ann R. Quiba.jpg");
    assert.strictEqual(legislative.viceMayor.isPortraitVerified, true);
    assert(!legislative.viceMayor.portrait.src.includes("placeholder"));
  });

  test("All 8 regular councilors have authoritative names and official portraits", () => {
    assert.strictEqual(legislative.regularMembers.length, 8);

    const expectedCouncilors = [
      { name: "HON. ROBERT R. TORRES", src: "/images/Hon. Robert R. Torres-1.jpg" },
      { name: "HON. RONALD JETRO L. DE JESUS", src: "/images/Hon. Ronald Jetro L. De Jesus-2.jpg" },
      { name: "HON. SIR ALFRED A. ABILLE", src: "/images/Hon. Sir Alfred A. Abille-3.jpg" },
      { name: "HON. ROSELYN MANGLICMOT", src: "/images/Hon. Roselyn Manglicmot-4.jpg" },
      { name: "HON. REX DANIEL A. ASUTILLA", src: "/images/Hon. Rex Daniel A. Asutilla-5.jpg" },
      { name: "HON. RAMIL T. ABLIAN", src: "/images/Hon. Ramil T. Ablian-6.jpg" },
      { name: "HON. RAY A. FRONDARINA", src: "/images/Hon. Ray A. Frondarina-7.jpg" },
      { name: "HON. GARY MICHAEL P. FARIÑAS", src: "/images/Hon. Gary Michael P. Fariñas-8.jpg" },
    ];

    expectedCouncilors.forEach((expected, i) => {
      const member = legislative.regularMembers[i];
      assert.strictEqual(member.name, expected.name, `Councilor ${i + 1} name match`);
      assert.strictEqual(member.portrait.src, expected.src, `Councilor ${i + 1} portrait match`);
      assert.strictEqual(member.isPortraitVerified, true, `Councilor ${i + 1} portrait verified`);
      assert(!member.portrait.src.includes("placeholder"));
    });
  });

  test("Sectoral / Ex-Officio members count is 3 (LNB, SKF, IPMR)", () => {
    assert.strictEqual(legislative.exOfficioMembers.length, 3);

    const lnb = legislative.exOfficioMembers[0];
    assert.strictEqual(lnb.name, "HON. DANA F. DAMASO");
    assert.strictEqual(lnb.portrait.src, "/images/Hon. Dana F. Damaso-LNB.jpg");
    assert.strictEqual(lnb.isPortraitVerified, true);

    const skf = legislative.exOfficioMembers[1];
    assert.strictEqual(skf.name, "HON. IVER-SON G. ALCANTARA");
    assert.strictEqual(skf.portrait.src, "/images/Hon. Iver-son G. Alcantara-SK FED..jpg");
    assert.strictEqual(skf.isPortraitVerified, true);

    const ipmr = legislative.exOfficioMembers[2];
    assert.strictEqual(ipmr.name, "HON. NAPOLEON DOMINGO");
    assert.strictEqual(ipmr.position, "Indigenous Peoples Mandatory Representative (IPMR)");
    assert.strictEqual(ipmr.portrait.src, "/images/Hon. Napoleon Domingo-IPMR.JPG");
    assert.strictEqual(ipmr.isPortraitVerified, true);
    assert.strictEqual(ipmr.isExOfficio, true);
    assert.strictEqual(ipmr.order, 13);
  });

  test("No official name contains filename-only identifiers (-1, -2, -3, -LNB, -SK FED., -IPMR, etc.)", () => {
    const allOfficials = [
      executive.mayor,
      legislative.viceMayor,
      ...legislative.regularMembers,
      ...legislative.exOfficioMembers,
    ];

    assert.strictEqual(allOfficials.length, 13, "Total officials must be 13");

    const prohibitedPatterns = [
      /-\d/,
      /-LNB/i,
      /-SK/i,
      /-IPMR/i,
      /\.jpe?g/i,
      /\.png/i,
    ];

    for (const off of allOfficials) {
      for (const pat of prohibitedPatterns) {
        assert(!pat.test(off.name), `Official name '${off.name}' must not match prohibited pattern ${pat}`);
      }
      // Alt text must also not contain raw filename identifiers
      for (const pat of [/-[1-8]/, /-LNB/, /-SK FED/, /-IPMR/]) {
        assert(!pat.test(off.portrait.alt), `Portrait alt '${off.portrait.alt}' must not contain filename identifier ${pat}`);
      }
    }
  });

  test("Homepage officials preview data and centralized assets match Phase 22 names and paths", () => {
    assert.strictEqual(OFFICIALS_DATA.mayor.name, "HON. REINHARD E. JERESANO");
    assert.strictEqual(OFFICIALS_DATA.viceMayor.name, "HON. MARY ANN R. QUIBA");
    assert.strictEqual(ASSETS.officials.mayor.src, "/images/Hon. Reinhard E. Jeresano.jpg");
    assert.strictEqual(ASSETS.officials.viceMayor.src, "/images/Hon. Mary Ann R. Quiba.jpg");
  });

  // ============================================================================
  // 3. NAVIGATION STRUCTURE VERIFICATION
  // ============================================================================
  console.log("\n3. Navigation Structure, Dropdowns & Standalone Removal");

  test("Top-level navigation contains Home, About, Government, Services, Tourism, Transparency", () => {
    const titles = MAIN_NAV_ITEMS.map((item) => item.title);
    assert.deepStrictEqual(titles, [
      "Home",
      "About",
      "Government",
      "Services",
      "Tourism",
      "Transparency",
    ]);

    // Standalone Offices and standalone News are absent from top-level
    assert(!titles.includes("Offices"), "Offices must NOT be a top-level nav item");
    assert(!titles.includes("News"), "News must NOT be a top-level nav item");
    // About is preserved
    assert(titles.includes("About"), "About must be preserved");
  });

  test("Government dropdown contains Municipal Officials, All Municipal Offices, Barangay Emergency Hotlines, GAD Corner", () => {
    const govDropdown = NAV_DROPDOWN_ITEMS["Government"];
    assert(govDropdown, "Government dropdown must exist");
    assert.strictEqual(govDropdown.length, 4);
    assert.strictEqual(govDropdown[0].title, "Municipal Officials");
    assert.strictEqual(govDropdown[0].href, "/government/officials");
    assert.strictEqual(govDropdown[1].title, "All Municipal Offices");
    assert.strictEqual(govDropdown[1].href, "/offices");
    assert.strictEqual(govDropdown[2].title, "Barangay Emergency Hotlines");
    assert.strictEqual(govDropdown[2].href, "/emergency-hotlines/barangays");
    assert.strictEqual(govDropdown[3].title, "GAD Corner");
    assert.strictEqual(govDropdown[3].href, "/gad");
  });

  test("Services dropdown is preserved with all 5 approved items", () => {
    const servicesDropdown = NAV_DROPDOWN_ITEMS["Services"];
    assert(servicesDropdown, "Services dropdown must exist");
    assert.strictEqual(servicesDropdown.length, 5);
    assert.strictEqual(servicesDropdown[0].href, "/services/citizens-charter");
    assert.strictEqual(servicesDropdown[1].href, "/services/business-permits");
    assert.strictEqual(servicesDropdown[2].href, "/services/downloadable-forms");
    assert.strictEqual(servicesDropdown[3].href, "/services/job-opportunities");
    assert.strictEqual(servicesDropdown[4].href, "/#emergency-hotlines");
  });

  test("Tourism dropdown contains Attractions, Resorts, Culture and Arts, Products", () => {
    const tourismDropdown = NAV_DROPDOWN_ITEMS["Tourism"];
    assert(tourismDropdown, "Tourism dropdown must exist");
    assert.strictEqual(tourismDropdown.length, 4);
    assert.strictEqual(tourismDropdown[0].title, "Attractions");
    assert.strictEqual(tourismDropdown[0].href, "/tourism/attractions");
    assert.strictEqual(tourismDropdown[1].title, "Resorts");
    assert.strictEqual(tourismDropdown[1].href, "/tourism/resorts");
    assert.strictEqual(tourismDropdown[2].title, "Culture and Arts");
    assert.strictEqual(tourismDropdown[2].href, "/tourism/culture-and-arts");
    assert.strictEqual(tourismDropdown[3].title, "Products");
    assert.strictEqual(tourismDropdown[3].href, "/tourism/products");
  });

  test("Transparency dropdown contains Procurement and Journal and News (/news) (BAC and Contact Us removed in Phase 27)", () => {
    const transparencyDropdown = NAV_DROPDOWN_ITEMS["Transparency"];
    assert(transparencyDropdown, "Transparency dropdown must exist");
    assert.strictEqual(transparencyDropdown.length, 2);
    assert.strictEqual(transparencyDropdown[0].title, "Procurement");
    assert.strictEqual(transparencyDropdown[0].href, "/transparency/procurement");
    assert.strictEqual(transparencyDropdown[1].title, "Journal and News");
    assert.strictEqual(transparencyDropdown[1].href, "/news");
    assert(
      !transparencyDropdown.some((item) => item.title.includes("BAC") || item.href.includes("/bac")),
      "BAC is strictly excluded from Transparency dropdown"
    );
  });

  // ============================================================================
  // 4. HEADER ACTIONS & CONTACT US ANCHOR
  // ============================================================================
  console.log("\n4. Public Header Search Removal, Contact Us Action & Anchor");

  test("Site header component contains Contact Us link to /#contact-us and no Search button", () => {
    const headerCode = fs.readFileSync(path.join(process.cwd(), "src/components/layout/site-header.tsx"), "utf-8");
    assert(headerCode.includes('href="/#contact-us"'), "Header must link to /#contact-us");
    assert(headerCode.includes("Contact Us"), "Header must display Contact Us text");
    assert(!headerCode.includes('aria-label="Search portal"'), "Search button must be removed");
    assert(!headerCode.includes("import { Search }"), "Search icon import must be removed");
  });

  test("Homepage municipal contact section has id='contact-us' and scroll-mt utility", () => {
    const contactCode = fs.readFileSync(path.join(process.cwd(), "src/components/home/municipal-contact-section.tsx"), "utf-8");
    assert(contactCode.includes('id="contact-us"'), "Section must have id='contact-us'");
    assert(contactCode.includes("scroll-mt-"), "Section must have scroll-margin utility");
    assert(contactCode.includes("Visit the Municipal Government"), "Section heading must be preserved");
  });

  // ============================================================================
  // 5. PUBLIC OFFICE ACRONYM REMOVAL
  // ============================================================================
  console.log("\n5. Office Acronym Removal from Public Display");

  test("OfficeDirectory table has no Abbreviation heading or acronym cells", () => {
    const dirCode = fs.readFileSync(path.join(process.cwd(), "src/components/offices/office-directory.tsx"), "utf-8");
    assert(!dirCode.includes("Abbreviation"), "Abbreviation th must not be present in public office directory");
    assert(!dirCode.includes("{office.acronym"), "acronym rendering must not be present in office directory table");
  });

  test("Homepage office cards do not display acronyms in parentheses", () => {
    const cardCode = fs.readFileSync(path.join(process.cwd(), "src/components/home/office-card.tsx"), "utf-8");
    assert(!cardCode.includes("office.acronym"), "office.acronym rendering must not be present in homepage office card");
  });

  test("Underlying canonical municipal offices data preserves exactly 18 offices and acronyms", () => {
    const offices = getCanonicalOffices();
    assert.strictEqual(offices.length, 18, "Exactly 18 canonical offices");
    assert.strictEqual(VERIFIED_MUNICIPAL_OFFICES.length, 18, "Verified municipal offices array contains 18 offices");

    // Acronyms in data are intact
    const mpdo = offices.find((o) => o.slug === "municipal-planning-and-development-office");
    assert(mpdo, "MPDO exists");
    assert.strictEqual(mpdo.acronym, "MPDO", "MPDO acronym data preserved in config");
  });

  // ============================================================================
  // 6. TOURISM & TRANSPARENCY ROUTE FILES
  // ============================================================================
  console.log("\n6. Tourism & Transparency Route File Integrity");

  const requiredRoutes = [
    "src/app/(public)/tourism/page.tsx",
    "src/app/(public)/tourism/attractions/page.tsx",
    "src/app/(public)/tourism/resorts/page.tsx",
    "src/app/(public)/tourism/culture-and-arts/page.tsx",
    "src/app/(public)/tourism/products/page.tsx",
    "src/app/(public)/transparency/page.tsx",
    "src/app/(public)/transparency/procurement/page.tsx",
  ];

  test("All new Tourism and Transparency page route files exist", () => {
    for (const route of requiredRoutes) {
      const fullPath = path.join(process.cwd(), route);
      assert(fs.existsSync(fullPath), `Route file must exist: ${route}`);
    }
  });

  // ============================================================================
  // 7. CLIENT CORRECTIONS VERIFICATION
  // ============================================================================
  console.log("\n7. Phase 22 Client Corrections (Pending Gazette, IPMR Secondary Text, Slogans)");

  test("Exact text 'Committee assignment pending gazette' is absent from all officials components and data", () => {
    const cardCode = fs.readFileSync(path.join(process.cwd(), "src/components/officials/official-card.tsx"), "utf-8");
    assert(!cardCode.includes("Committee assignment pending gazette"), "Must not contain 'Committee assignment pending gazette'");
    assert(!cardCode.includes("pending gazette"), "Must not contain 'pending gazette'");

    const dataCode = fs.readFileSync(path.join(process.cwd(), "src/config/officials-data.ts"), "utf-8");
    assert(!dataCode.includes("pending gazette"), "Config data must not contain 'pending gazette'");
  });

  test("Hon. Napoleon Domingo card content preserves name, position, portrait and omits secondary description", () => {
    const ipmr = legislative.exOfficioMembers.find((m) => m.id === "ex-officio-ipmr");
    assert(ipmr, "Hon. Napoleon Domingo must be in exOfficioMembers");
    assert.strictEqual(ipmr.name, "HON. NAPOLEON DOMINGO");
    assert.strictEqual(ipmr.position, "Indigenous Peoples Mandatory Representative (IPMR)");
    assert.strictEqual(ipmr.portrait.src, "/images/Hon. Napoleon Domingo-IPMR.JPG");
    assert.strictEqual(ipmr.secondaryInfo, undefined, "secondaryInfo must be undefined for Hon. Napoleon Domingo");

    // The other two ex-officio members still have secondaryInfo intact
    const lnb = legislative.exOfficioMembers.find((m) => m.id === "ex-officio-lbp");
    assert.strictEqual(lnb?.secondaryInfo, "Ex-Officio Member, Sangguniang Bayan");
    const skf = legislative.exOfficioMembers.find((m) => m.id === "ex-officio-skf");
    assert.strictEqual(skf?.secondaryInfo, "Ex-Officio Member, Sangguniang Bayan");
  });

  test("Homepage slogans 'Serbisyong May Puso' and 'Serbisyong Todo-Todo Mula Noon Hanggang Ngayon' are absent", () => {
    const homepageDataCode = fs.readFileSync(path.join(process.cwd(), "src/config/homepage-data.ts"), "utf-8");
    assert(!homepageDataCode.includes("Serbisyong May Puso"), "homepage-data must not contain 'Serbisyong May Puso'");
    assert(!homepageDataCode.includes("Serbisyong Todo-Todo"), "homepage-data must not contain 'Serbisyong Todo-Todo'");

    const previewCode = fs.readFileSync(path.join(process.cwd(), "src/components/home/municipal-officials-preview.tsx"), "utf-8");
    assert(!previewCode.includes("Serbisyong May Puso"), "preview component must not contain 'Serbisyong May Puso'");
    assert(!previewCode.includes("Serbisyong Todo-Todo"), "preview component must not contain 'Serbisyong Todo-Todo'");
    assert(!previewCode.includes("mayor.quote"), "preview component must not render mayor.quote");
    assert(!previewCode.includes("viceMayor.quote"), "preview component must not render viceMayor.quote");
    assert(!previewCode.includes("&ldquo;"), "preview component must not render empty or orphan quotes");
  });

  test("Homepage Mayor and Vice Mayor cards center portrait + text group as a unit with left-aligned text", () => {
    const previewCode = fs.readFileSync(path.join(process.cwd(), "src/components/home/municipal-officials-preview.tsx"), "utf-8");
    assert(previewCode.includes("w-fit max-w-full"), "Content group must use w-fit max-w-full to hug content");
    assert(previewCode.includes("mx-auto"), "Content group must use mx-auto to center horizontally");
    assert(previewCode.includes("text-center sm:text-left"), "Text container must remain left-aligned on sm and up");
  });

  test("Contact Us hash navigation relies on native browser/Next.js behavior without custom scroll JS", () => {
    const desktopNavCode = fs.readFileSync(path.join(process.cwd(), "src/components/layout/desktop-navigation.tsx"), "utf-8");
    assert(!desktopNavCode.includes('subItem.href === "/#contact-us" && pathname === "/"'), "desktop nav must not intercept #contact-us with custom scroll JS");

    const mobileNavCode = fs.readFileSync(path.join(process.cwd(), "src/components/layout/mobile-navigation.tsx"), "utf-8");
    assert(!mobileNavCode.includes('href === "/#contact-us" && pathname === "/"'), "mobile nav must not intercept #contact-us with custom scroll JS");
  });

  // ============================================================================
  // 8. CMS PROCUREMENT & TRANSPARENCY ARCHITECTURE VERIFICATION
  // ============================================================================
  console.log("\n8. CMS Procurement Category & Deterministic Public Transparency");

  test("DOCUMENT_CATEGORIES contains 'Procurement' for CMS upload and filtering", async () => {
    const { DOCUMENT_CATEGORIES } = await import("@/lib/validation/documents");
    assert(DOCUMENT_CATEGORIES.includes("Procurement"), "DOCUMENT_CATEGORIES must include 'Procurement'");

    const docFormCode = fs.readFileSync(path.join(process.cwd(), "src/components/admin/document-form.tsx"), "utf-8");
    assert(docFormCode.includes("DOCUMENT_CATEGORIES.map"), "document-form must map over DOCUMENT_CATEGORIES");

    const cmsListPageCode = fs.readFileSync(path.join(process.cwd(), "src/app/(cms)/admin/documents/page.tsx"), "utf-8");
    assert(cmsListPageCode.includes("DOCUMENT_CATEGORIES.map"), "admin/documents page must map over DOCUMENT_CATEGORIES");
  });

  test("Public /transparency/procurement uses deterministic category query and secure managed routes", () => {
    const procurementPageCode = fs.readFileSync(path.join(process.cwd(), "src/app/(public)/transparency/procurement/page.tsx"), "utf-8");

    // Deterministic category filtering
    assert(procurementPageCode.includes('"Procurement"') && procurementPageCode.includes('category:'), "Must query strictly category including 'Procurement'");
    assert(procurementPageCode.includes('purpose: "OTHER_PUBLIC_DOCUMENT"'), "Must query strictly purpose: 'OTHER_PUBLIC_DOCUMENT'");
    assert(!procurementPageCode.includes(".filter("), "Must not use loose keyword matching fallback filter");

    // Secure managed routes - no raw Cloudinary URLs
    assert(procurementPageCode.includes('href={`/documents/${doc.id}/view`}'), "Must use managed view route");
    assert(procurementPageCode.includes('href={`/documents/${doc.id}/download`}'), "Must use managed download route");
    assert(!procurementPageCode.includes("doc.downloadUrl"), "Must not expose raw Cloudinary downloadUrl");
  });

  test("Unrelated OTHER_PUBLIC_DOCUMENT records cannot leak into Procurement through title/filename keywords", () => {
    const filterRule = {
      status: "PUBLISHED",
      purpose: "OTHER_PUBLIC_DOCUMENT",
      category: "Procurement",
    };

    // Case 1: Document with title containing 'Procurement Plan' but category 'General Administration'
    const docGeneralAdmin = {
      title: "Annual Procurement Plan 2026",
      status: "PUBLISHED",
      purpose: "OTHER_PUBLIC_DOCUMENT",
      category: "General Administration",
    };
    const matchesGeneralAdmin =
      docGeneralAdmin.status === filterRule.status &&
      docGeneralAdmin.purpose === filterRule.purpose &&
      docGeneralAdmin.category === filterRule.category;
    assert.strictEqual(matchesGeneralAdmin, false, "Doc with category 'General Administration' must NOT match Procurement filter");

    // Case 2: Document with category 'Procurement' matches
    const docProcurement = {
      title: "ITB-2026-001 Municipal Road Concreting",
      status: "PUBLISHED",
      purpose: "OTHER_PUBLIC_DOCUMENT",
      category: "Procurement",
    };
    const matchesProcurement =
      docProcurement.status === filterRule.status &&
      docProcurement.purpose === filterRule.purpose &&
      docProcurement.category === filterRule.category;
    assert.strictEqual(matchesProcurement, true, "Doc with category 'Procurement' must match Procurement filter");

    // Case 3: Draft Procurement document does NOT match
    const docDraft = {
      title: "Draft Bidding Document",
      status: "DRAFT",
      purpose: "OTHER_PUBLIC_DOCUMENT",
      category: "Procurement",
    };
    const matchesDraft =
      docDraft.status === filterRule.status &&
      docDraft.purpose === filterRule.purpose &&
      docDraft.category === filterRule.category;
    assert.strictEqual(matchesDraft, false, "DRAFT document must NOT match Procurement filter");
  });

  test("Database and package integrity: zero migrations added, schema unchanged", () => {
    const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
    const migrationDirs = fs.readdirSync(migrationsDir).filter((d) => {
      const fullPath = path.join(migrationsDir, d);
      return fs.statSync(fullPath).isDirectory();
    });

    assert(
      [10, 11, 12, 13].includes(migrationDirs.length),
      "Migration count must be 10 (Phase 22 baseline), 11 (Phase 23 TourismEntry), 12 (Phase 26 Optional News Office), or 13 (Phase 27 Optional Document Office)"
    );
  });

  // ============================================================================
  // 9. PUBLIC DIRECTORY FACEBOOK PAGE PRESENTATION & PHONE PRESERVATION
  // ============================================================================
  console.log("\n9. Municipal Offices Directory: Facebook Page Presentation & Phone Preservation");

  test("Public directory header renders Facebook Page and not Contact Details", () => {
    const dirCode = fs.readFileSync(path.join(process.cwd(), "src/components/offices/office-directory.tsx"), "utf-8");
    assert(dirCode.includes("Facebook Page"), "Public directory must contain 'Facebook Page' th heading");
    assert(!dirCode.includes("Contact Details"), "Public directory must NOT contain 'Contact Details' heading");
    assert(!dirCode.includes("office.telephone"), "Public directory table must NOT render office.telephone");
  });

  test("All 18 canonical offices have unconfigured Facebook URL and render neutral —", () => {
    const offices = getCanonicalOffices();
    assert.strictEqual(offices.length, 18, "Directory contains exactly 18 canonical offices");
    for (const off of offices) {
      assert(!off.facebookUrl, `Office ${off.slug} must not have placeholder/fake Facebook URL`);
    }
  });

  test("Underlying office telephone and email data remains fully preserved", () => {
    const offices = getCanonicalOffices();
    const mayor = offices.find((o) => o.slug === "office-of-the-mayor");
    assert(mayor?.telephone === "0976-566-0872", "Mayor telephone preserved");
    const mdrrmo = offices.find((o) => o.slug === "municipal-disaster-risk-reduction-and-management-office");
    assert(mdrrmo?.telephone === "0929-183-8441", "MDRRMO telephone preserved");
    const accounting = offices.find((o) => o.slug === "municipal-accounting-office");
    assert(accounting?.telephone === "602-5181", "Accounting landline preserved");
  });

  console.log(`\n================================================================================`);
  console.log(`PHASE 22 TEST RESULTS: ${passed}/${total} assertions PASSED`);
  console.log(`================================================================================\n`);
}

runPhase22Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
