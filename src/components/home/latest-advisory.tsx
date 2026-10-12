import * as React from "react";
import Link from "next/link";
import { ArrowRight, Volume2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ADVISORY_DATA } from "@/config/homepage-data";

export function LatestAdvisory() {
  return (
    <aside
      aria-label="Latest Municipal Advisory"
      className="bg-white border-b border-gray-200 py-3 shadow-2xs"
    >
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Burgundy Advisory Badge */}
            <span className="inline-flex items-center gap-1.5 shrink-0 bg-burgundy-700 text-white font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-xs shadow-2xs">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              {ADVISORY_DATA.badge}
            </span>

            {/* Advisory Headline */}
            <span className="font-semibold text-gov-charcoal truncate tracking-tight">
              {ADVISORY_DATA.title}
            </span>
          </div>

          {/* Action Link */}
          <Link
            href={ADVISORY_DATA.href}
            className="inline-flex items-center gap-1 shrink-0 text-burgundy-700 hover:text-burgundy-900 font-bold text-xs uppercase tracking-wider transition-colors group"
          >
            <span>Read Advisory</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </Container>
    </aside>
  );
}
