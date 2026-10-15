import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Building2, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { listOffices } from "@/server/offices/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

export const instant = false;

export const metadata: Metadata = {
  title: "Municipal Offices Administration | San Felipe LGU CMS",
  description: "Official municipal department profiles, mandates, and operational directory",
};

const OFFICE_COLUMNS: DataTableColumn[] = [
  { key: "name", header: "Department & Acronym", width: "42%" },
  { key: "head", header: "Department Head", width: "24%" },
  { key: "content", header: "Assigned Records", width: "18%" },
  { key: "status", header: "Status", width: "10%" },
  { key: "actions", header: "Actions", width: "6%", align: "right" },
];

export default async function AdminOfficesListPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Strictly System-Scope only
  if (!isSystemScoped(user) || !hasPermission(user, PERMISSIONS.OFFICES_VIEW)) {
    redirect("/admin");
  }

  const offices = await listOffices(user);
  const canUpdate = hasPermission(user, PERMISSIONS.OFFICES_UPDATE);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Municipal Offices Administration"
        description="Official directory of executive departments, legislative offices, and administrative units of the Municipality of San Felipe, Zambales."
        breadcrumbs={[{ label: "Municipal Offices" }]}
      />

      <AdminContent>
        <DataTable
          columns={OFFICE_COLUMNS}
          data={offices}
          keyExtractor={(item) => item.id}
          renderRow={(item) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
              {/* Department Name & Acronym */}
              <td className="px-4 py-3 text-xs">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-burgundy-700 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.shortName && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 ml-5">
                    Acronym: {item.shortName} • slug: {item.slug}
                  </div>
                )}
              </td>

              {/* Department Head */}
              <td className="px-4 py-3 text-xs text-slate-700">
                {item.officeHead ? (
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">{item.officeHead}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </td>

              {/* Content & Personnel Counts */}
              <td className="px-4 py-3 text-xs text-slate-600">
                <div className="flex flex-col gap-0.5 text-[10px]">
                  <span>{item._count.users} staff accounts</span>
                  <span>{item._count.documents} forms • {item._count.jobOpportunities} jobs</span>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3 text-xs">
                <StatusBadge status={item.status} size="sm" />
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-xs text-right">
                {canUpdate && (
                  <Link
                    href={`/admin/offices/${item.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-burgundy-700 hover:text-burgundy-900 transition-colors p-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Link>
                )}
              </td>
            </tr>
          )}
        />
      </AdminContent>
    </div>
  );
}
