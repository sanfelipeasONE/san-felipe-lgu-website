import "server-only";
import { prisma } from "@/server/db/client";
import type { NewsStatus, DocumentStatus, JobOpportunityStatus } from "@prisma/client";
import type { SessionUser } from "@/server/auth/session";
import { canViewAuditLogs } from "@/server/audit/query";
import { hasPermission, canAccessOffice } from "@/lib/authz/scope";
import { isJobClosed } from "@/lib/validation/jobs";
import { getCanonicalOffices } from "@/config/offices-data";

export interface DashboardSummaryMetrics {
  publishedNewsCount: number;
  publishedDocumentsCount: number;
  activeJobsCount: number;
  activeStaffCount: number;
}

export interface PublishingActivityMonth {
  monthKey: string; // e.g. "2026-05"
  label: string; // e.g. "May"
  year: number;
  news: number;
  documents: number;
  jobs: number;
}

export interface PublishingActivityData {
  months: PublishingActivityMonth[];
  maxCount: number;
  totalPeriodPublished: number;
}

export interface PublishedContentDistribution {
  news: number;
  documents: number;
  jobs: number;
  total: number;
}

export interface RecentContentItem {
  id: string;
  title: string;
  type: "news" | "document" | "job";
  typeLabel: "News" | "Document" | "Job Opportunity";
  officeId: string;
  officeName: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  updatedAt: Date;
  editHref: string;
  canEdit: boolean;
}

export interface OfficeContentDistributionItem {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  count: number;
  newsCount: number;
  docsCount: number;
  jobsCount: number;
}

export interface OfficeContentDistributionData {
  offices: OfficeContentDistributionItem[];
  totalActiveItems: number;
  reportingOfficeCount: number;
  isOfficeScoped: boolean;
  assignedOfficeName?: string;
}

export interface RecentAdministrativeActivityItem {
  id: string;
  action: string;
  actionLabel: string;
  moduleLabel: string;
  userName: string;
  officeName: string;
  dotColor: "emerald" | "blue" | "amber" | "rose" | "slate";
  createdAt: Date;
}

/**
 * Derives the last 6 calendar months based on Asia/Manila (UTC+8) time.
 */
function getLast6ManilaMonths(referenceDate = new Date()): {
  monthKey: string;
  label: string;
  year: number;
  startUtc: Date;
  endUtc: Date;
}[] {
  // Get current year and month in Asia/Manila
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(referenceDate);
  const currentYear = Number(parts.find((p) => p.type === "year")?.value || referenceDate.getFullYear());
  const currentMonth = Number(parts.find((p) => p.type === "month")?.value || referenceDate.getMonth() + 1);

  const months: {
    monthKey: string;
    label: string;
    year: number;
    startUtc: Date;
    endUtc: Date;
  }[] = [];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 5; i >= 0; i--) {
    let year = currentYear;
    let month = currentMonth - i;
    while (month <= 0) {
      month += 12;
      year -= 1;
    }

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const label = monthNames[month - 1];

    // Manila is UTC+8. Midnight at the start of the 1st day in Manila is (year, month-1, 1, 00:00:00 +08:00) -> -8 hours in UTC
    const startUtc = new Date(Date.UTC(year, month - 1, 1, -8, 0, 0, 0));
    // End of month: start of next month - 1ms
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const endUtc = new Date(Date.UTC(nextYear, nextMonth - 1, 1, -8, 0, 0, -1));

    months.push({
      monthKey,
      label,
      year,
      startUtc,
      endUtc,
    });
  }

  return months;
}

/**
 * 1. Summary Metrics: Real database-backed summary counts scoped to user authority.
 */
export async function getDashboardSummaryMetrics(
  user: SessionUser
): Promise<DashboardSummaryMetrics> {
  const isSystem = Boolean(user.isSystemScope || user.role?.isSystemScope);
  const officeFilter = isSystem ? {} : (user.officeId ? { officeId: user.officeId } : {});
  const canonicalSlugs = getCanonicalOffices().map((o) => o.slug);

  const activeStaffCountPromise = isSystem
    ? prisma.user.count({
        where: {
          status: "ACTIVE",
          role: { slug: "staff" },
          office: {
            slug: { in: canonicalSlugs, not: "icto" },
          },
        },
      })
    : user.officeId
    ? prisma.user.count({
        where: {
          status: "ACTIVE",
          role: { slug: "staff" },
          officeId: user.officeId,
        },
      })
    : Promise.resolve(0);

  const [publishedNewsCount, publishedDocumentsCount, publishedJobs, activeStaffCount] =
    await Promise.all([
      // Published News
      prisma.newsArticle.count({
        where: {
          status: "PUBLISHED",
          ...officeFilter,
        },
      }),

      // Published Documents
      prisma.document.count({
        where: {
          status: "PUBLISHED",
          ...officeFilter,
        },
      }),

      // Published Jobs for Active Opportunities check
      prisma.jobOpportunity.findMany({
        where: {
          status: "PUBLISHED",
          ...officeFilter,
        },
        select: {
          closingDate: true,
        },
      }),

      // Active Staff Accounts: strictly ACTIVE users assigned to canonical Staff role
      activeStaffCountPromise,
    ]);

  // Active Job Opportunities: strictly currently open per Asia/Manila date semantics
  const activeJobsCount = publishedJobs.filter((j) => !isJobClosed(j.closingDate)).length;

  return {
    publishedNewsCount,
    publishedDocumentsCount,
    activeJobsCount,
    activeStaffCount,
  };
}

/**
 * 2. Content Publishing Activity: 6-month historical publication analytics from real publishedAt timestamps.
 */
export async function getContentPublishingActivity(
  user: SessionUser
): Promise<PublishingActivityData> {
  const isSystem = Boolean(user.isSystemScope || user.role?.isSystemScope);
  const officeFilter = isSystem ? {} : (user.officeId ? { officeId: user.officeId } : {});

  const months = getLast6ManilaMonths();
  const windowStart = months[0].startUtc;
  const windowEnd = months[months.length - 1].endUtc;

  const [newsRecords, docRecords, jobRecords] = await Promise.all([
    prisma.newsArticle.findMany({
      where: {
        publishedAt: { gte: windowStart, lte: windowEnd },
        status: "PUBLISHED",
        ...officeFilter,
      },
      select: { publishedAt: true },
    }),
    prisma.document.findMany({
      where: {
        publishedAt: { gte: windowStart, lte: windowEnd },
        status: "PUBLISHED",
        ...officeFilter,
      },
      select: { publishedAt: true },
    }),
    prisma.jobOpportunity.findMany({
      where: {
        publishedAt: { gte: windowStart, lte: windowEnd },
        status: "PUBLISHED",
        ...officeFilter,
      },
      select: { publishedAt: true },
    }),
  ]);

  let maxCount = 0;
  let totalPeriodPublished = 0;

  const resultMonths: PublishingActivityMonth[] = months.map((m) => {
    const news = newsRecords.filter(
      (r) => r.publishedAt && r.publishedAt >= m.startUtc && r.publishedAt <= m.endUtc
    ).length;
    const documents = docRecords.filter(
      (r) => r.publishedAt && r.publishedAt >= m.startUtc && r.publishedAt <= m.endUtc
    ).length;
    const jobs = jobRecords.filter(
      (r) => r.publishedAt && r.publishedAt >= m.startUtc && r.publishedAt <= m.endUtc
    ).length;

    maxCount = Math.max(maxCount, news, documents, jobs);
    totalPeriodPublished += news + documents + jobs;

    return {
      monthKey: m.monthKey,
      label: m.label,
      year: m.year,
      news,
      documents,
      jobs,
    };
  });

  return {
    months: resultMonths,
    maxCount,
    totalPeriodPublished,
  };
}

/**
 * 3. Published Content Distribution: Current breakdown by content type.
 */
export async function getPublishedContentDistribution(
  user: SessionUser
): Promise<PublishedContentDistribution> {
  const isSystem = Boolean(user.isSystemScope || user.role?.isSystemScope);
  const officeFilter = isSystem ? {} : (user.officeId ? { officeId: user.officeId } : {});

  const [news, documents, jobs] = await Promise.all([
    prisma.newsArticle.count({
      where: { status: "PUBLISHED", ...officeFilter },
    }),
    prisma.document.count({
      where: { status: "PUBLISHED", ...officeFilter },
    }),
    prisma.jobOpportunity.count({
      where: { status: "PUBLISHED", ...officeFilter },
    }),
  ]);

  return {
    news,
    documents,
    jobs,
    total: news + documents + jobs,
  };
}

/**
 * 4. Recent Content: Unified CMS content records with permission-aware actions and bounded limit.
 */
export async function getRecentContent(
  user: SessionUser,
  filters?: {
    type?: string;
    status?: string;
    limit?: number;
  }
): Promise<RecentContentItem[]> {
  const isSystem = Boolean(user.isSystemScope || user.role?.isSystemScope);
  const officeFilter = isSystem ? {} : (user.officeId ? { officeId: user.officeId } : {});
  const requestedLimit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 20) : 10;

  const typeFilter = filters?.type && filters.type !== "all" ? filters.type : undefined;
  const statusFilter = filters?.status && filters.status !== "all" ? filters.status : undefined;

  const promises: Promise<RecentContentItem[]>[] = [];

  // Query News if type allows
  if (!typeFilter || typeFilter === "news") {
    promises.push(
      prisma.newsArticle
        .findMany({
          where: {
            ...officeFilter,
            ...(statusFilter ? { status: statusFilter as NewsStatus } : {}),
          },
          take: requestedLimit,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            officeId: true,
            updatedAt: true,
            office: { select: { name: true, shortName: true } },
          },
        })
        .then((articles) =>
          articles.map((article) => ({
            id: article.id,
            title: article.title,
            type: "news" as const,
            typeLabel: "News" as const,
            officeId: article.officeId,
            officeName: article.office.shortName
              ? `${article.office.name} (${article.office.shortName})`
              : article.office.name,
            status: article.status as "PUBLISHED" | "DRAFT" | "ARCHIVED",
            updatedAt: article.updatedAt,
            editHref: `/admin/news/${article.id}/edit`,
            canEdit:
              hasPermission(user, "posts.update") &&
              canAccessOffice(user, article.officeId),
          }))
        )
    );
  }

  // Query Documents if type allows
  if (!typeFilter || typeFilter === "document") {
    promises.push(
      prisma.document
        .findMany({
          where: {
            ...officeFilter,
            ...(statusFilter ? { status: statusFilter as DocumentStatus } : {}),
          },
          take: requestedLimit,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            officeId: true,
            updatedAt: true,
            office: { select: { name: true, shortName: true } },
          },
        })
        .then((docs) =>
          docs.map((doc) => ({
            id: doc.id,
            title: doc.title,
            type: "document" as const,
            typeLabel: "Document" as const,
            officeId: doc.officeId,
            officeName: doc.office.shortName
              ? `${doc.office.name} (${doc.office.shortName})`
              : doc.office.name,
            status: doc.status as "PUBLISHED" | "DRAFT" | "ARCHIVED",
            updatedAt: doc.updatedAt,
            editHref: `/admin/documents/${doc.id}/edit`,
            canEdit:
              hasPermission(user, "documents.update") &&
              canAccessOffice(user, doc.officeId),
          }))
        )
    );
  }

  // Query Jobs if type allows
  if (!typeFilter || typeFilter === "job") {
    promises.push(
      prisma.jobOpportunity
        .findMany({
          where: {
            ...officeFilter,
            ...(statusFilter ? { status: statusFilter as JobOpportunityStatus } : {}),
          },
          take: requestedLimit,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            officeId: true,
            updatedAt: true,
            office: { select: { name: true, shortName: true } },
          },
        })
        .then((jobs) =>
          jobs.map((job) => ({
            id: job.id,
            title: job.title,
            type: "job" as const,
            typeLabel: "Job Opportunity" as const,
            officeId: job.officeId,
            officeName: job.office.shortName
              ? `${job.office.name} (${job.office.shortName})`
              : job.office.name,
            status: job.status as "PUBLISHED" | "DRAFT" | "ARCHIVED",
            updatedAt: job.updatedAt,
            editHref: `/admin/jobs/${job.id}/edit`,
            canEdit:
              hasPermission(user, "jobs.update") &&
              canAccessOffice(user, job.officeId),
          }))
        )
    );
  }

  const results = await Promise.all(promises);
  const flattened = results.flat();

  // Sort unified content by updatedAt descending and slice to requested limit
  flattened.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return flattened.slice(0, requestedLimit);
}

/**
 * 5. Published Content by Office: Real office-owned database content attribution.
 * Strictly excludes noncanonical legacy ICTO.
 * Enforces office scope boundary (OFFICE users see only their assigned office).
 */
export async function getPublishedContentByOffice(
  user: SessionUser
): Promise<OfficeContentDistributionData> {
  const isSystem = Boolean(user.isSystemScope || user.role?.isSystemScope);

  const canonicalList = getCanonicalOffices();
  const canonicalSlugs = canonicalList.map((o) => o.slug);

  if (!isSystem && user.officeId) {
    // OFFICE Scope: strictly query and display own assigned canonical office only
    const office = await prisma.office.findUnique({
      where: { id: user.officeId },
      select: { id: true, name: true, shortName: true, slug: true },
    });

    const isCanonical = office && canonicalSlugs.includes(office.slug) && office.slug !== "icto";

    if (!office || !isCanonical) {
      return {
        offices: [],
        totalActiveItems: 0,
        reportingOfficeCount: 0,
        isOfficeScoped: true,
      };
    }

    const [newsCount, docsCount, jobsCount] = await Promise.all([
      prisma.newsArticle.count({
        where: { status: "PUBLISHED", officeId: office.id },
      }),
      prisma.document.count({
        where: { status: "PUBLISHED", officeId: office.id },
      }),
      prisma.jobOpportunity.count({
        where: { status: "PUBLISHED", officeId: office.id },
      }),
    ]);

    const total = newsCount + docsCount + jobsCount;
    const canonEntry = canonicalList.find((c) => c.slug === office.slug);
    const shortName = canonEntry?.acronym || office.shortName || null;

    return {
      offices: [
        {
          id: office.id,
          name: canonEntry?.name || office.name,
          shortName,
          slug: office.slug,
          count: total,
          newsCount,
          docsCount,
          jobsCount,
        },
      ],
      totalActiveItems: total,
      reportingOfficeCount: total > 0 ? 1 : 0,
      isOfficeScoped: true,
      assignedOfficeName: canonEntry?.name || office.name,
    };
  }

  // SYSTEM Scope: exactly the 18 canonical municipal offices in canonical ordering
  // Fetch canonical office rows from DB (strictly excluding noncanonical ICTO, regardless of office status)
  const dbOffices = await prisma.office.findMany({
    where: {
      slug: { in: canonicalSlugs, not: "icto" },
    },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
    },
  });

  const officeIds = dbOffices.map((o) => o.id);

  const [newsGroup, docsGroup, jobsGroup] = await Promise.all([
    prisma.newsArticle.groupBy({
      by: ["officeId"],
      _count: { id: true },
      where: {
        status: "PUBLISHED",
        officeId: { in: officeIds },
      },
    }),
    prisma.document.groupBy({
      by: ["officeId"],
      _count: { id: true },
      where: {
        status: "PUBLISHED",
        officeId: { in: officeIds },
      },
    }),
    prisma.jobOpportunity.groupBy({
      by: ["officeId"],
      _count: { id: true },
      where: {
        status: "PUBLISHED",
        officeId: { in: officeIds },
      },
    }),
  ]);

  const newsMap = new Map(newsGroup.map((g) => [g.officeId, g._count.id]));
  const docsMap = new Map(docsGroup.map((g) => [g.officeId, g._count.id]));
  const jobsMap = new Map(jobsGroup.map((g) => [g.officeId, g._count.id]));

  const dbOfficeBySlug = new Map(dbOffices.map((o) => [o.slug, o]));

  let totalActiveItems = 0;
  // Map strictly over canonicalList to preserve exact canonical ordering (displayOrder 1..18).
  // Inactive canonical offices are included; zero published content renders honestly as zero.
  const items: OfficeContentDistributionItem[] = canonicalList.map((canon) => {
    const dbOffice = dbOfficeBySlug.get(canon.slug);
    const officeDbId = dbOffice?.id;
    const newsCount = officeDbId ? (newsMap.get(officeDbId) || 0) : 0;
    const docsCount = officeDbId ? (docsMap.get(officeDbId) || 0) : 0;
    const jobsCount = officeDbId ? (jobsMap.get(officeDbId) || 0) : 0;
    const count = newsCount + docsCount + jobsCount;
    totalActiveItems += count;

    // Use verified acronym from canonical config if present, or DB shortName
    const shortName = canon.acronym || dbOffice?.shortName || null;

    return {
      id: officeDbId || canon.id,
      name: canon.name,
      shortName,
      slug: canon.slug,
      count,
      newsCount,
      docsCount,
      jobsCount,
    };
  });

  const reportingOffices = items.filter((o) => o.count > 0);

  return {
    offices: items,
    totalActiveItems,
    reportingOfficeCount: reportingOffices.length,
    isOfficeScoped: false,
  };
}

/**
 * Maps raw audit action string to formatted human-readable action label and module name.
 */
function formatAuditAction(action: string): {
  actionLabel: string;
  moduleLabel: string;
  dotColor: "emerald" | "blue" | "amber" | "rose" | "slate";
} {
  const lower = action.toLowerCase();

  let dotColor: "emerald" | "blue" | "amber" | "rose" | "slate" = "blue";
  if (lower.includes("publish") || lower.includes("success") || lower.includes("created")) {
    dotColor = "emerald";
  } else if (lower.includes("draft") || lower.includes("update") || lower.includes("modified")) {
    dotColor = "amber";
  } else if (lower.includes("fail") || lower.includes("revoke") || lower.includes("delete") || lower.includes("disable")) {
    dotColor = "rose";
  }

  // Derive module label
  let moduleLabel = "System Administration";
  if (lower.startsWith("post") || lower.startsWith("news")) {
    moduleLabel = "News & Advisories";
  } else if (lower.startsWith("document")) {
    moduleLabel = "Documents";
  } else if (lower.startsWith("job")) {
    moduleLabel = "Job Opportunities";
  } else if (lower.startsWith("service")) {
    moduleLabel = "Municipal Services";
  } else if (lower.startsWith("user") || lower.startsWith("auth") || lower.startsWith("session")) {
    moduleLabel = "Staff Accounts & Auth";
  } else if (lower.startsWith("office")) {
    moduleLabel = "Municipal Offices";
  } else if (lower.startsWith("role")) {
    moduleLabel = "Roles & Permissions";
  }

  // Humanize action label
  let actionLabel = action.replace(/_/g, " ").replace(/\./g, " : ");
  if (action === "posts.publish") actionLabel = "Content Published";
  else if (action === "documents.publish") actionLabel = "Document Published";
  else if (action === "documents.create") actionLabel = "Document Uploaded";
  else if (action === "jobs.publish") actionLabel = "Job Vacancy Posted";
  else if (action === "jobs.create") actionLabel = "Job Draft Created";
  else if (action === "posts.create") actionLabel = "Draft Created";
  else if (action === "posts.update") actionLabel = "Draft Updated";
  else if (action === "auth.login_success") actionLabel = "Staff Authenticated";
  else if (action === "users.create") actionLabel = "Staff Account Created";
  else if (action === "users.update") actionLabel = "Staff Account Updated";
  else if (action === "offices.update") actionLabel = "Office Profile Updated";

  return { actionLabel, moduleLabel, dotColor };
}

/**
 * 6. Recent Administrative Activity: Authoritative audit trail for authorized SYSTEM + audit.view users only.
 * If user lacks authorization, returns null with zero audit querying.
 */
export async function getRecentAdministrativeActivity(
  user: SessionUser,
  limit = 5
): Promise<RecentAdministrativeActivityItem[] | null> {
  // Authorization boundary: strictly SYSTEM scope + audit.view required
  if (!canViewAuditLogs(user)) {
    return null;
  }

  const boundedLimit = Math.min(Math.max(limit, 1), 20);

  const logs = await prisma.auditLog.findMany({
    take: boundedLimit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (logs.length === 0) {
    return [];
  }

  // Resolve office names for logs with officeId
  const officeIds = Array.from(new Set(logs.map((l) => l.officeId).filter((id): id is string => Boolean(id))));
  const offices =
    officeIds.length > 0
      ? await prisma.office.findMany({
          where: { id: { in: officeIds } },
          select: { id: true, name: true, shortName: true },
        })
      : [];
  const officeMap = new Map(
    offices.map((o) => [o.id, o.shortName ? `${o.name} (${o.shortName})` : o.name])
  );

  return logs.map((log) => {
    const { actionLabel, moduleLabel, dotColor } = formatAuditAction(log.action);
    const officeName = log.officeId
      ? officeMap.get(log.officeId) || "Municipal Office"
      : "System-Wide";
    const userName = log.user?.name || (log.userId ? "Staff User" : "System");

    return {
      id: log.id,
      action: log.action,
      actionLabel,
      moduleLabel,
      userName,
      officeName,
      dotColor,
      createdAt: log.createdAt,
    };
  });
}
