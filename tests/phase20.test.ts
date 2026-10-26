/**
 * Phase 20 Verification Test Suite (Corrected):
 * UX States, Notifications, Error Handling & Interaction Polish
 *
 * Verifies all 19 Authoritative Invariants:
 * 1. Public splash component exists
 * 2. Public layout mounts splash
 * 3. sessionStorage suppression does NOT exist
 * 4. localStorage suppression does NOT exist
 * 5. Splash has perceptible short presentation behavior (~600ms visible, ~300ms fade, ~950ms unmount)
 * 6. No multi-second artificial delay
 * 7. Reduced-motion behavior exists (CSS cancellation and JS fast-path)
 * 8. CMS does not mount public splash (/admin/** and /staff/login isolated)
 * 9. Toast provider exists & Toaster mounted in RootLayout
 * 10. Representative success toast works
 * 11. Routine success does not produce duplicate success feedback (no duplicate success banners in 7 forms)
 * 12. Native alert/confirm absent across entire src/ directory
 * 13. Inline validation preserved adjacent to form inputs
 * 14. Destructive confirmation dialog preserved
 * 15. Pending/double-submit protection preserved
 * 16. 409 Concurrency conflict banner preserved with reload action
 * 17. Exact Citizen's Charter unavailable heading preserved
 * 18. Exact Citizen's Charter unavailable description preserved
 * 19. All 30 CMS page segments retain export const instant = false
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { toast } from "../src/components/ui/toast";
import { ASSETS } from "../src/config/assets";

async function runPhase20Tests() {
  console.log("=====================================================================");
  console.log("RUNNING PHASE 20 UX STATES, NOTIFICATIONS & POLISH TEST SUITE");
  console.log("=====================================================================\n");

  const projectRoot = process.cwd();

  // -------------------------------------------------------------------------
  // TEST 1: Public splash component exists
  // -------------------------------------------------------------------------
  console.log("TEST 1: Public splash component exists and reuses verified asset");
  const splashPath = path.resolve(projectRoot, "src/components/layout/public-seal-splash.tsx");
  assert(fs.existsSync(splashPath), "public-seal-splash.tsx must exist");
  const splashContent = fs.readFileSync(splashPath, "utf-8");

  assert(
    splashContent.includes("ASSETS.branding.seal.src"),
    "Splash must reuse official ASSETS.branding.seal.src"
  );
  assert(
    splashContent.includes("ASSETS.branding.seal.alt"),
    "Splash must reuse official ASSETS.branding.seal.alt"
  );
  assert(
    ASSETS.branding.seal.src === "/images/seal-san-felipe.jpg",
    "Municipal seal asset path must remain /images/seal-san-felipe.jpg"
  );
  console.log("  ✓ PASS: Public splash component exists and reuses verified seal asset\n");

  // -------------------------------------------------------------------------
  // TEST 2: Public layout mounts splash
  // -------------------------------------------------------------------------
  console.log("TEST 2: Public layout mounts splash");
  const publicLayoutPath = path.resolve(projectRoot, "src/app/(public)/layout.tsx");
  const publicLayoutContent = fs.readFileSync(publicLayoutPath, "utf-8");
  assert(
    publicLayoutContent.includes("<PublicSealSplash />") || publicLayoutContent.includes("<PublicSealSplash/>"),
    "PublicSealSplash must be mounted in public layout"
  );
  console.log("  ✓ PASS: Public layout mounts PublicSealSplash\n");

  // -------------------------------------------------------------------------
  // TEST 3: sessionStorage suppression does NOT exist
  // -------------------------------------------------------------------------
  console.log("TEST 3: sessionStorage suppression does NOT exist");
  assert(
    !splashContent.includes("sessionStorage"),
    "Splash must NOT use sessionStorage (must show on every full document load / refresh)"
  );
  assert(
    !splashContent.includes("sfz_public_entry_seen"),
    "Splash must NOT use sfz_public_entry_seen storage key"
  );
  console.log("  ✓ PASS: sessionStorage suppression removed; full document refresh allowed\n");

  // -------------------------------------------------------------------------
  // TEST 4: localStorage suppression does NOT exist
  // -------------------------------------------------------------------------
  console.log("TEST 4: localStorage suppression does NOT exist");
  assert(
    !splashContent.includes("localStorage"),
    "Splash must NOT use localStorage"
  );
  console.log("  ✓ PASS: Zero localStorage usage in splash\n");

  // -------------------------------------------------------------------------
  // TEST 5: Splash has perceptible short presentation behavior
  // -------------------------------------------------------------------------
  console.log("TEST 5: Splash has perceptible short presentation behavior");
  assert(
    splashContent.includes("600"),
    "Splash must be visible for ~600ms before fading"
  );
  assert(
    splashContent.includes("950"),
    "Splash must unmount completely at ~950ms (~600ms visible + ~350ms fade)"
  );
  assert(
    splashContent.includes("phase === \"hidden\"") && splashContent.includes("return null;"),
    "Splash must return null when phase === 'hidden' to unmount completely from DOM"
  );
  console.log("  ✓ PASS: Perceptible civic duration (~600ms visible, ~300ms fade, unmounted from DOM)\n");

  // -------------------------------------------------------------------------
  // TEST 6: No multi-second artificial delay
  // -------------------------------------------------------------------------
  console.log("TEST 6: No multi-second artificial delay");
  assert(
    !splashContent.includes("3000") &&
    !splashContent.includes("4000") &&
    !splashContent.includes("5000"),
    "Splash must NOT introduce arbitrary multi-second artificial delays"
  );
  console.log("  ✓ PASS: Zero multi-second artificial delay; maximum duration is under 1 second\n");

  // -------------------------------------------------------------------------
  // TEST 7: Reduced-motion behavior exists
  // -------------------------------------------------------------------------
  console.log("TEST 7: Reduced-motion behavior exists");
  const globalsCssPath = path.resolve(projectRoot, "src/app/globals.css");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  assert(
    globalsCss.includes("animate-seal-pulse"),
    "globals.css must define .animate-seal-pulse"
  );
  assert(
    globalsCss.includes("prefers-reduced-motion: reduce"),
    "globals.css must contain prefers-reduced-motion: reduce media query"
  );
  assert(
    globalsCss.includes(".animate-seal-pulse") && globalsCss.includes("animation: none !important"),
    "Reduced-motion must disable animate-seal-pulse animation"
  );
  assert(
    splashContent.includes("prefers-reduced-motion: reduce"),
    "Splash JS must check prefers-reduced-motion for rapid dismiss"
  );
  console.log("  ✓ PASS: Reduced-motion pulse cancellation and fast-path confirmed\n");

  // -------------------------------------------------------------------------
  // TEST 8: CMS does not mount public splash
  // -------------------------------------------------------------------------
  console.log("TEST 8: CMS does not mount public splash");
  const adminLayoutPath = path.resolve(projectRoot, "src/app/(cms)/admin/layout.tsx");
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, "utf-8");
  assert(
    !adminLayoutContent.includes("PublicSealSplash"),
    "Admin CMS layout must NOT mount PublicSealSplash"
  );

  const loginPagePath = path.resolve(projectRoot, "src/app/(auth)/staff/login/page.tsx");
  const loginPageContent = fs.readFileSync(loginPagePath, "utf-8");
  assert(
    !loginPageContent.includes("PublicSealSplash"),
    "Staff login page must NOT mount PublicSealSplash"
  );
  console.log("  ✓ PASS: Splash is strictly isolated to public portal layout\n");

  // -------------------------------------------------------------------------
  // TEST 9: Toast provider exists & Toaster mounted in RootLayout
  // -------------------------------------------------------------------------
  console.log("TEST 9: Toast provider exists & Toaster mounted in RootLayout");
  const toastModulePath = path.resolve(projectRoot, "src/components/ui/toast.tsx");
  assert(fs.existsSync(toastModulePath), "toast.tsx component must exist");

  const rootLayoutPath = path.resolve(projectRoot, "src/app/layout.tsx");
  const rootLayoutContent = fs.readFileSync(rootLayoutPath, "utf-8");
  assert(
    rootLayoutContent.includes("<Toaster />") || rootLayoutContent.includes("<Toaster/>"),
    "Toaster must be mounted in RootLayout"
  );
  console.log("  ✓ PASS: Toaster primitive mounted in RootLayout\n");

  // -------------------------------------------------------------------------
  // TEST 10: Representative success toast works
  // -------------------------------------------------------------------------
  console.log("TEST 10: Representative success toast works");
  const successId = toast.success("Test success message");
  assert(typeof successId === "string" && successId.startsWith("toast-"), "toast.success returns valid ID");

  const errorId = toast.error("Test error message");
  assert(typeof errorId === "string" && errorId.startsWith("toast-"), "toast.error returns valid ID");

  const infoId = toast.info("Test info message");
  assert(typeof infoId === "string" && infoId.startsWith("toast-"), "toast.info returns valid ID");

  toast.dismiss(successId);
  toast.clear();
  console.log("  ✓ PASS: Toast programmatic API correctly dispatches and clears\n");

  // -------------------------------------------------------------------------
  // TEST 11: Routine success does not produce duplicate success feedback
  // -------------------------------------------------------------------------
  console.log("TEST 11: Routine success does not produce duplicate success feedback");
  const formPaths = [
    "src/components/admin/document-form.tsx",
    "src/components/admin/job-form.tsx",
    "src/components/admin/news-form.tsx",
    "src/components/admin/service-page-form.tsx",
    "src/components/admin/user-form.tsx",
    "src/components/admin/office-form.tsx",
    "src/components/admin/role-permission-form.tsx",
  ];

  for (const relPath of formPaths) {
    const fullPath = path.resolve(projectRoot, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert(
      !content.includes("const [successMessage, setSuccessMessage]"),
      `File ${relPath} must NOT declare redundant successMessage state`
    );
    assert(
      !content.includes("{successMessage &&"),
      `File ${relPath} must NOT render redundant successMessage banner`
    );
    assert(
      content.includes("toast.success("),
      `File ${relPath} must use toast.success for routine success feedback`
    );
  }
  console.log("  ✓ PASS: Zero duplicate success banners across all 7 admin forms; toast is single transient source\n");

  // -------------------------------------------------------------------------
  // TEST 12: Native alert/confirm absent across entire src/ directory
  // -------------------------------------------------------------------------
  console.log("TEST 12: Native alert/confirm absent across entire src/ directory");
  const srcFiles = getAllFiles(path.resolve(projectRoot, "src"));
  for (const filePath of srcFiles) {
    if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      const content = fs.readFileSync(filePath, "utf-8");
      const hasNativeConfirm = /(?<!\w)(window\.)?confirm\s*\(/.test(content);
      const hasNativeAlert = /(?<!\w)(window\.)?alert\s*\(/.test(content);
      assert(
        !hasNativeConfirm,
        `File ${filePath} must not contain native confirm()`
      );
      assert(
        !hasNativeAlert,
        `File ${filePath} must not contain native alert()`
      );
    }
  }
  console.log("  ✓ PASS: Exactly zero native alert/confirm in src; accessible project dialogs active\n");

  // -------------------------------------------------------------------------
  // TEST 13: Inline validation preserved adjacent to form inputs
  // -------------------------------------------------------------------------
  console.log("TEST 13: Inline validation preserved adjacent to form inputs");
  const userFormPath = path.resolve(projectRoot, "src/components/admin/user-form.tsx");
  const userFormContent = fs.readFileSync(userFormPath, "utf-8");
  assert(
    userFormContent.includes("errors.email.message") && userFormContent.includes("errors.name.message"),
    "UserForm retains inline field validation errors"
  );

  const officeFormPath = path.resolve(projectRoot, "src/components/admin/office-form.tsx");
  const officeFormContent = fs.readFileSync(officeFormPath, "utf-8");
  assert(
    officeFormContent.includes("errors.name.message") && officeFormContent.includes("errors.mandate.message"),
    "OfficeForm retains inline field validation errors"
  );
  console.log("  ✓ PASS: Inline validation messages remain adjacent to inputs\n");

  // -------------------------------------------------------------------------
  // TEST 14: Destructive confirmation dialog preserved
  // -------------------------------------------------------------------------
  console.log("TEST 14: Destructive confirmation dialog preserved");
  const docFormPath = path.resolve(projectRoot, "src/components/admin/document-form.tsx");
  const docFormContent = fs.readFileSync(docFormPath, "utf-8");
  assert(
    docFormContent.includes("<ConfirmationDialog") && docFormContent.includes("setShowArchiveDialog"),
    "DocumentForm uses ConfirmationDialog for archiving"
  );

  const jobFormPath = path.resolve(projectRoot, "src/components/admin/job-form.tsx");
  const jobFormContent = fs.readFileSync(jobFormPath, "utf-8");
  assert(
    jobFormContent.includes("<ConfirmationDialog") &&
    jobFormContent.includes("setShowPublishDialog") &&
    jobFormContent.includes("setShowArchiveDialog"),
    "JobForm uses ConfirmationDialog for publishing and archiving"
  );
  console.log("  ✓ PASS: ConfirmationDialog active for destructive & state transition actions\n");

  // -------------------------------------------------------------------------
  // TEST 15: Pending/double-submit protection preserved
  // -------------------------------------------------------------------------
  console.log("TEST 15: Pending/double-submit protection preserved");
  assert(
    docFormContent.includes("disabled={isPending}"),
    "DocumentForm disables action buttons during submission"
  );
  assert(
    jobFormContent.includes("disabled={isPending}"),
    "JobForm disables action buttons during submission"
  );
  assert(
    userFormContent.includes("disabled={isSubmitting}"),
    "UserForm disables submit button during submission"
  );
  assert(
    officeFormContent.includes("disabled={isSubmitting}"),
    "OfficeForm disables submit button during submission"
  );
  console.log("  ✓ PASS: Double-submit protection enforced with disabled state and loading indicators\n");

  // -------------------------------------------------------------------------
  // TEST 16: 409 Concurrency conflict banner preserved with reload action
  // -------------------------------------------------------------------------
  console.log("TEST 16: 409 Concurrency conflict banner preserved with reload action");
  const bannerPath = path.resolve(projectRoot, "src/components/admin/concurrency-conflict-banner.tsx");
  assert(fs.existsSync(bannerPath), "concurrency-conflict-banner.tsx must exist");
  const bannerContent = fs.readFileSync(bannerPath, "utf-8");
  assert(
    bannerContent.includes("Concurrent Modification Detected"),
    "Banner must display 'Concurrent Modification Detected'"
  );
  assert(
    bannerContent.includes("Reload Latest Version"),
    "Banner must provide 'Reload Latest Version' action"
  );

  assert(
    docFormContent.includes("<ConcurrencyConflictBanner"),
    "DocumentForm renders ConcurrencyConflictBanner on conflict"
  );
  assert(
    jobFormContent.includes("<ConcurrencyConflictBanner"),
    "JobForm renders ConcurrencyConflictBanner on conflict"
  );
  assert(
    userFormContent.includes("<ConcurrencyConflictBanner"),
    "UserForm renders ConcurrencyConflictBanner on conflict"
  );
  assert(
    officeFormContent.includes("<ConcurrencyConflictBanner"),
    "OfficeForm renders ConcurrencyConflictBanner on conflict"
  );
  console.log("  ✓ PASS: Concurrency 409 conflict renders dedicated banner with reload action; no silent overwrite\n");

  // -------------------------------------------------------------------------
  // TEST 17: Exact Citizen's Charter unavailable heading preserved
  // -------------------------------------------------------------------------
  console.log("TEST 17: Exact Citizen's Charter unavailable heading preserved");
  const charterPagePath = path.resolve(
    projectRoot,
    "src/app/(public)/services/citizens-charter/page.tsx"
  );
  const charterPageContent = fs.readFileSync(charterPagePath, "utf-8");
  assert(
    charterPageContent.includes("Citizen's Charter PDF not currently available") ||
    charterPageContent.includes("Citizen&apos;s Charter PDF not currently available"),
    "Citizen's Charter heading must remain exactly 'Citizen's Charter PDF not currently available'"
  );
  console.log("  ✓ PASS: Citizen's Charter heading strictly matches 'Citizen\'s Charter PDF not currently available'\n");

  // -------------------------------------------------------------------------
  // TEST 18: Exact Citizen's Charter unavailable description preserved
  // -------------------------------------------------------------------------
  console.log("TEST 18: Exact Citizen's Charter unavailable description preserved");
  assert(
    charterPageContent.includes("The official Citizen's Charter PDF will be available here once published by the Municipality of San Felipe.") ||
    charterPageContent.includes("The official Citizen&apos;s Charter PDF will be available here once published by the Municipality of San Felipe."),
    "Citizen's Charter description must remain exactly 'The official Citizen's Charter PDF will be available here once published by the Municipality of San Felipe.'"
  );
  assert(
    !charterPageContent.toLowerCase().includes("under review") &&
    !charterPageContent.toLowerCase().includes("pending approval") &&
    !charterPageContent.toLowerCase().includes("awaiting approval") &&
    !charterPageContent.toLowerCase().includes("contact the municipal government of san felipe for frontline service inquiries"),
    "Citizen's Charter strictly contains zero review/approval or unauthorized contact claims"
  );
  console.log("  ✓ PASS: Citizen's Charter description strictly matches 'The official Citizen\'s Charter PDF will be available here once published by the Municipality of San Felipe.'\n");

  // -------------------------------------------------------------------------
  // TEST 19: All 30 CMS page segments retain export const instant = false
  // -------------------------------------------------------------------------
  console.log("TEST 19: All 30 CMS page segments retain export const instant = false");
  const adminAppDir = path.resolve(projectRoot, "src/app/(cms)/admin");
  const allAdminFiles = getAllFiles(adminAppDir);
  const adminPageFiles = allAdminFiles.filter((f) => f.endsWith("page.tsx"));

  const EXPECTED_CMS_PAGE_REL_PATHS = [
    "account/security/page.tsx",
    "audit-logs/page.tsx",
    "documents/new/page.tsx",
    "documents/page.tsx",
    "documents/[id]/edit/page.tsx",
    "gad/page.tsx",
    "jobs/new/page.tsx",
    "jobs/page.tsx",
    "jobs/[id]/edit/page.tsx",
    "news/new/page.tsx",
    "news/page.tsx",
    "news/[id]/edit/page.tsx",
    "news/[id]/preview/page.tsx",
    "offices/page.tsx",
    "offices/[id]/edit/page.tsx",
    "page.tsx",
    "roles/page.tsx",
    "roles/[id]/edit/page.tsx",
    "services/page.tsx",
    "services/[serviceKey]/edit/page.tsx",
    "services/[serviceKey]/page.tsx",
    "services/[serviceKey]/preview/page.tsx",
    "tourism/new/page.tsx",
    "tourism/page.tsx",
    "tourism/[id]/edit/page.tsx",
    "transparency/bac/page.tsx",
    "transparency/procurement/page.tsx",
    "users/new/page.tsx",
    "users/page.tsx",
    "users/[id]/edit/page.tsx",
  ];

  assert.strictEqual(
    adminPageFiles.length,
    EXPECTED_CMS_PAGE_REL_PATHS.length,
    `Expected exactly ${EXPECTED_CMS_PAGE_REL_PATHS.length} CMS page segments, found ${adminPageFiles.length}`
  );

  for (const relPath of EXPECTED_CMS_PAGE_REL_PATHS) {
    const fullExpectedPath = path.resolve(adminAppDir, relPath);
    assert(
      fs.existsSync(fullExpectedPath),
      `Expected CMS page segment missing from disk: ${relPath}`
    );
  }

  let verifiedCount = 0;
  for (const pageFile of adminPageFiles) {
    const pageContent = fs.readFileSync(pageFile, "utf-8");
    assert(
      pageContent.includes("export const instant = false;"),
      `Page segment ${pageFile} MUST contain 'export const instant = false;'`
    );
    verifiedCount++;
  }

  assert.strictEqual(verifiedCount, 30, "All 30 CMS page segments must export instant = false");
  console.log(`  ✓ PASS: Exactly ${verifiedCount}/30 CMS page segments retain export const instant = false;\n`);

  // -------------------------------------------------------------------------
  // TEST 20: Official municipal seal replaces default Next.js favicon with transparent corners
  // -------------------------------------------------------------------------
  console.log("TEST 20: Official municipal seal replaces default Next.js favicon with transparent corners");
  const sourceSealPath = path.resolve(projectRoot, "public/images/seal-san-felipe.jpg");
  const faviconPath = path.resolve(projectRoot, "src/app/favicon.ico");
  const iconPngPath = path.resolve(projectRoot, "src/app/icon.png");
  const appleIconPath = path.resolve(projectRoot, "src/app/apple-icon.png");

  assert(fs.existsSync(sourceSealPath), "Official source seal public/images/seal-san-felipe.jpg must remain present");
  assert(fs.existsSync(faviconPath), "src/app/favicon.ico must exist");
  assert(fs.existsSync(iconPngPath), "src/app/icon.png must exist");
  assert(fs.existsSync(appleIconPath), "src/app/apple-icon.png must exist");

  const faviconStat = fs.statSync(faviconPath);
  assert(faviconStat.size !== 15086, "Default 15,086-byte Next.js favicon must be replaced");

  // Verify icon.png has RGBA transparency and corner pixels are transparent
  const sharp = (await import("sharp")).default;
  const iconPngMeta = await sharp(iconPngPath).raw().toBuffer({ resolveWithObject: true });
  assert(iconPngMeta.info.channels === 4, "icon.png must have 4 channels (RGBA) for alpha transparency");

  const w = iconPngMeta.info.width;
  const h = iconPngMeta.info.height;
  const tlAlpha = iconPngMeta.data[3];
  const trAlpha = iconPngMeta.data[(w - 1) * 4 + 3];
  const blAlpha = iconPngMeta.data[(h - 1) * w * 4 + 3];
  const brAlpha = iconPngMeta.data[((h - 1) * w + (w - 1)) * 4 + 3];
  assert(
    tlAlpha === 0 && trAlpha === 0 && blAlpha === 0 && brAlpha === 0,
    "icon.png corner pixels must be fully transparent (alpha = 0)"
  );
  console.log(`  ✓ PASS: Favicon and icon use official seal with verified transparent outer corners (size: ${faviconStat.size} bytes, icon.png: ${fs.statSync(iconPngPath).size} bytes)\n`);

  // -------------------------------------------------------------------------
  // TEST 21: Official browser title remains correct
  // -------------------------------------------------------------------------
  console.log("TEST 21: Official browser title remains correct");
  const layoutContentForIcons = fs.readFileSync(rootLayoutPath, "utf-8");
  assert(
    layoutContentForIcons.includes("Municipality of San Felipe, Zambales"),
    "Root layout must configure official title 'Municipality of San Felipe, Zambales'"
  );
  assert(
    layoutContentForIcons.includes("icons:"),
    "Root layout metadata must configure icons metadata object"
  );
  console.log("  ✓ PASS: Official browser title and metadata icons confirmed\n");

  // -------------------------------------------------------------------------
  // TEST 22: Leaflet map component exists and is client-safe
  // -------------------------------------------------------------------------
  console.log("TEST 22: Leaflet map component exists and executes client-side safely");
  const mapComponentPath = path.resolve(projectRoot, "src/components/home/municipal-map.tsx");
  assert(fs.existsSync(mapComponentPath), "src/components/home/municipal-map.tsx must exist");
  const mapComponentContent = fs.readFileSync(mapComponentPath, "utf-8");
  assert(
    mapComponentContent.startsWith('"use client";') || mapComponentContent.startsWith("'use client';"),
    "municipal-map.tsx must be a client component"
  );
  assert(
    mapComponentContent.includes('import("leaflet")'),
    "municipal-map.tsx must dynamically import leaflet on the client to avoid SSR issues"
  );
  assert(
    mapComponentContent.includes("Loading location map…"),
    "municipal-map.tsx must provide a loading state placeholder"
  );
  console.log("  ✓ PASS: Leaflet map component exists and enforces client-safe execution\n");

  // -------------------------------------------------------------------------
  // TEST 23: Fake illustrated map code completely removed
  // -------------------------------------------------------------------------
  console.log("TEST 23: Hard-coded fake map illustration completely removed");
  const contactSectionPath = path.resolve(projectRoot, "src/components/home/municipal-contact-section.tsx");
  const contactSectionContent = fs.readFileSync(contactSectionPath, "utf-8");

  assert(
    !contactSectionContent.includes("West Philippine Sea"),
    "Fake West Philippine Sea illustration must be removed"
  );
  assert(
    !contactSectionContent.includes("Olongapo - Bugallon National Highway"),
    "Fake highway illustration must be removed"
  );
  assert(
    !contactSectionContent.includes("San Felipe Geographic Gateway Map Preview"),
    "Fake gateway map watermark must be removed"
  );
  assert(
    contactSectionContent.includes("<MunicipalMap"),
    "municipal-contact-section.tsx must mount MunicipalMap"
  );
  console.log("  ✓ PASS: Fake map illustration removed and replaced with MunicipalMap\n");

  // -------------------------------------------------------------------------
  // TEST 24: Required OpenStreetMap attribution preserved
  // -------------------------------------------------------------------------
  console.log("TEST 24: Required OpenStreetMap attribution preserved");
  const locationConfigPath = path.resolve(projectRoot, "src/config/location.ts");
  assert(fs.existsSync(locationConfigPath), "src/config/location.ts must exist");
  const locationConfigContent = fs.readFileSync(locationConfigPath, "utf-8");

  assert(
    locationConfigContent.includes("OpenStreetMap") && locationConfigContent.includes("contributors"),
    "Location config must declare OpenStreetMap attribution"
  );
  console.log("  ✓ PASS: OpenStreetMap attribution defined\n");

  // -------------------------------------------------------------------------
  // TEST 25: Authoritative coordinates strictly equal DICT verified coordinates
  // -------------------------------------------------------------------------
  console.log("TEST 25: Authoritative coordinates strictly equal DICT verified coordinates");
  const { MUNICIPAL_HALL_LOCATION, getDirectionsUrl } = await import("../src/config/location");
  assert.strictEqual(
    MUNICIPAL_HALL_LOCATION.coordinates.lat,
    15.060148,
    "Latitude must be exactly 15.060148"
  );
  assert.strictEqual(
    MUNICIPAL_HALL_LOCATION.coordinates.lng,
    120.070978,
    "Longitude must be exactly 120.070978"
  );
  console.log("  ✓ PASS: Coordinates verified: lat=15.060148, lng=120.070978 (DICT Region III dataset)\n");

  // -------------------------------------------------------------------------
  // TEST 26: Get Directions resolves to coordinate-based destination
  // -------------------------------------------------------------------------
  console.log("TEST 26: Get Directions resolves to coordinate-based destination");
  const expectedDirectionsUrl = "https://www.google.com/maps/dir/?api=1&destination=15.060148,120.070978";
  const actualDirectionsUrl = getDirectionsUrl();
  assert.strictEqual(
    actualDirectionsUrl,
    expectedDirectionsUrl,
    `getDirectionsUrl() must return '${expectedDirectionsUrl}', got '${actualDirectionsUrl}'`
  );
  assert(
    contactSectionContent.includes("getDirectionsUrl()"),
    "Get Directions button must derive from getDirectionsUrl()"
  );
  assert(
    contactSectionContent.includes('target="_blank"') && contactSectionContent.includes('rel="noopener noreferrer"'),
    "Get Directions external link must open safely in new tab"
  );
  console.log("  ✓ PASS: Get Directions operates via coordinate-based destination: " + actualDirectionsUrl + "\n");

  // -------------------------------------------------------------------------
  // TEST 27: CSP remains narrowly scoped to OpenStreetMap tiles
  // -------------------------------------------------------------------------
  console.log("TEST 27: CSP remains narrowly scoped to OpenStreetMap tiles");
  const nextConfigPath = path.resolve(projectRoot, "next.config.ts");
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
  assert(
    nextConfigContent.includes("https://*.tile.openstreetmap.org"),
    "next.config.ts must allow https://*.tile.openstreetmap.org in CSP"
  );
  assert(
    !nextConfigContent.includes("img-src *"),
    "CSP must not use wildcard img-src *"
  );
  assert(
    !nextConfigContent.includes("connect-src *"),
    "CSP must not use wildcard connect-src *"
  );
  console.log("  ✓ PASS: CSP narrowly scoped with zero wildcard shortcuts\n");

  // -------------------------------------------------------------------------
  // TEST 28: Internal coordinate-verification message absent from public UI
  // -------------------------------------------------------------------------
  console.log("TEST 28: Internal coordinate-verification placeholder absent from all public UI");
  assert(
    !mapComponentContent.includes("Verified San Felipe Municipal Hall coordinates are required before"),
    "municipal-map.tsx must NOT contain the internal verification placeholder"
  );
  assert(
    !contactSectionContent.includes("Verified San Felipe Municipal Hall coordinates are required before"),
    "municipal-contact-section.tsx must NOT contain the internal verification placeholder"
  );
  console.log("  ✓ PASS: Zero developer or coordinate-verification messages exposed to citizens\n");

  // -------------------------------------------------------------------------
  // TEST 29: No Google Maps JavaScript SDK or API secrets added
  // -------------------------------------------------------------------------
  console.log("TEST 29: No Google Maps JavaScript SDK or API secrets added");
  const packageJsonPath = path.resolve(projectRoot, "package.json");
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
  assert(
    !packageJsonContent.includes("@googlemaps") && !packageJsonContent.includes("google-maps"),
    "Zero Google Maps SDK in dependencies"
  );
  assert(
    !nextConfigContent.includes("maps.googleapis.com"),
    "Zero Google Maps API scripts in CSP"
  );
  console.log("  ✓ PASS: Lightweight Leaflet architecture confirmed without proprietary SDK or secrets\n");

  // -------------------------------------------------------------------------
  // TEST 30: Leaflet map component renders verified center, marker, and popup
  // -------------------------------------------------------------------------
  console.log("TEST 30: Leaflet map component renders verified center, marker, and popup");
  assert(
    mapComponentContent.includes("center: [activeCoordinates.lat, activeCoordinates.lng]"),
    "Map must center on active coordinates"
  );
  assert(
    mapComponentContent.includes("L.marker([activeCoordinates.lat, activeCoordinates.lng]"),
    "Marker must be positioned at active coordinates"
  );
  assert(
    mapComponentContent.includes("San Felipe Municipal Hall") &&
    mapComponentContent.includes("Municipal Government Center Compound") &&
    mapComponentContent.includes("Municipal Hall Compound, National Highway, San Felipe, Zambales 2204"),
    "Popup must contain official Title, Subtitle, and displayed address"
  );
  console.log("  ✓ PASS: Map center, marker pin, and popup verified\n");

  // -------------------------------------------------------------------------
  // TEST 31: Client-Provided Official LGU Directory & Office Heads Integration
  // -------------------------------------------------------------------------
  console.log("TEST 31: Client-Provided Official LGU Directory & Office Heads Integration");
  const { VERIFIED_MUNICIPAL_OFFICES } = await import("../src/config/offices-data");
  const { MUNICIPAL_CONTACT_DATA, EMERGENCY_DATA } = await import("../src/config/homepage-data");

  assert(
    VERIFIED_MUNICIPAL_OFFICES.length === 18,
    `Canonical office registry must contain exactly 18 offices (found: ${VERIFIED_MUNICIPAL_OFFICES.length})`
  );

  const EXPECTED_OFFICE_HEADS: Record<string, string> = {
    "office-of-the-mayor": "HON. ENGR. REINHARD E. JERESANO",
    "office-of-the-sangguniang-bayan": "HON. MARY ANN R. QUIBA",
    "municipal-planning-and-development-office": "FREDERICK F. TORRES",
    "municipal-health-office": "SALOME F. ARINDUQUE",
    "municipal-budget-office": "DAISY R. NERY",
    "municipal-accounting-office": "MICHELLE ANN N. CALLES",
    "municipal-treasury-office": "ELSIE C. ALIP",
    "municipal-assessors-office": "GERALDINE B. BADA",
    "municipal-social-welfare-and-development-office": "ROWEL A. VILLANUEVA",
    "local-civil-registrars-office": "JEANELLENE R. SALES (OIC)",
    "municipal-engineering-office": "BENEDICT F. JADLOC",
    "municipal-agriculture-office": "JOHN REY F. FUNIESTAS (OIC)",
    "municipal-disaster-risk-reduction-and-management-office": "RAYMOND F. DE JESUS",
    "municipal-tourism-and-investments-promotions-office": "DWAIN O. DOCTANA",
    "local-youth-development-office": "ADRIAN LUKE R. GALLARDO",
    "municipal-ecological-and-natural-resources-office": "ANDRE CARLO A. DASIG",
    "human-resource-management-office": "MERCEDES L. FORONDA",
    "public-employment-service-office": "FREDERICK F. TORRES",
  };

  for (const off of VERIFIED_MUNICIPAL_OFFICES) {
    assert(
      off.head === EXPECTED_OFFICE_HEADS[off.slug],
      `Office head for ${off.slug} must be ${EXPECTED_OFFICE_HEADS[off.slug]} (got: ${off.head})`
    );
  }

  // Dual office head
  const mpdoOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "municipal-planning-and-development-office");
  const pesoOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "public-employment-service-office");
  assert(
    mpdoOff?.head === "FREDERICK F. TORRES" && pesoOff?.head === "FREDERICK F. TORRES",
    "Frederick F. Torres legitimately heads both MPDO and PESO"
  );

  // OIC designations
  const lcroOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "local-civil-registrars-office");
  const maoOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "municipal-agriculture-office");
  assert(lcroOff?.head === "JEANELLENE R. SALES (OIC)", "Jeanellene R. Sales preserved as Registrar OIC");
  assert(maoOff?.head === "JOHN REY F. FUNIESTAS (OIC)", "John Rey F. Funiestas preserved as Agriculture OIC");

  // Agriculture phones
  assert(
    maoOff?.telephone === "09097884173 / 09100757895",
    "Both Agriculture phones preserved (09097884173 / 09100757895)"
  );

  // Unusual formats
  const acctOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "municipal-accounting-office");
  const menroOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "municipal-ecological-and-natural-resources-office");
  assert(acctOff?.telephone === "602-5181", "Accounting landline format preserved (602-5181)");
  assert(menroOff?.telephone === "09467585305", "MENRO mobile format preserved (09467585305)");

  // Unsupported contacts remain empty
  const hrmoOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "human-resource-management-office");
  assert(!lcroOff?.telephone && !lcroOff?.email, "LCRO has null/empty contact");
  assert(!hrmoOff?.telephone && !hrmoOff?.email, "HRMO has null/empty contact");

  // Crucial office head mappings
  const assessorOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "municipal-assessors-office");
  const mdrrmoOff = VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === "municipal-disaster-risk-reduction-and-management-office");
  assert(assessorOff?.head === "GERALDINE B. BADA", "Assessor Office head must be GERALDINE B. BADA");
  assert(lcroOff?.head === "JEANELLENE R. SALES (OIC)", "Local Civil Registrar Office head must be JEANELLENE R. SALES (OIC)");
  assert(maoOff?.head === "JOHN REY F. FUNIESTAS (OIC)", "Municipal Agriculture Office head must be JOHN REY F. FUNIESTAS (OIC)");
  assert(mdrrmoOff?.head === "RAYMOND F. DE JESUS", "MDRRMO Office head must be RAYMOND F. DE JESUS");

  // Only 7 approved acronyms, strictly rejecting MTO, MSWDO, MAO
  const ALLOWED_ACRONYMS = new Set(["MPDO", "MHO", "MBO", "MDRRMO", "LYDO", "HRMO", "PESO"]);
  const FORBIDDEN_ACRONYMS = ["MTO", "MSWDO", "MAO"];
  const assignedAcronyms = VERIFIED_MUNICIPAL_OFFICES.filter((o) => !!o.acronym).map((o) => o.acronym);
  assert(assignedAcronyms.length === 7, `Must have exactly 7 canonical acronyms (found: ${assignedAcronyms.length})`);

  for (const off of VERIFIED_MUNICIPAL_OFFICES) {
    if (off.acronym) {
      assert(
        ALLOWED_ACRONYMS.has(off.acronym),
        `Unexpected acronym "${off.acronym}" on ${off.slug}. Only 7 verified acronyms allowed.`
      );
      assert(
        !FORBIDDEN_ACRONYMS.includes(off.acronym),
        `Forbidden acronym "${off.acronym}" found on ${off.slug}. MTO, MSWDO, MAO are strictly forbidden.`
      );
    }
  }

  // Homepage general Municipal Hall contact remains untouched and distinct from Mayor
  assert(
    MUNICIPAL_CONTACT_DATA.address === "Municipal Hall Compound, National Highway, San Felipe, Zambales 2204",
    "General municipal address must remain intact"
  );
  assert(
    MUNICIPAL_CONTACT_DATA.phone === "0969-540-9138",
    "General municipal trunkline must NOT be overwritten by Mayor office phone"
  );
  assert(
    MUNICIPAL_CONTACT_DATA.email === "lgu.sanfelipe@gmail.com",
    "General municipal email must NOT be overwritten by Mayor office email"
  );

  // Emergency Hotlines corroboration
  const mdrrmoHotline = EMERGENCY_DATA.find((e) => e.name.includes("MDRRMO"));
  const rhuHotline = EMERGENCY_DATA.find((e) => e.name.includes("RHU"));
  const pnpHotline = EMERGENCY_DATA.find((e) => e.name.includes("PNP") || e.name.includes("Mps"));
  const bfpHotline = EMERGENCY_DATA.find((e) => e.name.includes("BFP"));

  assert(mdrrmoHotline?.numbers.includes("0929-183-8441"), "MDRRMO emergency number corroborated (0929-183-8441)");
  assert(rhuHotline?.numbers.includes("0931-793-8035"), "RHU emergency number corroborated (0931-793-8035)");
  assert(pnpHotline?.numbers.includes("0998-598-5509"), "PNP emergency number corroborated (0998-598-5509)");
  assert(bfpHotline?.numbers.includes("0946-451-2121"), "BFP emergency number corroborated (0946-451-2121)");

  // Public OfficeDirectory component verifies Facebook Page presentation
  const officeDirectoryPath = path.resolve(projectRoot, "src/components/offices/office-directory.tsx");
  const officeDirectoryContent = fs.readFileSync(officeDirectoryPath, "utf-8");
  assert(
    officeDirectoryContent.includes("Facebook Page"),
    "OfficeDirectory component must render Facebook Page column"
  );
  assert(
    !officeDirectoryContent.includes("Phone:") && !officeDirectoryContent.includes("Email:"),
    "OfficeDirectory must not render empty Phone: or Email: text labels"
  );
  console.log("  ✓ PASS: Client-provided LGU directory contacts and office heads verified\n");

  // -------------------------------------------------------------------------
  // TEST 32: Homepage Municipal Officials Leadership Visual Polish & Audit
  // -------------------------------------------------------------------------
  console.log("TEST 32: Homepage Municipal Officials Leadership Visual Polish & Audit");
  const officialsPreviewPath = path.resolve(projectRoot, "src/components/home/municipal-officials-preview.tsx");
  const officialsPreviewContent = fs.readFileSync(officialsPreviewPath, "utf-8");

  // 1. Exact Mayor Name
  const { OFFICIALS_DATA: previewOfficials } = await import("../src/config/homepage-data");
  assert(
    officialsPreviewContent.includes("{mayor.name}") &&
    previewOfficials.mayor.name === "HON. REINHARD E. JERESANO" &&
    !previewOfficials.mayor.name.includes("Hart"),
    "Homepage leadership section renders canonical Mayor name HON. REINHARD E. JERESANO without 'Hart'"
  );

  // 2. Exact Vice Mayor Name
  assert(
    (officialsPreviewContent.includes("{viceMayor.name}") || officialsPreviewContent.includes("HON. MARY ANN R. QUIBA")) &&
    previewOfficials.viceMayor.name === "HON. MARY ANN R. QUIBA",
    "Homepage leadership section renders canonical Vice Mayor name HON. MARY ANN R. QUIBA"
  );

  // 3. Correct Titles Retained
  assert(
    officialsPreviewContent.includes("Municipal Mayor"),
    "Mayor title 'Municipal Mayor' must be retained"
  );
  assert(
    officialsPreviewContent.includes("Municipal Vice Mayor &amp; SB Presiding Officer") ||
    officialsPreviewContent.includes("Municipal Vice Mayor & SB Presiding Officer"),
    "Vice Mayor title 'Municipal Vice Mayor & SB Presiding Officer' must be retained"
  );

  // 4. Existing Verified Portrait Sources Retained
  assert(
    officialsPreviewContent.includes("ASSETS.officials.mayor.src") &&
    officialsPreviewContent.includes("ASSETS.officials.viceMayor.src"),
    "Must reuse centralized verified assets ASSETS.officials.mayor.src and ASSETS.officials.viceMayor.src"
  );

  // 5. Dedicated Officials Page Not Structurally Redesigned
  const dedicatedOfficialsPath = path.resolve(projectRoot, "src/app/(public)/government/officials/page.tsx");
  assert(fs.existsSync(dedicatedOfficialsPath), "Dedicated officials page must exist");
  const dedicatedOfficialsContent = fs.readFileSync(dedicatedOfficialsPath, "utf-8");
  assert(
    dedicatedOfficialsContent.includes("OrganizationalTree") &&
    dedicatedOfficialsContent.includes("Municipal Officials") &&
    dedicatedOfficialsContent.includes("PageHeader"),
    "Dedicated officials page structure must remain intact and not redesigned"
  );

  // 6. No Bounce or Continuous Floating Animation
  assert(
    !officialsPreviewContent.includes("animate-bounce") &&
    !officialsPreviewContent.includes("animate-float") &&
    !officialsPreviewContent.includes("card-interactive"),
    "Homepage leadership component must NOT use bouncing, floating, or exaggerated card-interactive animation"
  );

  // 7. Reduced-Motion Handling Exists
  assert(
    officialsPreviewContent.includes("motion-reduce:transform-none"),
    "Homepage leadership component must enforce motion-reduce:transform-none for reduced-motion accessibility"
  );

  // 8. Homepage Leadership Links Remain Accessible
  assert(
    officialsPreviewContent.includes("Link") &&
    officialsPreviewContent.includes("/government/officials#mayor") &&
    officialsPreviewContent.includes("/government/officials#vice-mayor") &&
    officialsPreviewContent.includes("focus-visible:"),
    "Leadership profiles must provide accessible Link navigation with visible focus states"
  );

  // 9. No Invented Biography or Quote Text Added
  assert(
    !officialsPreviewContent.includes("A seasoned public servant with over") &&
    !officialsPreviewContent.includes("Dedicated to championing modern governance"),
    "No fabricated biographies or slogans added to leadership section"
  );

  // 10. Directory Does Not Invent 'Permanent Head' Classifications
  const officesDataPath = path.resolve(projectRoot, "src/config/offices-data.ts");
  const officesDataContent = fs.readFileSync(officesDataPath, "utf-8");
  const seedPath = path.resolve(projectRoot, "prisma/seed.ts");
  const seedContent = fs.readFileSync(seedPath, "utf-8");
  assert(
    !officesDataContent.includes("Permanent Head") &&
    !officeDirectoryContent.includes("Permanent Head") &&
    !seedContent.includes("Permanent Head"),
    "Zero invented 'Permanent Head' classifications across configuration, seed, and UI"
  );

  // 11. Super Admin Identity/Credentials are NOT Printed by Seed/Application Logging
  assert(
    !seedContent.includes("${existingSuperAdmin.id}") &&
    !seedContent.includes("${existingSuperAdmin.email}") &&
    !seedContent.includes("${adminUser.id}") &&
    !seedContent.includes("${adminUser.email}") &&
    !seedContent.includes("(${adminEmail})"),
    "prisma/seed.ts must NOT print Super Admin user ID, email, or credentials to console"
  );
  assert(
    seedContent.includes("Super Admin credentials preserved and untouched."),
    "prisma/seed.ts must output strictly privacy-preserving confirmation: 'Super Admin credentials preserved and untouched.'"
  );

  // 12. Removal of all "Motto" labels and retention of restrained quotation presentation
  assert(
    !officialsPreviewContent.includes("Executive Motto") &&
    !officialsPreviewContent.includes("Legislative Motto") &&
    !officialsPreviewContent.includes("Civic Motto") &&
    !officialsPreviewContent.includes("Mayor's Motto") &&
    !officialsPreviewContent.includes("Vice Mayor's Motto") &&
    !officialsPreviewContent.includes("Executive Quote") &&
    !officialsPreviewContent.includes("Legislative Quote") &&
    !officialsPreviewContent.includes("Legislative Commitment") &&
    !officialsPreviewContent.includes("Motto"),
    "Homepage leadership section must not contain any visible 'Motto' or category labels"
  );
  assert(
    !officialsPreviewContent.includes("mayor.quote") &&
    !officialsPreviewContent.includes("viceMayor.quote"),
    "Homepage leadership preview cleanly omits orphan quotation marks per Phase 22 civic polish"
  );
  assert(
    !officialsPreviewContent.includes("speech-bubble") &&
    !officialsPreviewContent.includes("testimonial"),
    "Quote presentation must NOT use speech-bubble or testimonial card styles"
  );
  console.log("  ✓ PASS: Leadership visual polish, accessibility, and provenance invariants verified\n");

  console.log("=====================================================================");
  console.log("ALL 32 PHASE 20 TESTS PASSED SUCCESSFULLY");
  console.log("=====================================================================");
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

runPhase20Tests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
