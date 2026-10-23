import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminTourismList } from "@/server/tourism/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { TourismListTable } from "@/components/admin/tourism-list-table";
import type { TourismCategory, TourismStatus } from "@prisma/client";

export const instant = false;

export const metadata: Metadata = {
  title: "Tourism Directory Management | San Felipe LGU CMS",
  description: "Official municipal tourism editorial management for attractions, resorts, culture, and local products",
};

interface TourismPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminTourismListPage({ searchParams }: TourismPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.TOURISM_VIEW)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search?.trim();
  const category = (params.category as TourismCategory | "all") || undefined;
  const status = (params.status as TourismStatus) || undefined;

  const result = await getAdminTourismList(user, {
    page,
    pageSize: 10,
    search,
    category,
    status,
  });

  const canCreate = hasPermission(user, PERMISSIONS.TOURISM_CREATE);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Tourism Directory Management"
        description="Create, edit, publish, and maintain municipal attractions, accredited resorts, cultural heritage, and local products."
        breadcrumbs={[{ label: "Tourism" }]}
        actions={
          canCreate ? (
            <Link
              href="/admin/tourism/new"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-xs bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-8 px-3 shadow-2xs tracking-wide cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Entry</span>
            </Link>
          ) : undefined
        }
      />

      <AdminContent>
        <TourismListTable
          entries={result.entries}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          currentCategory={category}
          currentStatus={status}
          currentSearch={search}
        />
      </AdminContent>
    </div>
  );
}
