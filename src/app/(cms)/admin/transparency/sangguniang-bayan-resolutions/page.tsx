import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import {
  getAdminResolutionsList,
  ResolutionError,
} from "@/server/resolutions/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { SbResolutionsListTable } from "@/components/admin/sb-resolutions-list-table";
import type { ResolutionStatus } from "@prisma/client";

export const instant = false;

export const metadata: Metadata = {
  title: "Sangguniang Bayan Resolutions | San Felipe LGU CMS",
  description:
    "Manage official Sangguniang Bayan resolutions, adoption metadata, and public PDF issuances.",
};

interface SbResolutionsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    year?: string;
    page?: string;
  }>;
}

export default async function AdminSbResolutionsListPage({
  searchParams,
}: SbResolutionsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_VIEW)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search?.trim();
  const status = (params.status as ResolutionStatus) || undefined;
  const year = params.year ? Number(params.year) : undefined;

  let result;
  try {
    result = await getAdminResolutionsList(user, {
      page,
      pageSize: 10,
      search,
      status,
      year: year && Number.isInteger(year) ? year : undefined,
    });
  } catch (err) {
    if (err instanceof ResolutionError && err.statusCode === 403) {
      redirect("/admin");
    }
    throw err;
  }

  const canCreate = hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_CREATE);
  const canUpdate = hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_UPDATE);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Sangguniang Bayan Resolutions"
        description="Manage official resolutions adopted by the Sangguniang Bayan of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Transparency" },
          { label: "Sangguniang Bayan Resolutions" },
        ]}
        actions={
          canCreate ? (
            <Link
              href="/admin/transparency/sangguniang-bayan-resolutions/new"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Resolution</span>
            </Link>
          ) : undefined
        }
      />

      <AdminContent>
        <SbResolutionsListTable
          resolutions={result.resolutions}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          availableYears={result.availableYears}
          currentStatus={status}
          currentYear={year && Number.isInteger(year) ? year : undefined}
          currentSearch={search}
          canUpdate={canUpdate}
        />
      </AdminContent>
    </div>
  );
}
