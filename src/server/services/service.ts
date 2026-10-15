import "server-only";
import { prisma } from "@/server/db/client";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import { logAuditEvent } from "@/server/audit/service";
import { sanitizeArticleHtml } from "@/server/news/sanitize";
import {
  CANONICAL_SERVICE_KEYS,
  CANONICAL_SERVICE_PAGES,
  isCanonicalServiceKey,
} from "@/config/services-canonical";
import {
  validateServicePageForPublish,
  type ServicePageDraftInput,
} from "@/lib/validation/services";
import {
  validateCharterPdfFile,
  sanitizeFilename,
} from "@/lib/validation/documents";
import {
  uploadDocumentFile,
  deleteCloudinaryDocument,
  getDocumentDownloadUrl,
} from "@/server/media/cloudinary-documents";
import type { SessionUser } from "@/server/auth/session";

export class ServiceError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * Idempotently ensures all four canonical service pages exist in the database.
 * Created in DRAFT status with safe baseline metadata if not already present.
 */
export async function ensureCanonicalServicePages(createdById?: string) {
  let fallbackUserId = createdById;
  if (!fallbackUserId) {
    const adminUser = await prisma.user.findFirst({
      where: { role: { isSystemScope: true } },
      select: { id: true },
    });
    fallbackUserId = adminUser?.id;
  }

  if (!fallbackUserId) {
    // If no user exists yet, return early without error
    return;
  }

  for (const key of CANONICAL_SERVICE_KEYS) {
    const def = CANONICAL_SERVICE_PAGES[key];
    await prisma.servicePage.upsert({
      where: { serviceKey: key },
      update: {},
      create: {
        serviceKey: key,
        title: def.title,
        description: def.description,
        status: "DRAFT",
        createdById: fallbackUserId,
      },
    });
  }
}

/**
 * Lists the canonical service pages for CMS administration.
 * Requires services.view permission.
 */
export async function getAdminServicesList(user: SessionUser) {
  if (!hasPermission(user, PERMISSIONS.SERVICES_VIEW)) {
    throw new ServiceError("Missing required permission: services.view", 403);
  }

  const pages = await prisma.servicePage.findMany({
    where: {
      serviceKey: { in: [...CANONICAL_SERVICE_KEYS] },
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
      _count: {
        select: {
          sections: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return pages;
}

/**
 * Fetches a single canonical service page for CMS viewing/editing.
 * Enforces canonical key allowlist and services.view permission.
 */
export async function getAdminServicePage(
  user: SessionUser,
  serviceKey: string
) {
  if (!hasPermission(user, PERMISSIONS.SERVICES_VIEW)) {
    throw new ServiceError("Missing required permission: services.view", 403);
  }

  if (!isCanonicalServiceKey(serviceKey)) {
    throw new ServiceError(`Invalid service key: "${serviceKey}". Only canonical service routes may be managed.`, 404);
  }

  await ensureCanonicalServicePages(user.id);

  const page = await prisma.servicePage.findUnique({
    where: { serviceKey },
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
      sections: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      charterDocument: {
        select: {
          id: true,
          title: true,
          originalFilename: true,
          storagePublicId: true,
          storageUrl: true,
          format: true,
          mimeType: true,
          bytes: true,
          status: true,
          purpose: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!page) {
    throw new ServiceError(`Service page "${serviceKey}" not found.`, 404);
  }

  return page;
}

/**
 * Updates a canonical service page and its ordered content sections.
 * Enforces:
 * - services.update permission
 * - Canonical key allowlist
 * - Office scope security boundary
 * - Optimistic concurrency check (expectedUpdatedAt)
 * - Strict XSS sanitization on rich-text section content
 */
export async function updateServicePage(
  user: SessionUser,
  serviceKey: string,
  input: ServicePageDraftInput
) {
  if (!hasPermission(user, PERMISSIONS.SERVICES_UPDATE)) {
    throw new ServiceError("Missing required permission: services.update", 403);
  }

  if (!isCanonicalServiceKey(serviceKey)) {
    throw new ServiceError(`Invalid service key: "${serviceKey}".`, 400);
  }

  const existing = await prisma.servicePage.findUnique({
    where: { serviceKey },
    include: { sections: true },
  });

  if (!existing) {
    throw new ServiceError(`Service page "${serviceKey}" not found.`, 404);
  }

  // Office Scope Enforcement
  if (!isSystemScoped(user)) {
    // OFFICE scope: can only manage if assigned to this office
    if (!user.officeId) {
      throw new ServiceError("Your staff account is not assigned to a municipal office.", 403);
    }
    if (existing.officeId && existing.officeId !== user.officeId) {
      throw new ServiceError("Access restricted: you do not hold authorization for this office.", 403);
    }
    if (!existing.officeId) {
      // Unassigned/system-level service pages cannot be modified by office-scoped staff
      throw new ServiceError("This service page is unassigned and can only be managed by system administrators.", 403);
    }
  }

  // Optimistic Concurrency Check
  if (
    input.expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== input.expectedUpdatedAt
  ) {
    throw new ServiceError(
      "This service page was modified by another staff member. Please refresh to load the latest version before saving.",
      409
    );
  }

  // Determine target officeId
  let targetOfficeId: string | null = existing.officeId;
  if (isSystemScoped(user)) {
    if (input.officeId !== undefined) {
      targetOfficeId = input.officeId ? input.officeId : null;
    }
  }

  // Validate target office exists and is active if set
  if (targetOfficeId) {
    const officeExists = await prisma.office.findUnique({
      where: { id: targetOfficeId },
      select: { id: true, status: true },
    });
    if (!officeExists) {
      throw new ServiceError("The specified municipal office does not exist.", 400);
    }
    if (officeExists.status !== "ACTIVE") {
      throw new ServiceError("The specified municipal office is inactive.", 400);
    }
  }

  // Sanitize section content
  const sanitizedSections = (input.sections || []).map((sec, idx) => ({
    id: sec.id,
    title: sec.title.trim(),
    content: sanitizeArticleHtml(sec.content),
    sortOrder: idx,
  }));

  // Validate charter document association if provided
  let targetCharterDocId: string | null | undefined = undefined;
  if (input.charterDocumentId !== undefined) {
    if (input.charterDocumentId && input.charterDocumentId.trim()) {
      if (serviceKey !== "citizens-charter") {
        throw new ServiceError(
          "Citizen's Charter document attachment is strictly restricted to the citizens-charter service page.",
          400
        );
      }

      const doc = await prisma.document.findUnique({
        where: { id: input.charterDocumentId.trim() },
        select: {
          id: true,
          status: true,
          purpose: true,
          officeId: true,
          office: { select: { id: true, status: true } },
        },
      });
      if (!doc) {
        throw new ServiceError("The selected Citizen's Charter document does not exist.", 400);
      }
      if (doc.status !== "PUBLISHED") {
        throw new ServiceError("Only PUBLISHED documents can be associated as the official Citizen's Charter.", 400);
      }
      if (doc.purpose !== "CITIZENS_CHARTER") {
        throw new ServiceError("Only documents classified with the CITIZENS_CHARTER purpose may be associated as the official Citizen's Charter.", 400);
      }
      if (doc.office.status !== "ACTIVE") {
        throw new ServiceError("The selected document belongs to an inactive municipal office.", 400);
      }
      if (!user.isSystemScope && user.officeId && doc.officeId !== user.officeId) {
        throw new ServiceError("You cannot associate a document belonging to another municipal office.", 403);
      }
      targetCharterDocId = doc.id;
    } else {
      targetCharterDocId = null;
    }
  }

  // Reconcile page and sections in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update main page metadata
    const page = await tx.servicePage.update({
      where: { serviceKey },
      data: {
        title: input.title.trim(),
        description: input.description ? input.description.trim() : null,
        officeId: targetOfficeId,
        ...(targetCharterDocId !== undefined ? { charterDocumentId: targetCharterDocId } : {}),
        updatedById: user.id,
      },
    });

    // Replace sections: delete existing sections for this page and insert sanitized ordered sections
    await tx.serviceSection.deleteMany({
      where: { servicePageId: page.id },
    });

    if (sanitizedSections.length > 0) {
      await tx.serviceSection.createMany({
        data: sanitizedSections.map((sec) => ({
          servicePageId: page.id,
          title: sec.title,
          content: sec.content,
          sortOrder: sec.sortOrder,
        })),
      });
    }

    return tx.servicePage.findUnique({
      where: { id: page.id },
      include: {
        office: true,
        sections: { orderBy: { sortOrder: "asc" } },
      },
    });
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.SERVICE_CONTENT_UPDATED,
    userId: user.id,
    officeId: targetOfficeId || user.officeId,
    details: {
      servicePageId: existing.id,
      serviceKey,
      title: input.title.trim(),
      sectionsCount: sanitizedSections.length,
      status: existing.status,
    },
  });

  return updated;
}

/**
 * Publishes a canonical service page to the public website.
 * Enforces:
 * - services.publish permission
 * - Canonical key allowlist
 * - Office scope security boundary
 * - Content completeness validation (validateServicePageForPublish)
 */
export async function publishServicePage(
  user: SessionUser,
  serviceKey: string,
  input?: ServicePageDraftInput
) {
  if (!hasPermission(user, PERMISSIONS.SERVICES_PUBLISH)) {
    throw new ServiceError("Missing required permission: services.publish", 403);
  }

  if (!isCanonicalServiceKey(serviceKey)) {
    throw new ServiceError(`Invalid service key: "${serviceKey}".`, 400);
  }

  // If input is provided, save updates first
  if (input) {
    await updateServicePage(user, serviceKey, input);
  }

  const existing = await prisma.servicePage.findUnique({
    where: { serviceKey },
    include: {
      sections: true,
      office: { select: { id: true, status: true } },
    },
  });

  if (!existing) {
    throw new ServiceError(`Service page "${serviceKey}" not found.`, 404);
  }

  // Office scope check
  if (!isSystemScoped(user)) {
    if (!user.officeId || (existing.officeId && existing.officeId !== user.officeId)) {
      throw new ServiceError("Access restricted: you do not hold authorization for this office.", 403);
    }
    if (!existing.officeId) {
      throw new ServiceError("This service page is unassigned and can only be published by system administrators.", 403);
    }
  }

  // Active office check if assigned to an office
  if (existing.office && existing.office.status !== "ACTIVE") {
    throw new ServiceError("Cannot publish service page assigned to an inactive municipal office.", 400);
  }

  // Validate structural readiness for publication
  const validation = validateServicePageForPublish({
    title: existing.title,
    description: existing.description,
    sections: existing.sections,
  });

  if (!validation.valid) {
    throw new ServiceError(`Cannot publish incomplete service page: ${validation.errors.join(" ")}`, 400);
  }

  const published = await prisma.servicePage.update({
    where: { serviceKey },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedById: user.id,
    },
    include: {
      office: true,
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.SERVICE_CONTENT_PUBLISHED,
    userId: user.id,
    officeId: existing.officeId || user.officeId,
    details: {
      servicePageId: published.id,
      serviceKey,
      title: published.title,
      previousStatus: existing.status,
      newStatus: "PUBLISHED",
      operation: "PUBLISH",
      publishedAt: published.publishedAt,
    },
  });

  return published;
}

/**
 * Unpublishes a service page back to DRAFT status.
 * Content is removed from public view immediately while preserved in CMS.
 * Strictly requires services.publish permission.
 * Supports optimistic concurrency protection when expectedUpdatedAt is supplied.
 */
export async function unpublishServicePage(
  user: SessionUser,
  serviceKey: string,
  expectedUpdatedAt?: string
) {
  if (!hasPermission(user, PERMISSIONS.SERVICES_PUBLISH)) {
    throw new ServiceError("Missing required permission: services.publish to unpublish service content.", 403);
  }

  if (!isCanonicalServiceKey(serviceKey)) {
    throw new ServiceError(`Invalid service key: "${serviceKey}".`, 400);
  }

  const existing = await prisma.servicePage.findUnique({
    where: { serviceKey },
  });

  if (!existing) {
    throw new ServiceError(`Service page "${serviceKey}" not found.`, 404);
  }

  if (!isSystemScoped(user)) {
    if (!user.officeId || (existing.officeId && existing.officeId !== user.officeId)) {
      throw new ServiceError("Access restricted: you do not hold authorization for this office.", 403);
    }
    if (!existing.officeId) {
      throw new ServiceError("This service page is unassigned and can only be managed by system administrators.", 403);
    }
  }

  // Optimistic concurrency check
  if (
    expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    throw new ServiceError(
      "This service page was modified by another staff member. Please refresh to load the latest version before unpublishing.",
      409
    );
  }

  const unpublished = await prisma.servicePage.update({
    where: { serviceKey },
    data: {
      status: "DRAFT",
      updatedById: user.id,
    },
    include: {
      office: true,
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.SERVICE_CONTENT_PUBLISHED,
    userId: user.id,
    officeId: existing.officeId || user.officeId,
    details: {
      servicePageId: unpublished.id,
      serviceKey,
      title: unpublished.title,
      previousStatus: existing.status,
      newStatus: "DRAFT",
      operation: "UNPUBLISH",
      note: "Service page unpublished and reverted to draft status.",
    },
  });

  return unpublished;
}

/**
 * Public query for canonical service page content.
 * CRITICAL SECURITY RULE:
 * Strictly returns PUBLISHED content only. Draft content is NEVER returned.
 */
export async function getPublishedServicePage(serviceKey: string) {
  if (!isCanonicalServiceKey(serviceKey)) {
    return null;
  }

  const page = await prisma.servicePage.findFirst({
    where: {
      serviceKey,
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
      sections: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      charterDocument: {
        select: {
          id: true,
          title: true,
          originalFilename: true,
          storagePublicId: true,
          storageUrl: true,
          format: true,
          mimeType: true,
          bytes: true,
          status: true,
          purpose: true,
          publishedAt: true,
        },
      },
    },
  });

  if (page && page.charterDocument) {
    if (
      page.charterDocument.status !== "PUBLISHED" ||
      page.charterDocument.purpose !== "CITIZENS_CHARTER"
    ) {
      return {
        ...page,
        charterDocument: null,
      };
    }
  }

  return page;
}

/**
 * Direct upload and automatic association of the official Citizen's Charter PDF.
 * Reuses the authoritative Document -> Cloudinary -> PostgreSQL architecture.
 * Enforces:
 * - services.update, documents.create, and documents.publish permissions
 * - serviceKey == "citizens-charter" strictly
 * - PDF only format validation (.pdf extension + authentic %PDF- header magic bytes, max 15 MB)
 * - Server-side forced purpose: CITIZENS_CHARTER
 * - Direct publication status: PUBLISHED
 * - Automatic association to ServicePage.charterDocumentId
 * - Rollback of Cloudinary asset if DB persistence fails
 * - Audit logs for DOCUMENT_CREATED, DOCUMENT_PUBLISHED, and SERVICE_CONTENT_UPDATED
 * - Safe replacement: does NOT delete previous Document or Cloudinary asset
 */
export async function uploadAndAttachCharterPdf(
  user: SessionUser,
  serviceKey: string,
  params: {
    fileBuffer: Buffer;
    filename: string;
    mimeType?: string;
    size: number;
    title?: string;
  }
) {
  if (
    !hasPermission(user, PERMISSIONS.SERVICES_UPDATE) ||
    !hasPermission(user, PERMISSIONS.DOCUMENTS_CREATE) ||
    !hasPermission(user, PERMISSIONS.DOCUMENTS_PUBLISH)
  ) {
    throw new ServiceError(
      "Missing required permissions to upload and publish official Citizen's Charter document.",
      403
    );
  }

  if (serviceKey !== "citizens-charter") {
    throw new ServiceError(
      "Direct charter PDF upload is strictly restricted to the Citizen's Charter service.",
      400
    );
  }

  await ensureCanonicalServicePages(user.id);

  const servicePage = await prisma.servicePage.findUnique({
    where: { serviceKey: "citizens-charter" },
  });

  if (!servicePage) {
    throw new ServiceError("Citizen's Charter service page not found.", 404);
  }

  // Office Scope Enforcement
  let targetOfficeId: string;
  if (!isSystemScoped(user)) {
    if (!user.officeId) {
      throw new ServiceError("Your staff account is not assigned to a municipal office.", 403);
    }
    if (!servicePage.officeId) {
      throw new ServiceError("This service page is unassigned and can only be managed by system administrators.", 403);
    }
    if (servicePage.officeId !== user.officeId) {
      throw new ServiceError("Access restricted: you do not hold authorization for this office.", 403);
    }
    targetOfficeId = user.officeId;
  } else {
    if (servicePage.officeId) {
      targetOfficeId = servicePage.officeId;
    } else if (user.officeId) {
      targetOfficeId = user.officeId;
    } else {
      const activeOffice = await prisma.office.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (!activeOffice) {
        throw new ServiceError("No active municipal office is available to own this document.", 400);
      }
      targetOfficeId = activeOffice.id;
    }
  }

  // Validate target office exists and is active
  const targetOffice = await prisma.office.findUnique({
    where: { id: targetOfficeId },
    select: { id: true, status: true, name: true },
  });
  if (!targetOffice || targetOffice.status !== "ACTIVE") {
    throw new ServiceError("The assigned municipal office is inactive or invalid.", 400);
  }

  // Strict PDF-only validation (deep magic bytes check)
  const fileValidation = validateCharterPdfFile({
    filename: params.filename,
    size: params.size,
    mimeType: params.mimeType,
    buffer: params.fileBuffer,
  });
  if (!fileValidation.valid) {
    throw new ServiceError(fileValidation.error || "Invalid Citizen's Charter PDF.", 400);
  }

  const cleanFilename = sanitizeFilename(params.filename);
  const cleanTitle =
    params.title?.trim() && params.title.trim().length >= 3
      ? params.title.trim()
      : "Official Citizen's Charter";

  // Upload raw PDF to Cloudinary under san-felipe-lgu/documents/<year>
  const uploadResult = await uploadDocumentFile(params.fileBuffer, {
    filename: cleanFilename,
    format: "pdf",
  });

  // Persist Document in DB in PUBLISHED status with forced CITIZENS_CHARTER purpose
  let createdDocument;
  try {
    createdDocument = await prisma.document.create({
      data: {
        title: cleanTitle,
        description:
          "Official frontline service standards, procedural requirements, processing turnaround times, and fee schedules published by the Municipality of San Felipe, Zambales.",
        category: "General Administration",
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        publishedAt: new Date(),
        officeId: targetOfficeId,
        originalFilename: cleanFilename,
        storagePublicId: uploadResult.publicId,
        storageUrl: uploadResult.url,
        resourceType: "raw",
        format: "pdf",
        mimeType: params.mimeType || "application/pdf",
        bytes: uploadResult.bytes,
        createdById: user.id,
        updatedById: user.id,
      },
      include: {
        office: { select: { id: true, name: true, slug: true } },
      },
    });
  } catch (dbError) {
    console.error("[SERVICES] Database persistence of Charter document failed, rolling back Cloudinary asset:", dbError);
    await deleteCloudinaryDocument(uploadResult.publicId);
    throw new ServiceError("Failed to save Citizen's Charter document record in database.", 500);
  }

  // Automatically associate new document to ServicePage
  // Safe replacement: does NOT delete previous Document or Cloudinary asset
  try {
    await prisma.servicePage.update({
      where: { serviceKey: "citizens-charter" },
      data: {
        charterDocumentId: createdDocument.id,
        updatedById: user.id,
      },
    });
  } catch (assocError) {
    console.error("[SERVICES] Failed to associate newly created Charter document to service page:", assocError);
    throw new ServiceError(
      "Citizen's Charter document was created but could not be linked to the service page.",
      500
    );
  }

  // Record audit trail
  await logAuditEvent({
    action: AUDIT_ACTIONS.DOCUMENT_CREATED,
    userId: user.id,
    officeId: targetOfficeId,
    details: {
      documentId: createdDocument.id,
      title: createdDocument.title,
      purpose: "CITIZENS_CHARTER",
      status: "PUBLISHED",
      filename: cleanFilename,
      format: "pdf",
      bytes: uploadResult.bytes,
      storagePublicId: uploadResult.publicId,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.DOCUMENT_PUBLISHED,
    userId: user.id,
    officeId: targetOfficeId,
    details: {
      documentId: createdDocument.id,
      title: createdDocument.title,
      purpose: "CITIZENS_CHARTER",
      status: "PUBLISHED",
      publishedAt: createdDocument.publishedAt,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.SERVICE_CONTENT_UPDATED,
    userId: user.id,
    officeId: targetOfficeId,
    details: {
      servicePageId: servicePage.id,
      serviceKey: "citizens-charter",
      charterDocumentId: createdDocument.id,
      previousCharterDocumentId: servicePage.charterDocumentId,
      operation: "ATTACH_CHARTER_PDF",
    },
  });

  return {
    ...createdDocument,
    downloadUrl: getDocumentDownloadUrl(
      createdDocument.storagePublicId,
      createdDocument.originalFilename
    ),
  };
}

/**
 * Removes the charter document association from the Citizen's Charter service page.
 * Sets ServicePage.charterDocumentId = null.
 * CRITICAL: Does NOT delete the underlying Document record or Cloudinary asset.
 */
export async function removeCharterDocumentAssociation(
  user: SessionUser,
  serviceKey: string
) {
  if (!hasPermission(user, PERMISSIONS.SERVICES_UPDATE)) {
    throw new ServiceError("Missing required permission: services.update", 403);
  }

  if (serviceKey !== "citizens-charter") {
    throw new ServiceError(
      "Charter document association is strictly restricted to the citizens-charter service page.",
      400
    );
  }

  const existing = await prisma.servicePage.findUnique({
    where: { serviceKey: "citizens-charter" },
  });

  if (!existing) {
    throw new ServiceError("Citizen's Charter service page not found.", 404);
  }

  if (!isSystemScoped(user)) {
    if (!user.officeId) {
      throw new ServiceError("Your staff account is not assigned to a municipal office.", 403);
    }
    if (!existing.officeId) {
      throw new ServiceError("This service page is unassigned and can only be managed by system administrators.", 403);
    }
    if (existing.officeId !== user.officeId) {
      throw new ServiceError("Access restricted: you do not hold authorization for this office.", 403);
    }
  }

  if (!existing.charterDocumentId) {
    return existing;
  }

  const previousDocId = existing.charterDocumentId;

  const updated = await prisma.servicePage.update({
    where: { serviceKey: "citizens-charter" },
    data: {
      charterDocumentId: null,
      updatedById: user.id,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.SERVICE_CONTENT_UPDATED,
    userId: user.id,
    officeId: existing.officeId || user.officeId,
    details: {
      servicePageId: existing.id,
      serviceKey: "citizens-charter",
      charterDocumentId: null,
      previousCharterDocumentId: previousDocId,
      operation: "REMOVE_CHARTER_ASSOCIATION",
      note: "Citizen's Charter document association removed. The underlying Document remains preserved in Document Management.",
    },
  });

  return updated;
}

/**
 * Associates an existing PUBLISHED CITIZENS_CHARTER document to the Citizen's Charter service page.
 */
export async function attachExistingCharterDocument(
  user: SessionUser,
  serviceKey: string,
  documentId: string
) {
  if (!hasPermission(user, PERMISSIONS.SERVICES_UPDATE)) {
    throw new ServiceError("Missing required permission: services.update", 403);
  }

  if (serviceKey !== "citizens-charter") {
    throw new ServiceError(
      "Charter document association is strictly restricted to the citizens-charter service page.",
      400
    );
  }

  const existing = await prisma.servicePage.findUnique({
    where: { serviceKey: "citizens-charter" },
  });

  if (!existing) {
    throw new ServiceError("Citizen's Charter service page not found.", 404);
  }

  if (!isSystemScoped(user)) {
    if (!user.officeId) {
      throw new ServiceError("Your staff account is not assigned to a municipal office.", 403);
    }
    if (!existing.officeId) {
      throw new ServiceError("This service page is unassigned and can only be managed by system administrators.", 403);
    }
    if (existing.officeId !== user.officeId) {
      throw new ServiceError("Access restricted: you do not hold authorization for this office.", 403);
    }
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId.trim() },
    include: { office: { select: { id: true, status: true } } },
  });

  if (!doc) {
    throw new ServiceError("The selected Citizen's Charter document does not exist.", 400);
  }
  if (doc.status !== "PUBLISHED") {
    throw new ServiceError("Only PUBLISHED documents can be associated as the official Citizen's Charter.", 400);
  }
  if (doc.purpose !== "CITIZENS_CHARTER") {
    throw new ServiceError("Only documents classified with the CITIZENS_CHARTER purpose may be associated as the official Citizen's Charter.", 400);
  }
  if (doc.office.status !== "ACTIVE") {
    throw new ServiceError("The selected document belongs to an inactive municipal office.", 400);
  }
  if (!isSystemScoped(user) && doc.officeId !== user.officeId) {
    throw new ServiceError("You cannot associate a document belonging to another municipal office.", 403);
  }

  const previousDocId = existing.charterDocumentId;

  const updated = await prisma.servicePage.update({
    where: { serviceKey: "citizens-charter" },
    data: {
      charterDocumentId: doc.id,
      updatedById: user.id,
    },
    include: {
      charterDocument: true,
    },
  });

  await logAuditEvent({
    action: AUDIT_ACTIONS.SERVICE_CONTENT_UPDATED,
    userId: user.id,
    officeId: existing.officeId || user.officeId,
    details: {
      servicePageId: existing.id,
      serviceKey: "citizens-charter",
      charterDocumentId: doc.id,
      previousCharterDocumentId: previousDocId,
      operation: "ATTACH_EXISTING_CHARTER_DOCUMENT",
    },
  });

  return updated;
}
