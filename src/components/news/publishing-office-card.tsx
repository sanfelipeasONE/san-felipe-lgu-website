import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublishingOffice } from "@/config/news-data";

export interface PublishingOfficeCardProps {
  office: PublishingOffice;
}

export function PublishingOfficeCard({ office }: PublishingOfficeCardProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Publishing Office
        </span>
        <span className="font-bold text-gov-charcoal text-sm">
          {office.name}
        </span>
      </div>

      <Link
        href="/offices"
        className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 inline-flex items-center gap-1 group"
      >
        <span>View Office Directory</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
