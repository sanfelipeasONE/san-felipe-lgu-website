"use client";

import * as React from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { ADMINISTRATION_PERIODS } from "@/config/officials-data";

export function AdministrationSelector() {
  const currentPeriod = ADMINISTRATION_PERIODS[0];

  return (
    <div className="flex items-center space-x-2 text-xs">
      <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] hidden sm:inline-block">
        Administration
      </span>
      <div className="relative inline-block">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label={`Current Administration: ${currentPeriod.label}`}
          title="Administration term (Historical record archive view)"
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-burgundy-700/60 rounded-xs text-xs font-bold text-burgundy-900 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
        >
          <Calendar className="h-3.5 w-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
          <span>{currentPeriod.label}</span>
          <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
