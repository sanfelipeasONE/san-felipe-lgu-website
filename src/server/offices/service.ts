import "server-only";
import { prisma } from "@/server/db/client";
import { type SessionUser, revokeOfficeSessions } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { recordAuditEvent } from "@/server/audit/service";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import type { UpdateOfficeInput } from "@/lib/validation/offices";
import { OfficeStatus } from "@prisma/client";
import {
  getCanonicalOffices,
  type MunicipalOffice,
} from "@/config/offices-data";

export class OfficeError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "OfficeError";
  }
}

/**
 * Lists all municipal offices.
 * Strictly restricted to SYSTEM scope administrators holding offices.view.
 * Excludes deprecated legacy placeholder records (ICTO).
 */
export async function listOffices(caller: SessionUser) {
  if (!caller.isSystemScope) {
    throw new OfficeError("Access restricted: Office management requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.OFFICES_VIEW)) {
    throw new OfficeError("Missing required permission: offices.view", 403);
  }

  return prisma.office.findMany({
    where: {
      slug: { not: "icto" },
    },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      location: true,
      officeHours: true,
      officeHead: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          newsArticles: true,
          documents: true,
          jobOpportunities: true,
          servicePages: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Retrieves a single municipal office with detail counts.
 */
export async function getOfficeById(caller: SessionUser, officeId: string) {
  if (!caller.isSystemScope) {
    throw new OfficeError("Access restricted: Office management requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.OFFICES_VIEW)) {
    throw new OfficeError("Missing required permission: offices.view", 403);
  }

  const office = await prisma.office.findUnique({
    where: { id: officeId },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      description: true,
      mandate: true,
      location: true,
      officeHours: true,
      officeHead: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          newsArticles: true,
          documents: true,
          jobOpportunities: true,
          servicePages: true,
        },
      },
    },
  });

  if (!office || office.slug === "icto") {
    throw new OfficeError("Municipal office not found.", 404);
  }

  return office;
}

/**
 * Updates a municipal office's operational metadata and status.
 * - Enforces optimistic concurrency (expectedUpdatedAt).
 * - Records audit events.
 * - Revokes active sessions of users assigned to this office if deactivated.
 */
export async function updateOffice(
  caller: SessionUser,
  officeId: string,
  input: UpdateOfficeInput,
  clientMeta?: { ipAddress?: string | null; userAgent?: string | null }
) {
  if (!caller.isSystemScope) {
    throw new OfficeError("Access restricted: Office management requires System Administrator authority.", 403);
  }
  if (!hasPermission(caller, PERMISSIONS.OFFICES_UPDATE)) {
    throw new OfficeError("Missing required permission: offices.update", 403);
  }

  const existing = await prisma.office.findUnique({
    where: { id: officeId },
  });

  if (!existing || existing.slug === "icto") {
    throw new OfficeError("Municipal office not found.", 404);
  }

  // Optimistic concurrency check
  if (
    input.expectedUpdatedAt &&
    existing.updatedAt.toISOString() !== input.expectedUpdatedAt
  ) {
    throw new OfficeError(
      "This office record was modified by another administrator. Please refresh and review before saving.",
      409
    );
  }

  const statusChanged = input.status !== existing.status;

  const updated = await prisma.office.update({
    where: { id: officeId },
    data: {
      name: input.name.trim(),
      shortName: input.shortName ? input.shortName.trim() : null,
      location: input.location ? input.location.trim() : null,
      officeHours: input.officeHours ? input.officeHours.trim() : null,
      officeHead: input.officeHead ? input.officeHead.trim() : null,
      email: input.email ? input.email.trim().toLowerCase() : null,
      phone: input.phone ? input.phone.trim() : null,
      description: input.description ? input.description.trim() : null,
      mandate: input.mandate ? input.mandate.trim() : null,
      status: input.status as OfficeStatus,
    },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      location: true,
      officeHours: true,
      officeHead: true,
      email: true,
      phone: true,
      description: true,
      mandate: true,
      status: true,
      updatedAt: true,
    },
  });

  // If deactivated, revoke active sessions of users belonging to this office
  if (statusChanged && updated.status === OfficeStatus.INACTIVE) {
    await revokeOfficeSessions(officeId);
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.OFFICE_UPDATED,
    userId: caller.id,
    officeId: updated.id,
    details: {
      officeId: updated.id,
      name: updated.name,
      statusChanged,
      newStatus: updated.status,
    },
    ipAddress: clientMeta?.ipAddress,
    userAgent: clientMeta?.userAgent,
  });

  if (statusChanged) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.OFFICE_STATUS_CHANGED,
      userId: caller.id,
      officeId: updated.id,
      details: {
        officeId: updated.id,
        previousStatus: existing.status,
        newStatus: updated.status,
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });
  }

  return updated;
}

/**
 * Public directory query: Returns the 18 canonical municipal offices with
 * database-backed mutable metadata merged onto the canonical order and identity.
 *
 * Strict constraints:
 * - Exactly the 18 canonical offices are returned.
 * - Legacy ICTO is strictly excluded.
 * - Noncanonical / arbitrary test rows in the database are strictly excluded.
 * - Canonical displayOrder (1 to 18) is strictly preserved.
 * - Canonical verified acronym is 100% authoritative; database shortName cannot invent or override acronyms.
 * - Safe fallback: if database query encounters an error, returns the canonical baseline.
 */
export async function getPublicCanonicalOffices(): Promise<MunicipalOffice[]> {
  const canonicalOffices = getCanonicalOffices();
  const canonicalSlugs = canonicalOffices.map((o) => o.slug);

  try {
    const dbOffices = await prisma.office.findMany({
      where: {
        slug: { in: canonicalSlugs },
      },
      select: {
        slug: true,
        officeHead: true,
        location: true,
        officeHours: true,
        email: true,
        phone: true,
      },
    });

    const dbMap = new Map(dbOffices.map((o) => [o.slug, o]));

    return canonicalOffices.map((canonical) => {
      const db = dbMap.get(canonical.slug);
      if (!db) return canonical;

      return {
        ...canonical,
        // Canonical configuration is strictly authoritative for public acronym
        acronym: canonical.acronym ?? "",
        // Database officeHead takes precedence if non-null
        head: db.officeHead ?? canonical.head,
        // Database location takes precedence if non-null
        location: db.location ?? canonical.location,
        // Database email takes precedence if non-null
        email: db.email ?? canonical.email,
        // Database phone takes precedence if non-null
        telephone: db.phone ?? canonical.telephone,
        // Office operating hours
        officeHours: db.officeHours ?? canonical.officeHours ?? undefined,
      };
    });
  } catch (error) {
    // Fail safely without exposing database credentials or stack traces
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to load database office metadata for public directory:", message);
    return canonicalOffices;
  }
}

