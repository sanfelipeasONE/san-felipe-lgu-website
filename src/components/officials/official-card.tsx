import * as React from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Official } from "@/config/officials-data";

/**
 * Executive Leadership Card (Mayor & Vice Mayor)
 * Refined prominence with verified badges and official institutional typography.
 */
export function ExecutiveOfficialCard({
  official,
  isMayor = false,
  className,
}: {
  official: Official;
  isMayor?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden flex flex-col sm:flex-row gap-5 p-5 sm:p-6 items-center sm:items-start text-center sm:text-left transition-all hover:border-burgundy-700/60 hover:shadow-sm relative",
        className
      )}
    >
      {/* Top Burgundy Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-burgundy-900" aria-hidden="true" />

      {/* Portrait Container */}
      <div
        className={cn(
          "relative w-32 h-40 sm:w-36 sm:h-44 shrink-0 overflow-hidden rounded-xs bg-slate-100 shadow-2xs mt-1",
          isMayor
            ? "border-2 border-gold-500/80 p-0.5 bg-white"
            : "border border-gray-200"
        )}
      >
        <Image
          src={official.portrait.src}
          alt={official.portrait.alt}
          fill
          sizes="(max-width: 640px) 128px, 144px"
          className="object-cover object-top"
          priority
        />
      </div>

      {/* Official Information */}
      <div className="flex-1 space-y-1.5 flex flex-col justify-center mt-1">
        <div className="flex items-center justify-center sm:justify-between gap-2 flex-wrap">
          {official.eyebrow && (
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block">
              {official.eyebrow}
            </span>
          )}

          {official.isPortraitVerified && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-xs">
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" aria-hidden="true" />
              <span>Verified Portrait</span>
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-black text-gov-charcoal uppercase leading-snug tracking-tight">
          {official.name}
        </h3>

        <p className="text-xs sm:text-[13px] font-bold text-burgundy-800">
          {official.position}
        </p>

        {official.roleDescription && (
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {official.roleDescription}
          </p>
        )}

        {/* Committee Assignment (e.g. Vice Mayor) */}
        {official.committeeAssignments && official.committeeAssignments.length > 0 && (
          <div className="pt-1.5">
            <span className="inline-block text-[11px] font-semibold text-burgundy-800 bg-burgundy-50 border border-burgundy-200/80 px-2.5 py-1 rounded-xs">
              {official.committeeAssignments[0]}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Councilor Card (Regular Sangguniang Bayan Members)
 * Clean, institutional card displaying verified name and seat.
 */
export function CouncilorCard({
  official,
  className,
}: {
  official: Official;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "bg-white border border-gray-200 rounded-xs overflow-hidden shadow-2xs hover:border-burgundy-700/60 hover:shadow-xs transition-all flex flex-col justify-between text-left",
        className
      )}
    >
      <div>
        {/* Full-Width Portrait Area */}
        <div className="relative w-full aspect-4/5 bg-slate-100 overflow-hidden border-b border-gray-200">
          <Image
            src={official.portrait.src}
            alt={official.portrait.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            className="object-cover object-center"
          />
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {official.seat || "SB COUNCILOR"}
          </span>

          <h3 className="text-sm sm:text-base font-extrabold text-gov-charcoal uppercase leading-tight">
            {official.name}
          </h3>

          <p className="text-xs font-semibold text-burgundy-800">
            {official.position}
          </p>

          <p className="text-[11px] text-slate-400 italic pt-1">
            Committee assignment pending gazette
          </p>
        </div>
      </div>
    </article>
  );
}

/**
 * Ex-Officio Member Card (LNB & SK Federation)
 * Clean horizontal layout matching approved design without dummy text.
 */
export function ExOfficioCard({
  official,
  className,
}: {
  official: Official;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "bg-white border border-gray-200 rounded-xs p-4 sm:p-5 shadow-2xs flex flex-row gap-4 items-center text-left hover:border-burgundy-700/60 hover:shadow-xs transition-all",
        className
      )}
    >
      {/* Portrait Container */}
      <div className="w-24 h-28 sm:w-28 sm:h-32 shrink-0 aspect-4/5 relative rounded-xs overflow-hidden border border-gray-200 bg-slate-100 shadow-2xs">
        <Image
          src={official.portrait.src}
          alt={official.portrait.alt}
          fill
          sizes="(max-width: 640px) 96px, 112px"
          className="object-cover object-center"
        />
      </div>

      {/* Information */}
      <div className="flex-1 space-y-1 min-w-0">
        {official.eyebrow && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block truncate">
            {official.eyebrow}
          </span>
        )}

        <h3 className="text-sm sm:text-base font-extrabold text-gov-charcoal uppercase leading-tight">
          {official.name}
        </h3>

        <p className="text-xs font-bold text-burgundy-800">
          {official.position}
        </p>

        {official.secondaryInfo && (
          <p className="text-xs text-slate-500">
            {official.secondaryInfo}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Universal OfficialCard fallback router
 */
export function OfficialCard({
  official,
  isProminent,
  className,
}: {
  official: Official;
  isProminent?: boolean;
  className?: string;
  portraitFit?: "cover" | "contain";
}) {
  if (isProminent || official.branch === "executive" || official.id === "vice-mayor") {
    return (
      <ExecutiveOfficialCard
        official={official}
        isMayor={official.id === "mayor"}
        className={className}
      />
    );
  }

  if (official.isExOfficio) {
    return <ExOfficioCard official={official} className={className} />;
  }

  return <CouncilorCard official={official} className={className} />;
}
