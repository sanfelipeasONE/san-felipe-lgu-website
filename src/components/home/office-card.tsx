import * as React from "react";
import Link from "next/link";
import type { OfficeItem } from "@/config/homepage-data";
import { cn } from "@/lib/utils";

interface OfficeCardProps {
  office: OfficeItem;
}

export function OfficeCard({ office }: OfficeCardProps) {
  return (
    <Link
      href="/offices"
      className={cn(
        "relative bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-burgundy-700/60 rounded-xl sm:rounded-2xl pl-7 sm:pl-8 pr-6 py-6 sm:py-7 shadow-2xs hover:shadow-sm flex items-center min-h-[104px] sm:min-h-[112px] h-full group overflow-hidden transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:ring-offset-2 motion-reduce:hover:translate-none hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
      )}
    >
      {/* Short burgundy vertical accent attached to the left edge, vertically centered */}
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-7 sm:h-8 bg-burgundy-700 rounded-r-full transition-colors duration-200 group-hover:bg-burgundy-800"
        aria-hidden="true"
      />

      <h3 className="text-base sm:text-lg font-bold text-gov-charcoal tracking-tight leading-snug group-hover:text-burgundy-800 group-focus-visible:text-burgundy-800 transition-colors duration-200">
        {office.name}
      </h3>
    </Link>
  );
}
