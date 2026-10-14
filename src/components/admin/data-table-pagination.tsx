"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageParamName?: string;
}

export function DataTablePaginationSkeleton({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
}: Partial<DataTablePaginationProps>) {
  const startItem =
    totalItems === 0
      ? 0
      : Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gov-muted">
      <div>
        Showing{" "}
        <span className="font-semibold text-gov-charcoal">{startItem}</span> to{" "}
        <span className="font-semibold text-gov-charcoal">{endItem}</span> of{" "}
        <span className="font-semibold text-gov-charcoal">{totalItems}</span>{" "}
        records
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled
          className="h-7 px-2 text-xs border-gray-300"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 font-medium text-gov-charcoal text-[11px]">
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled
          className="h-7 px-2 text-xs border-gray-300"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageParamName = "page",
}: DataTablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set(pageParamName, String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const startItem =
    totalItems === 0
      ? 0
      : Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gov-muted">
      <div>
        Showing{" "}
        <span className="font-semibold text-gov-charcoal">{startItem}</span> to{" "}
        <span className="font-semibold text-gov-charcoal">{endItem}</span> of{" "}
        <span className="font-semibold text-gov-charcoal">{totalItems}</span>{" "}
        records
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="h-7 px-2 text-xs border-gray-300"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 font-medium text-gov-charcoal text-[11px]">
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="h-7 px-2 text-xs border-gray-300"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
