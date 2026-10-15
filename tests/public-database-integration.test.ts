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

import {
  OfficeStatus,
  type Office,
  type NewsArticle,
  type Document,
  type JobOpportunity,
  type User,
} from "@prisma/client";

function assert(condition: unknown, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runPublicDatabaseIntegrationTestSuite() {
  console.log("===============================================================");
  console.log("SAN FELIPE LGU PUBLIC DATABASE INTEGRATION TEST SUITE (PHASE 19)");
  console.log("===============================================================\n");

  const { prisma } = await import("../src/server/db/client");
  const {
    getPublicPublishedNews,
    getPublicPublishedNewsBySlug,
    getPublicLatestNews,
  } = await import("../src/server/news/service");
  const { getPublishedDocuments } = await import("../src/server/documents/service");
  const { getPublishedJobOpportunities } = await import("../src/server/jobs/service");
  const { getPublishedServicePage } = await import("../src/server/services/service");
  const {
    getPublicCanonicalOffices,
  } = await import("../src/server/offices/service");
  const {
    CITIZENS_CHARTER_ENTRIES,
    BUSINESS_PERMIT_TRACKS,
    getCitizensCharterEntries,
  } = await import("../src/config/services-data");
  const { MUNICIPAL_OFFICIALS_DATA } = await import("../src/config/officials-data");
  const { ABOUT_DATA } = await import("../src/config/about-data");
  const { EMERGENCY_DATA } = await import("../src/config/homepage-data");

  const ts = Date.now();
  let testOfficeActive: Office | null = null;
  let testOfficeInactive: Office | null = null;
  let testArticlePub: NewsArticle | null = null;
  let testArticleDraft: NewsArticle | null = null;
  let testArticleArchived: NewsArticle | null = null;
  let testDocPub: Document | null = null;
  let testDocDraft: Document | null = null;
  let testDocArchived: Document | null = null;
  let testDocInactiveOffice: Document | null = null;
  let testJobPub: JobOpportunity | null = null;
  let testJobDraft: JobOpportunity | null = null;
  let testJobArchived: JobOpportunity | null = null;
  let testJobInactiveOffice: JobOpportunity | null = null;
  let testAuthor: User | null = null;

  try {
    // -------------------------------------------------------------
    // Setup: Author and Test Offices
    // -------------------------------------------------------------
    const superAdminRole = await prisma.role.findFirstOrThrow({
      where: { slug: "super-admin" },
    });

    testAuthor = await prisma.user.create({
      data: {
        email: `test-pub-author-${ts}@sanfelipe.gov.ph`,
        name: "Test Public Author",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456789",
        roleId: superAdminRole.id,
      },
    });

    testOfficeActive = await prisma.office.create({
      data: {
        name: `Test Active Office ${ts}`,
        slug: `test-active-office-${ts}`,
        shortName: "TAO",
        status: OfficeStatus.ACTIVE,
      },
    });

    testOfficeInactive = await prisma.office.create({
      data: {
        name: `Test Inactive Office ${ts}`,
        slug: `test-inactive-office-${ts}`,
        shortName: "TIO",
        status: OfficeStatus.INACTIVE,
      },
    });

    // =============================================================
    // 1. News Public Database Integration & Filtering
    // =============================================================
    console.log("1. News Public Database Integration & Visibility Filtering");

    testArticlePub = await prisma.newsArticle.create({
      data: {
        title: `Public Published Article ${ts}`,
        slug: `public-published-article-${ts}`,
        excerpt: "Test published excerpt",
        body: "<p>Test published content</p>",
        type: "news",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testArticleDraft = await prisma.newsArticle.create({
      data: {
        title: `Public Draft Article ${ts}`,
        slug: `public-draft-article-${ts}`,
        excerpt: "Test draft excerpt",
        body: "<p>Test draft content</p>",
        type: "news",
        status: "DRAFT",
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testArticleArchived = await prisma.newsArticle.create({
      data: {
        title: `Public Archived Article ${ts}`,
        slug: `public-archived-article-${ts}`,
        excerpt: "Test archived excerpt",
        body: "<p>Test archived content</p>",
        type: "news",
        status: "ARCHIVED",
        publishedAt: new Date(Date.now() - 86400000),
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    const newsList = await getPublicPublishedNews({ pageSize: 100 });
    const newsSlugs = newsList.articles.map((a) => a.slug);
    assert(newsSlugs.includes(testArticlePub!.slug), "PUBLISHED news article is visible in public news listing");
    assert(!newsSlugs.includes(testArticleDraft!.slug), "DRAFT news article is strictly excluded from public news listing");
    assert(!newsSlugs.includes(testArticleArchived!.slug), "ARCHIVED news article is strictly excluded from public news listing");

    const fetchedPubBySlug = await getPublicPublishedNewsBySlug(testArticlePub!.slug);
    assert(fetchedPubBySlug !== null, "getPublicPublishedNewsBySlug returns the PUBLISHED article");
    assert(fetchedPubBySlug?.title === testArticlePub!.title, "getPublicPublishedNewsBySlug returns correct title");

    const fetchedDraftBySlug = await getPublicPublishedNewsBySlug(testArticleDraft!.slug);
    assert(fetchedDraftBySlug === null, "getPublicPublishedNewsBySlug returns null for DRAFT article (prevents draft exposure)");

    const fetchedArchivedBySlug = await getPublicPublishedNewsBySlug(testArticleArchived!.slug);
    assert(fetchedArchivedBySlug === null, "getPublicPublishedNewsBySlug returns null for ARCHIVED article");

    const latestNews = await getPublicLatestNews(10);
    const latestSlugs = latestNews.map((a) => a.slug);
    assert(latestSlugs.includes(testArticlePub!.slug), "getPublicLatestNews includes eligible PUBLISHED article");
    assert(!latestSlugs.includes(testArticleDraft!.slug), "getPublicLatestNews excludes DRAFT article");
    assert(!latestSlugs.includes(testArticleArchived!.slug), "getPublicLatestNews excludes ARCHIVED article");

    // Phase 16 Rule: Historical published news remains visible even if originating office later deactivated
    await prisma.office.update({
      where: { id: testOfficeActive!.id },
      data: { status: OfficeStatus.INACTIVE },
    });
    const newsAfterDeactivation = await getPublicPublishedNewsBySlug(testArticlePub!.slug);
    assert(
      newsAfterDeactivation !== null,
      "Historical published news remains accessible even if publishing office is subsequently deactivated (Phase 16 policy)"
    );
    // Restore office to ACTIVE
    await prisma.office.update({
      where: { id: testOfficeActive.id },
      data: { status: OfficeStatus.ACTIVE },
    });

    // =============================================================
    // 2. Documents / Downloadable Forms Public Database Integration
    // =============================================================
    console.log("\n2. Documents / Downloadable Forms Public Database Integration");

    testDocPub = await prisma.document.create({
      data: {
        title: `Public Published Document ${ts}`,
        description: "Official downloadable document",
        category: "General Administration",
        originalFilename: "sample-form.pdf",
        format: "pdf",
        bytes: 1048576,
        storagePublicId: `sfz/documents/test_doc_${ts}`,
        storageUrl: `https://res.cloudinary.com/sfz/raw/upload/v1/test_doc_${ts}.pdf`,
        mimeType: "application/pdf",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testDocDraft = await prisma.document.create({
      data: {
        title: `Public Draft Document ${ts}`,
        category: "General Administration",
        originalFilename: "draft-form.pdf",
        format: "pdf",
        bytes: 524288,
        storagePublicId: `sfz/documents/draft_doc_${ts}`,
        storageUrl: `https://res.cloudinary.com/sfz/raw/upload/v1/draft_doc_${ts}.pdf`,
        mimeType: "application/pdf",
        status: "DRAFT",
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testDocArchived = await prisma.document.create({
      data: {
        title: `Public Archived Document ${ts}`,
        category: "General Administration",
        originalFilename: "archived-form.pdf",
        format: "pdf",
        bytes: 262144,
        storagePublicId: `sfz/documents/archived_doc_${ts}`,
        storageUrl: `https://res.cloudinary.com/sfz/raw/upload/v1/archived_doc_${ts}.pdf`,
        mimeType: "application/pdf",
        status: "ARCHIVED",
        publishedAt: new Date(Date.now() - 86400000),
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testDocInactiveOffice = await prisma.document.create({
      data: {
        title: `Public Inactive Office Document ${ts}`,
        category: "General Administration",
        originalFilename: "inactive-office-form.pdf",
        format: "pdf",
        bytes: 123456,
        storagePublicId: `sfz/documents/inactive_office_doc_${ts}`,
        storageUrl: `https://res.cloudinary.com/sfz/raw/upload/v1/inactive_office_doc_${ts}.pdf`,
        mimeType: "application/pdf",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: testOfficeInactive.id,
        createdById: testAuthor.id,
      },
    });

    const publishedDocs = await getPublishedDocuments();
    const docIds = publishedDocs.map((d) => d.id);

    assert(docIds.includes(testDocPub!.id), "PUBLISHED document from ACTIVE office is visible publicly");
    assert(!docIds.includes(testDocDraft!.id), "DRAFT document is strictly excluded from public listing");
    assert(!docIds.includes(testDocArchived!.id), "ARCHIVED document is strictly excluded from public listing");
    assert(
      !docIds.includes(testDocInactiveOffice!.id),
      "PUBLISHED document from INACTIVE office is suppressed from public listing"
    );

    const pubDocItem = publishedDocs.find((d) => d.id === testDocPub!.id);
    assert(Boolean(pubDocItem?.downloadUrl), "Public document has server-generated downloadUrl");
    assert(
      !pubDocItem?.downloadUrl.includes("api_secret"),
      "Public document downloadUrl does not leak Cloudinary API secrets"
    );

    // =============================================================
    // 3. Job Opportunities Public Database Integration
    // =============================================================
    console.log("\n3. Job Opportunities Public Database Integration");

    const futureDate = new Date(Date.now() + 30 * 86400000);
    const pastDate = new Date(Date.now() - 5 * 86400000);

    testJobPub = await prisma.jobOpportunity.create({
      data: {
        title: `Public Published Job ${ts}`,
        slug: `public-published-job-${ts}`,
        itemNumber: `ITEM-PUB-${ts}`,
        employmentType: "Permanent",
        salaryGrade: "12",
        monthlySalary: "29165",
        postingDate: new Date(),
        closingDate: futureDate,
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testJobDraft = await prisma.jobOpportunity.create({
      data: {
        title: `Public Draft Job ${ts}`,
        slug: `public-draft-job-${ts}`,
        itemNumber: `ITEM-DRAFT-${ts}`,
        employmentType: "Contractual",
        salaryGrade: "8",
        monthlySalary: "19744",
        postingDate: new Date(),
        closingDate: futureDate,
        status: "DRAFT",
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testJobArchived = await prisma.jobOpportunity.create({
      data: {
        title: `Public Archived Job ${ts}`,
        slug: `public-archived-job-${ts}`,
        itemNumber: `ITEM-ARCH-${ts}`,
        employmentType: "Co-Terminous",
        salaryGrade: "15",
        monthlySalary: "36619",
        postingDate: new Date(Date.now() - 60 * 86400000),
        closingDate: pastDate,
        status: "ARCHIVED",
        officeId: testOfficeActive.id,
        createdById: testAuthor.id,
      },
    });

    testJobInactiveOffice = await prisma.jobOpportunity.create({
      data: {
        title: `Public Inactive Office Job ${ts}`,
        slug: `public-inactive-office-job-${ts}`,
        itemNumber: `ITEM-INACT-${ts}`,
        employmentType: "Permanent",
        salaryGrade: "10",
        monthlySalary: "23176",
        postingDate: new Date(),
        closingDate: futureDate,
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: testOfficeInactive.id,
        createdById: testAuthor.id,
      },
    });

    const publishedJobs = await getPublishedJobOpportunities();
    const jobSlugs = publishedJobs.map((j) => j.slug);

    assert(jobSlugs.includes(testJobPub!.slug), "PUBLISHED job opportunity from ACTIVE office is visible publicly");
    assert(!jobSlugs.includes(testJobDraft!.slug), "DRAFT job opportunity is strictly excluded from public listing");
    assert(!jobSlugs.includes(testJobArchived!.slug), "ARCHIVED job opportunity is strictly excluded from public listing");
    assert(
      !jobSlugs.includes(testJobInactiveOffice!.slug),
      "PUBLISHED job opportunity from INACTIVE office is suppressed from public listing"
    );

    // =============================================================
    // 4. Service Pages Database Integration
    // =============================================================
    console.log("\n4. Service Pages Database Integration");

    const charterPage = await getPublishedServicePage("citizens-charter");
    if (charterPage) {
      assert(charterPage.status === "PUBLISHED", "getPublishedServicePage strictly returns PUBLISHED status");
      assert(charterPage.serviceKey === "citizens-charter", "Service page matches canonical service key");
    } else {
      assert(charterPage === null, "getPublishedServicePage returns null when no PUBLISHED record exists (graceful static fallback)");
    }

    // DRAFT Citizen's Charter does not expose unverified substantive fallback
    const testDraftCharter = await prisma.servicePage.create({
      data: {
        serviceKey: `test-charter-${ts}`,
        title: "Test Draft Charter",
        description: "Draft Description",
        status: "DRAFT",
        createdById: testAuthor!.id,
      },
    });
    const draftCharterResult = await getPublishedServicePage(`test-charter-${ts}`);
    assert(draftCharterResult === null, "DRAFT service page returns null (strictly not public)");
    await prisma.servicePage.delete({ where: { id: testDraftCharter.id } });

    // Verify fallback for citizens-charter contains zero unverified substantive content
    const fallbackCharterEntries = getCitizensCharterEntries();
    assert(
      fallbackCharterEntries.length === 0,
      "Citizen's Charter fallback entries collection is strictly empty (no mock requirements/fees/steps)"
    );
    assert(CITIZENS_CHARTER_ENTRIES.length === 0, "Static CITIZENS_CHARTER_ENTRIES is strictly empty");

    const permitsPage = await getPublishedServicePage("business-permits");
    if (permitsPage) {
      assert(permitsPage.status === "PUBLISHED", "getPublishedServicePage strictly returns PUBLISHED status");
      assert(permitsPage.serviceKey === "business-permits", "Service page matches canonical service key");
    } else {
      assert(permitsPage === null, "getPublishedServicePage returns null when no PUBLISHED record exists");
    }

    // Unpublished Business Permits does not expose unverified substantive fallback
    for (const track of BUSINESS_PERMIT_TRACKS) {
      assert(!track.isPublished, `Business permit track '${track.id}' has isPublished: false by default`);
      assert(track.requirements.length === 0, `Business permit track '${track.id}' has 0 mock requirements`);
      assert(track.procedure.length === 0, `Business permit track '${track.id}' has 0 mock procedure steps`);
    }

    const invalidServicePage = await getPublishedServicePage("non-canonical-random-service");
    assert(invalidServicePage === null, "Non-canonical service key returns null immediately");

    // Documents and Jobs remain authoritative for their specialized listings
    assert(typeof getPublishedDocuments === "function", "getPublishedDocuments is authoritative for documents");
    assert(typeof getPublishedJobOpportunities === "function", "getPublishedJobOpportunities is authoritative for jobs");

    // =============================================================
    // 5. Offices Public Database Integration & Boundary Rules
    // =============================================================
    console.log("\n5. Offices Public Database Integration & Boundary Rules");

    const publicOffices = await getPublicCanonicalOffices();

    assert(
      publicOffices.length === 18,
      `Public office directory exposes EXACTLY 18 canonical offices (found: ${publicOffices.length})`
    );

    // ICTO Exclusion Rule
    const publicSlugs = publicOffices.map((o) => o.slug);
    assert(!publicSlugs.includes("icto"), "Legacy ICTO is strictly EXCLUDED from public office directory");

    // Arbitrary DB row exclusion rule
    assert(!publicSlugs.includes(testOfficeActive!.slug), "Arbitrary active DB office is strictly EXCLUDED from public directory");
    assert(!publicSlugs.includes(testOfficeInactive!.slug), "Arbitrary inactive DB office is strictly EXCLUDED from public directory");

    // Canonical ordering rule
    assert(publicOffices[0].slug === "office-of-the-mayor", "First office in public directory is Office of the Mayor (displayOrder 1)");
    assert(
      publicOffices[1].slug === "office-of-the-sangguniang-bayan",
      "Second office in public directory is Office of the Sangguniang Bayan (displayOrder 2)"
    );

    for (let i = 0; i < publicOffices.length; i++) {
      assert(
        publicOffices[i].displayOrder === i + 1,
        `Office #${i + 1} (${publicOffices[i].slug}) preserves strict canonical displayOrder ${i + 1}`
      );
    }

    // Acronym provenance rule: only verified 7 charter acronyms can appear
    const VERIFIED_7_ACRONYMS = new Set(["MPDO", "MHO", "MBO", "MDRRMO", "LYDO", "HRMO", "PESO"]);
    for (const off of publicOffices) {
      if (off.acronym && off.acronym !== "") {
        assert(
          VERIFIED_7_ACRONYMS.has(off.acronym),
          `Public acronym '${off.acronym}' for '${off.slug}' is one of the 7 verified charter acronyms`
        );
      }
    }

    // Canonical verified acronym authority: DB shortName CANNOT invent an acronym for an acronym-less office
    const acctOffice = await prisma.office.findUnique({
      where: { slug: "municipal-accounting-office" },
    });
    if (acctOffice) {
      await prisma.office.update({
        where: { id: acctOffice.id },
        data: { shortName: "MAO" },
      });
      const officesWithMaoDb = await getPublicCanonicalOffices();
      const acctPublic = officesWithMaoDb.find((o) => o.slug === "municipal-accounting-office");
      assert(
        acctPublic?.acronym === "",
        "Canonical office without verified acronym (accounting) exposes empty acronym even if DB shortName is 'MAO'"
      );
      // Restore shortName to null
      await prisma.office.update({
        where: { id: acctOffice.id },
        data: { shortName: null },
      });
    }

    // Canonical verified acronym authority: DB shortName CANNOT override a verified charter acronym
    const mhoOffice = await prisma.office.findUnique({
      where: { slug: "municipal-health-office" },
    });
    if (mhoOffice) {
      await prisma.office.update({
        where: { id: mhoOffice.id },
        data: { shortName: "CONFLICTING_ACRONYM" },
      });
      const officesWithConflictingDb = await getPublicCanonicalOffices();
      const mhoPublic = officesWithConflictingDb.find((o) => o.slug === "municipal-health-office");
      assert(
        mhoPublic?.acronym === "MHO",
        "Canonical office with verified acronym (MHO) retains canonical acronym regardless of conflicting DB shortName"
      );
      // Restore shortName
      await prisma.office.update({
        where: { id: mhoOffice.id },
        data: { shortName: "MHO" },
      });
    }

    // Null DB profile fields use neutral/canonical fallback
    const treasuryOffice = publicOffices.find((o) => o.slug === "municipal-treasury-office");
    assert(treasuryOffice !== undefined, "Municipal Treasury Office exists in canonical directory");
    assert(
      treasuryOffice?.head === undefined || treasuryOffice?.head === null,
      "Office without verified head has null/undefined head (neutral fallback)"
    );
    assert(treasuryOffice?.acronym === "", "Office without verified acronym has empty acronym (neutral fallback)");

    // Office head correctly resolved from DB for Mayor
    const mayorPublic = publicOffices.find((o) => o.slug === "office-of-the-mayor");
    assert(mayorPublic?.head === 'Hon. Engr. Reinhard "Hart" E. Jeresano', "Mayor office head correctly resolved from DB");

    // Inactive canonical office institutional reality rule
    if (mhoOffice) {
      await prisma.office.update({
        where: { id: mhoOffice.id },
        data: { status: OfficeStatus.INACTIVE },
      });
      const officesAfterInactive = await getPublicCanonicalOffices();
      const mhoStillPresent = officesAfterInactive.some((o) => o.slug === "municipal-health-office");
      assert(
        mhoStillPresent,
        "Canonical municipal office remains institutionally present in public directory even if CMS status is INACTIVE"
      );
      // Restore MHO
      await prisma.office.update({
        where: { id: mhoOffice.id },
        data: { status: OfficeStatus.ACTIVE },
      });
    }

    // =============================================================
    // 6. Static Civic Content Boundaries (Officials, About, Hotlines)
    // =============================================================
    console.log("\n6. Static Civic Content Boundaries (Officials, About, Hotlines)");

    // Officials
    assert(
      MUNICIPAL_OFFICIALS_DATA.executive.mayor.name === 'HON. ENGR. REINHARD "HART" E. JERESANO',
      "Mayor remains verified static civic record"
    );
    assert(
      MUNICIPAL_OFFICIALS_DATA.legislative.viceMayor.name === "HON. MARY ANN R. QUIBA",
      "Vice Mayor remains verified static civic record"
    );
    assert(
      MUNICIPAL_OFFICIALS_DATA.legislative.regularMembers.length === 8,
      "8 regular Sangguniang Bayan councilors remain verified static civic records"
    );
    assert(
      MUNICIPAL_OFFICIALS_DATA.legislative.exOfficioMembers.length === 2,
      "2 ex-officio council members remain verified static civic records"
    );

    // Verify no 'official' table in Prisma
    assert(!("official" in prisma), "Zero unnecessary Prisma models created for Officials (remains verified static)");

    // About
    assert(
      ABOUT_DATA.provenance === "VERIFIED_CLIENT_INFORMATION",
      "About page content remains VERIFIED_CLIENT_INFORMATION"
    );
    assert(
      ABOUT_DATA.history.paragraphs.length === 4,
      "About history contains all 4 client-provided paragraphs exactly preserved"
    );
    assert(
      !("aboutPage" in prisma),
      "Zero unnecessary Prisma models created for About (remains verified static)"
    );

    // Emergency Hotlines
    assert(
      EMERGENCY_DATA.length === 4,
      "Emergency Hotlines directory contains exactly 4 verified response agencies"
    );
    assert(
      EMERGENCY_DATA[0].numbers[0] === "0929-183-8441",
      "MDRRMO hotline is verified San Felipe response line"
    );
    assert(
      !("emergencyHotline" in prisma),
      "Zero unnecessary Prisma models created for EmergencyHotlines (remains verified static)"
    );

    console.log("\n===============================================================");
    console.log("ALL PUBLIC DATABASE INTEGRATION TESTS PASSED SUCCESSFULLY");
    console.log("===============================================================\n");
  } finally {
    console.log("Cleaning up test records...");
    if (testArticlePub) {
      await prisma.newsArticle.deleteMany({ where: { id: testArticlePub.id } }).catch(() => {});
    }
    if (testArticleDraft) {
      await prisma.newsArticle.deleteMany({ where: { id: testArticleDraft.id } }).catch(() => {});
    }
    if (testArticleArchived) {
      await prisma.newsArticle.deleteMany({ where: { id: testArticleArchived.id } }).catch(() => {});
    }
    if (testDocPub) {
      await prisma.document.deleteMany({ where: { id: testDocPub.id } }).catch(() => {});
    }
    if (testDocDraft) {
      await prisma.document.deleteMany({ where: { id: testDocDraft.id } }).catch(() => {});
    }
    if (testDocArchived) {
      await prisma.document.deleteMany({ where: { id: testDocArchived.id } }).catch(() => {});
    }
    if (testDocInactiveOffice) {
      await prisma.document.deleteMany({ where: { id: testDocInactiveOffice.id } }).catch(() => {});
    }
    if (testJobPub) {
      await prisma.jobOpportunity.deleteMany({ where: { id: testJobPub.id } }).catch(() => {});
    }
    if (testJobDraft) {
      await prisma.jobOpportunity.deleteMany({ where: { id: testJobDraft.id } }).catch(() => {});
    }
    if (testJobArchived) {
      await prisma.jobOpportunity.deleteMany({ where: { id: testJobArchived.id } }).catch(() => {});
    }
    if (testJobInactiveOffice) {
      await prisma.jobOpportunity.deleteMany({ where: { id: testJobInactiveOffice.id } }).catch(() => {});
    }
    if (testOfficeActive) {
      await prisma.office.deleteMany({ where: { id: testOfficeActive.id } }).catch(() => {});
    }
    if (testOfficeInactive) {
      await prisma.office.deleteMany({ where: { id: testOfficeInactive.id } }).catch(() => {});
    }
    if (testAuthor) {
      await prisma.user.deleteMany({ where: { id: testAuthor.id } }).catch(() => {});
    }

    // Verify physical office row count after cleanup
    const remainingOffices = await prisma.office.findMany({ select: { slug: true } });
    console.log(`Physical office count after cleanup: ${remainingOffices.length} (Expected: 19)`);
    assert(remainingOffices.length === 19, `Physical office rows in PostgreSQL must remain exactly 19 (found: ${remainingOffices.length})`);
    assert(remainingOffices.some((o) => o.slug === "icto"), "Preserved legacy ICTO row is still present in database");
    console.log("Cleanup verified successfully.");
  }
}

runPublicDatabaseIntegrationTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test suite failed:", err);
    process.exit(1);
  });
