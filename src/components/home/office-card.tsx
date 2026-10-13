import * as React from "react";
import Link from "next/link";
import type { OfficeItem } from "@/config/homepage-data";
import { cn } from "@/lib/utils";
import { CARD_LINK_INTERACTIVE_CLASSES } from "@/lib/card-styles";

interface OfficeCardProps {
  office: OfficeItem;
}

export function OfficeCard({ office }: OfficeCardProps) {
  return (
    <Link
      href="/offices"
      className={cn(
        "bg-white border border-gray-200 rounded-xs p-5 sm:p-6 shadow-2xs hover:bg-slate-50/50 flex items-center group h-full",
        CARD_LINK_INTERACTIVE_CLASSES
      )}
    >
      <h3 className="text-sm sm:text-base font-bold text-gov-charcoal tracking-tight leading-snug group-hover:text-burgundy-800 group-focus-visible:text-burgundy-800 transition-colors duration-200">
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
