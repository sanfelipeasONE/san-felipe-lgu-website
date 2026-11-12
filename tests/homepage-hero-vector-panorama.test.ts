import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import assert from "assert";
import { ASSETS, ASSET_PROVENANCE } from "../src/config/assets";

function runHeroTests() {
  console.log("================================================================================");
  console.log("HOMEPAGE HERO TEST SUITE: Official Vector Panorama Redesign");
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

  const masterPath = path.join(process.cwd(), "public/images/San Felipe Tourism Vector Panorama.png");
  const derivativePath = path.join(process.cwd(), "public/images/san-felipe-tourism-vector-panorama-hero.webp");
  const heroComponentPath = path.join(process.cwd(), "src/components/home/hero-section.tsx");
  const homePagePath = path.join(process.cwd(), "src/app/(public)/page.tsx");

  console.log("\n--- 1. Source Asset Protection & Integrity ---");

  test("Master artwork exists and matches exact protected SHA-256 and byte size", () => {
    assert(fs.existsSync(masterPath), "Master artwork must exist at public/images/San Felipe Tourism Vector Panorama.png");
    const masterBuf = fs.readFileSync(masterPath);
    assert.strictEqual(masterBuf.length, 1789077, "Master artwork file size must be exactly 1,789,077 bytes");
    const hash = crypto.createHash("sha256").update(masterBuf).digest("hex");
    assert.strictEqual(
      hash.toLowerCase(),
      "97d3776a1187820d74621a995fc89b34f38a67213bbcb4df6f49e77d6ca101d0",
      "Master artwork SHA-256 must match exactly"
    );
  });

  console.log("\n--- 2. Optimized Derivative Asset Specification ---");

  test("Optimized derivative WebP exists with required size and hash", () => {
    assert(fs.existsSync(derivativePath), "Optimized derivative must exist at public/images/san-felipe-tourism-vector-panorama-hero.webp");
    const derivBuf = fs.readFileSync(derivativePath);
    assert(derivBuf.length > 150000 && derivBuf.length < 350000, `Derivative size (${derivBuf.length} bytes) is within expected WebP bounds`);
    const hash = crypto.createHash("sha256").update(derivBuf).digest("hex");
    assert.strictEqual(
      hash.toLowerCase(),
      "13af6e6bb06f9c553c18272c096f1d219ffc0ce74f0570368a473ea245e3d286",
      "Derivative SHA-256 must match verified build hash"
    );
  });

  console.log("\n--- 3. Asset Registry Configuration ---");

  test("ASSETS.hero.vectorPanorama is properly configured with client provenance and accurate alt text", () => {
    assert(ASSETS.hero.vectorPanorama, "vectorPanorama must be registered in ASSETS.hero");
    assert.strictEqual(
      ASSETS.hero.vectorPanorama.src,
      "/images/san-felipe-tourism-vector-panorama-hero.webp",
      "vectorPanorama.src must point to the optimized WebP derivative"
    );
    assert.strictEqual(
      ASSETS.hero.vectorPanorama.provenance,
      ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
      "Provenance must be VERIFIED_CLIENT_ASSET"
    );
    const alt = ASSETS.hero.vectorPanorama.alt.toLowerCase();
    assert(alt.includes("san felipe"), "Alt text must identify San Felipe");
    assert(alt.includes("coastal scenery"), "Alt text must accurately describe coastal scenery");
    assert(alt.includes("cultural activities"), "Alt text must accurately describe cultural activities");
    assert(alt.includes("municipal hall"), "Alt text must accurately describe Municipal Hall");
  });

  console.log("\n--- 4. Hero Component Structure & Responsive Design ---");

  test("HeroSection component implements directional scrim, responsive views, and branding", () => {
    const code = fs.readFileSync(heroComponentPath, "utf8");

    // Asset binding
    assert(code.includes("ASSETS.hero.vectorPanorama.src"), "HeroSection must use vectorPanorama.src as default imageSrc");
    assert(code.includes("ASSETS.hero.vectorPanorama.alt"), "HeroSection must use vectorPanorama.alt as default imageAlt");

    // Municipal branding & single smooth left-to-right gradient overlay
    assert(code.includes("bg-burgundy-950"), "HeroSection must use burgundy-950 base");
    assert(code.includes("border-gold-600"), "HeroSection must preserve border-b-4 border-gold-600");
    assert(code.includes("bg-gradient-to-r"), "HeroSection must use directional horizontal gradient");
    assert(code.includes("to-transparent"), "Directional gradient must fade to transparent to leave artwork visible");
    assert(!code.includes("bg-gradient-to-t"), "HeroSection must NOT contain a second overlay (bg-gradient-to-t is eliminated)");

    // Responsive desktop/tablet vs dedicated mobile presentation
    assert(code.includes("hidden sm:block"), "Must provide full-bleed presentation on sm and larger viewports");
    assert(code.includes("sm:hidden"), "Must provide dedicated responsive presentation below 640px");
    assert(code.includes("aspect-[2.71/1]"), "Mobile showcase must preserve active panorama aspect ratio");

    // Welcome message & institutional hierarchy
    assert(code.includes("Republic of the Philippines"), "Must preserve national heading");
    assert(code.includes("Province of Zambales"), "Must preserve provincial heading");
    assert(code.includes("Municipality of"), "Must preserve municipal heading line 1");
    assert(code.includes("San Felipe"), "Must preserve municipal name");
    assert(code.includes("Zambales"), "Must preserve Zambales label");

    // Call-to-action destinations
    assert(code.includes('href="#services"'), "Must preserve link to #services");
    assert(code.includes('href="/offices"'), "Must preserve link to /offices");
    assert(code.includes('href="/news"'), "Must provide link to canonical public /news route");
    assert(code.includes("Municipal Services"), "Must preserve Municipal Services button label");
    assert(code.includes("Municipal Offices"), "Must preserve Municipal Offices button label");
    assert(code.includes("News &amp; Updates") || code.includes("News & Updates"), "Must render News & Updates CTA button label");
    assert(code.includes("Newspaper"), "Must use Lucide Newspaper icon for News & Updates CTA");
    assert(code.includes("focus-visible:ring-gold-400"), "Must include visible keyboard-focus styling on News & Updates CTA");

    // Button placement ordering: services & offices row appears before news button
    const servicesIdx = code.indexOf('href="#services"');
    const officesIdx = code.indexOf('href="/offices"');
    const newsIdx = code.indexOf('href="/news"');
    assert(servicesIdx < newsIdx, "Municipal Services must precede News & Updates CTA");
    assert(officesIdx < newsIdx, "Municipal Offices must precede News & Updates CTA");
  });

  console.log("\n--- 5. Homepage Sequence Integrity ---");

  test("page.tsx preserves all existing homepage sections and ordering", () => {
    const homeCode = fs.readFileSync(homePagePath, "utf8");
    assert(homeCode.includes("<HeroSection />"), "page.tsx must render HeroSection");
    assert(homeCode.includes("<GovernmentPrograms />"), "page.tsx must preserve GovernmentPrograms");
    assert(homeCode.includes("<GovernmentServices />"), "page.tsx must preserve GovernmentServices");
    assert(homeCode.includes("<MunicipalOfficialsPreview />"), "page.tsx must preserve MunicipalOfficialsPreview");
    assert(homeCode.includes("<MunicipalOfficesPreview />"), "page.tsx must preserve MunicipalOfficesPreview");
    assert(homeCode.includes("<LatestNews />"), "page.tsx must preserve LatestNews");
    assert(homeCode.includes("<EmergencyHotlines />"), "page.tsx must preserve EmergencyHotlines");
    assert(homeCode.includes("<MunicipalContactSection />"), "page.tsx must preserve MunicipalContactSection");
  });

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runHeroTests();
