import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Official } from "@/config/officials-data";

/**
 * Shared Civic Interaction Tokens for Municipal Official Cards
 * Restrained, dignified, and responsive:
 * - 200-250ms ease-out transitions
 * - Subtle lift (3-4px) and shadow elevation
 * - Restrained portrait scale (1.02x - 1.03x) inside overflow-hidden frames
 * - Soft border & name transition to San Felipe burgundy (#8B1E2D)
 * - Accessible prefers-reduced-motion resets
 */
const CARD_BASE_INTERACTION =
  "transition-all duration-200 ease-out hover:shadow-md group relative overflow-hidden";

/** Regular Sangguniang Bayan Member Card interaction (-4px lift, burgundy border shift) */
const SB_CARD_INTERACTION = cn(
  CARD_BASE_INTERACTION,
  "hover:-translate-y-1 hover:border-burgundy-700/70 motion-reduce:hover:translate-none"
);

/** Mayor & Vice Mayor Executive Leadership card interaction (-3px lift, subtle emphasis) */
const EXECUTIVE_CARD_INTERACTION = cn(
  CARD_BASE_INTERACTION,
  "hover:-translate-y-[3px] hover:border-burgundy-700/80 motion-reduce:hover:translate-none"
);

/** Ex-Officio Member card interaction (-3px lift, visually subordinate) */
const EX_OFFICIO_CARD_INTERACTION = cn(
  CARD_BASE_INTERACTION,
  "hover:-translate-y-[3px] hover:border-burgundy-700/60 motion-reduce:hover:translate-none"
);

/** Portrait zoom styling variants */
const PORTRAIT_ZOOM_SB =
  "transition-transform duration-250 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100";

const PORTRAIT_ZOOM_EXECUTIVE =
  "transition-transform duration-250 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100";

const PORTRAIT_ZOOM_EX_OFFICIO =
  "transition-transform duration-250 ease-out group-hover:scale-[1.025] motion-reduce:group-hover:scale-100";

/** Official name color transition to primary burgundy (#8B1E2D) */
const OFFICIAL_NAME_HOVER =
  "transition-colors duration-200 group-hover:text-burgundy-700";

/** Expanding thin (2px) top burgundy accent line for Council & Ex-Officio cards */
function CardTopAccent() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-[2px] bg-slate-100 z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div className="h-full w-full bg-burgundy-700 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out motion-reduce:transform-none motion-reduce:opacity-0 motion-reduce:group-hover:opacity-100" />
    </div>
  );
}

/**
 * Executive Leadership Card (Mayor & Vice Mayor)
 * Refined prominence with official institutional typography.
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
        "bg-white border border-gray-200 rounded-xs shadow-xs flex flex-col sm:flex-row gap-5 p-5 sm:p-6 items-center sm:items-start text-center sm:text-left",
        EXECUTIVE_CARD_INTERACTION,
        className
      )}
    >
      {/* Top Burgundy Accent Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-burgundy-900 group-hover:bg-burgundy-700 transition-colors duration-200"
        aria-hidden="true"
      />

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
          className={cn("object-cover object-top", PORTRAIT_ZOOM_EXECUTIVE)}
          priority
        />
      </div>

      {/* Official Information */}
      <div className="flex-1 space-y-1.5 flex flex-col justify-center mt-1">
        {official.eyebrow && (
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block">
            {official.eyebrow}
          </span>
        )}

        <h3 className={cn("text-base sm:text-lg font-black text-gov-charcoal uppercase leading-snug tracking-tight", OFFICIAL_NAME_HOVER)}>
          {official.name}
        </h3>

        <p className="text-xs sm:text-[13px] font-bold text-burgundy-800">
          {official.position}
        </p>

        {!isMayor && official.roleDescription && (
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {official.roleDescription}
          </p>
        )}

        {/* Role Badge for Mayor (e.g. Local Chief Executive • Municipality of San Felipe) */}
        {isMayor && official.roleDescription && (
          <div className="pt-1.5">
            <span className="inline-block text-[11px] font-semibold text-burgundy-800 bg-burgundy-50 border border-burgundy-200/80 px-2.5 py-1 rounded-xs">
              {official.roleDescription}
            </span>
          </div>
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
        "bg-white border border-gray-200 rounded-xs shadow-2xs flex flex-col justify-between text-left",
        SB_CARD_INTERACTION,
        className
      )}
    >
      {/* Expanding Top Burgundy Accent */}
      <CardTopAccent />

      <div>
        {/* Full-Width Portrait Area */}
        <div className="relative w-full aspect-4/5 bg-slate-100 overflow-hidden border-b border-gray-200">
          <Image
            src={official.portrait.src}
            alt={official.portrait.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            className={cn("object-cover object-center", PORTRAIT_ZOOM_SB)}
          />
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {official.seat || "SB COUNCILOR"}
          </span>

          <h3 className={cn("text-sm sm:text-base font-extrabold text-gov-charcoal uppercase leading-tight", OFFICIAL_NAME_HOVER)}>
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
        "bg-white border border-gray-200 rounded-xs p-4 sm:p-5 shadow-2xs flex flex-row gap-4 items-center text-left",
        EX_OFFICIO_CARD_INTERACTION,
        className
      )}
    >
      {/* Expanding Top Burgundy Accent */}
      <CardTopAccent />

      {/* Portrait Container */}
      <div className="w-24 h-28 sm:w-28 sm:h-32 shrink-0 aspect-4/5 relative rounded-xs overflow-hidden border border-gray-200 bg-slate-100 shadow-2xs">
        <Image
          src={official.portrait.src}
          alt={official.portrait.alt}
          fill
          sizes="(max-width: 640px) 96px, 112px"
          className={cn("object-cover object-center", PORTRAIT_ZOOM_EX_OFFICIO)}
        />
      </div>

      {/* Information */}
      <div className="flex-1 space-y-1 min-w-0">
        {official.eyebrow && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block truncate">
            {official.eyebrow}
          </span>
        )}

        <h3 className={cn("text-sm sm:text-base font-extrabold text-gov-charcoal uppercase leading-tight", OFFICIAL_NAME_HOVER)}>
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
