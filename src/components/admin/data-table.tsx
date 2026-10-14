"use client";

import * as React from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { cn } from "@/lib/utils";

export interface DataTableColumn {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  title?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  headerActions?: React.ReactNode;
  pagination?: DataTablePaginationProps;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  renderRow,
  keyExtractor = (_, index) => String(index),
  title,
  searchPlaceholder = "Search records...",
  searchValue,
  onSearchChange,
  filters,
  headerActions,
  pagination,
  emptyState,
  isLoading = false,
  className,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = React.useState("");
  const activeSearch = searchValue !== undefined ? searchValue : internalSearch;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (searchValue === undefined) {
      setInternalSearch(val);
    }
    onSearchChange?.(val);
  };

  const hasControls = Boolean(onSearchChange || searchPlaceholder || filters || headerActions || title);

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xs shadow-2xs overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Top Filter & Action Bar */}
      {hasControls && (
        <div className="p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            {title && (
              <h3 className="text-xs font-bold uppercase tracking-wider text-gov-charcoal">
                {title}
              </h3>
            )}
            {onSearchChange && (
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={activeSearch}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  className="pl-8 h-8 text-xs bg-slate-50 border-gray-300 focus:bg-white"
                />
              </div>
            )}
            {filters}
          </div>

          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Table Surface */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/75 text-gov-charcoal">
              {columns.map((col) => {
                const alignClass =
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={cn(
                      "px-4 py-3 font-semibold tracking-wider text-[11px] uppercase text-gov-muted whitespace-nowrap",
                      alignClass,
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gov-muted text-xs"
                >
                  Loading records...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6">
                  {emptyState || (
                    <AdminEmptyState
                      title="No records found"
                      description="No administrative records match your current criteria or query."
                    />
                  )}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <React.Fragment key={keyExtractor(item, index)}>
                  {renderRow(item, index)}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gov-muted">
          <div>
            Showing{" "}
            <span className="font-semibold text-gov-charcoal">
              {Math.min(
                (pagination.currentPage - 1) * pagination.pageSize + 1,
                pagination.totalItems
              )}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gov-charcoal">
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gov-charcoal">
              {pagination.totalItems}
            </span>{" "}
            records
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1}
              onClick={() =>
                pagination.onPageChange?.(pagination.currentPage - 1)
              }
              className="h-7 px-2 text-xs border-gray-300"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-medium text-gov-charcoal text-[11px]">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                pagination.onPageChange?.(pagination.currentPage + 1)
              }
              className="h-7 px-2 text-xs border-gray-300"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
