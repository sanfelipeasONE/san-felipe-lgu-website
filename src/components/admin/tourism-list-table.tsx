"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Edit,
  MapPin,
  Compass,
  Palmtree,
  Hotel,
  Landmark,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  TOURISM_CATEGORIES,
  TOURISM_CATEGORY_LABELS,
  TOURISM_CATEGORY_ROUTES,
} from "@/lib/validation/tourism";
import type { TourismCategory, TourismStatus } from "@prisma/client";

export interface TourismAdminListItem {
  id: string;
  slug: string;
  category: TourismCategory;
  title: string;
  summary: string;
  location?: string | null;
  status: TourismStatus;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  publishedAt?: Date | string | null;
  updatedAt: Date | string;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface TourismListTableProps {
  entries: TourismAdminListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentCategory?: string;
  currentStatus?: string;
  currentSearch?: string;
}

const CATEGORY_ICONS: Record<TourismCategory, React.ComponentType<{ className?: string }>> = {
  ATTRACTIONS: Compass,
  RESORTS: Hotel,
  CULTURE_AND_ARTS: Landmark,
  PRODUCTS: ShoppingBag,
};

const CATEGORY_COLORS: Record<TourismCategory, string> = {
  ATTRACTIONS: "bg-emerald-50 text-emerald-800 border-emerald-200",
  RESORTS: "bg-blue-50 text-blue-800 border-blue-200",
  CULTURE_AND_ARTS: "bg-amber-50 text-amber-800 border-amber-200",
  PRODUCTS: "bg-purple-50 text-purple-800 border-purple-200",
};

const TOURISM_COLUMNS: DataTableColumn[] = [
  { key: "title", header: "Entry & Summary", width: "40%" },
  { key: "category", header: "Category", width: "16%" },
  { key: "location", header: "Location", width: "16%" },
  { key: "status", header: "Status", width: "12%" },
  { key: "actions", header: "Actions", width: "16%", align: "right" },
];

export function TourismListTable({
  entries,
  total,
  page,
  pageSize,
  totalPages,
  currentCategory = "all",
  currentStatus = "",
  currentSearch = "",
}: TourismListTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to build URL with updated search params
  const createQueryString = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryChange = (cat: string) => {
    const qs = createQueryString({
      category: cat === "all" ? null : cat,
      page: "1",
    });
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const handleStatusChange = (statusVal: string) => {
    const qs = createQueryString({
      status: statusVal === "" ? null : statusVal,
      page: "1",
    });
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const categoryTabs = [
    { key: "all", label: "All Categories", icon: Palmtree },
    ...TOURISM_CATEGORIES.map((cat) => ({
      key: cat,
      label: TOURISM_CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200">
        {categoryTabs.map((tab) => {
          const isActive =
            tab.key === "all"
              ? !currentCategory || currentCategory === "all"
              : currentCategory === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleCategoryChange(tab.key)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-md transition-all whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] ${
                isActive
                  ? "border-burgundy-700 text-burgundy-800 bg-white shadow-2xs font-bold"
                  : "border-transparent text-gov-muted hover:text-gov-charcoal hover:border-gray-300"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-burgundy-700" : "text-gray-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Data Table */}
      <DataTable
        title="Tourism Directory Entries"
        columns={TOURISM_COLUMNS}
        data={entries}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search entries by title, summary, or location..."
        searchValue={currentSearch}
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              defaultValue={currentStatus || ""}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-medium cursor-pointer"
              aria-label="Filter by publication status"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        }
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: total,
          pageSize,
        }}
        renderRow={(entry) => {
          const CategoryIcon = CATEGORY_ICONS[entry.category] || Compass;
          const categoryColor = CATEGORY_COLORS[entry.category] || "bg-gray-100 text-gray-800";
          const publicRoute = `${TOURISM_CATEGORY_ROUTES[entry.category]}/${entry.slug}`;

          return (
            <tr key={entry.id} className="hover:bg-slate-50/75 transition-colors">
              {/* Entry & Summary (with optional thumbnail) */}
              <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    {entry.featuredImageUrl ? (
                      <Image
                        src={entry.featuredImageUrl}
                        alt={entry.featuredImageAlt || entry.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <CategoryIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <Link
                      href={`/admin/tourism/${entry.id}/edit`}
                      className="font-bold text-gov-charcoal hover:text-burgundy-800 transition-colors line-clamp-1 text-xs"
                    >
                      {entry.title}
                    </Link>
                    <p className="text-[11px] text-gov-muted line-clamp-1">
                      {entry.summary}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">
                      /{entry.slug}
                    </p>
                  </div>
                </div>
              </td>

              {/* Category */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${categoryColor}`}
                >
                  <CategoryIcon className="h-3 w-3 shrink-0" />
                  <span>{TOURISM_CATEGORY_LABELS[entry.category]}</span>
                </span>
              </td>

              {/* Location */}
              <td className="px-4 py-3 text-xs text-gov-charcoal whitespace-nowrap">
                {entry.location ? (
                  <div className="flex items-center gap-1 text-gov-charcoal">
                    <MapPin className="h-3.5 w-3.5 text-burgundy-700 shrink-0" />
                    <span className="truncate max-w-[160px]" title={entry.location}>
                      {entry.location}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 italic">Not specified</span>
                )}
              </td>

              {/* Status Badge */}
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={entry.status} size="sm" />
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Public Link (if published) */}
                  {entry.status === "PUBLISHED" ? (
                    <Link
                      href={publicRoute}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-xs text-gray-500 hover:text-burgundy-700 hover:bg-slate-100 transition-colors"
                      title="View Published Page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}

                  {/* Edit Link */}
                  <Link
                    href={`/admin/tourism/${entry.id}/edit`}
                    className="p-1 rounded-xs text-gray-500 hover:text-burgundy-700 hover:bg-slate-100 transition-colors"
                    title="Edit Entry"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}
