import "server-only";
import { prisma } from "@/server/db/client";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import { logAuditEvent } from "@/server/audit/service";
import { sanitizeTourismHtml } from "@/server/tourism/sanitize";
import { generateUniqueTourismSlug } from "@/server/tourism/slug";
import { deleteCloudinaryAsset } from "@/server/media/cloudinary";
import {
  validateTourismForPublish,
  type TourismDraftInput,
} from "@/lib/validation/tourism";
import type { SessionUser } from "@/server/auth/session";
import type { TourismCategory, TourismStatus } from "@prisma/client";

export class TourismError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "TourismError";
  }
}

export interface AdminTourismListQuery {
  search?: string;
  category?: TourismCategory | "all";
  status?: TourismStatus;
  page?: number;
  pageSize?: number;
}

/**
 * Fetches tourism entries for the CMS administration view.
 */
export async function getAdminTourismList(
  user: SessionUser,
  query: AdminTourismListQuery = {}
) {
  if (!hasPermission(user, PERMISSIONS.TOURISM_VIEW)) {
    throw new TourismError("Missing required permission: tourism.view", 403);
  }

  const page = Math.max(1, query.page || 1);
  const pageSize = Math.min(50, Math.max(1, query.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  // Category filter
  if (query.category && query.category !== "all") {
    where.category = query.category;
  }

  // Status filter
  if (query.status) {
    where.status = query.status;
  }

  // Search query (title, summary, location)
  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { summary: { contains: term, mode: "insensitive" } },
      { location: { contains: term, mode: "insensitive" } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.tourismEntry.findMany({
      where,
      include: {
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
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { updatedAt: "desc" },
      ],
      skip,
      take: pageSize,
    }),
    prisma.tourismEntry.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves a single tourism entry for CMS editing or preview.
 */
export async function getAdminTourismById(user: SessionUser, id: string) {
  if (!hasPermission(user, PERMISSIONS.TOURISM_VIEW)) {
    throw new TourismError("Missing required permission: tourism.view", 403);
  }

  const entry = await prisma.tourismEntry.findUnique({
    where: { id },
    include: {
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

  if (!entry) {
    throw new TourismError("Tourism entry not found.", 404);
  }

  return entry;
}

/**
 * Creates a new Tourism draft.
 */
export async function createTourismEntry(
  user: SessionUser,
  input: TourismDraftInput
) {
  if (!hasPermission(user, PERMISSIONS.TOURISM_CREATE)) {
    throw new TourismError("Missing required permission: tourism.create", 403);
  }

  const slug = await generateUniqueTourismSlug(input.title);
  const cleanBody = sanitizeTourismHtml(input.body);

  const entry = await prisma.tourismEntry.create({
    data: {
      category: input.category,
      title: input.title.trim(),
      slug,
      summary: input.summary.trim(),
      body: cleanBody,
      location: input.location?.trim() || null,
      mapUrl: input.mapUrl?.trim() || null,
      contactNumber: input.contactNumber?.trim() || null,
      email: input.email?.trim() || null,
      websiteUrl: input.websiteUrl?.trim() || null,
      operatingHours: input.operatingHours?.trim() || null,
      status: "DRAFT",
      createdById: user.id,
      featuredImagePublicId: input.featuredImagePublicId || null,
      featuredImageUrl: input.featuredImageUrl || null,
      featuredImageAlt: input.featuredImageAlt?.trim() || null,
      featuredImageWidth: input.featuredImageWidth || null,
      featuredImageHeight: input.featuredImageHeight || null,
      featuredImageFormat: input.featuredImageFormat || null,
      featuredImageBytes: input.featuredImageBytes || null,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.TOURISM_CREATED,
    userId: user.id,
    details: {
      entryId: entry.id,
      title: entry.title,
      slug: entry.slug,
      category: entry.category,
      status: entry.status,
    },
  });

  return entry;
}

/**
 * Updates an existing Tourism entry.
 * Enforces optimistic concurrency and safe image replacement.
 */
export async function updateTourismEntry(
  user: SessionUser,
  id: string,
  input: TourismDraftInput
) {
  if (!hasPermission(user, PERMISSIONS.TOURISM_UPDATE)) {
    throw new TourismError("Missing required permission: tourism.update", 403);
  }

  const existing = await prisma.tourismEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new TourismError("Tourism entry not found.", 404);
  }

  // Optimistic concurrency check
  if (
    input.expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== input.expectedUpdatedAt
  ) {
    throw new TourismError(
      "This tourism entry was modified by another user. Please refresh and review before saving your changes.",
      409
    );
  }

  // Preserve slug if already published; if in draft and title changed, regenerate slug
  let slug = existing.slug;
  if (existing.status === "DRAFT" && input.title.trim() !== existing.title) {
    slug = await generateUniqueTourismSlug(input.title, existing.id);
  }

  const cleanBody = sanitizeTourismHtml(input.body);
  const oldImagePublicId = existing.featuredImagePublicId;
  const newImagePublicId = input.featuredImagePublicId || null;

  let updated;
  try {
    updated = await prisma.tourismEntry.update({
      where: { id },
      data: {
        category: input.category,
        title: input.title.trim(),
        slug,
        summary: input.summary.trim(),
        body: cleanBody,
        location: input.location?.trim() || null,
        mapUrl: input.mapUrl?.trim() || null,
        contactNumber: input.contactNumber?.trim() || null,
        email: input.email?.trim() || null,
        websiteUrl: input.websiteUrl?.trim() || null,
        operatingHours: input.operatingHours?.trim() || null,
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
  } catch (dbErr) {
    if (newImagePublicId && oldImagePublicId !== newImagePublicId) {
      deleteCloudinaryAsset(newImagePublicId).catch((cleanupErr) => {
        console.error("[CLOUDINARY] Failed to clean up newly uploaded orphan image on DB error:", cleanupErr);
      });
    }
    throw dbErr;
  }

  // Safe image replacement: remove old Cloudinary asset only after database update succeeds
  if (oldImagePublicId && newImagePublicId && oldImagePublicId !== newImagePublicId) {
    deleteCloudinaryAsset(oldImagePublicId).catch((err) => {
      console.error("[CLOUDINARY] Failed to clean up replaced tourism asset:", err);
    });
  }

  await logAuditEvent({
    action: AUDIT_ACTIONS.TOURISM_UPDATED,
    userId: user.id,
    details: {
      entryId: updated.id,
      title: updated.title,
      category: updated.category,
      status: updated.status,
    },
  });

  return updated;
}

/**
 * Transitions a Tourism entry from DRAFT to PUBLISHED.
 */
export async function publishTourismEntry(
  user: SessionUser,
  id: string,
  expectedUpdatedAt?: string
) {
  if (!hasPermission(user, PERMISSIONS.TOURISM_PUBLISH)) {
    throw new TourismError("Missing required permission: tourism.publish", 403);
  }

  const existing = await prisma.tourismEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new TourismError("Tourism entry not found.", 404);
  }

  if (existing.status === "ARCHIVED") {
    throw new TourismError("Archived tourism entries cannot be published directly.", 400);
  }

  if (
    expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new TourismError(
      "This tourism entry was modified by another user. Please refresh and review before publishing.",
      409
    );
  }

  const validation = validateTourismForPublish({
    category: existing.category,
    title: existing.title,
    summary: existing.summary,
    body: existing.body,
    featuredImagePublicId: existing.featuredImagePublicId,
    featuredImageAlt: existing.featuredImageAlt,
  });

  if (!validation.valid) {
    throw new TourismError(`Cannot publish: ${validation.errors.join(", ")}`, 400);
  }

  const publishedAt = existing.publishedAt || new Date();

  const published = await prisma.tourismEntry.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt,
      updatedById: user.id,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.TOURISM_PUBLISHED,
    userId: user.id,
    details: {
      entryId: published.id,
      title: published.title,
      slug: published.slug,
      category: published.category,
      publishedAt: published.publishedAt,
    },
  });

  return published;
}

/**
 * Archives a Tourism entry.
 */
export async function archiveTourismEntry(
  user: SessionUser,
  id: string,
  expectedUpdatedAt?: string
) {
  const canArchive =
    hasPermission(user, PERMISSIONS.TOURISM_ARCHIVE) ||
    hasPermission(user, PERMISSIONS.TOURISM_DELETE);

  if (!canArchive) {
    throw new TourismError("Missing required permission: tourism.archive", 403);
  }

  const existing = await prisma.tourismEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new TourismError("Tourism entry not found.", 404);
  }

  if (
    expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new TourismError(
      "This tourism entry was modified by another user. Please refresh and review before archiving.",
      409
    );
  }

  const archived = await prisma.tourismEntry.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
      updatedById: user.id,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.TOURISM_ARCHIVED,
    userId: user.id,
    details: {
      entryId: archived.id,
      title: archived.title,
      category: archived.category,
      archivedAt: archived.archivedAt,
    },
  });

  return archived;
}

/**
 * Permanently deletes a Tourism entry.
 * Cleans up associated Cloudinary image asset upon deletion.
 */
export async function deleteTourismEntry(
  user: SessionUser,
  id: string,
  expectedUpdatedAt?: string
) {
  if (!hasPermission(user, PERMISSIONS.TOURISM_DELETE)) {
    throw new TourismError("Missing required permission: tourism.delete", 403);
  }

  const existing = await prisma.tourismEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new TourismError("Tourism entry not found.", 404);
  }

  if (
    expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new TourismError(
      "This tourism entry was modified by another user. Please refresh and review before deleting.",
      409
    );
  }

  const imagePublicId = existing.featuredImagePublicId;

  await prisma.tourismEntry.delete({
    where: { id },
  });

  if (imagePublicId) {
    deleteCloudinaryAsset(imagePublicId).catch((err) => {
      console.error("[CLOUDINARY] Failed to clean up deleted tourism image:", err);
    });
  }

  await logAuditEvent({
    action: AUDIT_ACTIONS.TOURISM_DELETED,
    userId: user.id,
    details: {
      entryId: existing.id,
      title: existing.title,
      slug: existing.slug,
      category: existing.category,
      previousStatus: existing.status,
      entityType: "TourismEntry",
    },
  });

  return { success: true, id: existing.id };
}

/**
 * Removes the featured image from a Tourism entry and cleans up the Cloudinary asset.
 */
export async function removeTourismFeaturedImage(user: SessionUser, id: string) {
  if (!hasPermission(user, PERMISSIONS.TOURISM_UPDATE)) {
    throw new TourismError("Missing required permission: tourism.update", 403);
  }

  const existing = await prisma.tourismEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new TourismError("Tourism entry not found.", 404);
  }

  const oldPublicId = existing.featuredImagePublicId;

  await prisma.tourismEntry.update({
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
      console.error("[CLOUDINARY] Failed to clean up removed tourism image:", err);
    });
  }

  await logAuditEvent({
    action: AUDIT_ACTIONS.TOURISM_IMAGE_REMOVED,
    userId: user.id,
    details: {
      entryId: existing.id,
      previousPublicId: oldPublicId,
    },
  });

  return { success: true };
}

// -----------------------------------------------------------------------------
// PUBLIC-FACING DATABASE QUERIES (STRICTLY PUBLISHED ONLY)
// -----------------------------------------------------------------------------

/**
 * Retrieves published tourism entries for a specific category.
 * CRITICAL: Strictly filters WHERE category = $category AND status = 'PUBLISHED'.
 */
export async function getPublicPublishedTourismByCategory(
  category: TourismCategory,
  options?: {
    page?: number;
    pageSize?: number;
  }
) {
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize || 12));
  const skip = (page - 1) * pageSize;

  const where = {
    category,
    status: "PUBLISHED" as const,
  };

  const [entries, total] = await Promise.all([
    prisma.tourismEntry.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.tourismEntry.count({ where }),
  ]);

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Retrieves a single published tourism entry by its slug and category.
 * CRITICAL: Strictly validates BOTH slug = $slug AND category = $category AND status = 'PUBLISHED'.
 */
export async function getPublicPublishedTourismBySlug(
  category: TourismCategory,
  slug: string
) {
  return prisma.tourismEntry.findFirst({
    where: {
      category,
      slug,
      status: "PUBLISHED",
    },
  });
}

/**
 * Retrieves other published entries in the same category for the detail sidebar.
 */
export async function getPublicOtherTourism(
  category: TourismCategory,
  excludeSlug: string,
  limit = 3
) {
  return prisma.tourismEntry.findMany({
    where: {
      category,
      status: "PUBLISHED",
      slug: {
        not: excludeSlug,
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: limit,
  });
}
