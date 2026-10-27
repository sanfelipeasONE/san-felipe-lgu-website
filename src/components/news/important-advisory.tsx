import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, Building2, ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/config/news-data";

export interface ImportantAdvisoryProps {
  advisory: NewsArticle;
}

export function ImportantAdvisory({ advisory }: ImportantAdvisoryProps) {
  return (
    <div
      role="region"
      aria-label="Important Municipal Advisory"
      className="mb-10 bg-burgundy-50/70 border-l-4 border-burgundy-700 p-5 sm:p-6 rounded-r-xs shadow-2xs border border-gray-200/80 border-l-burgundy-700"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-4xl">
          {/* Header Tag */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-burgundy-700 text-white shadow-2xs">
              <AlertTriangle className="h-3 w-3 text-gold-400" aria-hidden="true" />
              <span>IMPORTANT ADVISORY</span>
            </span>

            {advisory.publishingOffice && (
              <>
                <span className="text-gray-300 hidden sm:inline" aria-hidden="true">&bull;</span>
                <div className="flex items-center gap-1.5 text-xs text-burgundy-900 font-bold uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
                  <span>{advisory.publishingOffice.name}</span>
                </div>
              </>
            )}

            <span className="text-gray-300 hidden sm:inline" aria-hidden="true">&bull;</span>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
              <time dateTime={advisory.publishedAt}>{advisory.publishedAtFormatted}</time>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-black text-gov-charcoal tracking-tight leading-snug">
            <Link
              href={`/news/${advisory.slug}`}
              className="hover:text-burgundy-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
            >
              {advisory.title}
            </Link>
          </h3>

          {/* Short description */}
          <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
            {advisory.excerpt}
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          <Link
            href={`/news/${advisory.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white rounded-xs text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
          >
            <span>Read Advisory</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
