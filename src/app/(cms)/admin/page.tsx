import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Building2,
  Shield,
  Newspaper,
  Users,
  History,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { getAuthoritySummary } from "@/lib/authz/scope";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { AdminSection } from "@/components/admin/admin-section";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin Dashboard | San Felipe LGU CMS",
  description: "San Felipe LGU Staff & Multi-Office CMS Administrative Console",
};

interface ModuleOverviewItem {
  id: string;
  name: string;
  category: string;
  scopeRequirement: string;
  status: "ACTIVE" | "DRAFT" | "PUBLISHED";
  phase: string;
}

const FOUNDATION_MODULES_PREVIEW: ModuleOverviewItem[] = [
  {
    id: "mod-news",
    name: "News & Public Advisories",
    category: "Content Management",
    scopeRequirement: "Office Scope (Staff) / System Scope (Admin)",
    status: "ACTIVE",
    phase: "Phase 12 (Next)",
  },
  {
    id: "mod-users",
    name: "Municipal Staff Accounts",
    category: "Administration",
    scopeRequirement: "Office Scope (Office Admin) / System Scope (Super Admin)",
    status: "DRAFT",
    phase: "Phase 17",
  },
  {
    id: "mod-forms",
    name: "Downloadable Forms & Services",
    category: "Public Services",
    scopeRequirement: "Office Scope / System Scope",
    status: "DRAFT",
    phase: "Upcoming",
  },
  {
    id: "mod-audit",
    name: "Security & Administrative Audit Logs",
    category: "System Oversight",
    scopeRequirement: "System Scope (audit.view required)",
    status: "ACTIVE",
    phase: "Upcoming Module",
  },
];

const PREVIEW_COLUMNS: DataTableColumn[] = [
  { key: "name", header: "Module Name", width: "30%" },
  { key: "category", header: "Category", width: "20%" },
  { key: "scopeRequirement", header: "Operational Boundary", width: "30%" },
  { key: "status", header: "CMS Status", width: "10%" },
  { key: "phase", header: "Roadmap", width: "10%" },
];

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  const summary = getAuthoritySummary(user);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      {/* Reusable CMS Page Header */}
      <AdminPageHeader
        title="Admin Dashboard"
        description={`Welcome back, ${user.name}. Municipal workspace overview, operational authority context, and authorized tools.`}
        breadcrumbs={[{ label: "Overview" }]}
        badge={<StatusBadge status={user.status} size="sm" />}
      />

      {/* Main Admin Content Container */}
      <AdminContent>
        {/* Context Grid: Operational Scope & Account Authority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Office Affiliation & Boundary Card */}
          <AdminSection
            title="Municipal Office Context"
            description="Operational department affiliation and scope boundary."
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xs bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-700 shrink-0 mt-0.5">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block">
                    {summary.isSystem ? "SYSTEM SCOPE AUTHORITY" : "OFFICE SCOPE ASSIGNMENT"}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-gov-charcoal tracking-tight mt-0.5">
                    {user.office ? user.office.name : "System-wide Administration"}
                  </h3>
                  {user.office?.shortName && (
                    <span className="text-xs font-semibold text-gov-muted block">
                      Acronym: {user.office.shortName}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xs border border-gray-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gov-muted block">
                    Scope Type
                  </span>
                  <span className="font-semibold text-gov-charcoal mt-0.5 block">
                    {summary.isSystem ? "System Scope" : "Office Scope"}
                  </span>
                  <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                    {summary.isSystem
                      ? "Authorized across all municipal offices and departments."
                      : "Restricted strictly to your assigned municipal department."}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xs border border-gray-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gov-muted block">
                    Office Ownership Check
                  </span>
                  <span className="font-semibold text-gov-charcoal mt-0.5 block flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Enforced Server-Side</span>
                  </span>
                  <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                    Content actions require verified office affiliation or system scope.
                  </p>
                </div>
              </div>
            </div>
          </AdminSection>

          {/* Account Identity & Authority Summary Card */}
          <AdminSection
            title="Account Access & Authority"
            description="Role assignment and authorized municipal capabilities."
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xs bg-gold-50 border border-gold-300 flex items-center justify-center text-gold-700 shrink-0 mt-0.5">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 block">
                    ASSIGNED ROLE
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-gov-charcoal tracking-tight mt-0.5">
                    {user.role.name}
                  </h3>
                  <span className="text-xs text-gov-muted block">
                    Account: {user.email}
                  </span>
                </div>
              </div>

              {/* Categorized Capabilities Summary */}
              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gov-muted block">
                  Authorized Municipal Capabilities
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {summary.canPublishNews && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>News Publication</span>
                    </span>
                  )}
                  {summary.canCreateNews && !summary.canPublishNews && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-blue-600 shrink-0" />
                      <span>News Drafting</span>
                    </span>
                  )}
                  {summary.canManageUsers && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-indigo-600 shrink-0" />
                      <span>Staff Account Oversight</span>
                    </span>
                  )}
                  {summary.canManageOffices && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-purple-600 shrink-0" />
                      <span>Offices Management</span>
                    </span>
                  )}
                  {summary.canManageRoles && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-amber-600 shrink-0" />
                      <span>Roles & Permissions</span>
                    </span>
                  )}
                  {summary.canViewAudit && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-slate-600 shrink-0" />
                      <span>System Audit Trail</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </AdminSection>
        </div>

        {/* Authorized CMS Module Shortcuts */}
        <AdminSection
          title="Permitted Workspace Modules"
          description="Administrative modules authorized for your account credentials."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* News Module Shortcut */}
            {summary.canCreateNews && (
              <div className="p-4 rounded-xs border border-gray-200 bg-white hover:border-burgundy-700/50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xs bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-700">
                      <Newspaper className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-xs bg-amber-50 text-amber-800 border border-amber-200">
                      Phase 12
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gov-charcoal">
                    News & Public Advisories
                  </h4>
                  <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                    Draft, edit, and publish official municipal announcements for your office.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gov-muted font-medium flex items-center justify-between">
                  <span>Authorized for Office</span>
                  <span className="text-burgundy-700 font-semibold">Available Next Phase</span>
                </div>
              </div>
            )}

            {/* Staff Management Shortcut (Super Admin & Office Admin) */}
            {summary.canManageUsers && (
              <div className="p-4 rounded-xs border border-gray-200 bg-white hover:border-burgundy-700/50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xs bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-xs bg-gray-100 text-gray-700 border border-gray-200">
                      Phase 17
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gov-charcoal">
                    Staff Accounts
                  </h4>
                  <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                    {summary.isSystem
                      ? "Manage staff accounts and office assignments across all municipal departments."
                      : "Manage staff accounts strictly within your assigned department."}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gov-muted font-medium flex items-center justify-between">
                  <span>{summary.isSystem ? "System-wide" : "Department Scope"}</span>
                  <span className="text-gray-500 font-semibold">Phase 17</span>
                </div>
              </div>
            )}

            {/* Audit Logs Shortcut (System scope) */}
            {summary.canViewAudit && (
              <div className="p-4 rounded-xs border border-gray-200 bg-white hover:border-burgundy-700/50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                      <History className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-xs bg-gray-100 text-gray-700 border border-gray-200">
                      Upcoming
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gov-charcoal">
                    System Audit Logs
                  </h4>
                  <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                    Immutable security, authentication, and content action records.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gov-muted font-medium flex items-center justify-between">
                  <span>System Scope</span>
                  <span className="text-gray-500 font-semibold">Upcoming</span>
                </div>
              </div>
            )}

            {/* Public Services Shortcut */}
            <div className="p-4 rounded-xs border border-gray-200 bg-white hover:border-burgundy-700/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xs bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-xs bg-gray-100 text-gray-700 border border-gray-200">
                    Upcoming
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gov-charcoal">
                  Public Services & Forms
                </h4>
                <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                  Citizen&apos;s Charter, business permits, and official downloadable forms.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gov-muted font-medium flex items-center justify-between">
                <span>Services CMS</span>
                <span className="text-gray-500 font-semibold">Upcoming</span>
              </div>
            </div>
          </div>
        </AdminSection>

        {/* Reusable Foundation Preview Section (Demonstrates UI Primitives) */}
        <AdminSection
          title="CMS Foundation UI Architecture"
          description="Reusable civic UI patterns established for upcoming administrative content modules."
        >
          <div className="space-y-6">
            {/* Status Badges Showcase */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gov-muted block mb-2.5">
                Standard Content Status Badges
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="DRAFT" />
                <StatusBadge status="PUBLISHED" />
                <StatusBadge status="ARCHIVED" />
                <StatusBadge status="INACTIVE" />
                <StatusBadge status="SUSPENDED" />
                <StatusBadge status="ACTIVE" />
              </div>
              <p className="text-[11px] text-gov-muted mt-1.5">
                Status badges feature distinctive icons and text labels to ensure full accessibility without relying solely on color.
              </p>
            </div>

            {/* Data Table Foundation Demonstration */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gov-muted block mb-2.5">
                Data Table Visual Foundation Preview
              </span>
              <DataTable<ModuleOverviewItem>
                title="Municipal CMS Architecture Modules"
                columns={PREVIEW_COLUMNS}
                data={FOUNDATION_MODULES_PREVIEW}
                renderRow={(item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gov-charcoal whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gov-muted whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-gov-muted text-[11px]">
                      {item.scopeRequirement}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gov-muted font-medium text-[11px] whitespace-nowrap">
                      {item.phase}
                    </td>
                  </tr>
                )}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  totalItems: 4,
                  pageSize: 10,
                }}
              />
            </div>
          </div>
        </AdminSection>
      </AdminContent>
    </div>
  );
}
