import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RecentAdministrativeActivityItem } from "@/server/dashboard/service";

interface RecentActivityPanelProps {
  activities: RecentAdministrativeActivityItem[] | null;
}

function getDotClass(dotColor: "emerald" | "blue" | "amber" | "rose" | "slate") {
  switch (dotColor) {
    case "emerald":
      return "bg-emerald-500 ring-2 ring-emerald-100";
    case "blue":
      return "bg-blue-500 ring-2 ring-blue-100";
    case "amber":
      return "bg-amber-500 ring-2 ring-amber-100";
    case "rose":
      return "bg-rose-500 ring-2 ring-rose-100";
    case "slate":
    default:
      return "bg-slate-400 ring-2 ring-slate-100";
  }
}

export function RecentActivityPanel({ activities }: RecentActivityPanelProps) {
  // If user lacks audit view authorization, omit this section completely
  if (activities === null) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200/90 rounded-xs shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gov-charcoal tracking-tight">
            Recent Administrative Activity
          </h2>
          <p className="text-xs text-gov-muted mt-0.5">
            Immutable system audit trail of staff publishing and account changes.
          </p>
        </div>

        <Link
          href="/admin/audit-logs"
          className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 inline-flex items-center gap-1 hover:underline transition-colors shrink-0"
        >
          <span>View Full Audit Log</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3 px-4 min-w-[180px]">
                Action
              </th>
              <th scope="col" className="py-3 px-4 min-w-[150px]">
                Module
              </th>
              <th scope="col" className="py-3 px-4 min-w-[140px]">
                User
              </th>
              <th scope="col" className="py-3 px-4 min-w-[150px]">
                Office
              </th>
              <th scope="col" className="py-3 px-4 text-right min-w-[160px]">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gov-charcoal">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No administrative activity recorded yet.
                </td>
              </tr>
            ) : (
              activities.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gov-charcoal">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${getDotClass(item.dotColor)}`}
                        aria-hidden="true"
                      />
                      <span>{item.actionLabel}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {item.moduleLabel}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.userName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.officeName}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 font-medium font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    &bull;{" "}
                    {new Date(item.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
