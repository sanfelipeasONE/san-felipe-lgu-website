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
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function runPhase27TestSuite() {
  console.log("================================================================================");
  console.log("PHASE 27 TEST SUITE: Barangay Directory, Transparency & Global Loading UX");
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

  try {
    const {
      AUTHORITATIVE_BARANGAYS,
      AUTHORITATIVE_BARANGAY_COUNT,
    } = await import("../src/config/barangays-data");
    const { EMERGENCY_DATA } = await import("../src/config/homepage-data");
    const { NAV_DROPDOWN_ITEMS } = await import("../src/config/site");
    const { ADMIN_NAV_CONFIG } = await import("../src/config/admin-navigation");
    const {
      VERIFIED_MUNICIPAL_OFFICES,
      getCanonicalOffices,
    } = await import("../src/config/offices-data");

    // =========================================================================
    // 1. Authoritative Barangay Directory (11 Barangays)
    // =========================================================================
    console.log("\n--- 1. Authoritative Barangay Directory (11 Barangays) ---");

    // 1. Exactly 11 barangays
    assert(
      AUTHORITATIVE_BARANGAYS.length === 11 && AUTHORITATIVE_BARANGAY_COUNT === 11,
      "AUTHORITATIVE_BARANGAYS defines exactly 11 barangays"
    );

    // 2. Exact authoritative names in alphabetical order
    const expectedBarangayNames = [
      "Amagna",
      "Apostol",
      "Balincaguing",
      "Farañal",
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
      "All 11 barangays match exact authoritative names in alphabetical order"
    );

    // 3. Sto. Niño spelling with ñ
    const stoNino = AUTHORITATIVE_BARANGAYS.find((b) => b.id === "sto-nino");
    assert(
      stoNino !== undefined && stoNino.name === "Sto. Niño" && stoNino.name.includes("ñ"),
      "Sto. Niño preserves exact spelling with 'ñ'"
    );

    // 4. Farañal spelling with ñ
    const faranal = AUTHORITATIVE_BARANGAYS.find((b) => b.id === "faranal");
    assert(
      faranal !== undefined && faranal.name === "Farañal" && faranal.name.includes("ñ"),
      "Farañal preserves exact spelling with 'ñ'"
    );

    // 5. Verified phone numbers populated for all 11
    const expectedHotlines: Record<string, string> = {
      amagna: "0963-585-6103",
      apostol: "0938-922-9295",
      balincaguing: "0977-081-4255",
      faranal: "0908-187-6380",
      feria: "0992-337-7881",
      maloma: "0929-587-7085",
      manglicmot: "0919-424-0540",
      rosete: "0939-724-1315",
      "san-rafael": "0912-454-3858",
      sindol: "0919-833-1239",
      "sto-nino": "0998-420-5352",
    };

    const allPhonesMatch = AUTHORITATIVE_BARANGAYS.every(
      (b) => b.phone === expectedHotlines[b.id]
    );
    assert(
      allPhonesMatch,
      "All 11 barangays have exact verified emergency hotline numbers"
    );

    // 6. Verified exact digits for all 11 hotlines
    const expectedDigits: Record<string, string> = {
      amagna: "09635856103",
      apostol: "09389229295",
      balincaguing: "09770814255",
      faranal: "09081876380",
      feria: "09923377881",
      maloma: "09295877085",
      manglicmot: "09194240540",
      rosete: "09397241315",
      "san-rafael": "09124543858",
      sindol: "09198331239",
      "sto-nino": "09984205352",
    };

    const allDigitsMatch = AUTHORITATIVE_BARANGAYS.every(
      (b) => b.phone?.replace(/\D/g, "") === expectedDigits[b.id]
    );
    assert(
      allDigitsMatch,
      "All 11 barangays have exact verified hotline digits"
    );

    const faranalDigits = faranal?.phone?.replace(/\D/g, "");
    assert(
      faranalDigits === "09081876380",
      "Farañal emergency hotline digits strictly equal 09081876380"
    );

    // 7. Verified Facebook links populated for all 11
    const expectedFacebooks: Record<string, string> = {
      amagna: "https://www.facebook.com/amagna.san.felipe.zambales",
      apostol: "https://www.facebook.com/share/18ZT5rhVPZ/?mibextid=wwXIfr",
      balincaguing: "https://www.facebook.com/share/1JrvnSo1T4/?mibextid=wwXIfr",
      faranal: "https://www.facebook.com/share/1UkVWYeaG9/?mibextid=wwXIfr",
      feria: "https://www.facebook.com/share/1DorigfCqP/?mibextid=wwXIfr",
      maloma: "https://www.facebook.com/share/17nUAPNkVR/?mibextid=wwXIfr",
      manglicmot: "https://www.facebook.com/share/1Ex5apzjgQ/?mibextid=wwXIfr",
      rosete: "https://www.facebook.com/barangayrosete",
      "san-rafael": "https://www.facebook.com/share/1HUpnaTBcV/?mibextid=wwXIfr",
      sindol: "https://www.facebook.com/share/1Gqhmi4QTR/?mibextid=wwXIfr",
      "sto-nino": "https://www.facebook.com/share/19stNKYaxV/?mibextid=wwXIfr",
    };

    const allFacebooksMatch = AUTHORITATIVE_BARANGAYS.every(
      (b) => b.facebook === expectedFacebooks[b.id]
    );
    assert(
      allFacebooksMatch,
      "All 11 barangays have exact verified Facebook URLs"
    );

    // 8. Specific Barangay Invariants: Amagna, Farañal, Sindol & Anti-Regression
    const amagna = AUTHORITATIVE_BARANGAYS.find((b) => b.id === "amagna");
    assert(
      amagna !== undefined && amagna.name === "Amagna",
      "Amagna exists in authoritative barangay directory"
    );

    const amunganExists = AUTHORITATIVE_BARANGAYS.some(
      (b) => b.name.toLowerCase().includes("amungan") || b.id.includes("amungan") || b.slug.includes("amungan")
    );
    assert(
      !amunganExists,
      "Amungan does NOT exist and does NOT replace Amagna"
    );

    assert(
      faranal !== undefined && faranal.name === "Farañal",
      "Farañal exists in authoritative barangay directory"
    );

    const sindol = AUTHORITATIVE_BARANGAYS.find((b) => b.id === "sindol");
    assert(
      sindol !== undefined && sindol.name === "Sindol",
      "Sindol exists in authoritative barangay directory"
    );

    assert(
      faranal?.facebook === "https://www.facebook.com/share/1UkVWYeaG9/?mibextid=wwXIfr",
      "Farañal Facebook URL strictly matches authoritative share URL"
    );
    assert(
      faranal?.facebook !== "https://www.facebook.com/barangayfaranal",
      "Farañal Facebook URL does NOT use unauthorized profile URL (barangayfaranal)"
    );

    const expectedTelHrefs: Record<string, string> = {
      amagna: "tel:09635856103",
      apostol: "tel:09389229295",
      balincaguing: "tel:09770814255",
      faranal: "tel:09081876380",
      feria: "tel:09923377881",
      maloma: "tel:09295877085",
      manglicmot: "tel:09194240540",
      rosete: "tel:09397241315",
      "san-rafael": "tel:09124543858",
      sindol: "tel:09198331239",
      "sto-nino": "tel:09984205352",
    };
    const allTelsMatch = AUTHORITATIVE_BARANGAYS.every(
      (b) => `tel:${b.phone?.replace(/\D/g, "")}` === expectedTelHrefs[b.id]
    );
    assert(
      allTelsMatch,
      "All 11 barangays resolve to exact authoritative tel: href values"
    );

    // 9. isContactProvided is true for all 11
    const allContactsActive = AUTHORITATIVE_BARANGAYS.every(
      (b) => b.isContactProvided === true
    );
    assert(
      allContactsActive,
      "All 11 barangays have isContactProvided: true"
    );

    // 10. Central hotlines preservation
    const mdrrmo = EMERGENCY_DATA.find((e) => e.office.includes("Disaster"));
    const pnp = EMERGENCY_DATA.find((e) => e.office.includes("Police"));
    const bfp = EMERGENCY_DATA.find((e) => e.office.includes("Fire"));
    const rhu = EMERGENCY_DATA.find((e) => e.office.includes("Health"));

    assert(
      mdrrmo?.numbers[0] === "0929-183-8441" &&
        pnp?.numbers[0] === "0998-598-5509" &&
        bfp?.numbers[0] === "0946-451-2121" &&
        rhu?.numbers[0] === "0931-793-8035",
      "Central municipal emergency hotlines (MDRRMO, PNP, BFP, RHU) are preserved byte-for-byte"
    );

    assert(
      mdrrmo?.numbers[0] !== "0968-301-4474",
      "MDRRMO hotline strictly does NOT use 0968-301-4474"
    );

    // 10. Barangay Directory public UI rendering
    const barangayPageCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/emergency-hotlines/barangays/page.tsx"),
      "utf8"
    );
    assert(
      barangayPageCode.includes("Showing") && (barangayPageCode.includes("11") || barangayPageCode.includes("AUTHORITATIVE_BARANGAY_COUNT")),
      "Barangay directory shows count of 11 barangays"
    );
    assert(
      />\s*Barangay\s*<\/th>/.test(barangayPageCode),
      "Table has 'Barangay' column header"
    );
    assert(
      />\s*Emergency Hotline\s*<\/th>/.test(barangayPageCode),
      "Table has 'Emergency Hotline' column header"
    );
    assert(
      />\s*Facebook Page\s*<\/th>/.test(barangayPageCode),
      "Table has 'Facebook Page' column header"
    );
    assert(
      barangayPageCode.includes('href={`tel:${brgy.phone') || barangayPageCode.includes("href={`tel:"),
      "Emergency hotline numbers render callable tel: links"
    );
    assert(
      barangayPageCode.includes('target="_blank"') &&
        barangayPageCode.includes('rel="noopener noreferrer"') &&
        barangayPageCode.includes("Visit Facebook Page"),
      "Facebook links render with target='_blank', rel='noopener noreferrer', and 'Visit Facebook Page' label"
    );

    // =========================================================================
    // 2. Homepage Section Order & Canonical Asset
    // =========================================================================
    console.log("\n--- 2. Homepage Section Order, Wordings & Canonical Asset ---");

    const homePageCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/page.tsx"),
      "utf8"
    );

    // 11. Homepage section sequence: Hero -> Government Programs -> Municipal Services
    const heroIdx = homePageCode.indexOf("<HeroSection />");
    const programsIdx = homePageCode.indexOf("<GovernmentPrograms />");
    const servicesIdx = homePageCode.indexOf("<GovernmentServices />");
    const officialsIdx = homePageCode.indexOf("<MunicipalOfficialsPreview />");
    const officesIdx = homePageCode.indexOf("<MunicipalOfficesPreview />");

    assert(
      heroIdx !== -1 && programsIdx !== -1 && servicesIdx !== -1,
      "Homepage contains HeroSection, GovernmentPrograms, and MunicipalServices"
    );
    assert(
      heroIdx < programsIdx && programsIdx < servicesIdx && servicesIdx < officialsIdx && officialsIdx < officesIdx,
      "Homepage order is strictly: Hero -> Government Programs & Online Services -> Municipal Services -> Officials -> Offices"
    );

    // 12. Municipal Services heading and eyebrow
    const govServicesCode = fs.readFileSync(
      path.join(process.cwd(), "src/components/home/government-services.tsx"),
      "utf8"
    );
    assert(
      govServicesCode.includes("Municipal Services"),
      "Municipal Services section heading is present in src/components/home/government-services.tsx"
    );
    assert(
      !govServicesCode.includes("Government Services"),
      "Old heading 'Government Services' is absent from src/components/home/government-services.tsx"
    );
    assert(
      govServicesCode.includes("PUBLIC SERVICES & ASSISTANCE"),
      "PUBLIC SERVICES & ASSISTANCE eyebrow is preserved in Municipal Services"
    );

    // 13. Canonical Transparency Seal asset exists and duplicate is absent
    const canonicalSealPath = path.join(process.cwd(), "public/images/transparency-seal.png");
    const duplicateSealPath = path.join(process.cwd(), "public/images/transparency-seal-160x160.png");

    assert(
      fs.existsSync(canonicalSealPath),
      "Canonical Transparency Seal exists at public/images/transparency-seal.png"
    );
    assert(
      !fs.existsSync(duplicateSealPath),
      "Duplicate transparency-seal-160x160.png is strictly absent from public/images/"
    );

    // 14. Homepage references canonical Transparency Seal
    const govProgramsCode = fs.readFileSync(
      path.join(process.cwd(), "src/components/home/government-programs.tsx"),
      "utf8"
    );
    assert(
      govProgramsCode.includes("/images/transparency-seal.png"),
      "GovernmentPrograms references canonical /images/transparency-seal.png"
    );
    assert(
      !govProgramsCode.includes("transparency-seal-160x160"),
      "GovernmentPrograms has zero references to transparency-seal-160x160"
    );

    // 15. Transparency Seal card destination is direct to /transparency/procurement
    assert(
      govProgramsCode.includes('href="/transparency/procurement"'),
      "Transparency Seal card links directly to /transparency/procurement"
    );
    assert(
      !govProgramsCode.includes('href="/transparency"'),
      "Transparency Seal card does NOT link to intermediate /transparency page"
    );
    assert(
      govProgramsCode.includes("Procurement &amp; Transparency") || govProgramsCode.includes("Procurement & Transparency"),
      "Transparency Seal card subtitle is 'Procurement & Transparency'"
    );
    assert(
      !govProgramsCode.includes("Procurement &amp; BAC") && !govProgramsCode.includes("Procurement & BAC"),
      "Transparency Seal card does NOT advertise BAC as separate public destination"
    );

    // 16. Four program/service links in GovernmentPrograms
    assert(
      govProgramsCode.includes("https://bpbc.ibpls.com/sanfelipezambales/login"),
      "iBPLS card links to authoritative https://bpbc.ibpls.com/sanfelipezambales/login"
    );
    assert(
      govProgramsCode.includes("https://www.foi.gov.ph/"),
      "Freedom of Information card links to https://www.foi.gov.ph/"
    );
    assert(
      govProgramsCode.includes('href="/gad"'),
      "GAD Corner card links to /gad"
    );

    // =========================================================================
    // 3. Transparency Landing & Navigation
    // =========================================================================
    console.log("\n--- 3. Transparency Landing & Navigation ---");

    // 17. Contact Us removed from Transparency dropdown
    const transparencyDropdown = NAV_DROPDOWN_ITEMS["Transparency"];
    const hasContactUsInTransparency = transparencyDropdown?.some(
      (item) => item.href.includes("contact") || item.title.includes("Contact")
    );
    assert(
      !hasContactUsInTransparency,
      "Transparency dropdown navigation strictly excludes 'Contact Us'"
    );

    // 18. BAC removed from Transparency dropdown
    const hasBacInTransparency = transparencyDropdown?.some(
      (item) => item.href.includes("bac") || item.title.includes("BAC") || item.title.includes("Bids and Awards")
    );
    assert(
      !hasBacInTransparency,
      "Transparency dropdown navigation strictly excludes 'Bids and Awards Committee (BAC)'"
    );

    // 19. Final Transparency dropdown items
    assert(
      transparencyDropdown !== undefined &&
        transparencyDropdown.length === 2 &&
        transparencyDropdown[0].title === "Procurement" &&
        transparencyDropdown[0].href === "/transparency/procurement" &&
        transparencyDropdown[1].title === "Journal and News" &&
        transparencyDropdown[1].href === "/news",
      "Transparency dropdown contains strictly Procurement and Journal and News"
    );

    // 20. Transparency landing page has Procurement as sole top-level card
    const transparencyPageCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/transparency/page.tsx"),
      "utf8"
    );
    assert(
      transparencyPageCode.includes('href="/transparency/procurement"'),
      "Transparency landing page features Procurement card"
    );
    assert(
      !transparencyPageCode.includes('href="/transparency/bac"'),
      "Transparency landing page strictly excludes BAC card"
    );
    assert(
      !transparencyPageCode.includes('contact-us') && !transparencyPageCode.includes('Contact Us'),
      "Transparency landing page strictly excludes Contact Us"
    );

    // 21. Public BAC route preserved
    const bacPageExists = fs.existsSync(
      path.join(process.cwd(), "src/app/(public)/transparency/bac/page.tsx")
    );
    assert(
      bacPageExists,
      "Existing public BAC route (/transparency/bac) is preserved"
    );

    // =========================================================================
    // 4. CMS Sidebar & Administration
    // =========================================================================
    console.log("\n--- 4. CMS Sidebar & Administration ---");

    // 22. CMS sidebar Transparency section contains ONLY Procurement
    const transparencyNavSection = ADMIN_NAV_CONFIG.find(
      (sec) => sec.key === "transparency"
    );
    assert(
      transparencyNavSection !== undefined && transparencyNavSection.items.length === 1,
      "CMS sidebar Transparency section contains exactly ONE item"
    );
    assert(
      transparencyNavSection?.items[0].id === "transparency-procurement" &&
        transparencyNavSection?.items[0].href === "/admin/transparency/procurement",
      "CMS sidebar Transparency item is strictly Procurement"
    );

    // 23. CMS sidebar does NOT contain standalone BAC navigation
    const bacSidebarItem = transparencyNavSection?.items.find(
      (item) => item.id === "transparency-bac"
    );
    assert(
      bacSidebarItem === undefined,
      "CMS sidebar strictly excludes standalone 'transparency-bac' item"
    );

    // 24. /admin/transparency/bac route remains implemented and protected
    const adminBacRouteExists = fs.existsSync(
      path.join(process.cwd(), "src/app/(cms)/admin/transparency/bac/page.tsx")
    );
    assert(
      adminBacRouteExists,
      "CMS route /admin/transparency/bac remains implemented on disk for direct/backward-compatible access"
    );

    // =========================================================================
    // 5. Procurement — Responsible Office Architecture & Migration #13
    // =========================================================================
    console.log("\n--- 5. Procurement — Responsible Office Architecture & Migration #13 ---");

    // 25. DocumentForm renders Responsible Office label for Procurement flow
    const docFormCode = fs.readFileSync(
      path.join(process.cwd(), "src/components/admin/document-form.tsx"),
      "utf8"
    );
    assert(
      docFormCode.includes('isProcurementFlow\n                ? "Responsible Office"') ||
        docFormCode.includes('isProcurementFlow ? "Responsible Office" : "Responsible Municipal Office"') ||
        docFormCode.includes('"Responsible Office"'),
      "DocumentForm renders 'Responsible Office' label for Procurement flow"
    );

    // 26. DocumentForm offers Bids and Awards Committee (BAC) as special authority option
    assert(
      docFormCode.includes('<option value="__BAC__">Bids and Awards Committee (BAC)</option>'),
      "DocumentForm offers 'Bids and Awards Committee (BAC)' as special authority option"
    );

    // 27. Artificial Mayor's Office fallback is removed from Procurement form
    assert(
      !docFormCode.includes('responsibleOffice === "__BAC__" ? (mayorOffice') &&
        !docFormCode.includes('officeId = mayorOffice'),
      "Artificial Mayor's Office fallback for BAC is strictly prohibited in document-form.tsx"
    );

    // 28. Admin Procurement page displays Responsible Office column
    const adminProcurementCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/(cms)/admin/transparency/procurement/page.tsx"),
      "utf8"
    );
    assert(
      adminProcurementCode.includes('header: "Responsible Office"'),
      "Admin Procurement table displays 'Responsible Office' column header"
    );

    // 29. Public Procurement page displays responsible office attribution cleanly
    const publicProcurementCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/transparency/procurement/page.tsx"),
      "utf8"
    );
    assert(
      publicProcurementCode.includes("doc.office.name") || publicProcurementCode.includes("doc.office?.name"),
      "Public Procurement page renders responsible office name cleanly"
    );

    // 30. Migration #13 exists and repository migration count is 13
    const migrationsDir = path.join(process.cwd(), "prisma/migrations");
    const migrationDirs = fs
      .readdirSync(migrationsDir)
      .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory());
    assert(
      migrationDirs.length === 13,
      `Prisma migrations count is strictly 13 (found ${migrationDirs.length})`
    );

    const migration13 = migrationDirs.find((d) => d.includes("make_document_office_optional"));
    assert(
      Boolean(migration13),
      "Migration #13 (make_document_office_optional) directory exists"
    );

    if (migration13) {
      const sqlContent = fs.readFileSync(
        path.join(migrationsDir, migration13, "migration.sql"),
        "utf8"
      );
      assert(
        sqlContent.includes('ALTER TABLE "documents" ALTER COLUMN "officeId" DROP NOT NULL;'),
        "Migration #13 SQL drops NOT NULL on documents.officeId"
      );
      assert(
        !sqlContent.includes("DROP CONSTRAINT") && !sqlContent.includes("DROP COLUMN"),
        "Migration #13 preserves foreign key and officeId column"
      );
    }

    // 31. Prisma schema datamodel defines optional officeId and office
    const schemaContent = fs.readFileSync(
      path.join(process.cwd(), "prisma/schema.prisma"),
      "utf8"
    );
    assert(
      /officeId\s+String\?/.test(schemaContent),
      "prisma/schema.prisma defines Document.officeId as optional String?"
    );
    assert(
      /office\s+Office\?/.test(schemaContent),
      "prisma/schema.prisma defines Document.office as optional Office?"
    );

    // =========================================================================
    // 6. Decoupling & Canonical Safety
    // =========================================================================
    console.log("\n--- 6. Decoupling & Canonical Safety ---");

    // 32. Exactly 18 canonical offices
    const canonicalOffices = getCanonicalOffices();
    assert(
      canonicalOffices.length === 18 && VERIFIED_MUNICIPAL_OFFICES.length === 18,
      "Canonical municipal offices count remains strictly 18"
    );

    // 33. No BAC Office
    const bacInOffices = VERIFIED_MUNICIPAL_OFFICES.some(
      (o) => o.slug === "bac" || o.name.toLowerCase().includes("bids and awards")
    );
    assert(
      !bacInOffices,
      "Zero BAC Office records in canonical municipal offices"
    );

    // 34. No Farañal Office
    const faranalInOffices = VERIFIED_MUNICIPAL_OFFICES.some(
      (o) => o.slug.includes("faranal") || o.name.toLowerCase().includes("farañal")
    );
    assert(
      !faranalInOffices,
      "Zero Farañal Office records in canonical municipal offices"
    );

    // 35. No ICTO in canonical offices
    const ictoInOffices = canonicalOffices.some((o) => o.slug === "icto");
    assert(
      !ictoInOffices,
      "Legacy ICTO remains excluded from canonical municipal offices"
    );

    // =========================================================================
    // 7. Global Page Navigation Loading UX
    // =========================================================================
    console.log("\n--- 7. Global Page Navigation Loading UX ---");

    // 36. Public loading boundary exists
    const publicLoadingExists = fs.existsSync(
      path.join(process.cwd(), "src/app/(public)/loading.tsx")
    );
    assert(
      publicLoadingExists,
      "Public route loading boundary exists at src/app/(public)/loading.tsx"
    );

    // 37. CMS loading boundary exists
    const cmsAdminLoadingExists = fs.existsSync(
      path.join(process.cwd(), "src/app/(cms)/admin/loading.tsx")
    );
    const cmsLoadingExists = fs.existsSync(
      path.join(process.cwd(), "src/app/(cms)/loading.tsx")
    );
    assert(
      cmsAdminLoadingExists && cmsLoadingExists,
      "CMS route loading boundaries exist at src/app/(cms)/admin/loading.tsx and src/app/(cms)/loading.tsx"
    );

    // 38. Shared loading component exists
    const routeLoadingExists = fs.existsSync(
      path.join(process.cwd(), "src/components/ui/route-loading.tsx")
    );
    assert(
      routeLoadingExists,
      "Shared route loading component exists at src/components/ui/route-loading.tsx"
    );

    // 39. Accessible status semantics
    const routeLoadingCode = fs.readFileSync(
      path.join(process.cwd(), "src/components/ui/route-loading.tsx"),
      "utf8"
    );
    assert(
      routeLoadingCode.includes('role="status"') && routeLoadingCode.includes('aria-live="polite"'),
      "RouteLoading component implements role='status' and aria-live='polite'"
    );

    // 40. Screen-reader accessible announcement
    assert(
      routeLoadingCode.includes('sr-only'),
      "RouteLoading component provides sr-only text for screen readers"
    );

    // 41. Reduced-motion support
    assert(
      routeLoadingCode.includes("motion-reduce:animate-none"),
      "RouteLoading component implements motion-reduce:animate-none"
    );

    // 42. Approved municipal styling (burgundy & gold)
    assert(
      routeLoadingCode.includes("border-t-burgundy-700") &&
        routeLoadingCode.includes("border-r-gold-500"),
      "Public loading indicator uses approved municipal burgundy and gold styling"
    );

    // 43. Zero artificial delays
    assert(
      !routeLoadingCode.includes("setTimeout") && !routeLoadingCode.includes("setInterval"),
      "RouteLoading contains zero artificial timers or delays"
    );

    // 44. Zero package.json changes for loading
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    );
    assert(
      !packageJson.dependencies["nprogress"] &&
        !packageJson.dependencies["react-spinners"] &&
        !packageJson.dependencies["nextjs-toploader"],
      "No external loading packages added to package.json"
    );

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n================================================================================");
  console.log(`PHASE 27 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase27TestSuite();
