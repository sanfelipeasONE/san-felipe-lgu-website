import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { SessionUser } from "@/server/auth/session";
import { redactSensitiveMetadata } from "@/server/audit/service";

/**
 * Zod validation schema for server-side audit log query filtering.
 */
export const auditLogFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().trim().max(100).optional(),
  userId: z.string().trim().max(100).optional(),
  officeId: z.string().trim().max(100).optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  search: z.string().trim().max(100).optional(),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;

export interface SafeAuditLogRecord {
  id: string;
  action: string;
  userId: string | null;
  officeId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  office?: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
}

export interface PaginatedAuditLogs {
  data: SafeAuditLogRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Strict authorization predicate for viewing municipal audit logs.
 * Audit logs can ONLY be accessed by SYSTEM-scoped users holding the `audit.view` permission.
 * Office Admins and Staff are strictly DENIED.
 */
export function canViewAuditLogs(user: {
  isSystemScope: boolean;
  permissions: string[];
}): boolean {
  return Boolean(user.isSystemScope && user.permissions.includes("audit.view"));
}

/**
 * Queries and retrieves paginated, newest-first audit log records.
 * Enforces strict authorization, query filter validation, and recursive redaction of sensitive metadata.
 */
export async function listAuditLogs(
  caller: SessionUser,
  filters: unknown
): Promise<PaginatedAuditLogs> {
  if (!canViewAuditLogs(caller)) {
    throw new Error("FORBIDDEN: You do not have permission to view municipal audit logs.");
  }

  const parsed = auditLogFilterSchema.safeParse(filters);
  const { page, pageSize, action, userId, officeId, dateFrom, dateTo, search } = parsed.success
    ? parsed.data
    : { page: 1, pageSize: 25, action: undefined, userId: undefined, officeId: undefined, dateFrom: undefined, dateTo: undefined, search: undefined };

  const where: Prisma.AuditLogWhereInput = {};

  if (action && action !== "ALL") {
    where.action = action;
  }

  if (userId && userId !== "ALL") {
    where.userId = userId;
  }

  if (officeId && officeId !== "ALL") {
    where.officeId = officeId;
  }

  if (dateFrom || dateTo) {
    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) {
        createdAtFilter.gte = d;
      }
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) {
        // If YYYY-MM-DD was provided, include the full day up to 23:59:59.999
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
          d.setHours(23, 59, 59, 999);
        }
        createdAtFilter.lte = d;
      }
    }
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { action: { contains: term, mode: "insensitive" } },
      { ipAddress: { contains: term } },
    ];
  }

  const [total, rawRecords, offices] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" }, // Deterministic tie-breaker
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.office.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
      },
    }),
  ]);

  const officeMap = new Map(offices.map((o) => [o.id, o]));

  const data: SafeAuditLogRecord[] = rawRecords.map((record) => ({
    id: record.id,
    action: record.action,
    userId: record.userId,
    officeId: record.officeId,
    details: redactSensitiveMetadata(record.details),
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    createdAt: record.createdAt,
    user: record.user,
    office: record.officeId ? officeMap.get(record.officeId) ?? null : null,
  }));

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Retrieves a single audit log entry by ID with sensitive metadata redacted.
 */
export async function getAuditLogById(
  caller: SessionUser,
  id: string
): Promise<SafeAuditLogRecord | null> {
  if (!canViewAuditLogs(caller)) {
    throw new Error("FORBIDDEN: You do not have permission to view municipal audit logs.");
  }

  const record = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  let office = null;
  if (record.officeId) {
    office = await prisma.office.findUnique({
      where: { id: record.officeId },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
      },
    });
  }

  return {
    id: record.id,
    action: record.action,
    userId: record.userId,
    officeId: record.officeId,
    details: redactSensitiveMetadata(record.details),
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    createdAt: record.createdAt,
    user: record.user,
    office,
  };
}
