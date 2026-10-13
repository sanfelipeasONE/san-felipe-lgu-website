import * as React from "react";
import Link from "next/link";
import type { OfficeItem } from "@/config/homepage-data";

interface OfficeCardProps {
  office: OfficeItem;
}

export function OfficeCard({ office }: OfficeCardProps) {
  return (
    <Link
      href="/offices"
      className="bg-white border border-gray-200 rounded-xs p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-burgundy-700 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:border-burgundy-700 focus-visible:shadow-xs focus-visible:bg-slate-50/50 transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center group h-full"
    >
      <h3 className="text-sm sm:text-base font-bold text-gov-charcoal tracking-tight leading-snug group-hover:text-burgundy-800 group-focus-visible:text-burgundy-800 transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]">
        {office.name}{" "}
        {office.acronym && (
          <span className="text-burgundy-700 font-semibold">
            ({office.acronym})
          </span>
        )}
      </h3>
    </Link>
  );
}
