import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, Building2, Calendar } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminJobsList } from "@/server/jobs/service";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ALLOWED_EMPLOYMENT_TYPES } from "@/lib/validation/jobs";

export const instant = false;

export const metadata: Metadata = {
  title: "Job Opportunities Management | San Felipe LGU CMS",
  description: "Official municipal job opportunities, career vacancies, and recruitment notices management",
};

interface JobsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    employmentType?: string;
    officeId?: string;
    page?: string;
  }>;
}

const JOB_COLUMNS: DataTableColumn[] = [
  { key: "title", header: "Position Title", width: "32%" },
  { key: "office", header: "Owning Office", width: "18%" },
  { key: "type", header: "Classification", width: "16%" },
  { key: "closing", header: "Closing Date", width: "14%" },
  { key: "status", header: "Status", width: "10%" },
  { key: "actions", header: "Actions", width: "10%", align: "right" },
];

export default async function AdminJobsListPage({ searchParams }: JobsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.JOBS_VIEW)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search?.trim();
  const status = params.status;
  const employmentType = params.employmentType;
  const officeId = params.officeId;

  const result = await getAdminJobsList(user, {
    page,
    pageSize: 10,
    search,
    status,
    employmentType,
    officeId,
  });

  // Load offices for filter (SYSTEM scope only)
  let officesList: Array<{ id: string; name: string }> = [];
  if (isSystemScoped(user)) {
    officesList = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  const canCreate = hasPermission(user, PERMISSIONS.JOBS_CREATE);
  const canUpdate = hasPermission(user, PERMISSIONS.JOBS_UPDATE);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Job Opportunities & Vacancy Announcements"
        description="Manage official municipal vacant positions, qualification standards, and career bulletins."
        breadcrumbs={[{ label: "Job Opportunities" }]}
        actions={
          canCreate ? (
            <Link
              href="/admin/jobs/new"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create Vacancy</span>
            </Link>
          ) : undefined
        }
      />

      <AdminContent>
        {/* Filter Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-3">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-[11px] font-semibold text-gov-muted uppercase tracking-wider mb-1">
                Search Vacancies
              </label>
              <input
                id="search"
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Title, item #, or keyword..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-[11px] font-semibold text-gov-muted uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status || "all"}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              >
                <option value="all">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {/* Employment Classification Filter */}
            <div>
              <label htmlFor="employmentType" className="block text-[11px] font-semibold text-gov-muted uppercase tracking-wider mb-1">
                Classification
              </label>
              <select
                id="employmentType"
                name="employmentType"
                defaultValue={employmentType || "all"}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              >
                <option value="all">All Classifications</option>
                {ALLOWED_EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Office Filter (SYSTEM Scope only) */}
            {isSystemScoped(user) ? (
              <div>
                <label htmlFor="officeId" className="block text-[11px] font-semibold text-gov-muted uppercase tracking-wider mb-1">
                  Owning Office
                </label>
                <select
                  id="officeId"
                  name="officeId"
                  defaultValue={officeId || "all"}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                >
                  <option value="all">All Municipal Offices</option>
                  {officesList.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-burgundy-800 hover:bg-burgundy-900 rounded-xs transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}

            {isSystemScoped(user) && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="py-1.5 px-4 text-xs font-semibold text-white bg-burgundy-800 hover:bg-burgundy-900 rounded-xs transition-colors"
                >
                  Apply Filters
                </button>
                <Link
                  href="/admin/jobs"
                  className="py-1.5 px-3 text-xs font-medium text-gov-muted hover:text-gov-charcoal border border-gray-200 rounded-xs bg-white hover:bg-slate-50 transition-colors"
                >
                  Reset
                </Link>
              </div>
            )}
          </form>
        </div>

        {/* Data Table */}
        <DataTable
          columns={JOB_COLUMNS}
          data={result.jobs}
          keyExtractor={(job) => job.id}
          pagination={{
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            pageSize: result.pageSize,
          }}
          emptyState={
            <AdminEmptyState
              title="No job opportunities found"
              description="No job vacancies match your current search or filter criteria."
            />
          }
          renderRow={(job) => (
              <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                {/* Title & Item # */}
                <td className="px-4 py-3 text-xs text-gov-charcoal">
                  <div className="font-semibold text-sm text-gov-charcoal">
                    {job.title}
                  </div>
                  {job.itemNumber && (
                    <div className="text-[11px] text-gov-muted flex items-center gap-1 mt-0.5 font-mono">
                      Item: {job.itemNumber}
                    </div>
                  )}
                </td>

                {/* Owning Office */}
                <td className="px-4 py-3 text-xs text-gov-charcoal">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-gov-muted shrink-0" />
                    <span>{job.office.name}</span>
                  </div>
                </td>

                {/* Classification & SG */}
                <td className="px-4 py-3 text-xs text-gov-charcoal">
                  <div className="space-y-0.5">
                    {job.employmentType ? (
                      <span className="inline-block text-[11px] font-semibold text-burgundy-800 bg-burgundy-50 border border-burgundy-100 rounded-xs px-1.5 py-0.5">
                        {job.employmentType}
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-medium text-gov-muted bg-slate-100 border border-gray-200 rounded-xs px-1.5 py-0.5">
                        Unclassified
                      </span>
                    )}
                    {job.salaryGrade && (
                      <div className="text-[11px] font-mono text-gov-muted">
                        SG {job.salaryGrade}
                      </div>
                    )}
                  </div>
                </td>

                {/* Closing Date */}
                <td className="px-4 py-3 text-xs text-gov-charcoal">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-gov-muted">
                      <Calendar className="w-3 h-3 text-gov-muted shrink-0" />
                      <span>
                        {job.closingDate
                          ? new Date(job.closingDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Until filled"}
                      </span>
                    </div>
                    {job.isClosed && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 rounded-xs px-1.5 py-0.5">
                        Closed
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-xs">
                  <StatusBadge status={job.status} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-xs text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canUpdate && (
                      <Link
                        href={`/admin/jobs/${job.id}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gov-charcoal hover:text-burgundy-800 bg-slate-100 hover:bg-slate-200 rounded-xs transition-colors"
                        title="Edit Vacancy"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
      </AdminContent>
    </div>
  );
}
