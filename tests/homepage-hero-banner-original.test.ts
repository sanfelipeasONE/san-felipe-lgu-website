import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import assert from "assert";
import { ASSETS, ASSET_PROVENANCE } from "../src/config/assets";

function runBannerOriginalTests() {
  console.log("================================================================================");
  console.log("HOMEPAGE HERO TEST SUITE: Official Banner Original Replacement");
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

  const sourcePath = path.join(process.cwd(), "public/images/Banner Original.jpg");
  const derivativePath = path.join(process.cwd(), "public/images/san-felipe-tourism-banner-original.webp");
  const heroComponentPath = path.join(process.cwd(), "src/components/home/hero-section.tsx");
  const homePagePath = path.join(process.cwd(), "src/app/(public)/page.tsx");

  console.log("\n--- 1. Source Asset Integrity ---");

  test("Source Banner Original.jpg exists and matches exact size and SHA-256", () => {
    assert(fs.existsSync(sourcePath), "Banner Original.jpg must exist on disk");
    const buf = fs.readFileSync(sourcePath);
    assert.strictEqual(buf.length, 327691, "Source file size must be 327,691 bytes");
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    assert.strictEqual(
      hash.toLowerCase(),
      "33dbf9a9231a71e43155d65d97ce02d894544d7b9a8850311f3c143809ae91b8",
      "Source SHA-256 must match exactly"
    );
  });

  console.log("\n--- 2. Optimized Derivative Asset Specification ---");

  test("Optimized derivative WebP exists with required size and hash", () => {
    assert(fs.existsSync(derivativePath), "san-felipe-tourism-banner-original.webp must exist on disk");
    const buf = fs.readFileSync(derivativePath);
    assert(buf.length > 200000 && buf.length < 350000, `WebP file size (${buf.length} bytes) is within expected bounds`);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    assert.strictEqual(
      hash.toLowerCase(),
      "277c50b496935873066cf876c0a8d53a740e7e7ca7325b1f0dfc333a08ba2b5c",
      "Derivative SHA-256 must match verified build hash"
    );
  });

  console.log("\n--- 3. Asset Registry Configuration ---");

  test("ASSETS.hero.bannerOriginal is configured with VERIFIED_CLIENT_ASSET provenance and descriptive alt", () => {
    assert(ASSETS.hero.bannerOriginal, "bannerOriginal must be registered in ASSETS.hero");
    assert.strictEqual(
      ASSETS.hero.bannerOriginal.src,
      "/images/san-felipe-tourism-banner-original.webp",
      "bannerOriginal.src must point to the optimized WebP derivative"
    );
    assert.strictEqual(
      ASSETS.hero.bannerOriginal.provenance,
      ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
      "Provenance must be VERIFIED_CLIENT_ASSET"
    );
    const alt = ASSETS.hero.bannerOriginal.alt.toLowerCase();
    assert(alt.includes("san felipe"), "Alt text must identify San Felipe");
    assert(alt.includes("coastal sunset") || alt.includes("sunset"), "Alt text must describe sunset");
    assert(alt.includes("cultural heritage") || alt.includes("cultural"), "Alt text must describe cultural heritage");
    assert(alt.includes("municipal hall"), "Alt text must describe Municipal Hall");
  });

  test("Previous vector panorama and aerial backdrop assets remain preserved", () => {
    assert(ASSETS.hero.vectorPanorama, "vectorPanorama must remain registered");
    assert(ASSETS.hero.aerialBackdrop, "aerialBackdrop must remain registered");
    assert(
      fs.existsSync(path.join(process.cwd(), "public", ASSETS.hero.vectorPanorama.src)),
      "Previous vector panorama WebP file must still exist on disk"
    );
  });

  console.log("\n--- 4. Hero Component Structure & Responsive Design ---");

  test("HeroSection component uses bannerOriginal as active default asset", () => {
    const code = fs.readFileSync(heroComponentPath, "utf8");

    assert(code.includes("ASSETS.hero.bannerOriginal.src"), "HeroSection must use bannerOriginal.src as default imageSrc");
    assert(code.includes("ASSETS.hero.bannerOriginal.alt"), "HeroSection must use bannerOriginal.alt as default imageAlt");

    // Scrim overlay: subtle left-to-right gradient fading to transparent
    assert(code.includes("bg-gradient-to-r"), "Must use horizontal directional gradient");
    assert(code.includes("to-transparent"), "Gradient must fade to transparent to leave artwork visible");
    assert(!code.includes("bg-gradient-to-t"), "Must not include top vignette overlay");

    // Responsive views
    assert(code.includes("hidden sm:block"), "Must provide full-bleed desktop/tablet view");
    assert(code.includes("sm:hidden"), "Must provide dedicated mobile showcase frame");

    // Call-to-actions
    assert(code.includes('href="#services"'), "Must preserve link to #services");
    assert(code.includes('href="/offices"'), "Must preserve link to /offices");
    assert(code.includes('href="/news"'), "Must provide link to /news");
    assert(code.includes("Municipal Services"), "Must preserve Municipal Services button label");
    assert(code.includes("Municipal Offices"), "Must preserve Municipal Offices button label");
    assert(code.includes("News &amp; Updates") || code.includes("News & Updates"), "Must render News & Updates CTA button label");
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

runBannerOriginalTests();
