import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Eye, ExternalLink, Building2, Calendar, FileText } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminServicesList } from "@/server/services/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

export const instant = false;

export const metadata: Metadata = {
  title: "Municipal Services Management | San Felipe LGU CMS",
  description: "Official municipal service pages, frontline procedural guidelines, and section content management",
};

const SERVICES_COLUMNS: DataTableColumn[] = [
  { key: "title", header: "Service Page Title", width: "32%" },
  { key: "status", header: "Status", width: "12%" },
  { key: "office", header: "Responsible Office", width: "20%" },
  { key: "sections", header: "Sections", width: "10%", align: "center" },
  { key: "updatedAt", header: "Last Modified", width: "14%" },
  { key: "actions", header: "Actions", width: "12%", align: "right" },
];

export default async function AdminServicesListPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.SERVICES_VIEW)) {
    redirect("/admin");
  }

  const pages = await getAdminServicesList(user);
  const canUpdate = hasPermission(user, PERMISSIONS.SERVICES_UPDATE);

  return (
    <AdminContent>
      <AdminPageHeader
        title="Municipal Services"
        description="Manage published guidelines, procedural requirements, and structured section content for the four canonical municipal service pages."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Municipal Services" },
        ]}
      />

      {/* Main Canonical Services Table */}
      <DataTable
        columns={SERVICES_COLUMNS}
        data={pages}
        keyExtractor={(page) => page.id}
        emptyState={
          <AdminEmptyState
            icon={FileText}
            title="No canonical service pages registered"
            description="Canonical service pages are initialized upon administrative setup."
          />
        }
        renderRow={(page) => {
          const publicUrl = `/services/${page.serviceKey}`;
          const isSystem = isSystemScoped(user);
          const canEditThisPage =
            canUpdate &&
            (isSystem || (Boolean(user.officeId) && page.officeId === user.officeId));

          return (
            <tr
              key={page.id}
              className="border-b border-gray-100 hover:bg-slate-50/70 transition-colors"
            >
              {/* Title & Key */}
              <td className="py-3.5 px-4">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xs bg-burgundy-50 text-burgundy-800 shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    {canEditThisPage ? (
                      <Link
                        href={`/admin/services/${page.serviceKey}/edit`}
                        className="font-bold text-xs sm:text-sm text-gov-charcoal hover:text-burgundy-800 transition-colors line-clamp-1"
                      >
                        {page.title}
                      </Link>
                    ) : (
                      <span className="font-bold text-xs sm:text-sm text-gov-charcoal line-clamp-1">
                        {page.title}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gov-muted">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded-xs text-[10px]">
                        /{page.serviceKey}
                      </span>
                      {page.description && (
                        <span className="truncate max-w-xs sm:max-w-md hidden md:inline">
                          — {page.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="py-3.5 px-4 whitespace-nowrap">
                <StatusBadge status={page.status} size="sm" />
              </td>

              {/* Responsible Office */}
              <td className="py-3.5 px-4">
                {page.office ? (
                  <div className="flex items-center gap-1.5 text-xs text-gov-charcoal">
                    <Building2 className="h-3.5 w-3.5 text-gov-muted shrink-0" aria-hidden="true" />
                    <span className="font-medium truncate" title={page.office.name}>
                      {page.office.shortName || page.office.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-gov-muted italic">
                    Municipal-Wide / Unassigned
                  </span>
                )}
              </td>

              {/* Sections Count */}
              <td className="py-3.5 px-4 text-center">
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-gov-charcoal">
                  {page._count.sections}
                </span>
              </td>

              {/* Last Modified */}
              <td className="py-3.5 px-4 text-xs text-gov-muted whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gov-muted shrink-0" aria-hidden="true" />
                  <span>{new Date(page.updatedAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}</span>
                </div>
              </td>

              {/* Actions */}
              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Edit Link */}
                  {canEditThisPage && (
                    <Link
                      href={`/admin/services/${page.serviceKey}/edit`}
                      className="inline-flex items-center h-8 px-2.5 rounded-xs text-xs font-semibold text-burgundy-800 hover:text-burgundy-900 hover:bg-burgundy-50 transition-colors"
                      title="Edit Service Page Content"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                      <span>Edit</span>
                    </Link>
                  )}

                  {/* CMS Preview Link */}
                  <Link
                    href={`/admin/services/${page.serviceKey}/preview`}
                    className="inline-flex items-center h-8 px-2.5 rounded-xs text-xs font-semibold text-gov-muted hover:text-gov-charcoal hover:bg-slate-100 transition-colors"
                    title="CMS Draft Preview"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    <span>Preview</span>
                  </Link>

                  {/* Public Link (if published) */}
                  {page.status === "PUBLISHED" && (
                    <Link
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xs text-gov-muted hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="View Public Page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">View Public Page</span>
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />
    </AdminContent>
  );
}
