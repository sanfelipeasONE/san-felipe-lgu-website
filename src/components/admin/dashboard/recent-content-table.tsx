"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Newspaper,
  Briefcase,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import type { RecentContentItem } from "@/server/dashboard/service";

interface RecentContentTableProps {
  items: RecentContentItem[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Published
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Draft
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Archived
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "document":
      return <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
    case "job":
      return <Briefcase className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
    case "news":
    default:
      return <Newspaper className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
  }
}

export function RecentContentTable({ items }: RecentContentTableProps) {
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, typeFilter, statusFilter]);

  const viewAllHref = React.useMemo(() => {
    if (typeFilter === "document") return "/admin/documents";
    if (typeFilter === "job") return "/admin/jobs";
    return "/admin/news";
  }, [typeFilter]);

  return (
    <div className="bg-white border border-gray-200/90 rounded-xs shadow-2xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gov-charcoal tracking-tight">
            Recent Content
          </h2>
          <p className="text-xs text-gov-muted mt-0.5">
            Latest articles, public records, and employment notices.
          </p>
        </div>

        {/* Filters and View All matching Stitch layout */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Type Filter */}
          <div className="relative">
            <select
              aria-label="Filter by content type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-gray-300 rounded-xs py-1.5 pl-2.5 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-burgundy-700 shadow-2xs"
            >
              <option value="all">All Types</option>
              <option value="news">News</option>
              <option value="document">Documents</option>
              <option value="job">Job Opportunities</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              aria-label="Filter by content status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-gray-300 rounded-xs py-1.5 pl-2.5 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-burgundy-700 shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* View All link */}
          <Link
            href={viewAllHref}
            className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 inline-flex items-center gap-1 hover:underline ml-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3 px-4 min-w-[200px]">
                Title
              </th>
              <th scope="col" className="py-3 px-4 min-w-[120px]">
                Type
              </th>
              <th scope="col" className="py-3 px-4 min-w-[160px]">
                Municipal Office
              </th>
              <th scope="col" className="py-3 px-4 min-w-[100px]">
                Status
              </th>
              <th scope="col" className="py-3 px-4 min-w-[110px]">
                Last Updated
              </th>
              <th scope="col" className="py-3 px-4 text-right min-w-[80px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gov-charcoal">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No recent content matches the selected filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gov-charcoal max-w-xs truncate">
                    {item.title}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                      {getTypeIcon(item.type)}
                      <span>{item.typeLabel}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.officeName}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {new Date(item.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {item.canEdit ? (
                      <Link
                        href={item.editHref}
                        className="text-xs font-semibold text-burgundy-700 hover:text-burgundy-900 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Edit</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-slate-300 font-mono">&bull;&bull;&bull;</span>
                    )}
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
