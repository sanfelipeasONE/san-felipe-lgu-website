// Standalone test mock for server-only marker package
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

import assert from "assert";
import fs from "fs";
import path from "path";

async function runCitizensCharterViewerTests() {
  console.log("=====================================================================");
  console.log("CITIZEN'S CHARTER PUBLIC PDF VIEWER UX CORRECTION TEST SUITE");
  console.log("=====================================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const { GET: getViewRoute } = await import("../src/app/documents/[id]/view/route");
  const { GET: getDownloadRoute } = await import("../src/app/documents/[id]/download/route");

  // Find or verify test municipal office and admin user for test fixtures
  const adminUser = await prisma.user.findFirst({
    where: { role: { isSystemScope: true } },
    select: { id: true },
  });
  const office = await prisma.office.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  assert(adminUser, "Super Admin user exists in database");
  assert(office, "Active Office exists in database");

  // Ensure canonical citizens-charter service page exists
  let charterPage = await prisma.servicePage.findUnique({
    where: { serviceKey: "citizens-charter" },
  });
  if (!charterPage) {
    charterPage = await prisma.servicePage.create({
      data: {
        serviceKey: "citizens-charter",
        title: "Citizen's Charter",
        status: "PUBLISHED",
        createdById: adminUser.id,
      },
    });
  }

  // Ensure canonical published Charter document exists
  let publishedCharterDoc = await prisma.document.findFirst({
    where: {
      purpose: "CITIZENS_CHARTER",
      status: "PUBLISHED",
    },
  });

  if (!publishedCharterDoc) {
    publishedCharterDoc = await prisma.document.create({
      data: {
        title: "Official Citizen's Charter 2026",
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        officeId: office.id,
        createdById: adminUser.id,
        originalFilename: "CITIZENS_CHARTER_2026.pdf",
        storagePublicId: "san-felipe-lgu/documents/2026/charter-canonical",
        storageUrl: "https://res.cloudinary.com/sfz-website/raw/upload/v1/charter-canonical.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 1048576,
        publishedAt: new Date(),
      },
    });
  }

  // Ensure charterPage is PUBLISHED and links to publishedCharterDoc
  await prisma.servicePage.update({
    where: { serviceKey: "citizens-charter" },
    data: {
      charterDocumentId: publishedCharterDoc.id,
      status: "PUBLISHED",
      title: "Citizen's Charter",
    },
  });

  // Track temporary documents for cleanup
  const cleanupDocIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Published associated Charter Document: /documents/<id>/view succeeds
    // -------------------------------------------------------------------------
    console.log("TEST 1: Published associated Charter Document /documents/<id>/view succeeds");
    const viewRes = await getViewRoute(
      new Request(`http://localhost/documents/${publishedCharterDoc.id}/view`),
      { params: Promise.resolve({ id: publishedCharterDoc.id }) }
    );
    assert.strictEqual(viewRes.status, 307, "View route returns 307 Temporary Redirect");
    assert.strictEqual(
      viewRes.headers.get("location"),
      publishedCharterDoc.storageUrl,
      "View route redirects to the canonical storageUrl"
    );
    console.log("  ✓ PASS: /documents/<id>/view succeeds with 307 redirect to Cloudinary asset\n");

    // -------------------------------------------------------------------------
    // TEST 2: Published associated Charter Document: /documents/<id>/download succeeds
    // -------------------------------------------------------------------------
    console.log("TEST 2: Published associated Charter Document /documents/<id>/download succeeds");
    const dlRes = await getDownloadRoute(
      new Request(`http://localhost/documents/${publishedCharterDoc.id}/download`),
      { params: Promise.resolve({ id: publishedCharterDoc.id }) }
    );
    assert.strictEqual(dlRes.status, 307, "Download route returns 307 Temporary Redirect");
    const dlLocation = dlRes.headers.get("location") || "";
    assert(
      dlLocation.includes("attachment"),
      `Download route location must include attachment flag (found: ${dlLocation})`
    );
    console.log("  ✓ PASS: /documents/<id>/download succeeds with 307 redirect to attachment URL\n");

    // -------------------------------------------------------------------------
    // TEST 3: DRAFT Document: public view denied/not found
    // -------------------------------------------------------------------------
    console.log("TEST 3: DRAFT Document public view denied/not found");
    const draftDoc = await prisma.document.create({
      data: {
        title: "Test Draft Charter Document",
        purpose: "CITIZENS_CHARTER",
        status: "DRAFT",
        officeId: office.id,
        createdById: adminUser.id,
        originalFilename: "draft-charter.pdf",
        storagePublicId: "san-felipe-lgu/documents/2026/test-draft-charter",
        storageUrl: "https://res.cloudinary.com/sfz-website/raw/upload/v1/test-draft.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 12345,
      },
    });
    cleanupDocIds.push(draftDoc.id);

    const draftRes = await getViewRoute(
      new Request(`http://localhost/documents/${draftDoc.id}/view`),
      { params: Promise.resolve({ id: draftDoc.id }) }
    );
    assert.strictEqual(draftRes.status, 404, "Draft document view must be denied with 404 Not Found");
    console.log("  ✓ PASS: DRAFT Document public view returns 404 Not Found\n");

    // -------------------------------------------------------------------------
    // TEST 4: ARCHIVED Document: public view denied/not found
    // -------------------------------------------------------------------------
    console.log("TEST 4: ARCHIVED Document public view denied/not found");
    const archivedDoc = await prisma.document.create({
      data: {
        title: "Test Archived Charter Document",
        purpose: "CITIZENS_CHARTER",
        status: "ARCHIVED",
        officeId: office.id,
        createdById: adminUser.id,
        originalFilename: "archived-charter.pdf",
        storagePublicId: "san-felipe-lgu/documents/2026/test-archived-charter",
        storageUrl: "https://res.cloudinary.com/sfz-website/raw/upload/v1/test-archived.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 12345,
        archivedAt: new Date(),
      },
    });
    cleanupDocIds.push(archivedDoc.id);

    const archivedRes = await getViewRoute(
      new Request(`http://localhost/documents/${archivedDoc.id}/view`),
      { params: Promise.resolve({ id: archivedDoc.id }) }
    );
    assert.strictEqual(archivedRes.status, 404, "Archived document view must be denied with 404 Not Found");
    console.log("  ✓ PASS: ARCHIVED Document public view returns 404 Not Found\n");

    // -------------------------------------------------------------------------
    // TEST 5: CITIZENS_CHARTER Document not associated with published Charter ServicePage
    // -------------------------------------------------------------------------
    console.log("TEST 5: CITIZENS_CHARTER Document unassociated with published Charter ServicePage denied/not found");
    const unassociatedDoc = await prisma.document.create({
      data: {
        title: "Unassociated Published Charter Document",
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        officeId: office.id,
        createdById: adminUser.id,
        originalFilename: "unassociated-charter.pdf",
        storagePublicId: "san-felipe-lgu/documents/2026/test-unassociated-charter",
        storageUrl: "https://res.cloudinary.com/sfz-website/raw/upload/v1/test-unassociated.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 12345,
        publishedAt: new Date(),
      },
    });
    cleanupDocIds.push(unassociatedDoc.id);

    const unassociatedRes = await getViewRoute(
      new Request(`http://localhost/documents/${unassociatedDoc.id}/view`),
      { params: Promise.resolve({ id: unassociatedDoc.id }) }
    );
    assert.strictEqual(
      unassociatedRes.status,
      404,
      "Unassociated Charter document view must be denied with 404 Not Found"
    );
    console.log("  ✓ PASS: Unassociated Charter Document public view returns 404 Not Found\n");

    // -------------------------------------------------------------------------
    // TEST 6: Wrong-purpose Document: public Charter delivery denied/not found
    // -------------------------------------------------------------------------
    console.log("TEST 6: Wrong-purpose Document public Charter delivery denied/not found");
    const wrongPurposeDoc = await prisma.document.create({
      data: {
        title: "Downloadable Form Document",
        purpose: "DOWNLOADABLE_FORM",
        status: "PUBLISHED",
        officeId: office.id,
        createdById: adminUser.id,
        originalFilename: "tax-form.pdf",
        storagePublicId: "san-felipe-lgu/documents/2026/test-tax-form",
        storageUrl: "https://res.cloudinary.com/sfz-website/raw/upload/v1/test-tax-form.pdf",
        resourceType: "raw",
        format: "pdf",
        mimeType: "application/pdf",
        bytes: 12345,
        publishedAt: new Date(),
      },
    });
    cleanupDocIds.push(wrongPurposeDoc.id);

    const wrongPurposeViewRes = await getViewRoute(
      new Request(`http://localhost/documents/${wrongPurposeDoc.id}/view`),
      { params: Promise.resolve({ id: wrongPurposeDoc.id }) }
    );
    assert.strictEqual(
      wrongPurposeViewRes.status,
      404,
      "Wrong-purpose document view must be denied with 404 Not Found"
    );

    const wrongPurposeDlRes = await getDownloadRoute(
      new Request(`http://localhost/documents/${wrongPurposeDoc.id}/download`),
      { params: Promise.resolve({ id: wrongPurposeDoc.id }) }
    );
    assert.strictEqual(
      wrongPurposeDlRes.status,
      404,
      "Wrong-purpose document download must be denied with 404 Not Found"
    );
    console.log("  ✓ PASS: Wrong-purpose Document view & download return 404 Not Found\n");

    // -------------------------------------------------------------------------
    // TEST 7: Public Citizen's Charter page contains zero raw res.cloudinary.com links
    // -------------------------------------------------------------------------
    console.log("TEST 7: Public Citizen's Charter page contains zero raw res.cloudinary.com links");
    const pageFilePath = path.resolve(process.cwd(), "src/app/(public)/services/citizens-charter/page.tsx");
    const pageContent = fs.readFileSync(pageFilePath, "utf-8");

    assert(
      !pageContent.includes("res.cloudinary.com"),
      "Public Citizen's Charter page markup must not contain any raw res.cloudinary.com URL"
    );
    assert(
      !pageContent.includes("Open PDF"),
      "Open PDF button must be completely removed from public Citizen's Charter page"
    );
    assert(
      pageContent.includes("/documents/${validCharterDoc.id}/download") ||
      pageContent.includes("`/documents/${validCharterDoc.id}/download`"),
      "Download PDF action must link to first-party /documents/${validCharterDoc.id}/download"
    );
    assert(
      pageContent.includes("Download PDF"),
      "Download PDF action must remain on public Citizen's Charter page"
    );
    console.log("  ✓ PASS: Zero raw res.cloudinary.com URLs; Open PDF removed; Download PDF uses first-party route\n");

    // -------------------------------------------------------------------------
    // TEST 8: Public page no longer renders the custom Full Screen control
    // -------------------------------------------------------------------------
    console.log("TEST 8: Public page no longer renders the custom Full Screen control");
    assert(
      !pageContent.includes("Full Screen"),
      "Public Citizen's Charter page must not contain custom 'Full Screen' control"
    );
    console.log("  ✓ PASS: Custom Full Screen control is completely removed\n");

    // -------------------------------------------------------------------------
    // TEST 9: Public page no longer renders redundant desktop fallback strip & Frontline Assistance card
    // -------------------------------------------------------------------------
    console.log("TEST 9: Public page no longer renders redundant desktop fallback strip or Frontline Assistance card");
    assert(
      !pageContent.includes("Viewing on a mobile device or browser without inline PDF support?"),
      "Public page must not render duplicate instructions / redundant desktop fallback strip"
    );
    assert(
      !pageContent.includes("Questions Regarding Frontline Service Standards?"),
      "Frontline Assistance card must be removed from the published Citizen's Charter view"
    );
    assert(
      !pageContent.includes("Frontline Assistance &amp; Citizen Support") &&
      !pageContent.includes("Frontline Assistance & Citizen Support"),
      "Frontline Assistance header must be removed from the published Citizen's Charter view"
    );
    console.log("  ✓ PASS: Redundant desktop fallback strip and Frontline Assistance card are completely removed\n");

    // -------------------------------------------------------------------------
    // TEST 10: Citizen's Charter iframe uses approved first-party delivery route with portrait #view=Fit
    // -------------------------------------------------------------------------
    console.log("TEST 10: Citizen's Charter iframe uses approved first-party delivery route with portrait #view=Fit");
    assert(
      pageContent.includes("src={`/documents/${validCharterDoc.id}/view#view=Fit`}") ||
      pageContent.includes('src={`/documents/${validCharterDoc.id}/view#view=Fit`}'),
      "iframe src must point to `/documents/${validCharterDoc.id}/view#view=Fit` for portrait document fitting"
    );
    assert(
      !pageContent.includes("#view=FitH"),
      "iframe src must not use #view=FitH (landscape-style fit) for portrait Citizen's Charter"
    );
    assert(
      pageContent.includes("calc(100dvh-") || pageContent.includes("calc(100dvh - "),
      "iframe height must use viewport-aware calc(100dvh - <offset>) sizing"
    );
    console.log("  ✓ PASS: iframe uses first-party route with #view=Fit portrait fitting and viewport-aware height\n");

    // -------------------------------------------------------------------------
    // TEST 11: Existing unavailable state remains unchanged when no valid Charter PDF exists
    // -------------------------------------------------------------------------
    console.log("TEST 11: Existing unavailable state remains unchanged when no valid Charter PDF exists");
    assert(
      pageContent.includes("Citizen&apos;s Charter PDF not currently available") ||
      pageContent.includes("Citizen's Charter PDF not currently available"),
      "Neutral unavailable heading 'Citizen's Charter PDF not currently available' is preserved"
    );
    assert(
      pageContent.includes("The official Citizen&apos;s Charter PDF will be available here once published by the Municipality of San Felipe.") ||
      pageContent.includes("The official Citizen's Charter PDF will be available here once published by the Municipality of San Felipe."),
      "Neutral unavailable description 'The official Citizen's Charter PDF will be available here...' is preserved"
    );
    assert(
      !pageContent.toLowerCase().includes("under review") &&
      !pageContent.toLowerCase().includes("awaiting approval") &&
      !pageContent.toLowerCase().includes("pending approval") &&
      !pageContent.toLowerCase().includes("being evaluated") &&
      !pageContent.toLowerCase().includes("awaiting publication authorization"),
      "Citizen's Charter strictly contains ZERO workflow claims"
    );
    console.log("  ✓ PASS: Authoritative neutral unavailable state exactly preserved with zero workflow claims\n");

    console.log("=====================================================================");
    console.log("ALL 11 CITIZEN'S CHARTER PUBLIC VIEWER TESTS PASSED SUCCESSFULLY");
    console.log("=====================================================================");
  } finally {
    // Cleanup temporary test documents
    if (cleanupDocIds.length > 0) {
      await prisma.document.deleteMany({
        where: { id: { in: cleanupDocIds } },
      });
    }
    await prisma.$disconnect();
  }
}

runCitizensCharterViewerTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
