import fs from "node:fs";
import path from "node:path";
import type { SessionUser } from "../src/server/auth/session";

// Mock `server-only` so server modules can be imported directly under `tsx`
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
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

async function runTourismPublishConcurrencyTests() {
  console.log("=======================================================");
  console.log("TOURISM PUBLISHING CONCURRENCY REGRESSION TEST SUITE");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    createTourismEntry,
    updateTourismEntry,
    publishTourismEntry,
    deleteTourismEntry,
    TourismError,
  } = await import("../src/server/tourism/service");
  const { executeTourismPublishSequence } = await import(
    "../src/lib/validation/tourism"
  );

  // Locate an active super-admin (or user with tourism.*) to run DB integration tests
  const dbAdmin = await prisma.user.findFirst({
    where: { status: "ACTIVE", role: { slug: "super-admin" } },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!dbAdmin) {
    throw new Error("Active super-admin user not found in database for test setup.");
  }

  const testUser: SessionUser = {
    id: dbAdmin.id,
    name: dbAdmin.name,
    email: dbAdmin.email,
    status: "ACTIVE",
    officeId: null,
    office: null,
    roleId: dbAdmin.roleId,
    role: {
      id: dbAdmin.role.id,
      name: dbAdmin.role.name,
      slug: dbAdmin.role.slug,
      isSystemScope: dbAdmin.role.isSystemScope,
    },
    isSystemScope: dbAdmin.role.isSystemScope,
    permissions: dbAdmin.role.permissions.map((rp) => rp.permission.code),
    sessionId: "test-tourism-publish-concurrency-session",
  };

  const createdIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // A. Successful save-then-publish
    // -------------------------------------------------------------------------
    console.log("--- A. Successful Save-Then-Publish ---");
    const draftA = await createTourismEntry(testUser, {
      category: "ATTRACTIONS",
      title: `Concurrency Test Cove ${Date.now()}`,
      summary: "A scenic coastal destination used to verify save-then-publish concurrency.",
      body: "<p>Detailed verified description for save-then-publish testing in San Felipe.</p>",
    });
    createdIds.push(draftA.id);
    const t0 = draftA.updatedAt.toISOString();

    let capturedT1: string | undefined;
    let forwardedTimestamp: string | undefined;

    const outcomeA = await executeTourismPublishSequence({
      id: draftA.id,
      payload: {
        category: "ATTRACTIONS",
        title: `${draftA.title} Updated`,
        summary: "Updated scenic coastal destination summary for save-then-publish.",
        body: "<p>Updated detailed verified description for save-then-publish testing.</p>",
        expectedUpdatedAt: t0,
      },
      saveEntry: async (id, payload) => {
        const updated = await updateTourismEntry(testUser, id, payload);
        capturedT1 = updated.updatedAt.toISOString();
        return {
          success: true,
          data: { updatedAt: capturedT1 },
        };
      },
      publishEntry: async (id, expectedUpdatedAt) => {
        forwardedTimestamp = expectedUpdatedAt;
        await publishTourismEntry(testUser, id, expectedUpdatedAt);
        return { success: true };
      },
    });

    assert(Boolean(capturedT1) && capturedT1 !== t0, "Save step returns new updatedAt timestamp T1 != T0");
    assert(forwardedTimestamp === capturedT1, "Publish step receives exact returned T1 (not stale T0)");
    assert(outcomeA.success === true, "Save-then-publish sequence succeeds");
    assert(outcomeA.concurrencyConflict === false, "No concurrency conflict reported");
    assert(outcomeA.closeDialog === true && outcomeA.shouldRefresh === true, "Dialog closes and router refreshes on success");

    const dbAfterA = await prisma.tourismEntry.findUnique({ where: { id: draftA.id } });
    assert(dbAfterA?.status === "PUBLISHED", "Database status transitions to PUBLISHED");
    assert(Boolean(dbAfterA?.publishedAt), "Database publishedAt timestamp is populated");

    // -------------------------------------------------------------------------
    // B. True concurrent modification
    // -------------------------------------------------------------------------
    console.log("\n--- B. True Concurrent Modification ---");
    const draftB = await createTourismEntry(testUser, {
      category: "RESORTS",
      title: `Concurrent Session Resort ${Date.now()}`,
      summary: "Initial resort summary before another session modifies it.",
      body: "<p>Initial resort body content for genuine concurrent edit verification.</p>",
    });
    createdIds.push(draftB.id);
    const initialT0 = draftB.updatedAt.toISOString();

    // Another session updates the entry, advancing updatedAt to T1
    const otherSessionTitle = `${draftB.title} (Other Session Edit)`;
    const otherSessionUpdate = await updateTourismEntry(testUser, draftB.id, {
      category: "RESORTS",
      title: otherSessionTitle,
      summary: "Modified in another active session.",
      body: "<p>Content saved by another active session before publish attempt.</p>",
      expectedUpdatedAt: initialT0,
    });
    assert(otherSessionUpdate.updatedAt.toISOString() !== initialT0, "Other session advances DB updatedAt to T1");

    // Attempt direct publish with stale T0
    let threw409 = false;
    try {
      await publishTourismEntry(testUser, draftB.id, initialT0);
    } catch (err) {
      if (err instanceof TourismError && err.statusCode === 409) {
        threw409 = true;
      }
    }
    assert(threw409, "Publishing directly with stale T0 throws 409 TourismError");

    const dbAfterB = await prisma.tourismEntry.findUnique({ where: { id: draftB.id } });
    assert(dbAfterB?.status === "DRAFT", "Entry remains DRAFT after 409 conflict");
    assert(dbAfterB?.title === otherSessionTitle, "Latest saved content from other session is preserved");

    // Simulate race between saveEntry and publishEntry inside executeTourismPublishSequence
    const raceOutcome = await executeTourismPublishSequence({
      id: draftB.id,
      payload: {
        category: "RESORTS",
        title: draftB.title,
        summary: "Summary before race condition.",
        body: "<p>Body content before concurrent session interleaving.</p>",
        expectedUpdatedAt: dbAfterB?.updatedAt.toISOString(),
      },
      saveEntry: async (id, payload) => {
        const saved = await updateTourismEntry(testUser, id, payload);
        const t1 = saved.updatedAt.toISOString();
        // Simulate another session mutating the record right after save completes
        await updateTourismEntry(testUser, id, {
          ...payload,
          title: `${payload.title} Interleaved`,
          expectedUpdatedAt: t1,
        });
        return { success: true, data: { updatedAt: t1 } };
      },
      publishEntry: async (id, expectedUpdatedAt) => {
        try {
          await publishTourismEntry(testUser, id, expectedUpdatedAt);
          return { success: true };
        } catch (err) {
          return {
            success: false,
            error: err instanceof TourismError ? err.message : "Failed to publish.",
          };
        }
      },
    });

    assert(raceOutcome.success === false, "Interleaved concurrent edit fails publish sequence");
    assert(raceOutcome.concurrencyConflict === true, "Concurrency conflict flag is set for UI banner");
    assert(raceOutcome.closeDialog === true, "Confirmation dialog closes so concurrency banner is visible");

    const dbAfterRace = await prisma.tourismEntry.findUnique({ where: { id: draftB.id } });
    assert(dbAfterRace?.status === "DRAFT", "Interleaved entry remains DRAFT in database");

    // -------------------------------------------------------------------------
    // C. Save failure
    // -------------------------------------------------------------------------
    console.log("\n--- C. Save Failure ---");
    let publishCalledOnSaveFail = false;
    const saveFailOutcome = await executeTourismPublishSequence({
      id: "dummy-id",
      payload: {
        category: "ATTRACTIONS",
        title: "Test Attraction",
        summary: "Test attraction summary.",
        body: "<p>Test attraction body content.</p>",
        expectedUpdatedAt: "2026-01-01T00:00:00.000Z",
      },
      saveEntry: async () => ({
        success: false,
        error: "This tourism entry was modified by another user. Please refresh and review before saving your changes.",
      }),
      publishEntry: async () => {
        publishCalledOnSaveFail = true;
        return { success: true };
      },
    });

    assert(publishCalledOnSaveFail === false, "publishTourismAction is never called when save fails");
    assert(saveFailOutcome.success === false, "Sequence reports failure on save error");
    assert(saveFailOutcome.concurrencyConflict === true, "Concurrency conflict detected when save returns 409 message");
    assert(saveFailOutcome.closeDialog === true, "Publish dialog closes on save failure");

    // -------------------------------------------------------------------------
    // D. Missing updatedAt response
    // -------------------------------------------------------------------------
    console.log("\n--- D. Missing updatedAt Response ---");
    let publishCalledOnMissingTimestamp = false;
    const missingTsOutcome = await executeTourismPublishSequence({
      id: "dummy-id",
      payload: {
        category: "ATTRACTIONS",
        title: "Test Attraction",
        summary: "Test attraction summary.",
        body: "<p>Test attraction body content.</p>",
        expectedUpdatedAt: "2026-01-01T00:00:00.000Z",
      },
      saveEntry: async () => ({
        success: true,
        data: {},
      }),
      publishEntry: async () => {
        publishCalledOnMissingTimestamp = true;
        return { success: true };
      },
    });

    assert(
      publishCalledOnMissingTimestamp === false,
      "publishTourismAction is never called when save response omits updatedAt"
    );
    assert(missingTsOutcome.success === false, "Missing updatedAt is treated as an explicit failure");
    assert(
      Boolean(missingTsOutcome.error?.toLowerCase().includes("timestamp")),
      "Explicit error message explains the missing updatedAt timestamp"
    );
    assert(missingTsOutcome.closeDialog === true, "Publish dialog closes on missing timestamp error");

    // -------------------------------------------------------------------------
    // E & F. Response & UI Source Contract Verification
    // -------------------------------------------------------------------------
    console.log("\n--- E & F. Response & UI Source Contracts ---");
    const actionsSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(cms)/admin/tourism/actions.ts"),
      "utf8"
    );
    assert(
      actionsSource.includes("updatedAt: updated.updatedAt.toISOString()"),
      "updateTourismAction returns ISO-formatted updatedAt on success"
    );

    const formSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/admin/tourism-form.tsx"),
      "utf8"
    );
    assert(
      formSource.includes("executeTourismPublishSequence"),
      "TourismForm delegates publish sequence to executeTourismPublishSequence"
    );
    assert(
      !formSource.includes("publishTourismAction(initialData.id, initialData.updatedAt)"),
      "TourismForm no longer passes stale initialData.updatedAt directly to publishTourismAction"
    );
    assert(
      formSource.includes("if (outcome.closeDialog)") &&
        formSource.includes("setShowPublishDialog(false)") &&
        formSource.includes("if (outcome.concurrencyConflict)") &&
        formSource.includes("setConcurrencyConflict(true)"),
      "TourismForm closes confirmation dialog and surfaces ConcurrencyConflictBanner on conflict"
    );
  } finally {
    // Cleanup temporary test entries
    for (const id of createdIds) {
      await deleteTourismEntry(testUser, id).catch(() => {});
    }
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  console.log(`TOURISM PUBLISH CONCURRENCY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTourismPublishConcurrencyTests().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
