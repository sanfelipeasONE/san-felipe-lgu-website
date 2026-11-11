import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { OFFICES_DATA } from "@/config/homepage-data";

async function runHomepageOfficesRedesignTests() {
  console.log("================================================================================");
  console.log("HOMEPAGE GOVERNMENT OFFICES SECTION REDESIGN TEST SUITE");
  console.log("================================================================================\n");

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

  const officeCardPath = path.join(process.cwd(), "src/components/home/office-card.tsx");
  const officeCardCode = fs.readFileSync(officeCardPath, "utf-8");

  const previewPath = path.join(process.cwd(), "src/components/home/municipal-offices-preview.tsx");
  const previewCode = fs.readFileSync(previewPath, "utf-8");

  // 1. Office Card Visual Redesign Invariants
  console.log("--- 1. Office Card Visual Redesign Invariants ---");

  test("OfficeCard has rounded corners (rounded-xl or rounded-2xl)", () => {
    assert(
      officeCardCode.includes("rounded-xl") || officeCardCode.includes("rounded-2xl"),
      "Card must feature rounded corners matching reference design"
    );
  });

  test("OfficeCard has subtle border and light background", () => {
    assert(officeCardCode.includes("border"), "Card must have border");
    assert(
      officeCardCode.includes("bg-slate-50") || officeCardCode.includes("bg-white") || officeCardCode.includes("bg-gray-50"),
      "Card must use white or very light gray background"
    );
  });

  test("OfficeCard contains short burgundy vertical accent on left edge", () => {
    assert(officeCardCode.includes("bg-burgundy-700"), "Accent must use San Felipe burgundy");
    assert(officeCardCode.includes("absolute left-0"), "Accent must be attached to the left edge");
    assert(
      officeCardCode.includes("top-1/2 -translate-y-1/2"),
      "Accent must be vertically centered"
    );
    assert(
      officeCardCode.includes("rounded-r-full") || officeCardCode.includes("rounded-full"),
      "Accent must have rounded ends"
    );
  });

  test("OfficeCard renders large, bold office name", () => {
    assert(officeCardCode.includes("font-bold"), "Office name must be bold");
    assert(
      officeCardCode.includes("text-base") || officeCardCode.includes("text-lg"),
      "Office name must use prominent text size"
    );
    assert(
      officeCardCode.includes("text-gov-charcoal") || officeCardCode.includes("text-gray-900"),
      "Office name must use black/charcoal text color"
    );
  });

  test("OfficeCard has comfortable internal padding", () => {
    assert(
      officeCardCode.includes("pl-7") || officeCardCode.includes("pl-8"),
      "Card must have left padding providing comfortable breathing room from vertical accent"
    );
    assert(
      officeCardCode.includes("py-6") || officeCardCode.includes("py-7"),
      "Card must have comfortable vertical padding"
    );
  });

  test("OfficeCard enforces consistent card height and vertical alignment", () => {
    assert(officeCardCode.includes("min-h-"), "Card must enforce min-height for uniform alignment");
    assert(officeCardCode.includes("flex items-center"), "Card must vertically center text");
  });

  // 2. Removal of Card Arrows
  console.log("\n--- 2. Removal of Card Arrows ---");

  test("Card strictly excludes arrow icons and directional symbols", () => {
    assert(!officeCardCode.includes("ArrowRight"), "ArrowRight icon must not be imported or rendered");
    assert(!officeCardCode.includes("ChevronRight"), "ChevronRight icon must not be rendered");
    assert(!officeCardCode.includes("→"), "Unicode arrow must not be rendered");
    assert(!officeCardCode.includes("lucide-react"), "OfficeCard should not import arrow icons");
  });

  test("OfficeCard strictly excludes acronym display per Phase 22 invariant", () => {
    assert(!officeCardCode.includes("office.acronym"), "office.acronym must not be rendered");
  });

  test("Entire card remains an accessible Link to /offices", () => {
    assert(officeCardCode.includes("<Link"), "Card must be wrapped in Link");
    assert(officeCardCode.includes('href="/offices"'), "Card link must navigate to /offices");
    assert(officeCardCode.includes("focus-visible:ring"), "Card must provide accessible focus-visible ring");
  });

  // 3. Homepage Section Structure & Responsive Grid
  console.log("\n--- 3. Homepage Section Structure & Responsive Grid ---");

  test("MunicipalOfficesPreview enforces 3-column desktop and responsive grid", () => {
    assert(previewCode.includes("lg:grid-cols-3"), "Must use 3 columns on desktop");
    assert(previewCode.includes("md:grid-cols-2"), "Must use 2 columns on tablet");
    assert(previewCode.includes("grid-cols-1"), "Must use 1 column on mobile");
  });

  test("Section preserves exact heading and descriptive text", () => {
    assert(previewCode.includes("DEPARTMENTS & FRONTLINE OFFICES"), "Eyebrow must be preserved");
    assert(previewCode.includes("Our Municipal Offices"), "Heading must be preserved");
    assert(previewCode.includes("Discover the functions and services"), "Description must be preserved");
  });

  test("View All Offices button is preserved and links to /offices", () => {
    assert(previewCode.includes("View All Offices"), "Button label must be preserved");
    assert(previewCode.includes('href="/offices"'), "Button link must navigate to /offices");
  });

  test("Homepage displays exactly 9 offices in authoritative order", () => {
    assert.strictEqual(OFFICES_DATA.length, 9, "Exactly 9 offices displayed on homepage preview");
    assert.strictEqual(OFFICES_DATA[0].name, "Office of the Mayor");
    assert.strictEqual(OFFICES_DATA[1].name, "Office of the Sangguniang Bayan");
    assert.strictEqual(OFFICES_DATA[2].name, "Municipal Planning and Development Office");
    assert.strictEqual(OFFICES_DATA[3].name, "Municipal Engineering Office");
    assert.strictEqual(OFFICES_DATA[4].name, "Municipal Treasury Office");
    assert.strictEqual(OFFICES_DATA[5].name, "Municipal Assessor’s Office");
    assert.strictEqual(OFFICES_DATA[6].name, "Municipal Social Welfare and Development Office");
    assert.strictEqual(OFFICES_DATA[7].name, "Municipal Health Office");
    assert.strictEqual(OFFICES_DATA[8].name, "Municipal Disaster Risk Reduction and Management Office");
  });

  // 4. Scope Isolation Verification
  console.log("\n--- 4. Scope Isolation Verification ---");

  test("/government/officials and /offices routes are untouched", () => {
    const officialsPage = fs.readFileSync(path.join(process.cwd(), "src/app/(public)/government/officials/page.tsx"), "utf-8");
    assert(officialsPage.includes("OrganizationalTree"), "Officials page must retain OrganizationalTree");

    const officesPage = fs.readFileSync(path.join(process.cwd(), "src/app/(public)/offices/page.tsx"), "utf-8");
    assert(officesPage.includes("OfficeDirectory"), "Offices page must retain OfficeDirectory");
  });

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runHomepageOfficesRedesignTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
