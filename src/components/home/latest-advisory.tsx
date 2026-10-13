"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Volume2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ADVISORIES_DATA } from "@/config/homepage-data";

export function LatestAdvisory() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFading, setIsFading] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);

  const hasMultiple = ADVISORIES_DATA.length > 1;

  React.useEffect(() => {
    if (!hasMultiple || isPaused) return;

    // Respect prefers-reduced-motion at runtime
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const interval = setInterval(() => {
      if (prefersReducedMotion) {
        // Change immediately without crossfade transition
        setCurrentIndex((prev) => (prev + 1) % ADVISORIES_DATA.length);
        return;
      }

      // Calm crossfade: 200ms fade-out, update index, 200ms fade-in
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ADVISORIES_DATA.length);
        setIsFading(false);
      }, 200);
    }, 7000);

    return () => clearInterval(interval);
  }, [hasMultiple, isPaused]);

  const activeAdvisory = ADVISORIES_DATA[currentIndex] || ADVISORIES_DATA[0];

  return (
    <aside
      aria-label="Latest Municipal Advisory"
      className="bg-white border-b border-gray-200 py-3 shadow-2xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <Container>
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ opacity: isFading ? 0 : 1 }}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Burgundy Advisory Badge */}
            <span className="inline-flex items-center gap-1.5 shrink-0 bg-burgundy-700 text-white font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-xs shadow-2xs">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              {activeAdvisory.badge}
            </span>

            {/* Advisory Headline */}
            <span className="font-semibold text-gov-charcoal truncate tracking-tight">
              {activeAdvisory.title}
            </span>
          </div>

          {/* Action Link */}
          <Link
            href={activeAdvisory.href}
            className="inline-flex items-center gap-1 shrink-0 text-burgundy-700 hover:text-burgundy-900 focus-visible:outline-none focus-visible:underline font-bold text-xs uppercase tracking-wider transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group"
          >
            <span>Read Advisory</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 group-focus-visible:translate-x-1 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          </Link>
        </div>
      </Container>
    </aside>
  );
}
