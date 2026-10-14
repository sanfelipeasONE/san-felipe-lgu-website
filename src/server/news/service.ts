import "server-only";
import { prisma } from "@/server/db/client";
import { hasPermission, isSystemScoped, canAccessOffice } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import { logAuditEvent } from "@/server/audit/service";
import { sanitizeArticleHtml } from "@/server/news/sanitize";
import { generateUniqueSlug } from "@/server/news/slug";
import { deleteCloudinaryAsset } from "@/server/media/cloudinary";
import { validateForPublish, type NewsDraftInput } from "@/lib/validation/news";
import type { SessionUser } from "@/server/auth/session";
import type { NewsStatus } from "@prisma/client";

export class NewsError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "NewsError";
  }
}

export interface AdminNewsListQuery {
  search?: string;
  status?: NewsStatus;
  type?: string;
  officeId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetches news articles for the CMS administration view.
 * Strictly enforces office scope: office-scoped users can NEVER see other offices' drafts.
 */
export async function getAdminNewsList(
  user: SessionUser,
  query: AdminNewsListQuery = {}
) {
  if (!hasPermission(user, PERMISSIONS.POSTS_VIEW)) {
    throw new NewsError("Missing required permission: posts.view", 403);
  }

  const page = Math.max(1, query.page || 1);
  const pageSize = Math.min(50, Math.max(1, query.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  // 1. Enforce Office Boundary
  if (isSystemScoped(user)) {
    if (query.officeId && query.officeId !== "all") {
      where.officeId = query.officeId;
    }
  } else {
    // OFFICE scope: strictly restricted to user's assigned office
    if (!user.officeId) {
      return { articles: [], total: 0, page: 1, pageSize, totalPages: 0 };
    }
    where.officeId = user.officeId;
  }

  // 2. Status filter
  if (query.status) {
    where.status = query.status;
  }

  // 3. Type/Category filter
  if (query.type && query.type !== "all") {
    where.type = query.type;
  }

  // 4. Search query
  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { excerpt: { contains: term, mode: "insensitive" } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      include: {
        office: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { updatedAt: "desc" },
      ],
      skip,
      take: pageSize,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    articles,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves a single news article for CMS editing or preview.
 * Strictly verifies office ownership for office-scoped users.
 */
export async function getAdminNewsById(user: SessionUser, id: string) {
  if (!hasPermission(user, PERMISSIONS.POSTS_VIEW)) {
    throw new NewsError("Missing required permission: posts.view", 403);
  }

  const article = await prisma.newsArticle.findUnique({
    where: { id },
    include: {
      office: {
        select: {
          id: true,
          name: true,
          shortName: true,
          slug: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!article) {
    throw new NewsError("News article not found.", 404);
  }

  if (!canAccessOffice(user, article.officeId)) {
    throw new NewsError(
      "Access restricted: you do not hold authorization for this municipal office's content.",
      403
    );
  }

  return article;
}

/**
 * Creates a new News draft.
 * OFFICE scope: office is derived from authenticated user (browser input ignored).
 * SYSTEM scope: office is validated against existing offices in PostgreSQL.
 */
export async function createNewsArticle(
  user: SessionUser,
  input: NewsDraftInput
) {
  if (!hasPermission(user, PERMISSIONS.POSTS_CREATE)) {
    throw new NewsError("Missing required permission: posts.create", 403);
  }

  let targetOfficeId: string;

  if (isSystemScoped(user)) {
    if (!input.officeId) {
      throw new NewsError("System administrators must select a Publishing Office.");
    }
    const officeExists = await prisma.office.findUnique({
      where: { id: input.officeId },
      select: { id: true },
    });
    if (!officeExists) {
      throw new NewsError("Selected municipal office does not exist.");
    }
    targetOfficeId = input.officeId;
  } else {
    if (!user.officeId) {
      throw new NewsError("Your staff account is not assigned to a municipal office.", 403);
    }
    targetOfficeId = user.officeId;
  }

  const slug = await generateUniqueSlug(input.title);
  const cleanBody = sanitizeArticleHtml(input.body);

  const article = await prisma.newsArticle.create({
    data: {
      slug,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      body: cleanBody,
      type: input.type,
      category: input.category.trim(),
      status: "DRAFT",
      officeId: targetOfficeId,
      createdById: user.id,
      featuredImagePublicId: input.featuredImagePublicId || null,
      featuredImageUrl: input.featuredImageUrl || null,
      featuredImageAlt: input.featuredImageAlt?.trim() || null,
      featuredImageWidth: input.featuredImageWidth || null,
      featuredImageHeight: input.featuredImageHeight || null,
      featuredImageFormat: input.featuredImageFormat || null,
      featuredImageBytes: input.featuredImageBytes || null,
    },
    include: {
      office: true,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.POST_CREATED,
    userId: user.id,
    officeId: targetOfficeId,
    details: {
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
    },
  });

  return article;
}

/**
 * Updates an existing News article.
 * Enforces:
 * - posts.update permission
 * - Office ownership boundary
 * - Stale-write concurrency check
 * - Safe image replacement
 * - Stable slug for published articles
 */
export async function updateNewsArticle(
  user: SessionUser,
  id: string,
  input: NewsDraftInput
) {
  if (!hasPermission(user, PERMISSIONS.POSTS_UPDATE)) {
    throw new NewsError("Missing required permission: posts.update", 403);
  }

  const existing = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NewsError("News article not found.", 404);
  }

  if (!canAccessOffice(user, existing.officeId)) {
    throw new NewsError("Access restricted: you do not hold authorization for this office.", 403);
  }

  // Concurrency check
  if (
    input.expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== input.expectedUpdatedAt
  ) {
    throw new NewsError(
      "This article was modified by another user. Please refresh and review before saving your changes.",
      409
    );
  }

  // Preserve slug if already published, or update if draft
  let slug = existing.slug;
  if (existing.status === "DRAFT" && input.title.trim() !== existing.title) {
    slug = await generateUniqueSlug(input.title, existing.id);
  }

  const cleanBody = sanitizeArticleHtml(input.body);
  const oldImagePublicId = existing.featuredImagePublicId;
  const newImagePublicId = input.featuredImagePublicId || null;

  const updated = await prisma.newsArticle.update({
    where: { id },
    data: {
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt.trim(),
      body: cleanBody,
      type: input.type,
      category: input.category.trim(),
      updatedById: user.id,
      featuredImagePublicId: newImagePublicId,
      featuredImageUrl: input.featuredImageUrl || null,
      featuredImageAlt: input.featuredImageAlt?.trim() || null,
      featuredImageWidth: input.featuredImageWidth || null,
      featuredImageHeight: input.featuredImageHeight || null,
      featuredImageFormat: input.featuredImageFormat || null,
      featuredImageBytes: input.featuredImageBytes || null,
    },
  });

  // Safe image replacement: remove old Cloudinary asset only after DB update succeeds
  if (oldImagePublicId && newImagePublicId && oldImagePublicId !== newImagePublicId) {
    deleteCloudinaryAsset(oldImagePublicId).catch((err) => {
      console.error("[CLOUDINARY] Failed to clean up replaced asset:", err);
    });
  }

  await logAuditEvent({
    action: AUDIT_ACTIONS.POST_UPDATED,
    userId: user.id,
    officeId: existing.officeId,
    details: {
      articleId: updated.id,
      title: updated.title,
      status: updated.status,
    },
  });

  return updated;
}

/**
 * Transitions a News article from DRAFT to PUBLISHED.
 * Enforces:
 * - posts.publish permission
 * - Office ownership boundary
 * - Validation of publish requirements (alt text, content length)
 * - Assigns publishedAt server-side (preserves publishedAt if already published)
 */
export async function publishNewsArticle(user: SessionUser, id: string) {
  if (!hasPermission(user, PERMISSIONS.POSTS_PUBLISH)) {
    throw new NewsError("Missing required permission: posts.publish", 403);
  }

  const existing = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NewsError("News article not found.", 404);
  }

  if (!canAccessOffice(user, existing.officeId)) {
    throw new NewsError("Access restricted: you do not hold authorization for this office.", 403);
  }

  if (existing.status === "ARCHIVED") {
    throw new NewsError("Archived articles cannot be published directly.", 400);
  }

  const validation = validateForPublish({
    title: existing.title,
    excerpt: existing.excerpt,
    body: existing.body,
    type: existing.type as NewsDraftInput["type"],
    category: existing.category,
    featuredImagePublicId: existing.featuredImagePublicId,
    featuredImageAlt: existing.featuredImageAlt,
  });

  if (!validation.valid) {
    throw new NewsError(`Cannot publish: ${validation.errors.join(", ")}`, 400);
  }

  const publishedAt = existing.publishedAt || new Date();

  const published = await prisma.newsArticle.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt,
      updatedById: user.id,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.POST_PUBLISHED,
    userId: user.id,
    officeId: existing.officeId,
    details: {
      articleId: published.id,
      title: published.title,
      slug: published.slug,
      publishedAt: published.publishedAt,
    },
  });

  return published;
}

/**
 * Archives a News article.
 * Enforces:
 * - posts.archive (or posts.delete) permission
 * - Office ownership boundary
 * - Retains database record and Cloudinary asset (non-destructive)
 * - Sets status = ARCHIVED and archivedAt = now()
 */
export async function archiveNewsArticle(user: SessionUser, id: string) {
  const canArchive =
    hasPermission(user, PERMISSIONS.POSTS_ARCHIVE) ||
    hasPermission(user, PERMISSIONS.POSTS_DELETE);

  if (!canArchive) {
    throw new NewsError("Missing required permission: posts.archive", 403);
  }

  const existing = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NewsError("News article not found.", 404);
  }

  if (!canAccessOffice(user, existing.officeId)) {
    throw new NewsError("Access restricted: you do not hold authorization for this office.", 403);
  }

  const archived = await prisma.newsArticle.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
      updatedById: user.id,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.POST_ARCHIVED,
    userId: user.id,
    officeId: existing.officeId,
    details: {
      articleId: archived.id,
      title: archived.title,
      archivedAt: archived.archivedAt,
    },
  });

  return archived;
}

/**
 * Removes the featured image from a News article and cleans up the Cloudinary asset.
 */
export async function removeNewsFeaturedImage(user: SessionUser, id: string) {
  if (!hasPermission(user, PERMISSIONS.POSTS_UPDATE)) {
    throw new NewsError("Missing required permission: posts.update", 403);
  }

  const existing = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NewsError("News article not found.", 404);
  }

  if (!canAccessOffice(user, existing.officeId)) {
    throw new NewsError("Access restricted: you do not hold authorization for this office.", 403);
  }

  const oldPublicId = existing.featuredImagePublicId;

  await prisma.newsArticle.update({
    where: { id },
    data: {
      featuredImagePublicId: null,
      featuredImageUrl: null,
      featuredImageAlt: null,
      featuredImageWidth: null,
      featuredImageHeight: null,
      featuredImageFormat: null,
      featuredImageBytes: null,
      updatedById: user.id,
    },
  });

  if (oldPublicId) {
    deleteCloudinaryAsset(oldPublicId).catch((err) => {
      console.error("[CLOUDINARY] Failed to clean up removed image:", err);
    });
  }

  await logAuditEvent({
    action: AUDIT_ACTIONS.POST_IMAGE_REMOVED,
    userId: user.id,
    officeId: existing.officeId,
    details: {
      articleId: existing.id,
      previousPublicId: oldPublicId,
    },
  });

  return { success: true };
}

export { removeNewsFeaturedImage as removeFeaturedImage };


// -----------------------------------------------------------------------------
// PUBLIC-FACING DATABASE QUERIES (STRICTLY PUBLISHED ONLY)
// -----------------------------------------------------------------------------

/**
 * Retrieves published news articles for the public /news archive.
 * CRITICAL: Strictly filters WHERE status = 'PUBLISHED'.
 */
export async function getPublicPublishedNews(options?: {
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize || 12));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (options?.type && options.type !== "all") {
    where.type = options.type;
  }

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      include: {
        office: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    articles,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Retrieves a single published news article by its slug for public /news/[slug].
 * CRITICAL: Strictly filters WHERE slug = $slug AND status = 'PUBLISHED'.
 * Drafts and archived records return null immediately.
 */
export async function getPublicPublishedNewsBySlug(slug: string) {
  return prisma.newsArticle.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      office: {
        select: {
          id: true,
          name: true,
          shortName: true,
          slug: true,
          officeHead: true,
          email: true,
          location: true,
        },
      },
    },
  });
}

/**
 * Retrieves the latest published articles for the public homepage.
 * CRITICAL: Strictly filters WHERE status = 'PUBLISHED', limit 4.
 */
export async function getPublicLatestNews(limit = 4) {
  return prisma.newsArticle.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      office: {
        select: {
          id: true,
          name: true,
          shortName: true,
          slug: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: limit,
  });
}

/**
 * Retrieves other published articles for the article detail sidebar.
 * CRITICAL: Strictly filters WHERE status = 'PUBLISHED' AND slug != excludeSlug.
 */
export async function getPublicOtherNews(excludeSlug: string, limit = 4) {
  return prisma.newsArticle.findMany({
    where: {
      status: "PUBLISHED",
      slug: {
        not: excludeSlug,
      },
    },
    include: {
      office: {
        select: {
          id: true,
          name: true,
          shortName: true,
          slug: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: limit,
  });
}

