import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, Building2, Shield, Calendar } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { listUsers } from "@/server/users/service";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import type { UserStatus } from "@prisma/client";

export const instant = false;

export const metadata: Metadata = {
  title: "Staff Accounts | San Felipe LGU CMS",
  description: "Municipal staff accounts and office assignments management",
};

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    roleId?: string;
    officeId?: string;
  }>;
}

const USER_COLUMNS: DataTableColumn[] = [
  { key: "name", header: "Staff Member", width: "26%" },
  { key: "email", header: "Official Email", width: "22%" },
  { key: "role", header: "Role & Authority", width: "18%" },
  { key: "office", header: "Municipal Office", width: "16%" },
  { key: "status", header: "Status", width: "10%" },
  { key: "actions", header: "Actions", width: "8%", align: "right" },
];

export default async function AdminUsersListPage({ searchParams }: UsersPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.USERS_VIEW)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const search = params.search?.trim();
  const status = params.status as UserStatus | undefined;
  const officeId = params.officeId;
  const roleId = params.roleId;

  const users = await listUsers(user, {
    search,
    status,
    officeId,
    roleId,
  });

  // Filter options for SYSTEM scope
  let officesList: Array<{ id: string; name: string }> = [];
  let rolesList: Array<{ id: string; name: string }> = [];

  if (isSystemScoped(user)) {
    officesList = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    rolesList = await prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  const canCreate = hasPermission(user, PERMISSIONS.USERS_CREATE);
  const canUpdate = hasPermission(user, PERMISSIONS.USERS_UPDATE);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Staff Accounts"
        description={
          isSystemScoped(user)
            ? "Manage municipal personnel, office assignments, and role authorities across all municipal departments."
            : `Manage ordinary staff accounts and access within the ${user.office?.name || "assigned office"}.`
        }
        breadcrumbs={[{ label: "Staff Accounts" }]}
        actions={
          canCreate ? (
            <Link
              href="/admin/users/new"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create Account</span>
            </Link>
          ) : undefined
        }
      />

      <AdminContent>
        {/* Filters bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-2xs">
          <form method="GET" className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Search staff by name or email..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
              />
            </div>

            {/* Status filter */}
            <select
              name="status"
              defaultValue={status || ""}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Office filter (SYSTEM Scope Only) */}
            {isSystemScoped(user) && officesList.length > 0 && (
              <select
                name="officeId"
                defaultValue={officeId || ""}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20"
              >
                <option value="">All Municipal Offices</option>
                {officesList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}

            {/* Role filter (SYSTEM Scope Only) */}
            {isSystemScoped(user) && rolesList.length > 0 && (
              <select
                name="roleId"
                defaultValue={roleId || ""}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20"
              >
                <option value="">All Roles</option>
                {rolesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Filter
            </button>
            {(search || status || officeId || roleId) && (
              <Link
                href="/admin/users"
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Users Table */}
        <DataTable
          columns={USER_COLUMNS}
          data={users}
          keyExtractor={(item) => item.id}
          renderRow={(item) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
              {/* Name */}
              <td className="px-4 py-3 text-xs font-medium text-slate-900">
                <div className="font-semibold text-slate-800">{item.name}</div>
                {item.lastLoginAt ? (
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    Last login: {new Date(item.lastLoginAt).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 mt-0.5">Never logged in</div>
                )}
              </td>

              {/* Email */}
              <td className="px-4 py-3 text-xs font-mono text-slate-600">
                {item.email}
              </td>

              {/* Role */}
              <td className="px-4 py-3 text-xs text-slate-700">
                <div className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 text-slate-400" />
                  <span className="font-medium text-slate-800">{item.role.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {item.role.isSystemScope ? "System Authority" : "Office Scoped"}
                </div>
              </td>

              {/* Office */}
              <td className="px-4 py-3 text-xs text-slate-600">
                {item.office ? (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate" title={item.office.name}>
                      {item.office.shortName || item.office.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">None (System Admin)</span>
                )}
              </td>

              {/* Status */}
              <td className="px-4 py-3 text-xs">
                <StatusBadge status={item.status} size="sm" />
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-xs text-right">
                {canUpdate && (
                  <Link
                    href={`/admin/users/${item.id}/edit`}
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
