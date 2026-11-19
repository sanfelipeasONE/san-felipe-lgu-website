import "server-only";
import { prisma } from "@/server/db/client";
import type { SessionUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { SB_OFFICE_SLUG } from "@/server/roles/service";
import { recordAuditEvent } from "@/server/audit/service";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import {
  uploadDocumentFile,
  deleteCloudinaryDocument,
} from "@/server/media/cloudinary-documents";
import {
  validateResolutionPdfFile,
  type ResolutionInput,
} from "@/lib/validation/resolutions";
import { formatBytes } from "@/lib/validation/documents";
import type { Prisma, ResolutionStatus } from "@prisma/client";

export class ResolutionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "ResolutionError";
  }
}

/**
 * Resolves the canonical Office of the Sangguniang Bayan by stable slug.
 */
export async function getCanonicalSangguniangBayanOffice() {
  const office = await prisma.office.findUnique({
    where: { slug: SB_OFFICE_SLUG },
    select: { id: true, name: true, slug: true, status: true },
  });

  if (!office) {
    throw new ResolutionError(
      "System configuration error: Canonical Office of the Sangguniang Bayan was not found.",
      500
    );
  }
  if (office.status !== "ACTIVE") {
    throw new ResolutionError(
      "The Office of the Sangguniang Bayan is currently inactive.",
      400
    );
  }

  return office;
}

/**
 * Enforces office boundary for Sangguniang Bayan Resolutions:
 * - SYSTEM-scoped users with sb_resolutions.* permissions are permitted.
 * - Non-system users MUST be assigned to the canonical Office of the Sangguniang Bayan.
 */
function assertResolutionOfficeBoundary(caller: SessionUser, officeId: string) {
  if (caller.isSystemScope) {
    return;
  }
  if (!caller.officeId || caller.officeId !== officeId) {
    throw new ResolutionError(
      "Access restricted: You are only authorized to manage resolutions for the Office of the Sangguniang Bayan.",
      403
    );
  }
}

/**
 * Lists Sangguniang Bayan Resolutions for CMS management.
 */
export async function getAdminResolutionsList(
  caller: SessionUser,
  filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: ResolutionStatus;
    year?: number;
  } = {}
) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_VIEW)) {
    throw new ResolutionError(
      "You do not have permission to view Sangguniang Bayan Resolutions.",
      403
    );
  }

  const sbOffice = await getCanonicalSangguniangBayanOffice();
  assertResolutionOfficeBoundary(caller, sbOffice.id);

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const where: Prisma.SangguniangBayanResolutionWhereInput = {
    officeId: sbOffice.id,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.year && Number.isInteger(filters.year)) {
    where.year = filters.year;
  }

  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    where.OR = [
      { resolutionNumber: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const [resolutions, total, yearGroups] = await Promise.all([
    prisma.sangguniangBayanResolution.findMany({
      where,
      include: {
        office: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ year: "desc" }, { adoptedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.sangguniangBayanResolution.count({ where }),
    prisma.sangguniangBayanResolution.findMany({
      where: { officeId: sbOffice.id },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  return {
    resolutions: resolutions.map((r) => ({
      ...r,
      fileSizeFormatted: r.bytes ? formatBytes(r.bytes) : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    availableYears: yearGroups.map((g) => g.year),
  };
}

/**
 * Retrieves a single Sangguniang Bayan Resolution for CMS editing.
 */
export async function getAdminResolutionById(caller: SessionUser, id: string) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_VIEW)) {
    throw new ResolutionError(
      "You do not have permission to view Sangguniang Bayan Resolutions.",
      403
    );
  }

  const resolution = await prisma.sangguniangBayanResolution.findUnique({
    where: { id },
    include: {
      office: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
    },
  });

  if (!resolution) {
    throw new ResolutionError("Sangguniang Bayan Resolution not found.", 404);
  }

  assertResolutionOfficeBoundary(caller, resolution.officeId);

  return {
    ...resolution,
    fileSizeFormatted: resolution.bytes ? formatBytes(resolution.bytes) : null,
  };
}

/**
 * Creates a new Sangguniang Bayan Resolution in DRAFT status.
 * Bound strictly to the canonical Office of the Sangguniang Bayan.
 */
export async function createResolution(
  caller: SessionUser,
  params: {
    input: ResolutionInput;
    file?: {
      buffer: Buffer;
      filename: string;
      mimeType: string;
      size: number;
    } | null;
  },
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_CREATE)) {
    throw new ResolutionError(
      "You do not have permission to create Sangguniang Bayan Resolutions.",
      403
    );
  }

  const sbOffice = await getCanonicalSangguniangBayanOffice();
  assertResolutionOfficeBoundary(caller, sbOffice.id);

  const normalizedNumber = params.input.resolutionNumber.trim();
  const adoptedAtDate = new Date(params.input.adoptedAt);
  if (Number.isNaN(adoptedAtDate.getTime())) {
    throw new ResolutionError("Date adopted must be a valid date.", 400);
  }

  // Prevent duplicate resolution number in the same year
  const existingDuplicate = await prisma.sangguniangBayanResolution.findUnique({
    where: {
      resolutionNumber_year: {
        resolutionNumber: normalizedNumber,
        year: params.input.year,
      },
    },
    select: { id: true },
  });
  if (existingDuplicate) {
    throw new ResolutionError(
      `A resolution with number "${normalizedNumber}" for year ${params.input.year} already exists.`,
      400
    );
  }

  let uploadedPdf: {
    originalFilename: string;
    storagePublicId: string;
    storageUrl: string;
    resourceType: string;
    format: string;
    mimeType: string;
    bytes: number;
  } | null = null;

  if (params.file) {
    const validation = validateResolutionPdfFile(params.file);
    if (!validation.valid) {
      throw new ResolutionError(validation.error || "Invalid PDF file.", 400);
    }

    const uploaded = await uploadDocumentFile(params.file.buffer, {
      filename: validation.cleanFilename,
      format: "pdf",
      year: params.input.year,
      folderPrefix: "san-felipe-lgu/resolutions",
    });

    uploadedPdf = {
      originalFilename: validation.cleanFilename,
      storagePublicId: uploaded.publicId,
      storageUrl: uploaded.url,
      resourceType: "raw",
      format: "pdf",
      mimeType: "application/pdf",
      bytes: uploaded.bytes,
    };
  }

  try {
    const created = await prisma.sangguniangBayanResolution.create({
      data: {
        resolutionNumber: normalizedNumber,
        title: params.input.title.trim(),
        year: params.input.year,
        adoptedAt: adoptedAtDate,
        summary: params.input.summary?.trim() || null,
        status: "DRAFT",
        officeId: sbOffice.id,
        originalFilename: uploadedPdf?.originalFilename ?? null,
        storagePublicId: uploadedPdf?.storagePublicId ?? null,
        storageUrl: uploadedPdf?.storageUrl ?? null,
        resourceType: "raw",
        format: uploadedPdf?.format ?? null,
        mimeType: uploadedPdf?.mimeType ?? null,
        bytes: uploadedPdf?.bytes ?? null,
        createdById: caller.id,
        updatedById: caller.id,
      },
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.SB_RESOLUTION_CREATED,
      userId: caller.id,
      officeId: sbOffice.id,
      details: {
        resolutionId: created.id,
        resolutionNumber: created.resolutionNumber,
        year: created.year,
        title: created.title,
        hasPdf: Boolean(uploadedPdf),
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });

    return created;
  } catch (err) {
    if (uploadedPdf) {
      await deleteCloudinaryDocument(uploadedPdf.storagePublicId);
    }
    if (err instanceof ResolutionError) throw err;
    throw new ResolutionError("Failed to save Sangguniang Bayan Resolution.", 500);
  }
}

/**
 * Updates metadata and/or replaces the PDF attachment of a Sangguniang Bayan Resolution.
 */
export async function updateResolution(
  caller: SessionUser,
  id: string,
  params: {
    input: ResolutionInput;
    file?: {
      buffer: Buffer;
      filename: string;
      mimeType: string;
      size: number;
    } | null;
  },
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_UPDATE)) {
    throw new ResolutionError(
      "You do not have permission to update Sangguniang Bayan Resolutions.",
      403
    );
  }

  const existing = await prisma.sangguniangBayanResolution.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ResolutionError("Sangguniang Bayan Resolution not found.", 404);
  }

  assertResolutionOfficeBoundary(caller, existing.officeId);

  if (
    params.input.expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== params.input.expectedUpdatedAt
  ) {
    throw new ResolutionError(
      "This resolution was modified by another administrator. Please reload and try again.",
      409
    );
  }

  const normalizedNumber = params.input.resolutionNumber.trim();
  const adoptedAtDate = new Date(params.input.adoptedAt);
  if (Number.isNaN(adoptedAtDate.getTime())) {
    throw new ResolutionError("Date adopted must be a valid date.", 400);
  }

  const duplicate = await prisma.sangguniangBayanResolution.findFirst({
    where: {
      resolutionNumber: normalizedNumber,
      year: params.input.year,
      id: { not: id },
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ResolutionError(
      `Another resolution with number "${normalizedNumber}" for year ${params.input.year} already exists.`,
      400
    );
  }

  let newPdf: {
    originalFilename: string;
    storagePublicId: string;
    storageUrl: string;
    resourceType: string;
    format: string;
    mimeType: string;
    bytes: number;
  } | null = null;

  if (params.file) {
    const validation = validateResolutionPdfFile(params.file);
    if (!validation.valid) {
      throw new ResolutionError(validation.error || "Invalid PDF file.", 400);
    }

    const uploaded = await uploadDocumentFile(params.file.buffer, {
      filename: validation.cleanFilename,
      format: "pdf",
      year: params.input.year,
      folderPrefix: "san-felipe-lgu/resolutions",
    });

    newPdf = {
      originalFilename: validation.cleanFilename,
      storagePublicId: uploaded.publicId,
      storageUrl: uploaded.url,
      resourceType: "raw",
      format: "pdf",
      mimeType: "application/pdf",
      bytes: uploaded.bytes,
    };
  }

  try {
    const updated = await prisma.sangguniangBayanResolution.update({
      where: { id },
      data: {
        resolutionNumber: normalizedNumber,
        title: params.input.title.trim(),
        year: params.input.year,
        adoptedAt: adoptedAtDate,
        summary: params.input.summary?.trim() || null,
        updatedById: caller.id,
        ...(newPdf
          ? {
              originalFilename: newPdf.originalFilename,
              storagePublicId: newPdf.storagePublicId,
              storageUrl: newPdf.storageUrl,
              resourceType: newPdf.resourceType,
              format: newPdf.format,
              mimeType: newPdf.mimeType,
              bytes: newPdf.bytes,
            }
          : {}),
      },
    });

    if (newPdf && existing.storagePublicId) {
      await deleteCloudinaryDocument(existing.storagePublicId);
    }

    await recordAuditEvent({
      action: AUDIT_ACTIONS.SB_RESOLUTION_UPDATED,
      userId: caller.id,
      officeId: existing.officeId,
      details: {
        resolutionId: updated.id,
        resolutionNumber: updated.resolutionNumber,
        year: updated.year,
        title: updated.title,
        replacedPdf: Boolean(newPdf),
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });

    return updated;
  } catch (err) {
    if (newPdf) {
      await deleteCloudinaryDocument(newPdf.storagePublicId);
    }
    if (err instanceof ResolutionError) throw err;
    throw new ResolutionError("Failed to update Sangguniang Bayan Resolution.", 500);
  }
}

/**
 * Publishes a Sangguniang Bayan Resolution to the public Transparency page.
 * Requires an uploaded PDF attachment.
 */
export async function publishResolution(
  caller: SessionUser,
  id: string,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_PUBLISH)) {
    throw new ResolutionError(
      "You do not have permission to publish Sangguniang Bayan Resolutions.",
      403
    );
  }

  const existing = await prisma.sangguniangBayanResolution.findUnique({
    where: { id },
    include: { office: { select: { id: true, status: true, slug: true } } },
  });

  if (!existing) {
    throw new ResolutionError("Sangguniang Bayan Resolution not found.", 404);
  }

  assertResolutionOfficeBoundary(caller, existing.officeId);

  if (existing.office.status !== "ACTIVE" || existing.office.slug !== SB_OFFICE_SLUG) {
    throw new ResolutionError(
      "Cannot publish resolution: The Office of the Sangguniang Bayan is inactive or invalid.",
      400
    );
  }

  if (
    !existing.storagePublicId ||
    !existing.storageUrl ||
    !existing.originalFilename ||
    existing.format !== "pdf" ||
    existing.resourceType !== "raw" ||
    !existing.bytes ||
    existing.bytes <= 0
  ) {
    throw new ResolutionError(
      "Cannot publish a resolution without an uploaded PDF attachment.",
      400
    );
  }

  if (existing.status === "PUBLISHED") {
    throw new ResolutionError("This resolution is already published.", 400);
  }

  const published = await prisma.sangguniangBayanResolution.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      archivedAt: null,
      updatedById: caller.id,
    },
  });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.SB_RESOLUTION_PUBLISHED,
    userId: caller.id,
    officeId: existing.officeId,
    details: {
      resolutionId: published.id,
      resolutionNumber: published.resolutionNumber,
      year: published.year,
      title: published.title,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return published;
}

/**
 * Unpublishes a PUBLISHED Sangguniang Bayan Resolution back to DRAFT.
 */
export async function unpublishResolution(
  caller: SessionUser,
  id: string,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_PUBLISH)) {
    throw new ResolutionError(
      "You do not have permission to unpublish Sangguniang Bayan Resolutions.",
      403
    );
  }

  const existing = await prisma.sangguniangBayanResolution.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ResolutionError("Sangguniang Bayan Resolution not found.", 404);
  }

  assertResolutionOfficeBoundary(caller, existing.officeId);

  if (existing.status !== "PUBLISHED") {
    throw new ResolutionError("Only published resolutions can be unpublished.", 400);
  }

  const unpublished = await prisma.sangguniangBayanResolution.update({
    where: { id },
    data: {
      status: "DRAFT",
      publishedAt: null,
      updatedById: caller.id,
    },
  });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.SB_RESOLUTION_UNPUBLISHED,
    userId: caller.id,
    officeId: existing.officeId,
    details: {
      resolutionId: unpublished.id,
      resolutionNumber: unpublished.resolutionNumber,
      year: unpublished.year,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return unpublished;
}

/**
 * Archives a Sangguniang Bayan Resolution (removes from public view while preserving record).
 */
export async function archiveResolution(
  caller: SessionUser,
  id: string,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_ARCHIVE)) {
    throw new ResolutionError(
      "You do not have permission to archive Sangguniang Bayan Resolutions.",
      403
    );
  }

  const existing = await prisma.sangguniangBayanResolution.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ResolutionError("Sangguniang Bayan Resolution not found.", 404);
  }

  assertResolutionOfficeBoundary(caller, existing.officeId);

  if (existing.status === "ARCHIVED") {
    throw new ResolutionError("This resolution is already archived.", 400);
  }

  const archived = await prisma.sangguniangBayanResolution.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
      updatedById: caller.id,
    },
  });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.SB_RESOLUTION_ARCHIVED,
    userId: caller.id,
    officeId: existing.officeId,
    details: {
      resolutionId: archived.id,
      resolutionNumber: archived.resolutionNumber,
      year: archived.year,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return archived;
}

/**
 * Permanently deletes a Sangguniang Bayan Resolution and cleans up its Cloudinary PDF asset.
 */
export async function deleteResolution(
  caller: SessionUser,
  id: string,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!hasPermission(caller, PERMISSIONS.SB_RESOLUTIONS_DELETE)) {
    throw new ResolutionError(
      "Missing required permission: sb_resolutions.delete",
      403
    );
  }

  const existing = await prisma.sangguniangBayanResolution.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ResolutionError("Sangguniang Bayan Resolution not found.", 404);
  }

  assertResolutionOfficeBoundary(caller, existing.officeId);

  await prisma.sangguniangBayanResolution.delete({
    where: { id },
  });

  if (existing.storagePublicId) {
    await deleteCloudinaryDocument(existing.storagePublicId);
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.SB_RESOLUTION_DELETED,
    userId: caller.id,
    officeId: existing.officeId,
    details: {
      resolutionId: existing.id,
      resolutionNumber: existing.resolutionNumber,
      year: existing.year,
      title: existing.title,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  return { success: true };
}

/**
 * Public query: returns strictly PUBLISHED Sangguniang Bayan Resolutions
 * with active office and valid PDF attachment, plus available published years.
 */
export async function getPublishedResolutions(filters: {
  year?: number;
  search?: string;
} = {}) {
  const baseWhere: Prisma.SangguniangBayanResolutionWhereInput = {
    status: "PUBLISHED",
    office: {
      status: "ACTIVE",
      slug: SB_OFFICE_SLUG,
    },
    storagePublicId: { not: null },
    storageUrl: { not: null },
    format: "pdf",
  };

  const where: Prisma.SangguniangBayanResolutionWhereInput = {
    ...baseWhere,
    ...(filters.year && Number.isInteger(filters.year) ? { year: filters.year } : {}),
    ...(filters.search && filters.search.trim().length > 0
      ? {
          OR: [
            { resolutionNumber: { contains: filters.search.trim(), mode: "insensitive" } },
            { title: { contains: filters.search.trim(), mode: "insensitive" } },
            { summary: { contains: filters.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [resolutions, yearGroups] = await Promise.all([
    prisma.sangguniangBayanResolution.findMany({
      where,
      select: {
        id: true,
        resolutionNumber: true,
        title: true,
        year: true,
        adoptedAt: true,
        summary: true,
        originalFilename: true,
        bytes: true,
        publishedAt: true,
      },
      orderBy: [{ year: "desc" }, { adoptedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.sangguniangBayanResolution.findMany({
      where: baseWhere,
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  return {
    resolutions: resolutions.map((r) => ({
      ...r,
      fileSizeFormatted: r.bytes ? formatBytes(r.bytes) : "PDF",
    })),
    availableYears: yearGroups.map((g) => g.year),
  };
}

/**
 * Public PDF eligibility check:
 * Returns storage info ONLY if the resolution is PUBLISHED, belongs to the active
 * Office of the Sangguniang Bayan, and has a valid raw PDF asset.
 * Draft, unpublished, and archived resolutions strictly return null.
 */
export async function getEligiblePublicResolution(id: string) {
  const resolution = await prisma.sangguniangBayanResolution.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      office: {
        status: "ACTIVE",
        slug: SB_OFFICE_SLUG,
      },
      storagePublicId: { not: null },
      storageUrl: { not: null },
      format: "pdf",
      resourceType: "raw",
    },
    select: {
      id: true,
      resolutionNumber: true,
      title: true,
      originalFilename: true,
      storagePublicId: true,
      storageUrl: true,
    },
  });

  if (
    !resolution ||
    !resolution.storagePublicId ||
    !resolution.storageUrl ||
    !resolution.originalFilename
  ) {
    return null;
  }

  return {
    id: resolution.id,
    resolutionNumber: resolution.resolutionNumber,
    title: resolution.title,
    originalFilename: resolution.originalFilename,
    storagePublicId: resolution.storagePublicId,
    storageUrl: resolution.storageUrl,
  };
}

export { formatBytes };
