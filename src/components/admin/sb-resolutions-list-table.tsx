"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Edit,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import type { ResolutionStatus } from "@prisma/client";

export interface ResolutionListItem {
  id: string;
  resolutionNumber: string;
  title: string;
  year: number;
  adoptedAt: Date;
  status: ResolutionStatus;
  originalFilename: string | null;
  fileSizeFormatted: string | null;
  updatedAt: Date;
}

interface SbResolutionsListTableProps {
  resolutions: ResolutionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  availableYears: number[];
  currentStatus?: ResolutionStatus;
  currentYear?: number;
  currentSearch?: string;
  canUpdate: boolean;
}

export function SbResolutionsListTable({
  resolutions,
  total,
  page,
  pageSize,
  totalPages,
  availableYears,
  currentStatus,
  currentYear,
  currentSearch,
  canUpdate,
}: SbResolutionsListTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = React.useState(currentSearch ?? "");

  const buildUrl = (overrides: {
    search?: string;
    status?: string;
    year?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const s = overrides.search !== undefined ? overrides.search : searchValue;
    const st = overrides.status !== undefined ? overrides.status : (currentStatus ?? "");
    const yr = overrides.year !== undefined ? overrides.year : (currentYear ? String(currentYear) : "");
    const pg = overrides.page !== undefined ? overrides.page : 1;

    if (s.trim()) params.set("search", s.trim());
    if (st) params.set("status", st);
    if (yr) params.set("year", yr);
    if (pg > 1) params.set("page", String(pg));

    const qs = params.toString();
    return `/admin/transparency/sangguniang-bayan-resolutions${qs ? `?${qs}` : ""}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ search: searchValue, page: 1 }));
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by resolution number, title, or summary..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by year"
            value={currentYear ? String(currentYear) : ""}
            onChange={(e) => router.push(buildUrl({ year: e.target.value, page: 1 }))}
            className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20"
          >
            <option value="">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={currentStatus ?? ""}
            onChange={(e) => router.push(buildUrl({ status: e.target.value, page: 1 }))}
            className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {resolutions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              No Sangguniang Bayan Resolutions found
            </p>
            <p className="text-xs text-slate-500">
              Create a new resolution draft or adjust your search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4">Year / Adopted</th>
                  <th className="py-3 px-4">PDF Attachment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {resolutions.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-mono text-xs font-bold text-burgundy-800">
                        {res.resolutionNumber}
                      </div>
                      <div className="font-semibold text-slate-900 line-clamp-2 mt-0.5">
                        {res.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-800">{res.year}</div>
                      <div className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(res.adoptedAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {res.originalFilename ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <span className="px-1.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 font-mono text-[10px] font-bold">
                            PDF
                          </span>
                          <span className="truncate max-w-[160px]" title={res.originalFilename}>
                            {res.originalFilename}
                          </span>
                          {res.fileSizeFormatted && (
                            <span className="text-[11px] text-slate-400">
                              ({res.fileSizeFormatted})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No PDF uploaded
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {canUpdate && (
                        <Link
                          href={`/admin/transparency/sangguniang-bayan-resolutions/${res.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => router.push(buildUrl({ page: page - 1 }))}
                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => router.push(buildUrl({ page: page + 1 }))}
                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
