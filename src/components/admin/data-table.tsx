import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  DataTablePagination,
  DataTablePaginationSkeleton,
  type DataTablePaginationProps,
} from "@/components/admin/data-table-pagination";
import { DataTableSearch } from "@/components/admin/data-table-search";
import { cn } from "@/lib/utils";

export interface DataTableColumn {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export type { DataTablePaginationProps };

export interface DataTableProps<T> {
  columns: DataTableColumn[];
  data?: T[];
  renderRow?: (item: T, index: number) => React.ReactNode;
  children?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  title?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  filters?: React.ReactNode;
  headerActions?: React.ReactNode;
  pagination?: DataTablePaginationProps;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data = [],
  renderRow,
  children,
  keyExtractor = (_, index) => String(index),
  title,
  searchPlaceholder,
  searchValue,
  filters,
  headerActions,
  pagination,
  emptyState,
  isLoading = false,
  className,
}: DataTableProps<T>) {
  const hasControls = Boolean(
    searchPlaceholder || searchValue || filters || headerActions || title
  );

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
            {searchPlaceholder && (
              <React.Suspense
                fallback={
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      type="search"
                      defaultValue={searchValue}
                      placeholder={searchPlaceholder}
                      className="pl-8 h-8 text-xs bg-slate-50 border-gray-300"
                      disabled
                    />
                  </div>
                }
              >
                <DataTableSearch
                  placeholder={searchPlaceholder}
                  defaultValue={searchValue}
                />
              </React.Suspense>
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
            ) : children ? (
              children
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
            ) : renderRow ? (
              data.map((item, index) => (
                <React.Fragment key={keyExtractor(item, index)}>
                  {renderRow(item, index)}
                </React.Fragment>
              ))
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <React.Suspense
          fallback={
            <DataTablePaginationSkeleton
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
            />
          }
        >
          <DataTablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            pageParamName={pagination.pageParamName}
          />
        </React.Suspense>
      )}
    </div>
  );
}
