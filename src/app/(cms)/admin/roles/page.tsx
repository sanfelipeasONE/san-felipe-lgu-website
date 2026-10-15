import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Shield, BookOpen } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { listRoles, listPermissionCatalog, CANONICAL_PRODUCTION_ROLES } from "@/server/roles/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

export const instant = false;

export const metadata: Metadata = {
  title: "Roles & Permissions Management | San Felipe LGU CMS",
  description: "System role definitions and granular authority assignments",
};

const ROLE_COLUMNS: DataTableColumn[] = [
  { key: "name", header: "Role Name", width: "30%" },
  { key: "scope", header: "Operational Scope", width: "18%" },
  { key: "tier", header: "Privilege Tier", width: "16%" },
  { key: "personnel", header: "Assigned Staff", width: "14%" },
  { key: "permissions", header: "Permissions", width: "12%" },
  { key: "actions", header: "Actions", width: "10%", align: "right" },
];

export default async function AdminRolesListPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Strictly System-Scope only with settings.manage
  if (!isSystemScoped(user) || !hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) {
    redirect("/admin");
  }

  const [allRoles, catalog] = await Promise.all([
    listRoles(user),
    listPermissionCatalog(user),
  ]);

  const roles = allRoles.filter((r) =>
    CANONICAL_PRODUCTION_ROLES.includes(r.slug as (typeof CANONICAL_PRODUCTION_ROLES)[number])
  );

  // Group permission catalog by module for read-only inspection
  const catalogByModule = new Map<string, typeof catalog>();
  for (const perm of catalog) {
    const list = catalogByModule.get(perm.module) || [];
    list.push(perm);
    catalogByModule.set(perm.module, list);
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Roles & Permissions Management"
        description="System role definitions, privilege tiers, and granular code-enforced security capabilities."
        breadcrumbs={[{ label: "Roles & Permissions" }]}
      />

      <AdminContent>
        {/* Roles Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-burgundy-700" />
              <span>Configured System & Office Roles ({roles.length})</span>
            </h3>
          </div>

          <DataTable
            columns={ROLE_COLUMNS}
            data={roles}
            keyExtractor={(item) => item.id}
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                {/* Role Name */}
                <td className="px-4 py-3 text-xs">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{item.name}</span>
                    {item.isBuiltIn && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                        Built-in
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.description}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    slug: {item.slug}
                  </div>
                </td>

                {/* Scope */}
                <td className="px-4 py-3 text-xs text-slate-700">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      item.isSystemScope
                        ? "bg-purple-50 text-purple-800 border-purple-200"
                        : "bg-blue-50 text-blue-800 border-blue-200"
                    }`}
                  >
                    {item.isSystemScope ? "System-Wide" : "Office Scoped"}
                  </span>
                </td>

                {/* Tier */}
                <td className="px-4 py-3 text-xs font-mono font-medium text-slate-800">
                  {item.tier}
                </td>

                {/* Assigned Personnel */}
                <td className="px-4 py-3 text-xs text-slate-700">
                  <span className="font-semibold">{item.userCount}</span> staff accounts
                </td>

                {/* Granted Permissions */}
                <td className="px-4 py-3 text-xs text-slate-700">
                  <span className="font-semibold">{item.permissions.length}</span> grants
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-xs text-right">
                  <Link
                    href={`/admin/roles/${item.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-burgundy-700 hover:text-burgundy-900 transition-colors p-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Configure</span>
                  </Link>
                </td>
              </tr>
            )}
          />
        </div>

        {/* Read-Only Permission Catalog */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-burgundy-700" />
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Canonical Permission Catalog ({catalog.length} Code-Enforced Capabilities)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Permissions are immutable code-level capability definitions. They are referenced in application security guards and cannot be injected from the browser.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {Array.from(catalogByModule.entries()).map(([moduleName, perms]) => (
              <div key={moduleName} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Module: {moduleName} ({perms.length})
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {perms.map((p) => (
                    <div key={p.code} className="px-4 py-2.5 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          <span>{p.name}</span>
                          <code className="text-[11px] font-mono text-burgundy-800 bg-burgundy-50 px-1.5 py-0.2 rounded border border-burgundy-200">
                            {p.code}
                          </code>
                        </div>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminContent>
    </div>
  );
}
