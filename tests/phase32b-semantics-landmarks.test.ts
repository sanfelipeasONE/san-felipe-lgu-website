import React from "react";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { SessionUser } from "../src/server/auth/session";

// Mock `server-only` and `next/navigation` so components render cleanly under `tsx`
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

const nextNavPath = require.resolve("next/navigation");
require.cache[nextNavPath] = {
  id: nextNavPath,
  filename: nextNavPath,
  loaded: true,
  exports: {
    usePathname: () => "/",
    useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {} }),
    useSearchParams: () => new URLSearchParams(),
    redirect: () => {},
    notFound: () => {},
  },
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function hasNestedInteractiveInHtml(html: string): boolean {
  const anchorMatches = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const anchor of anchorMatches) {
    const inner = anchor.slice(anchor.indexOf(">") + 1, anchor.lastIndexOf("<"));
    if (/<button\b|<a\b/i.test(inner)) {
      return true;
    }
  }
  const buttonMatches = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];
  for (const btn of buttonMatches) {
    const inner = btn.slice(btn.indexOf(">") + 1, btn.lastIndexOf("<"));
    if (/<button\b|<a\b/i.test(inner)) {
      return true;
    }
  }
  return false;
}

function countMainLandmarks(html: string): number {
  return (html.match(/<main\b/gi) || []).length;
}

function walkTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTsxFiles(full));
    } else if (entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

async function runPhase32bTests() {
  console.log("=======================================================");
  console.log("PHASE 32B — SEMANTIC INTERACTIVE & LANDMARK TEST SUITE");
  console.log("=======================================================\n");

  const { HeroSection } = await import("../src/components/home/hero-section");
  const { MunicipalOfficesPreview } = await import(
    "../src/components/home/municipal-offices-preview"
  );
  const { MunicipalOfficialsPreview } = await import(
    "../src/components/home/municipal-officials-preview"
  );
  const { DashboardHeader } = await import(
    "../src/components/admin/dashboard/dashboard-header"
  );
  const { default: NotFound } = await import("../src/app/not-found");
  const { default: AboutPage } = await import("../src/app/(public)/about/page");
  const { default: TransparencyPage } = await import(
    "../src/app/(public)/transparency/page"
  );
  const { default: PublicLayout } = await import("../src/app/(public)/layout");
  const { TourismDetailView } = await import(
    "../src/components/tourism/tourism-detail-view"
  );
  const { buttonVariants } = await import("../src/components/ui/button");

  // ---------------------------------------------------------------------------
  // 1. Rendered HTML: Interactive Element Semantics (No Nested Buttons in Links)
  // ---------------------------------------------------------------------------
  console.log("--- 1. Rendered HTML Interactive Semantics ---");

  const heroHtml = renderToStaticMarkup(React.createElement(HeroSection));
  assert(
    !hasNestedInteractiveInHtml(heroHtml),
    "HeroSection renders zero nested interactive elements"
  );
  assert(
    heroHtml.includes('href="#services"') &&
      heroHtml.includes('href="/offices"') &&
      heroHtml.includes('href="/news"'),
    "HeroSection preserves all three CTA navigation links (#services, /offices, /news)"
  );

  const officesHtml = renderToStaticMarkup(
    React.createElement(MunicipalOfficesPreview, { offices: [] })
  );
  assert(
    !hasNestedInteractiveInHtml(officesHtml),
    "MunicipalOfficesPreview renders zero nested interactive elements"
  );
  assert(
    officesHtml.includes('href="/offices"') && officesHtml.includes("View All Offices"),
    "MunicipalOfficesPreview preserves View All Offices link"
  );

  const officialsHtml = renderToStaticMarkup(
    React.createElement(MunicipalOfficialsPreview)
  );
  assert(
    !hasNestedInteractiveInHtml(officialsHtml),
    "MunicipalOfficialsPreview renders zero nested interactive elements"
  );
  assert(
    officialsHtml.includes('href="/government/officials"'),
    "MunicipalOfficialsPreview preserves /government/officials CTA link"
  );

  const mockAdminUser: SessionUser = {
    id: "test-admin",
    name: "Test Admin",
    email: "admin@test.local",
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: "role-super-admin",
    role: {
      id: "role-super-admin",
      name: "Super Administrator",
      slug: "super-admin",
      isSystemScope: true,
    },
    isSystemScope: true,
    permissions: ["documents.create", "posts.create"],
    sessionId: "test-session",
  };

  const dashHeaderHtml = renderToStaticMarkup(
    React.createElement(DashboardHeader, { user: mockAdminUser })
  );
  assert(
    !hasNestedInteractiveInHtml(dashHeaderHtml),
    "DashboardHeader renders zero nested interactive elements"
  );
  assert(
    dashHeaderHtml.includes('href="/admin/documents/new"') &&
      dashHeaderHtml.includes('href="/admin/news/new"'),
    "DashboardHeader preserves Upload Document and Create News Article links"
  );

  const notFoundHtml = renderToStaticMarkup(React.createElement(NotFound));
  assert(
    !hasNestedInteractiveInHtml(notFoundHtml),
    "NotFound page renders zero nested interactive elements"
  );
  assert(
    notFoundHtml.includes('href="/"') && notFoundHtml.includes("Back to Homepage"),
    "NotFound page preserves Back to Homepage link"
  );

  const btnClasses = buttonVariants({ variant: "outline", size: "sm" });
  assert(
    btnClasses.includes("inline-flex") && btnClasses.includes("border-burgundy-700"),
    "buttonVariants helper generates expected Button classes for semantic links"
  );

  // ---------------------------------------------------------------------------
  // 2. Rendered HTML: Single Primary <main> Landmark Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Rendered HTML Single <main> Landmark ---");

  assert(
    countMainLandmarks(notFoundHtml) === 1,
    "NotFound page renders exactly 1 <main> landmark"
  );

  const aboutInLayoutHtml = renderToStaticMarkup(
    React.createElement(PublicLayout, null, React.createElement(AboutPage))
  );
  assert(
    countMainLandmarks(aboutInLayoutHtml) === 1,
    "PublicLayout + AboutPage renders exactly 1 <main> landmark"
  );

  const transparencyInLayoutHtml = renderToStaticMarkup(
    React.createElement(
      PublicLayout,
      null,
      React.createElement(TransparencyPage)
    )
  );
  assert(
    countMainLandmarks(transparencyInLayoutHtml) === 1,
    "PublicLayout + TransparencyPage renders exactly 1 <main> landmark"
  );

  const tourismDetailInLayoutHtml = renderToStaticMarkup(
    React.createElement(
      PublicLayout,
      null,
      React.createElement(TourismDetailView, {
        entry: {
          id: "test-entry",
          slug: "test-cove",
          title: "Test Cove",
          category: "ATTRACTIONS",
          categoryLabel: "Attractions",
          categoryRoute: "/tourism/attractions",
          summary: "A scenic destination for testing landmarks.",
          body: "<p>Scenic cove details for testing rendered landmarks.</p>",
          location: "San Felipe",
          mapUrl: null,
          contactNumber: null,
          email: null,
          websiteUrl: null,
          operatingHours: null,
          publishedAt: new Date("2026-01-01T00:00:00.000Z"),
          featuredImage: null,
        },
        otherEntries: [],
      })
    )
  );
  assert(
    countMainLandmarks(tourismDetailInLayoutHtml) === 1,
    "PublicLayout + TourismDetailView renders exactly 1 <main> landmark"
  );

  // ---------------------------------------------------------------------------
  // 3. Repository-Wide Structural Scan: Zero Nested Interactive & Exact Landmark Owners
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Repository-Wide Structural Invariants ---");

  const srcFiles = walkTsxFiles(path.join(process.cwd(), "src"));
  const filesWithMain: string[] = [];
  const nestedViolations: string[] = [];

  for (const file of srcFiles) {
    const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf8");

    if (/<main\b/.test(content)) {
      filesWithMain.push(rel);
    }

    const linkRe = /<(Link|a)\b[^>]*>[\s\S]*?<\/(Link|a)>/g;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(content)) !== null) {
      const inner = m[0].slice(m[0].indexOf(">") + 1);
      if (/<(Button|button|Link|a)\b/.test(inner)) {
        nestedViolations.push(`${rel}: nested interactive inside <${m[1]}>`);
      }
    }

    const btnRe = /<(Button|button)\b[^>]*>[\s\S]*?<\/(Button|button)>/g;
    while ((m = btnRe.exec(content)) !== null) {
      const inner = m[0].slice(m[0].indexOf(">") + 1);
      if (/<(Button|button|Link|a)\b/.test(inner)) {
        nestedViolations.push(`${rel}: nested interactive inside <${m[1]}>`);
      }
    }
  }

  assert(
    nestedViolations.length === 0,
    "Zero TSX files in src/ contain nested interactive elements",
    nestedViolations.join("; ")
  );

  const expectedMainOwners = new Set([
    "src/app/(auth)/staff/login/page.tsx",
    "src/app/(public)/layout.tsx",
    "src/app/not-found.tsx",
    "src/components/admin/admin-shell.tsx",
  ]);

  assert(
    filesWithMain.length === expectedMainOwners.size &&
      filesWithMain.every((f) => expectedMainOwners.has(f)),
    "Only the 4 top-level layout/root shells define <main> landmarks",
    `Found: ${filesWithMain.join(", ")}`
  );

  console.log("\n=======================================================");
  console.log(`PHASE 32B SEMANTICS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase32bTests().catch((err) => {
  console.error("FATAL ERROR IN PHASE 32B SUITE:", err);
  process.exit(1);
});
