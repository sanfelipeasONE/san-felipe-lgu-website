import * as fs from "fs";
import * as path from "path";
import assert from "assert";
import { MUNICIPAL_OFFICIALS_DATA } from "../src/config/officials-data";

function runPhase29Tests() {
  console.log("================================================================================");
  console.log("PHASE 29 TEST SUITE: Municipal Officials Portrait Sizing & Presentation");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ✗ FAIL: ${name} - ${(err as Error).message}`);
      failed++;
    }
  }

  const officialCardPath = path.join(process.cwd(), "src/components/officials/official-card.tsx");
  const officialCardCode = fs.readFileSync(officialCardPath, "utf-8");

  // 1. Component Image Containers and 3:4 Aspect Ratio
  console.log("\n--- 1. Portrait Containers & Aspect Ratio ---");

  test("ExecutiveOfficialCard uses aspect-3/4 without hardcoded height", () => {
    assert(
      officialCardCode.includes("aspect-3/4"),
      "ExecutiveOfficialCard must use aspect-3/4"
    );
    // Ensure old hardcoded h-40 and sm:h-44 are removed from portrait container
    assert(
      !officialCardCode.includes("w-32 h-40") && !officialCardCode.includes("sm:w-36 sm:h-44"),
      "Hardcoded height (h-40, sm:h-44) must be removed from ExecutiveOfficialCard portrait container"
    );
  });

  test("CouncilorCard uses aspect-3/4", () => {
    assert(
      officialCardCode.includes("w-full aspect-3/4"),
      "CouncilorCard must use full-width aspect-3/4 container"
    );
    assert(
      !officialCardCode.includes("aspect-4/5"),
      "Old aspect-4/5 must be completely removed from official-card.tsx"
    );
  });

  test("ExOfficioCard uses aspect-3/4 without hardcoded height", () => {
    assert(
      officialCardCode.includes("w-24 sm:w-28 aspect-3/4"),
      "ExOfficioCard must use responsive width with aspect-3/4"
    );
    assert(
      !officialCardCode.includes("h-28 sm:h-32"),
      "Hardcoded height (h-28, sm:h-32) must be removed from ExOfficioCard portrait container"
    );
  });

  // 2. Consistent Image Sizing & Object Fit / Position
  console.log("\n--- 2. Object Fit & Position Requirements ---");

  test("ExecutiveOfficialCard image uses w-full h-full object-cover object-top", () => {
    const executiveMatch = officialCardCode.match(/ExecutiveOfficialCard[\s\S]*?<Image[\s\S]*?\/>/);
    assert(executiveMatch, "ExecutiveOfficialCard must contain Image component");
    const imageSnippet = executiveMatch[0];
    assert(imageSnippet.includes("object-cover"), "Image must use object-cover");
    assert(imageSnippet.includes("object-top"), "Image must use object-top (center top)");
    assert(imageSnippet.includes("w-full"), "Image must use w-full (100% width)");
    assert(imageSnippet.includes("h-full"), "Image must use h-full (100% height)");
  });

  test("CouncilorCard image uses w-full h-full object-cover object-top", () => {
    const councilorMatch = officialCardCode.match(/CouncilorCard[\s\S]*?<Image[\s\S]*?\/>/);
    assert(councilorMatch, "CouncilorCard must contain Image component");
    const imageSnippet = councilorMatch[0];
    assert(imageSnippet.includes("object-cover"), "Councilor image must use object-cover");
    assert(imageSnippet.includes("object-top"), "Councilor image must use object-top (center top)");
    assert(!imageSnippet.includes("object-center"), "Councilor image must NOT use object-center");
    assert(imageSnippet.includes("w-full"), "Councilor image must use w-full");
    assert(imageSnippet.includes("h-full"), "Councilor image must use h-full");
  });

  test("ExOfficioCard image uses w-full h-full object-cover object-top", () => {
    const exOfficioMatch = officialCardCode.match(/ExOfficioCard[\s\S]*?<Image[\s\S]*?\/>/);
    assert(exOfficioMatch, "ExOfficioCard must contain Image component");
    const imageSnippet = exOfficioMatch[0];
    assert(imageSnippet.includes("object-cover"), "Ex-Officio image must use object-cover");
    assert(imageSnippet.includes("object-top"), "Ex-Officio image must use object-top (center top)");
    assert(!imageSnippet.includes("object-center"), "Ex-Officio image must NOT use object-center");
    assert(imageSnippet.includes("w-full"), "Ex-Officio image must use w-full");
    assert(imageSnippet.includes("h-full"), "Ex-Officio image must use h-full");
  });

  // 3. Data Integrity & Layout Preservation
  console.log("\n--- 3. Official Hierarchy & Data Preservation ---");

  test("Mayor and Vice Mayor names and positions preserved", () => {
    const { executive, legislative } = MUNICIPAL_OFFICIALS_DATA;
    assert.strictEqual(executive.mayor.name, "HON. REINHARD E. JERESANO");
    assert.strictEqual(executive.mayor.position, "Municipal Mayor");
    assert.strictEqual(legislative.viceMayor.name, "HON. MARY ANN R. QUIBA");
    assert(legislative.viceMayor.position.includes("Municipal Vice Mayor"));
  });

  test("Vice Mayor uses unique cache-safe official portrait filename", () => {
    const { legislative } = MUNICIPAL_OFFICIALS_DATA;
    assert.strictEqual(
      legislative.viceMayor.portrait.src,
      "/images/Hon. Mary Ann R. Quiba-official.jpg",
      "Vice Mayor portrait must use cache-safe -official.jpg filename"
    );
    const officialPath = path.join(process.cwd(), "public/images/Hon. Mary Ann R. Quiba-official.jpg");
    assert(fs.existsSync(officialPath), "Hon. Mary Ann R. Quiba-official.jpg must exist on disk");
    const legacyPath = path.join(process.cwd(), "public/images/Hon. Mary Ann R. Quiba.jpg");
    assert(fs.existsSync(legacyPath), "Hon. Mary Ann R. Quiba.jpg must remain available for backward compatibility");
  });

  test("All 8 regular councilors preserved in authoritative order", () => {
    const { legislative } = MUNICIPAL_OFFICIALS_DATA;
    assert.strictEqual(legislative.regularMembers.length, 8);
    const expectedCouncilors = [
      "HON. ROBERT R. TORRES",
      "HON. RONALD JETRO L. DE JESUS",
      "HON. SIR ALFRED A. ABILLE",
      "HON. ROSELYN MANGLICMOT",
      "HON. REX DANIEL A. ASUTILLA",
      "HON. RAMIL T. ABLIAN",
      "HON. RAY A. FRONDARINA",
      "HON. GARY MICHAEL P. FARIÑAS",
    ];
    legislative.regularMembers.forEach((member, i) => {
      assert.strictEqual(member.name, expectedCouncilors[i]);
    });
  });

  test("All 3 ex-officio members preserved", () => {
    const { legislative } = MUNICIPAL_OFFICIALS_DATA;
    assert.strictEqual(legislative.exOfficioMembers.length, 3);
    assert.strictEqual(legislative.exOfficioMembers[0].name, "HON. DANA F. DAMASO");
    assert.strictEqual(legislative.exOfficioMembers[1].name, "HON. IVER-SON G. ALCANTARA");
    assert.strictEqual(legislative.exOfficioMembers[2].name, "HON. NAPOLEON DOMINGO");
  });

  test("All 13 official portrait files exist on disk", () => {
    const { executive, legislative } = MUNICIPAL_OFFICIALS_DATA;
    const all = [
      executive.mayor,
      legislative.viceMayor,
      ...legislative.regularMembers,
      ...legislative.exOfficioMembers,
    ];
    assert.strictEqual(all.length, 13);
    all.forEach((official) => {
      const filePath = path.join(process.cwd(), "public", official.portrait.src);
      assert(fs.existsSync(filePath), `Portrait must exist: ${official.portrait.src}`);
      const stats = fs.statSync(filePath);
      assert(stats.size > 0, `Portrait must not be empty: ${official.portrait.src}`);
    });
  });

  // 4. Organizational Tree Layout Preservation
  console.log("\n--- 4. Organizational Tree Layout & Connectors ---");

  test("OrganizationalTree preserves connecting lines, badges, and layout hierarchy", () => {
    const treePath = path.join(process.cwd(), "src/components/officials/organizational-tree.tsx");
    const treeCode = fs.readFileSync(treePath, "utf-8");
    assert(treeCode.includes("LEGISLATIVE BRANCH &amp; PRESIDING OFFICER") || treeCode.includes("LEGISLATIVE BRANCH & PRESIDING OFFICER"));
    assert(treeCode.includes("SANGGUNIANG BAYAN - MEMBERS"));
    assert(treeCode.includes("EX-OFFICIO MEMBERS OF THE SANGGUNIANG BAYAN"));
    assert(treeCode.includes("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"));
  });

  console.log("\n================================================================================");
  console.log(`PHASE 29 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase29Tests();
