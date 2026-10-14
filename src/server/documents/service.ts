import "server-only";
import { prisma } from "@/server/db/client";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import { logAuditEvent } from "@/server/audit/service";
import {
  uploadDocumentFile,
  deleteCloudinaryDocument,
  getDocumentDownloadUrl,
} from "@/server/media/cloudinary-documents";
import {
  validateDocumentFile,
  sanitizeFilename,
  formatBytes,
  ALLOWED_DOCUMENT_EXTENSIONS,
  type AllowedDocumentExtension,
  type DocumentInput,
} from "@/lib/validation/documents";
import type { SessionUser } from "@/server/auth/session";
import type { DocumentStatus, Prisma } from "@prisma/client";

export class DocumentError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "DocumentError";
  }
}

export interface AdminDocumentFilters {
  search?: string;
  status?: string;
  category?: string;
  officeId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Lists documents for CMS administrative management with role/scope enforcement.
 * SYSTEM-scope users can see all documents and filter by office.
 * OFFICE-scope users can only see documents belonging to their assigned office.
 */
export async function getAdminDocumentsList(
  user: SessionUser,
  filters?: AdminDocumentFilters
) {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    throw new DocumentError("You do not have permission to view documents.", 403);
  }

  const isSystem = isSystemScoped(user);

  // Office-scoped users must have an assigned office and cannot view outside it
  if (!isSystem && !user.officeId) {
    return {
      documents: [],
      total: 0,
      page: 1,
      pageSize: filters?.pageSize || 10,
      totalPages: 0,
    };
  }

  const where: Prisma.DocumentWhereInput = {};

  if (!isSystem) {
    where.officeId = user.officeId!;
  } else if (filters?.officeId) {
    where.officeId = filters.officeId;
  }

  if (filters?.status) {
    where.status = filters.status as DocumentStatus;
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { originalFilename: { contains: q, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, filters?.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters?.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const [total, documents] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        office: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const items = documents.map((doc) => ({
    ...doc,
    downloadUrl: getDocumentDownloadUrl(doc.storagePublicId, doc.originalFilename),
  }));

  return {
    documents: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Retrieves a single document by ID for CMS editing, enforcing office scope.
 */
export async function getAdminDocumentById(user: SessionUser, id: string) {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    throw new DocumentError("You do not have permission to view documents.", 403);
  }

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      office: { select: { id: true, name: true, slug: true, status: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!doc) {
    throw new DocumentError("Document not found.", 404);
  }

  // Office scope check
  if (!isSystemScoped(user) && doc.officeId !== user.officeId) {
    throw new DocumentError(
      "You do not have permission to access documents belonging to another office.",
      403
    );
  }

  return {
    ...doc,
    downloadUrl: getDocumentDownloadUrl(doc.storagePublicId, doc.originalFilename),
  };
}

/**
 * Creates a new municipal document in DRAFT status.
 * Uploads document file to Cloudinary raw storage and creates database record.
 * Office ownership is strictly derived on the server for OFFICE-scoped users.
 */
export async function createDocument(
  user: SessionUser,
  params: {
    input: DocumentInput;
    fileBuffer: Buffer;
    filename: string;
    mimeType?: string;
    size: number;
  }
) {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_CREATE)) {
    throw new DocumentError("You do not have permission to create documents.", 403);
  }

  const isSystem = isSystemScoped(user);
  let targetOfficeId: string;

  if (isSystem) {
    if (!params.input.officeId) {
      throw new DocumentError("An owning municipal office is required.", 400);
    }
    targetOfficeId = params.input.officeId;
  } else {
    if (!user.officeId) {
      throw new DocumentError("Your account does not have an assigned office to own documents.", 403);
    }
    // Office-scoped users must strictly use their assigned office
    targetOfficeId = user.officeId;
  }

  // Verify target office exists and is ACTIVE
  const targetOffice = await prisma.office.findUnique({
    where: { id: targetOfficeId },
    select: { id: true, status: true, name: true },
  });

  if (!targetOffice) {
    throw new DocumentError("The selected municipal office does not exist.", 400);
  }

  if (targetOffice.status !== "ACTIVE") {
    throw new DocumentError("Documents can only be assigned to active municipal offices.", 400);
  }

  // Validate uploaded file and verify content signatures
  const fileValidation = validateDocumentFile({
    filename: params.filename,
    size: params.size,
    mimeType: params.mimeType,
    buffer: params.fileBuffer,
  });

  if (!fileValidation.valid || !fileValidation.extension) {
    throw new DocumentError(fileValidation.error || "Invalid document file.", 400);
  }

  const cleanOriginalFilename = sanitizeFilename(params.filename);

  // Upload raw file to Cloudinary
  const uploadResult = await uploadDocumentFile(params.fileBuffer, {
    filename: cleanOriginalFilename,
    format: fileValidation.extension,
  });

  let createdDocument;
  try {
    createdDocument = await prisma.document.create({
      data: {
        title: params.input.title.trim(),
        description: params.input.description?.trim() || null,
        category: params.input.category?.trim() || null,
        status: "DRAFT",
        officeId: targetOfficeId,
        originalFilename: cleanOriginalFilename,
        storagePublicId: uploadResult.publicId,
        storageUrl: uploadResult.url,
        resourceType: "raw",
        format: uploadResult.format,
        mimeType: params.mimeType || "application/octet-stream",
        bytes: uploadResult.bytes,
        createdById: user.id,
        updatedById: user.id,
      },
      include: {
        office: { select: { id: true, name: true, slug: true } },
      },
    });
  } catch (dbError) {
    // If DB persistence fails, immediately clean up newly uploaded Cloudinary asset
    console.error("[DOCUMENTS] Database creation failed, rolling back uploaded asset:", dbError);
    await deleteCloudinaryDocument(uploadResult.publicId);
    throw new DocumentError("Failed to save document record in database.", 500);
  }

  await logAuditEvent({
    action: AUDIT_ACTIONS.DOCUMENT_CREATED,
    userId: user.id,
    officeId: targetOfficeId,
    details: {
      documentId: createdDocument.id,
      title: createdDocument.title,
      officeId: targetOfficeId,
      filename: cleanOriginalFilename,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      storagePublicId: uploadResult.publicId,
      status: createdDocument.status,
    },
  });

  return {
    ...createdDocument,
    downloadUrl: getDocumentDownloadUrl(createdDocument.storagePublicId, createdDocument.originalFilename),
  };
}

/**
 * Updates document metadata and optionally replaces the underlying file asset.
 * Safe replacement order:
 * 1. Upload new asset to Cloudinary
 * 2. Update DB record in transaction
 * 3. Delete old Cloudinary asset only after DB update succeeds
 * 4. If DB update fails, clean up new asset and throw error
 */
export async function updateDocument(
  user: SessionUser,
  id: string,
  params: {
    input: DocumentInput;
    file?: {
      fileBuffer: Buffer;
      filename: string;
      mimeType?: string;
      size: number;
    };
  }
) {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_UPDATE)) {
    throw new DocumentError("You do not have permission to update documents.", 403);
  }

  const existing = await prisma.document.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new DocumentError("Document not found.", 404);
  }

  const isSystem = isSystemScoped(user);

  // Office scope check
  if (!isSystem && existing.officeId !== user.officeId) {
    throw new DocumentError("You do not have permission to modify documents belonging to another office.", 403);
  }

  // Optimistic concurrency check
  if (
    params.input.expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== params.input.expectedUpdatedAt
  ) {
    throw new DocumentError(
      "This document was modified by another user. Please refresh to load the latest version before saving.",
      409
    );
  }

  // Determine officeId
  let targetOfficeId = existing.officeId;
  if (isSystem && params.input.officeId && params.input.officeId !== existing.officeId) {
    const targetOffice = await prisma.office.findUnique({
      where: { id: params.input.officeId },
      select: { id: true, status: true },
    });
    if (!targetOffice) {
      throw new DocumentError("The selected municipal office does not exist.", 400);
    }
    if (targetOffice.status !== "ACTIVE") {
      throw new DocumentError("Documents can only be assigned to active municipal offices.", 400);
    }
    targetOfficeId = params.input.officeId;
  }

  // If a new file is provided, perform safe replacement
  if (params.file) {
    const fileValidation = validateDocumentFile({
      filename: params.file.filename,
      size: params.file.size,
      mimeType: params.file.mimeType,
      buffer: params.file.fileBuffer,
    });

    if (!fileValidation.valid || !fileValidation.extension) {
      throw new DocumentError(fileValidation.error || "Invalid replacement document file.", 400);
    }

    const cleanFilename = sanitizeFilename(params.file.filename);

    // Step 1: Upload new file first
    const newUploadResult = await uploadDocumentFile(params.file.fileBuffer, {
      filename: cleanFilename,
      format: fileValidation.extension,
    });

    // Step 2: Atomic conditional update with concurrency protection
    let updated;
    try {
      const updateResult = await prisma.document.updateMany({
        where: {
          id,
          updatedAt: existing.updatedAt,
        },
        data: {
          title: params.input.title.trim(),
          description: params.input.description?.trim() || null,
          category: params.input.category?.trim() || null,
          officeId: targetOfficeId,
          originalFilename: cleanFilename,
          storagePublicId: newUploadResult.publicId,
          storageUrl: newUploadResult.url,
          format: newUploadResult.format,
          mimeType: params.file.mimeType || "application/octet-stream",
          bytes: newUploadResult.bytes,
          updatedById: user.id,
        },
      });

      if (updateResult.count === 0) {
        // Step 4: If conditional update fails (concurrent update occurred), clean up new upload
        await deleteCloudinaryDocument(newUploadResult.publicId);
        throw new DocumentError(
          "This document was modified by another user. Please refresh to load the latest version before saving.",
          409
        );
      }

      updated = await prisma.document.findUniqueOrThrow({
        where: { id },
        include: {
          office: { select: { id: true, name: true, slug: true } },
        },
      });
    } catch (dbError) {
      if (dbError instanceof DocumentError) throw dbError;
      console.error("[DOCUMENTS] Database update failed during file replacement, rolling back new asset:", dbError);
      await deleteCloudinaryDocument(newUploadResult.publicId);
      throw new DocumentError("Failed to update document record with replacement file.", 500);
    }

    // Step 3: Delete old Cloudinary asset only after DB success
    if (existing.storagePublicId && existing.storagePublicId !== newUploadResult.publicId) {
      const deletedOld = await deleteCloudinaryDocument(existing.storagePublicId);
      if (!deletedOld) {
        console.warn("[DOCUMENTS] Old Cloudinary asset deletion unconfirmed after successful document replacement:", {
          documentId: id,
          oldPublicId: existing.storagePublicId,
        });
      }
    }

    await logAuditEvent({
      action: AUDIT_ACTIONS.DOCUMENT_FILE_REPLACED,
      userId: user.id,
      officeId: targetOfficeId,
      details: {
        documentId: id,
        title: updated.title,
        oldFilename: existing.originalFilename,
        newFilename: cleanFilename,
        oldPublicId: existing.storagePublicId,
        newPublicId: newUploadResult.publicId,
        bytes: newUploadResult.bytes,
      },
    });

    return {
      ...updated,
      downloadUrl: getDocumentDownloadUrl(updated.storagePublicId, updated.originalFilename),
    };
  }

  // Metadata only update (no file replacement) with atomic concurrency protection
  const updateResult = await prisma.document.updateMany({
    where: {
      id,
      updatedAt: existing.updatedAt,
    },
    data: {
      title: params.input.title.trim(),
      description: params.input.description?.trim() || null,
      category: params.input.category?.trim() || null,
      officeId: targetOfficeId,
      updatedById: user.id,
    },
  });

  if (updateResult.count === 0) {
    throw new DocumentError(
      "This document was modified by another user. Please refresh to load the latest version before saving.",
      409
    );
  }

  const updated = await prisma.document.findUniqueOrThrow({
    where: { id },
    include: {
      office: { select: { id: true, name: true, slug: true } },
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.DOCUMENT_UPDATED,
    userId: user.id,
    officeId: targetOfficeId,
    details: {
      documentId: id,
      title: updated.title,
      officeId: targetOfficeId,
      category: updated.category,
    },
  });

  return {
    ...updated,
    downloadUrl: getDocumentDownloadUrl(updated.storagePublicId, updated.originalFilename),
  };
}

/**
 * Publishes a document, transitioning status from DRAFT (or ARCHIVED) to PUBLISHED.
 * Enforces office scope and ensures file asset and active office are present.
 */
export async function publishDocument(
  user: SessionUser,
  id: string,
  expectedUpdatedAt?: string
) {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_PUBLISH)) {
    throw new DocumentError("You do not have permission to publish documents.", 403);
  }

  const existing = await prisma.document.findUnique({
    where: { id },
    include: { office: { select: { id: true, status: true } } },
  });

  if (!existing) {
    throw new DocumentError("Document not found.", 404);
  }

  if (!isSystemScoped(user) && existing.officeId !== user.officeId) {
    throw new DocumentError("You do not have permission to publish documents belonging to another office.", 403);
  }

  if (!existing.title || existing.title.trim().length < 3) {
    throw new DocumentError("Cannot publish document with invalid title.", 400);
  }

  if (!existing.office || existing.office.status !== "ACTIVE") {
    throw new DocumentError("Cannot publish documents for an inactive municipal office.", 400);
  }

  if (!existing.storagePublicId || !existing.storageUrl) {
    throw new DocumentError("Cannot publish a document without an uploaded file asset.", 400);
  }

  if (existing.resourceType !== "raw") {
    throw new DocumentError("Document must use raw storage resource type.", 400);
  }

  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(existing.format.toLowerCase() as AllowedDocumentExtension)) {
    throw new DocumentError(`Document format ${existing.format} is not supported for publication.`, 400);
  }

  // Optimistic concurrency check
  if (
    expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new DocumentError(
      "This document was modified by another user. Please refresh before publishing.",
      409
    );
  }

  const updateResult = await prisma.document.updateMany({
    where: {
      id,
      updatedAt: existing.updatedAt,
    },
    data: {
      status: "PUBLISHED",
      publishedAt: existing.publishedAt || new Date(),
      updatedById: user.id,
    },
  });

  if (updateResult.count === 0) {
    throw new DocumentError(
      "This document was modified by another user. Please refresh before publishing.",
      409
    );
  }

  const published = await prisma.document.findUniqueOrThrow({
    where: { id },
    include: {
      office: { select: { id: true, name: true, slug: true } },
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.DOCUMENT_PUBLISHED,
    userId: user.id,
    officeId: published.officeId,
    details: {
      documentId: id,
      title: published.title,
      publishedAt: published.publishedAt,
      filename: published.originalFilename,
    },
  });

  return {
    ...published,
    downloadUrl: getDocumentDownloadUrl(published.storagePublicId, published.originalFilename),
  };
}

/**
 * Archives a published or draft document.
 * Sets status to ARCHIVED.
 * CRITICAL: Archiving preserves the Cloudinary asset in storage for municipal records;
 * it DOES NOT delete the cloud storage asset.
 */
export async function archiveDocument(
  user: SessionUser,
  id: string,
  expectedUpdatedAt?: string
) {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_ARCHIVE)) {
    throw new DocumentError("You do not have permission to archive documents.", 403);
  }

  const existing = await prisma.document.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new DocumentError("Document not found.", 404);
  }

  if (!isSystemScoped(user) && existing.officeId !== user.officeId) {
    throw new DocumentError("You do not have permission to archive documents belonging to another office.", 403);
  }

  // Optimistic concurrency check
  if (
    expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new DocumentError(
      "This document was modified by another user. Please refresh before archiving.",
      409
    );
  }

  const updateResult = await prisma.document.updateMany({
    where: {
      id,
      updatedAt: existing.updatedAt,
    },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
      updatedById: user.id,
    },
  });

  if (updateResult.count === 0) {
    throw new DocumentError(
      "This document was modified by another user. Please refresh before archiving.",
      409
    );
  }

  const archived = await prisma.document.findUniqueOrThrow({
    where: { id },
    include: {
      office: { select: { id: true, name: true, slug: true } },
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.DOCUMENT_ARCHIVED,
    userId: user.id,
    officeId: archived.officeId,
    details: {
      documentId: id,
      title: archived.title,
      archivedAt: archived.archivedAt,
      filename: archived.originalFilename,
    },
  });

  return {
    ...archived,
    downloadUrl: getDocumentDownloadUrl(archived.storagePublicId, archived.originalFilename),
  };
}

/**
 * Public document query.
 * Strictly queries documents with status === "PUBLISHED" belonging to ACTIVE offices.
 * Draft and Archived documents are strictly excluded.
 */
export async function getPublishedDocuments(filters?: {
  search?: string;
  category?: string;
  officeId?: string;
}) {
  const where: Prisma.DocumentWhereInput = {
    status: "PUBLISHED",
    office: {
      status: "ACTIVE",
    },
  };

  if (filters?.officeId) {
    where.officeId = filters.officeId;
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { originalFilename: { contains: q, mode: "insensitive" } },
    ];
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      office: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    originalFilename: doc.originalFilename,
    format: doc.format.toUpperCase(),
    bytes: doc.bytes,
    fileSizeFormatted: formatBytes(doc.bytes),
    publishedAt: doc.publishedAt,
    office: doc.office,
    downloadUrl: getDocumentDownloadUrl(doc.storagePublicId, doc.originalFilename),
  }));
}

export { formatBytes } from "@/lib/validation/documents";
