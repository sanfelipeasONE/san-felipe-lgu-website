import "server-only";
import { prisma } from "@/server/db/client";
import type { SessionUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import type { TourismCategory, TourismStatus } from "@prisma/client";

export interface TourismDashboardData {
  metrics: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  categories: {
    attractions: number;
    resorts: number;
    cultureAndArts: number;
    products: number;
  };
  recentEntries: Array<{
    id: string;
    title: string;
    slug: string;
    category: TourismCategory;
    status: TourismStatus;
    featuredImageUrl: string | null;
    location: string | null;
    updatedAt: Date;
  }>;
}

/**
 * Retrieves focused tourism dashboard metrics, category distribution,
 * and recent entries for the Tourism Content Manager console.
 */
export async function getTourismDashboardData(user: SessionUser): Promise<TourismDashboardData> {
  if (!hasPermission(user, PERMISSIONS.TOURISM_VIEW)) {
    throw new Error("Missing required permission: tourism.view");
  }

  const [
    total,
    published,
    draft,
    archived,
    attractions,
    resorts,
    cultureAndArts,
    products,
    recentEntries,
  ] = await Promise.all([
    prisma.tourismEntry.count(),
    prisma.tourismEntry.count({ where: { status: "PUBLISHED" } }),
    prisma.tourismEntry.count({ where: { status: "DRAFT" } }),
    prisma.tourismEntry.count({ where: { status: "ARCHIVED" } }),
    prisma.tourismEntry.count({ where: { category: "ATTRACTIONS" } }),
    prisma.tourismEntry.count({ where: { category: "RESORTS" } }),
    prisma.tourismEntry.count({ where: { category: "CULTURE_AND_ARTS" } }),
    prisma.tourismEntry.count({ where: { category: "PRODUCTS" } }),
    prisma.tourismEntry.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        status: true,
        featuredImageUrl: true,
        location: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  return {
    metrics: {
      total,
      published,
      draft,
      archived,
    },
    categories: {
      attractions,
      resorts,
      cultureAndArts,
      products,
    },
    recentEntries,
  };
}
