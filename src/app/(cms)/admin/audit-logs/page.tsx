import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { History, Filter, RotateCcw, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { canViewAuditLogs, listAuditLogs } from "@/server/audit/query";
import { AUDIT_ACTIONS } from "@/server/audit/constants";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { AuditDetailModal } from "@/components/admin/audit-detail-modal";
import { Button } from "@/components/ui/button";

export const instant = false;

export const metadata: Metadata = {
  title: "Audit Logs | San Felipe LGU CMS",
  description: "Immutable security, authentication, and content audit trail for municipal operations.",
};

interface AuditLogsPageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    officeId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

function getActionBadgeColor(action: string): string {
  if (action.includes("FAILED") || action.includes("REVOKED") || action.includes("DISABLED")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (action.includes("SUCCESS") || action.includes("ENABLED") || action.includes("PUBLISHED")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (action.includes("UPDATED") || action.includes("CHANGED") || action.includes("RESET")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Strictly SYSTEM scope + audit.view required
  if (!canViewAuditLogs(user)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  const [auditResult, offices] = await Promise.all([
    listAuditLogs(user, params),
    prisma.office.findMany({
      select: { id: true, name: true, shortName: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const { data: logs, total, totalPages } = auditResult;

  // Inventory of unique known actions for filter dropdown
  const actionList = Object.values(AUDIT_ACTIONS).sort();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Audit Logs"
        description="Immutable security, authentication, and content audit trail for municipal operations."
        breadcrumbs={[{ label: "Audit Logs" }]}
      />

      <AdminContent>
        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-xs p-4 mb-6 shadow-2xs">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            {/* Search (Action or IP) */}
            <div className="space-y-1">
              <label htmlFor="search" className="font-semibold text-slate-700">
                Search
              </label>
              <div className="relative">
                <input
                  id="search"
                  name="search"
                  type="text"
                  placeholder="Action or IP address..."
                  defaultValue={params.search || ""}
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-xs text-xs focus:ring-1 focus:ring-burgundy-700 focus:outline-hidden"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Action Dropdown */}
            <div className="space-y-1">
              <label htmlFor="action" className="font-semibold text-slate-700">
                Action / Event
              </label>
              <select
                id="action"
                name="action"
                defaultValue={params.action || "ALL"}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xs text-xs focus:ring-1 focus:ring-burgundy-700 focus:outline-hidden bg-white"
              >
                <option value="ALL">All Actions</option>
                {actionList.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* Municipal Office Dropdown */}
            <div className="space-y-1">
              <label htmlFor="officeId" className="font-semibold text-slate-700">
                Office Context
              </label>
              <select
                id="officeId"
                name="officeId"
                defaultValue={params.officeId || "ALL"}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xs text-xs focus:ring-1 focus:ring-burgundy-700 focus:outline-hidden bg-white"
              >
                <option value="ALL">All Offices</option>
                {offices.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.shortName ? `${off.shortName} - ` : ""}{off.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range From */}
            <div className="space-y-1">
              <label htmlFor="dateFrom" className="font-semibold text-slate-700">
                Date From
              </label>
              <input
                id="dateFrom"
                name="dateFrom"
                type="date"
                defaultValue={params.dateFrom || ""}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xs text-xs focus:ring-1 focus:ring-burgundy-700 focus:outline-hidden bg-white"
              />
            </div>

            {/* Actions: Filter & Reset */}
            <div className="flex items-end gap-2">
              <Button type="submit" variant="primary" size="sm" className="flex-1 h-8">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filter
              </Button>
              <Link
                href="/admin/audit-logs"
                className="inline-flex items-center justify-center h-8 px-2.5 border border-slate-200 rounded-xs text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Link>
            </div>
          </form>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-slate-200 rounded-xs shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <History className="h-4 w-4 text-burgundy-700" />
              <span>Audit Trail Records ({total.toLocaleString()})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Office</th>
                  <th className="px-4 py-2.5">Client IP</th>
                  <th className="px-4 py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No audit events found matching the specified criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {new Date(log.createdAt).toLocaleString("en-PH", {
                          timeZone: "Asia/Manila",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-xs font-mono font-semibold text-[10px] border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-2.5 text-slate-900 whitespace-nowrap">
                        {log.user ? (
                          <div>
                            <span className="font-semibold block">{log.user.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {log.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System</span>
                        )}
                      </td>

                      {/* Office */}
                      <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                        {log.office ? (
                          <span>
                            {log.office.shortName || log.office.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">System-Wide</span>
                        )}
                      </td>

                      {/* Client IP */}
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.ipAddress || "—"}
                      </td>

                      {/* Details Trigger */}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <AuditDetailModal
                          log={{
                            id: log.id,
                            action: log.action,
                            createdAt: log.createdAt.toISOString(),
                            ipAddress: log.ipAddress,
                            userAgent: log.userAgent,
                            details: log.details,
                            user: log.user,
                            office: log.office,
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {logs.length} of {total.toLocaleString()} audit events
              </span>
              <div className="flex items-center gap-1.5">
                {currentPage > 1 ? (
                  <Link
                    href={`/admin/audit-logs?${new URLSearchParams({
                      ...params,
                      page: String(currentPage - 1),
                    }).toString()}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded-xs bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded-xs bg-slate-100 text-slate-400 cursor-not-allowed">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </span>
                )}

                <span className="px-2 text-xs font-mono text-slate-600">
                  {currentPage} / {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/admin/audit-logs?${new URLSearchParams({
                      ...params,
                      page: String(currentPage + 1),
                    }).toString()}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded-xs bg-white text-slate-700 hover:bg-slate-50"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded-xs bg-slate-100 text-slate-400 cursor-not-allowed">
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminContent>
    </div>
  );
}
