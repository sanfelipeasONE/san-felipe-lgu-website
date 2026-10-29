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

async function runPhase28TestSuite() {
  console.log("================================================================================");
  console.log("PHASE 28 TEST SUITE: Directory Typography & Action Refinement");
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
    const {
      VERIFIED_MUNICIPAL_OFFICES,
      getCanonicalOffices,
    } = await import("../src/config/offices-data");

    // =========================================================================
    // 1. Authoritative Barangay Directory & Data Freeze
    // =========================================================================
    console.log("\n--- 1. Authoritative Barangay Directory & Data Freeze ---");

    // 1. Exactly 11 barangays
    assert(
      AUTHORITATIVE_BARANGAYS.length === 11 && AUTHORITATIVE_BARANGAY_COUNT === 11,
      "AUTHORITATIVE_BARANGAYS defines exactly 11 barangays"
    );

    // 2. Exact authoritative names preserved
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
      "All 11 barangays match authoritative names in alphabetical order"
    );

    // 3. Amungan strictly absent
    const amunganFound = AUTHORITATIVE_BARANGAYS.some(
      (b) => b.name.toLowerCase().includes("amungan") || b.slug.includes("amungan") || b.id.includes("amungan")
    );
    assert(!amunganFound, "Amungan is strictly absent from directory");

    // 4. Farañal hotline and Facebook verified
    const faranal = AUTHORITATIVE_BARANGAYS.find((b) => b.id === "faranal");
    assert(
      faranal !== undefined &&
        faranal.phone === "0908-187-6380" &&
        faranal.phone.replace(/\D/g, "") === "09081876380" &&
        faranal.facebook === "https://www.facebook.com/share/1UkVWYeaG9/?mibextid=wwXIfr",
      "Farañal data is strictly verified (0908-187-6380, official share Facebook link)"
    );

    // 5. Sindol verified
    const sindol = AUTHORITATIVE_BARANGAYS.find((b) => b.id === "sindol");
    assert(
      sindol !== undefined &&
        sindol.phone === "0919-833-1239" &&
        sindol.phone.replace(/\D/g, "") === "09198331239" &&
        sindol.facebook === "https://www.facebook.com/share/1Gqhmi4QTR/?mibextid=wwXIfr",
      "Sindol data is strictly verified (0919-833-1239, official share Facebook link)"
    );

    // 6. All hotline digits, display numbers, tel hrefs, and Facebook URLs verified
    const authoritativeDataset: Array<{
      id: string;
      name: string;
      display: string;
      digits: string;
      tel: string;
      facebook: string;
    }> = [
      {
        id: "amagna",
        name: "Amagna",
        display: "0963-585-6103",
        digits: "09635856103",
        tel: "tel:09635856103",
        facebook: "https://www.facebook.com/amagna.san.felipe.zambales",
      },
      {
        id: "apostol",
        name: "Apostol",
        display: "0938-922-9295",
        digits: "09389229295",
        tel: "tel:09389229295",
        facebook: "https://www.facebook.com/share/18ZT5rhVPZ/?mibextid=wwXIfr",
      },
      {
        id: "balincaguing",
        name: "Balincaguing",
        display: "0977-081-4255",
        digits: "09770814255",
        tel: "tel:09770814255",
        facebook: "https://www.facebook.com/share/1JrvnSo1T4/?mibextid=wwXIfr",
      },
      {
        id: "faranal",
        name: "Farañal",
        display: "0908-187-6380",
        digits: "09081876380",
        tel: "tel:09081876380",
        facebook: "https://www.facebook.com/share/1UkVWYeaG9/?mibextid=wwXIfr",
      },
      {
        id: "feria",
        name: "Feria",
        display: "0992-337-7881",
        digits: "09923377881",
        tel: "tel:09923377881",
        facebook: "https://www.facebook.com/share/1DorigfCqP/?mibextid=wwXIfr",
      },
      {
        id: "maloma",
        name: "Maloma",
        display: "0929-587-7085",
        digits: "09295877085",
        tel: "tel:09295877085",
        facebook: "https://www.facebook.com/share/17nUAPNkVR/?mibextid=wwXIfr",
      },
      {
        id: "manglicmot",
        name: "Manglicmot",
        display: "0919-424-0540",
        digits: "09194240540",
        tel: "tel:09194240540",
        facebook: "https://www.facebook.com/share/1Ex5apzjgQ/?mibextid=wwXIfr",
      },
      {
        id: "rosete",
        name: "Rosete",
        display: "0939-724-1315",
        digits: "09397241315",
        tel: "tel:09397241315",
        facebook: "https://www.facebook.com/barangayrosete",
      },
      {
        id: "san-rafael",
        name: "San Rafael",
        display: "0912-454-3858",
        digits: "09124543858",
        tel: "tel:09124543858",
        facebook: "https://www.facebook.com/share/1HUpnaTBcV/?mibextid=wwXIfr",
      },
      {
        id: "sindol",
        name: "Sindol",
        display: "0919-833-1239",
        digits: "09198331239",
        tel: "tel:09198331239",
        facebook: "https://www.facebook.com/share/1Gqhmi4QTR/?mibextid=wwXIfr",
      },
      {
        id: "sto-nino",
        name: "Sto. Niño",
        display: "0998-420-5352",
        digits: "09984205352",
        tel: "tel:09984205352",
        facebook: "https://www.facebook.com/share/19stNKYaxV/?mibextid=wwXIfr",
      },
    ];

    authoritativeDataset.forEach((expected) => {
      const record = AUTHORITATIVE_BARANGAYS.find((b) => b.id === expected.id);
      assert(
        record !== undefined,
        `Barangay ${expected.name} exists in authoritative dataset`
      );
      assert(
        record?.name === expected.name,
        `Barangay ${expected.name} has exact name`
      );
      assert(
        record?.phone === expected.display,
        `Barangay ${expected.name} has exact display phone ${expected.display}`
      );
      assert(
        record?.phone?.replace(/\D/g, "") === expected.digits,
        `Barangay ${expected.name} has exact digits ${expected.digits}`
      );
      assert(
        `tel:${record?.phone?.replace(/\D/g, "")}` === expected.tel,
        `Barangay ${expected.name} resolves to exact ${expected.tel}`
      );
      assert(
        record?.facebook === expected.facebook,
        `Barangay ${expected.name} has exact authoritative Facebook URL`
      );
    });

    // 7. Central emergency hotlines preserved
    const { EMERGENCY_DATA } = await import("../src/config/homepage-data");
    const mdrrmo = EMERGENCY_DATA.find((e) => e.name.includes("MDRRMO"));
    const pnp = EMERGENCY_DATA.find((e) => e.name.includes("Police") || e.name.includes("Mps"));
    const bfp = EMERGENCY_DATA.find((e) => e.name.includes("Fire") || e.name.includes("BFP"));
    const rhu = EMERGENCY_DATA.find((e) => e.name.includes("RHU"));

    assert(
      mdrrmo?.numbers[0] === "0929-183-8441",
      "Central MDRRMO hotline strictly equals 0929-183-8441"
    );
    assert(
      pnp?.numbers[0] === "0998-598-5509",
      "Central PNP hotline strictly equals 0998-598-5509"
    );
    assert(
      bfp?.numbers[0] === "0946-451-2121",
      "Central BFP hotline strictly equals 0946-451-2121"
    );
    assert(
      rhu?.numbers[0] === "0931-793-8035",
      "Central RHU hotline strictly equals 0931-793-8035"
    );
    const staleMdrrmoFound = EMERGENCY_DATA.some((e) => e.numbers.includes("0968-301-4474"));
    assert(
      !staleMdrrmoFound,
      "Stale MDRRMO number 0968-301-4474 is strictly absent"
    );

    // =========================================================================
    // 2. Modern Barangay Directory: Action & Typography Refinements
    // =========================================================================
    console.log("\n--- 2. Modern Barangay Directory: Action & Typography Refinements ---");

    const brgyPageCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/emergency-hotlines/barangays/page.tsx"),
      "utf8"
    );

    // 7. Semantic table structure present
    assert(brgyPageCode.includes("<table"), "Barangay directory renders semantic <table>");
    assert(brgyPageCode.includes("<thead"), "Barangay directory renders semantic <thead>");
    assert(brgyPageCode.includes("<tbody"), "Barangay directory renders semantic <tbody>");
    assert(brgyPageCode.includes('scope="col"'), "Barangay directory renders accessible <th scope='col'>");

    // 8. Card grid and floating cards strictly removed
    assert(!brgyPageCode.includes("grid-cols-"), "Card grid classes (grid-cols-) strictly absent from Barangay page");

    // 9. Columns: Barangay, Emergency Hotline, Official Facebook
    assert(
      />\s*Barangay\s*<\/th>/.test(brgyPageCode),
      "Header defines 'Barangay' column"
    );
    assert(
      />\s*Emergency Hotline\s*<\/th>/.test(brgyPageCode),
      "Header defines 'Emergency Hotline' column"
    );
    assert(
      />\s*Official Facebook\s*<\/th>/.test(brgyPageCode),
      "Header defines 'Official Facebook' column"
    );

    // 10. Unsupported 24/7 claims removed
    assert(
      !brgyPageCode.includes("24/7 Active"),
      "'24/7 Active' badge strictly removed from barangay directory"
    );
    assert(
      !brgyPageCode.includes("Official 24/7 emergency response hotlines"),
      "Unsupported 'Official 24/7 emergency response hotlines' claim removed"
    );

    // 11. Redundant 'Call' button/action completely removed
    assert(
      !brgyPageCode.includes(">Call<") && !/>\s*Call\s*<\/a>/.test(brgyPageCode),
      "Redundant 'Call' button/badge is strictly removed"
    );

    // 12. Hotline presentation: phone icon + formatted number is sole clickable action
    assert(
      brgyPageCode.includes("<Phone") && (brgyPageCode.includes("{brgy.phone}") || brgyPageCode.includes("brgy.phone")),
      "Hotline displays Phone icon and formatted number"
    );
    assert(
      brgyPageCode.includes("href={telHref}") || brgyPageCode.includes('href={`tel:'),
      "Hotline number provides directly callable tel: link"
    );

    // 13. Lighter typography for barangay name, hotline, and Facebook
    assert(
      brgyPageCode.includes("font-medium text-gov-charcoal"),
      "Barangay name uses restrained font-medium weight (not heavy bold)"
    );
    assert(
      brgyPageCode.includes("font-medium text-burgundy-800"),
      "Hotline number uses restrained font-medium weight (not heavy bold)"
    );
    assert(
      brgyPageCode.includes("font-normal text-slate-600"),
      "Facebook link uses restrained font-normal weight"
    );

    // 14. Facebook link security attributes & external icon
    assert(
      brgyPageCode.includes("Facebook Page") &&
        brgyPageCode.includes('target="_blank"') &&
        brgyPageCode.includes('rel="noopener noreferrer"'),
      "Facebook link uses compact 'Facebook Page' label with security attributes"
    );
    assert(
      brgyPageCode.includes("<ExternalLink"),
      "Facebook link displays external link icon"
    );

    // 15. Header typography: font-semibold
    assert(
      brgyPageCode.includes("font-semibold uppercase tracking-wider text-white"),
      "Table header uses compact font-semibold uppercase labels"
    );

    // 16. Restrained summary header: quiet count
    assert(
      brgyPageCode.includes("({AUTHORITATIVE_BARANGAY_COUNT} barangays)") ||
        brgyPageCode.includes("(11 barangays)"),
      "Restrained count summary '(11 barangays)' displayed"
    );
    assert(
      brgyPageCode.includes("text-xs font-normal text-slate-500"),
      "Summary count uses muted font-normal styling"
    );

    // 17. Whitespace fix & clean semantics
    assert(
      !brgyPageCode.includes("min-h-[460px]"),
      "Artificial min-h-[460px] spacer strictly removed"
    );
    assert(
      brgyPageCode.includes("pt-6") && brgyPageCode.includes("pb-12"),
      "Restrained section padding applied to eliminate empty vertical gap"
    );
    assert(
      !brgyPageCode.includes("<main>"),
      "Nested <main> tag removed to ensure valid landmark hierarchy"
    );

    // =========================================================================
    // 3. Municipal Offices Directory & Data Freeze
    // =========================================================================
    console.log("\n--- 3. Municipal Offices Directory & Data Freeze ---");

    const offices = getCanonicalOffices();

    // 18. Exactly 18 canonical offices
    assert(
      offices.length === 18 && VERIFIED_MUNICIPAL_OFFICES.length === 18,
      "Municipal offices directory contains strictly 18 canonical offices"
    );

    // 19. Spurious and unauthorized offices absent
    const hasBac = offices.some((o) => o.name.toLowerCase().includes("bids and awards") || o.slug.includes("bac"));
    const hasIcto = offices.some((o) => o.slug === "icto" || o.name.includes("ICTO"));
    const hasFaranalOffice = offices.some((o) => o.name.toLowerCase().includes("farañal office") || o.slug.includes("faranal"));
    const hasMunAdmin = offices.some((o) => o.name.toLowerCase().includes("municipal administrator"));
    const hasGso = offices.some((o) => o.name.toLowerCase().includes("general services"));

    assert(!hasBac, "BAC Office is strictly absent from canonical offices");
    assert(!hasIcto, "ICTO is strictly absent from canonical offices");
    assert(!hasFaranalOffice, "Farañal Office is strictly absent from canonical offices");
    assert(!hasMunAdmin, "Office of the Municipal Administrator is strictly absent from canonical offices");
    assert(!hasGso, "General Services Office is strictly absent from canonical offices");

    // 20. Exact 18 canonical offices and heads verification
    const authoritativeOffices = [
      { order: 1, name: "Office of the Mayor", head: "HON. ENGR. REINHARD E. JERESANO" },
      { order: 2, name: "Office of the Sangguniang Bayan", head: "HON. MARY ANN R. QUIBA" },
      { order: 3, name: "Municipal Planning and Development Office", head: "FREDERICK F. TORRES" },
      { order: 4, name: "Municipal Health Office", head: "SALOME F. ARINDUQUE" },
      { order: 5, name: "Municipal Budget Office", head: "DAISY R. NERY" },
      { order: 6, name: "Municipal Accounting Office", head: "MICHELLE ANN N. CALLES" },
      { order: 7, name: "Municipal Treasury Office", head: "ELSIE C. ALIP" },
      { order: 8, name: "Municipal Assessor’s Office", head: "GERALDINE B. BADA" },
      { order: 9, name: "Municipal Social Welfare and Development Office", head: "ROWEL A. VILLANUEVA" },
      { order: 10, name: "Local Civil Registrar’s Office", head: "JEANELLENE R. SALES (OIC)" },
      { order: 11, name: "Municipal Engineering Office", head: "BENEDICT F. JADLOC" },
      { order: 12, name: "Municipal Agriculture Office", head: "JOHN REY F. FUNIESTAS (OIC)" },
      { order: 13, name: "Municipal Disaster Risk Reduction and Management Office", head: "RAYMOND F. DE JESUS" },
      { order: 14, name: "Municipal Tourism and Investments Promotions Office", head: "DWAIN O. DOCTANA" },
      { order: 15, name: "Local Youth Development Office", head: "ADRIAN LUKE R. GALLARDO" },
      { order: 16, name: "Municipal Ecological and Natural Resources Office", head: "ANDRE CARLO A. DASIG" },
      { order: 17, name: "Human Resource Management Office", head: "MERCEDES L. FORONDA" },
      { order: 18, name: "Public Employment Service Office", head: "FREDERICK F. TORRES" },
    ];

    authoritativeOffices.forEach((expected) => {
      const office = offices.find((o) => o.displayOrder === expected.order);
      assert(
        office !== undefined,
        `Office #${expected.order} (${expected.name}) exists in canonical list`
      );
      assert(
        office?.name === expected.name,
        `Office #${expected.order} matches name '${expected.name}'`
      );
      assert(
        office?.head === expected.head,
        `Office #${expected.order} head matches '${expected.head}'`
      );
    });

    // =========================================================================
    // 4. Modern Municipal Offices Row-and-Column: Action & Typography Refinements
    // =========================================================================
    console.log("\n--- 4. Modern Municipal Offices: Action & Typography Refinements ---");

    const officeDirCode = fs.readFileSync(
      path.join(process.cwd(), "src/components/offices/office-directory.tsx"),
      "utf8"
    );
    const officesPageCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/offices/page.tsx"),
      "utf8"
    );

    // 21. Semantic table structure present
    assert(officeDirCode.includes("<table"), "Office directory renders semantic <table>");
    assert(officeDirCode.includes("<thead"), "Office directory renders semantic <thead>");
    assert(officeDirCode.includes("<tbody"), "Office directory renders semantic <tbody>");
    assert(officeDirCode.includes('scope="col"'), "Office directory renders accessible <th scope='col'>");

    // 22. Card grid and floating cards strictly removed
    assert(!officeDirCode.includes("grid-cols-"), "Card grid classes (grid-cols-) strictly absent from Office directory");

    // 23. Columns: Office / Department, Office Head / OIC, Official Facebook
    assert(
      />\s*Office \/ Department\s*<\/th>/.test(officeDirCode),
      "Header defines 'Office / Department' column"
    );
    assert(
      />\s*Office Head \/ OIC\s*<\/th>/.test(officeDirCode),
      "Header defines 'Office Head / OIC' column"
    );
    assert(
      />\s*Official Facebook\s*<\/th>/.test(officeDirCode),
      "Header defines 'Official Facebook' column"
    );

    // 24. Lighter typography for office name
    assert(
      officeDirCode.includes("font-medium text-gov-charcoal text-xs sm:text-sm"),
      "Office name uses restrained font-medium weight (not heavy bold)"
    );

    // 25. Subtle directory index #{formattedNumber}
    assert(
      officeDirCode.includes("#{formattedNumber}") && officeDirCode.includes("font-normal"),
      "Directory index (#{formattedNumber}) displayed in subtle font-normal metadata"
    );

    // 26. Office acronyms strictly removed from public directory UI
    assert(
      !officeDirCode.includes("{office.acronym}") && !officeDirCode.includes("office.acronym"),
      "Office acronym expression strictly removed from office directory table"
    );
    const prohibitedAcronyms = [
      "MPDO",
      "MHO",
      "MBO",
      "MDRRMO",
      "LYDO",
      "HRMO",
      "PESO",
      "MACCO",
      "MTO",
      "MASSO",
      "MSWDO",
      "MEO",
      "MAO",
      "MCRO",
      "MENRO",
      "MHRMO",
      "GSO",
    ];
    const acronymsRendered = prohibitedAcronyms.some((acronym) =>
      new RegExp(`>\\s*${acronym}\\s*<`).test(officeDirCode)
    );
    assert(!acronymsRendered, "No prohibited secondary office acronym labels rendered in public UI");

    // 27. Office head typography: font-medium name with font-normal designation
    assert(
      officeDirCode.includes("font-medium text-gov-charcoal text-xs sm:text-[13px]"),
      "Office head name uses restrained font-medium weight"
    );
    assert(
      officeDirCode.includes("text-[11px] text-gov-muted font-normal"),
      "Official designation uses muted font-normal weight"
    );

    // 28. Clean omission of unconfigured Facebook links (no prominent em-dashes '—')
    assert(
      !officeDirCode.includes("—") && !officeDirCode.includes("&mdash;"),
      "Prominent em-dash '—' is eliminated from Facebook column"
    );
    assert(
      officeDirCode.includes("office.facebookUrl ?"),
      "Facebook link rendered only when valid URL exists"
    );
    assert(
      officeDirCode.includes("font-normal text-slate-600"),
      "Office Facebook link uses restrained font-normal weight"
    );

    // 29. Header typography: font-semibold
    assert(
      officeDirCode.includes("font-semibold uppercase tracking-wider text-white"),
      "Office table header uses compact font-semibold uppercase labels"
    );

    // 30. Restrained summary header: quiet count
    assert(
      officeDirCode.includes("({offices.length} municipal offices)") ||
        officeDirCode.includes("(18 municipal offices)"),
      "Restrained count summary '(18 municipal offices)' displayed"
    );
    assert(
      officeDirCode.includes("text-xs font-normal text-slate-500"),
      "Office summary count uses muted font-normal styling"
    );

    // 31. Whitespace fix in /offices page
    assert(
      officesPageCode.includes("pt-6") && officesPageCode.includes("pb-12"),
      "Offices page applies restrained section spacing to eliminate empty vertical gap"
    );
    assert(
      !officesPageCode.includes("<main"),
      "Offices page avoids nested <main> landmark"
    );

    // =========================================================================
    // 5. Database, Schema & Migration Freeze
    // =========================================================================
    console.log("\n--- 5. Database, Schema & Migration Freeze ---");

    const migrationsDir = path.join(process.cwd(), "prisma/migrations");
    const migrationFolders = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."));
    assert(
      migrationFolders.length === 13,
      `Prisma migrations count remains strictly 13 (found ${migrationFolders.length})`
    );

    const schemaContent = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
    assert(
      /officeId\s+String\?/.test(schemaContent),
      "prisma/schema.prisma preserves optional officeId on Document"
    );

    console.log("\n================================================================================");
    console.log(`PHASE 28 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test runner encountered an error:", error);
    process.exit(1);
  }
}

runPhase28TestSuite();
