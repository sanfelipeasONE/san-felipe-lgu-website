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

  // Validate target office exists if set
  if (targetOfficeId) {
    const officeExists = await prisma.office.findUnique({
      where: { id: targetOfficeId },
      select: { id: true },
    });
    if (!officeExists) {
      throw new ServiceError("The specified municipal office does not exist.", 400);
    }
  }

  // Sanitize section content
  const sanitizedSections = (input.sections || []).map((sec, idx) => ({
    id: sec.id,
    title: sec.title.trim(),
    content: sanitizeArticleHtml(sec.content),
    sortOrder: idx,
  }));

  // Reconcile page and sections in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update main page metadata
    const page = await tx.servicePage.update({
      where: { serviceKey },
      data: {
        title: input.title.trim(),
        description: input.description ? input.description.trim() : null,
        officeId: targetOfficeId,
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
    include: { sections: true },
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
 */
export async function unpublishServicePage(
  user: SessionUser,
  serviceKey: string
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
    },
  });

  return page;
}
