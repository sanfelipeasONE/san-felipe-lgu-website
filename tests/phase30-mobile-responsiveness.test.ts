import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import assert from "assert";

function runMobileResponsivenessTests() {
  console.log("================================================================================");
  console.log("PHASE 30 TEST SUITE: Mobile Website Experience & Responsiveness Correction");
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

  const siteHeaderPath = path.join(process.cwd(), "src/components/layout/site-header.tsx");
  const mobileNavPath = path.join(process.cwd(), "src/components/layout/mobile-navigation.tsx");
  const heroComponentPath = path.join(process.cwd(), "src/components/home/hero-section.tsx");
  const officialsPreviewPath = path.join(process.cwd(), "src/components/home/municipal-officials-preview.tsx");
  const latestNewsPath = path.join(process.cwd(), "src/components/home/latest-news.tsx");
  const emergencyHotlinesPath = path.join(process.cwd(), "src/components/home/emergency-hotlines.tsx");

  console.log("\n--- 1. Global Mobile Header & Brand Identity ---");

  test("SiteHeader brand identity fits mobile viewports with min-w-0 and truncate", () => {
    const code = fs.readFileSync(siteHeaderPath, "utf8");
    assert(code.includes("min-w-0"), "Brand Link or text wrapper must have min-w-0");
    assert(code.includes("shrink"), "Brand Link must allow shrinking on narrow screens");
    assert(code.includes("truncate"), "Brand texts must have truncate class to prevent horizontal overflow");
    assert(code.includes("REPUBLIC OF THE PHILIPPINES"), "Must preserve national label");
    assert(code.includes("Municipality of San Felipe"), "Must preserve municipal name");
    assert(code.includes("PROVINCE OF ZAMBALES"), "Must preserve provincial label");
    assert(code.includes("<MobileNavigation />") || code.includes("<MobileNavigation"), "MobileNavigation must remain present");
  });

  test("SiteHeader preserves exact baseline Contact Us button styling and classes", () => {
    const code = fs.readFileSync(siteHeaderPath, "utf8");
    assert(code.includes('href="/#contact-us"'), "Contact Us link must target /#contact-us");
    assert(code.includes("px-2.5 sm:px-3 py-1.5"), "Contact Us button must preserve exact baseline padding");
    assert(code.includes("text-[11px] sm:text-xs font-bold uppercase tracking-wider"), "Contact Us button must preserve exact baseline typography");
    assert(code.includes("text-burgundy-900 border border-burgundy-800/30 bg-burgundy-50/50 hover:bg-burgundy-800 hover:text-white rounded-xs"), "Contact Us button must preserve exact baseline color scheme");
  });

  console.log("\n--- 2. Mobile Navigation Drawer Off-Screen Isolation ---");

  test("MobileNavigation drawer is invisible and pointer-events-none when closed", () => {
    const code = fs.readFileSync(mobileNavPath, "utf8");
    assert(code.includes("translate-x-full"), "Drawer must translate off-screen when closed");
    assert(code.includes("invisible"), "Drawer must be marked invisible when closed to prevent horizontal overflow");
    assert(code.includes("pointer-events-none"), "Drawer must disable pointer events when closed");
    assert(code.includes("aria-label"), "Hamburger button must have accessible aria-label");
    assert(code.includes("aria-expanded"), "Hamburger button must have aria-expanded attribute");
  });

  console.log("\n--- 3. Full-Width Immersive Mobile Hero Composition ---");

  test("HeroSection integrates original tourism banner as full-bleed backdrop across all viewports", () => {
    const code = fs.readFileSync(heroComponentPath, "utf8");
    assert(code.includes("ASSETS.hero.bannerOriginal.src"), "HeroSection must use bannerOriginal as default asset");
    assert(code.includes("ASSETS.hero.bannerOriginal.alt"), "HeroSection must use bannerOriginal descriptive alt text");
    assert(code.includes("hidden sm:block"), "Must provide full-bleed desktop/tablet view");
    assert(code.includes("sm:hidden"), "Must provide full-bleed mobile backdrop view");
    assert(code.includes("object-cover"), "Backdrop image must use object-cover");
    assert(code.includes("absolute inset-0"), "Backdrop must occupy full hero section");
  });

  test("HeroSection eliminates detached small banner card underneath text", () => {
    const code = fs.readFileSync(heroComponentPath, "utf8");
    // Ensure no second detached image element exists inside Container
    const matches = code.match(/<Image\b/g);
    // Exactly 2 Image occurrences: one for desktop/tablet backdrop, one for mobile backdrop
    assert.strictEqual(matches?.length, 2, "HeroSection must contain exactly backdrop images and no detached image card");
  });

  test("HeroSection implements controlled burgundy gradients for text readability", () => {
    const code = fs.readFileSync(heroComponentPath, "utf8");
    assert(code.includes("bg-gradient-to-r"), "Desktop backdrop must use directional horizontal gradient");
    assert(code.includes("bg-gradient-to-b"), "Mobile backdrop must use top-to-bottom directional contrast gradient");
    assert(code.includes("from-burgundy-950"), "Gradients must use burgundy-950 theme color");
  });

  test("HeroSection preserves all 3 CTA buttons with exact baseline styling", () => {
    const code = fs.readFileSync(heroComponentPath, "utf8");
    assert(code.includes('href="#services"'), "Must preserve link to #services");
    assert(code.includes('href="/offices"'), "Must preserve link to /offices");
    assert(code.includes('href="/news"'), "Must preserve link to /news");
    assert(code.includes("Municipal Services"), "Must preserve Municipal Services button label");
    assert(code.includes("Municipal Offices"), "Must preserve Municipal Offices button label");
    assert(code.includes("News &amp; Updates") || code.includes("News & Updates"), "Must render News & Updates CTA button label");

    // Exact button classes from commit 7389a077
    assert(
      code.includes("bg-white text-burgundy-900 hover:bg-gold-50 hover:text-burgundy-950 font-medium text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xs transition-all shadow-xs border border-white"),
      "Municipal Services button must preserve exact baseline classes"
    );
    assert(
      code.includes("bg-burgundy-950/70 hover:bg-burgundy-900 border border-white/75 hover:border-white text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xs transition-all shadow-2xs backdrop-blur-xs"),
      "Municipal Offices button must preserve exact baseline classes"
    );
    assert(
      code.includes("bg-burgundy-950/60 hover:bg-burgundy-900/90 border border-gold-500/60 hover:border-gold-400 text-gold-100 hover:text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xs transition-all shadow-2xs backdrop-blur-xs focus-visible:ring-gold-400"),
      "News & Updates button must preserve exact baseline classes"
    );
  });

  console.log("\n--- 4. Homepage Sections Responsive Width Compliance ---");

  test("MunicipalOfficialsPreview CTA preserves baseline styling with graceful text wrapping", () => {
    const code = fs.readFileSync(officialsPreviewPath, "utf8");
    assert(code.includes("whitespace-normal"), "Officials directory CTA must allow text wrapping on narrow screens");
    assert(code.includes("max-w-full"), "Officials directory CTA must not exceed container width");
    assert(code.includes("border-slate-300 text-gov-charcoal hover:border-burgundy-700 hover:text-burgundy-800 font-bold text-xs uppercase tracking-wider px-6 py-2.5 shadow-2xs"), "Must preserve exact baseline button styling");
  });

  test("LatestNews CTA link preserves exact baseline styling", () => {
    const code = fs.readFileSync(latestNewsPath, "utf8");
    assert(code.includes("inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-burgundy-700 hover:text-burgundy-900 focus-visible:outline-none focus-visible:underline transition-colors shrink-0 group"), "LatestNews CTA must preserve exact baseline classes");
  });

  test("EmergencyHotlines CTA button preserves exact baseline styling", () => {
    const code = fs.readFileSync(emergencyHotlinesPath, "utf8");
    assert(code.includes("inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xs bg-gold-600 hover:bg-gold-500 text-burgundy-950 transition-colors shrink-0 shadow-2xs"), "EmergencyHotlines CTA must preserve exact baseline classes");
  });

  console.log("\n--- 5. Phase 30.1 Dedicated Mobile Homepage Background Artwork ---");

  test("User-provided mobile-bg.jpg exists with verified dimensions, size, and hash", () => {
    const mobileBgPath = path.join(process.cwd(), "public/images/mobile-bg.jpg");
    assert(fs.existsSync(mobileBgPath), "public/images/mobile-bg.jpg must exist");
    const buf = fs.readFileSync(mobileBgPath);
    assert.strictEqual(buf.length, 3496539, "mobile-bg.jpg must match exact byte size of 3,496,539");
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    assert.strictEqual(
      hash,
      "e9c01982338f7a18a792069d69f8be208ae721bcc1f275ab8345b7fff00b388c",
      "SHA-256 must match verified client asset"
    );
  });

  test("Optimized WebP derivative mobile-bg.webp exists", () => {
    const webpPath = path.join(process.cwd(), "public/images/mobile-bg.webp");
    assert(fs.existsSync(webpPath), "public/images/mobile-bg.webp must exist");
    const buf = fs.readFileSync(webpPath);
    assert(buf.length > 500000 && buf.length < 1500000, "WebP file size must be within expected bounds");
  });

  test("ASSETS.hero.mobileBackground is registered with VERIFIED_CLIENT_ASSET", () => {
    const assetsPath = path.join(process.cwd(), "src/config/assets.ts");
    const assetsCode = fs.readFileSync(assetsPath, "utf8");
    assert(assetsCode.includes("mobileBackground:"), "assets.ts must define mobileBackground");
    assert(assetsCode.includes("/images/mobile-bg.jpg"), "assets.ts must reference /images/mobile-bg.jpg");
    assert(assetsCode.includes("VERIFIED_CLIENT_ASSET"), "Provenance must be VERIFIED_CLIENT_ASSET");
  });

  test("HeroSection uses mobileBackground as dedicated mobile backdrop", () => {
    const code = fs.readFileSync(heroComponentPath, "utf8");
    assert(code.includes("ASSETS.hero.mobileBackground.src"), "HeroSection must use mobileBackground.src");
    assert(code.includes("mobileImageSrc"), "HeroSection must support mobileImageSrc prop");
    assert(code.includes("object-center"), "HeroSection mobile backdrop must be centered to showcase portrait artwork");
  });

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runMobileResponsivenessTests();
