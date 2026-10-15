"use client";

import * as React from "react";
import Image from "next/image";
import { ASSETS } from "@/config/assets";
import { cn } from "@/lib/utils";

/**
 * Public Municipal Seal Initial Document Load Splash.
 *
 * Lifecycle Architecture:
 * - Mounted exclusively in `src/app/(public)/layout.tsx`.
 * - Fires on every full browser document load (new tab, address bar entry, browser refresh, hard refresh).
 * - Because Next.js preserves layout state across client-side router navigations (Link clicks),
 *   this component naturally unmounts once and NEVER replays during client-side route transitions.
 * - Zero persistent storage (no browser storage mechanisms, cookies, or URL params).
 * - Restrained civic duration: ~600ms visible, ~300ms smooth fade (~950ms total unmount).
 * - Completely unmounts from DOM after fade to prevent invisible interaction interception.
 */
export function PublicSealSplash() {
  const [phase, setPhase] = React.useState<"visible" | "fading" | "hidden">("visible");

  React.useEffect(() => {
    // 1. Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // For reduced motion: minimal presentation, no pulse, quick dismiss
      const timer = setTimeout(() => {
        setPhase("hidden");
      }, 250);
      return () => clearTimeout(timer);
    }

    // 2. Normal presentation: visible for 600ms, then trigger CSS opacity fade
    const fadeTimer = setTimeout(() => {
      setPhase("fading");
    }, 600);

    // 3. Complete fade (300ms duration) and unmount completely from DOM at 950ms
    const unmountTimer = setTimeout(() => {
      setPhase("hidden");
    }, 950);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  // When transition is completed, remove completely from DOM
  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Municipality of San Felipe Digital Portal"
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ease-out",
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center text-center px-4 max-w-sm">
        {/* Verified San Felipe Municipal Seal with Subtle Civic Pulse */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3.5 animate-seal-pulse">
          <Image
            src={ASSETS.branding.seal.src}
            alt={ASSETS.branding.seal.alt}
            width={112}
            height={112}
            priority
            className="w-full h-full object-contain rounded-full shadow-2xs"
          />
        </div>

        {/* Civic Identification Typography */}
        <div className="space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-widest text-burgundy-900">
            Municipality of San Felipe
          </p>
          <p className="text-[11px] font-medium tracking-wide text-slate-500">
            Province of Zambales
          </p>
        </div>
      </div>
    </div>
  );
}
