"use client";

import * as React from "react";
import { Search, RotateCcw, Building2, Info } from "lucide-react";
import type { MunicipalOffice } from "@/config/offices-data";

export interface OfficeDirectoryProps {
  offices: MunicipalOffice[];
}

export function OfficeDirectory({ offices }: OfficeDirectoryProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Search filter computes matches against office name, acronym, or verified head
  const filteredOffices = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return offices;
    }

    const query = searchQuery.toLowerCase().trim();
    return offices.filter((office) => {
      const nameMatch = office.name.toLowerCase().includes(query);
      const acronymMatch = office.acronym
        ? office.acronym.toLowerCase().includes(query)
        : false;
      const headMatch = office.head
        ? office.head.toLowerCase().includes(query)
        : false;

      return nameMatch || acronymMatch || headMatch;
    });
  }, [offices, searchQuery]);

  const handleClear = () => {
    setSearchQuery("");
  };

  const isFiltered = searchQuery.trim().length > 0;

  return (
    <div>
      {/* Search Input Bar */}
      <div className="mb-6 max-w-md">
        <label htmlFor="office-search-input" className="sr-only">
          Search municipal offices
        </label>
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="office-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search municipal offices or acronym..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-xs placeholder:text-slate-400 text-gov-charcoal font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:border-transparent transition-all"
          />
          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-burgundy-800 rounded-xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Directory Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-2 border-b border-gray-200">
        <span>
          Showing{" "}
          <strong className="text-gov-charcoal font-bold">
            {filteredOffices.length}
          </strong>{" "}
          {filteredOffices.length === 1 ? "office" : "offices"}
          {isFiltered && ` matching "${searchQuery}"`}
        </span>

        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="text-burgundy-700 hover:text-burgundy-900 font-bold hover:underline inline-flex items-center gap-1 text-xs"
          >
            <span>Reset Directory</span>
          </button>
        )}
      </div>

      {/* Directory Table */}
      {filteredOffices.length > 0 ? (
        <div className="bg-white border border-gray-300 rounded-xs shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left border-collapse">
              <thead>
                <tr className="bg-burgundy-900 text-white border-b-2 border-gold-500 divide-x divide-burgundy-800/80">
                  <th
                    scope="col"
                    className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-[48%]"
                  >
                    Office / Department
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-white w-[20%]"
                  >
                    Abbreviation
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-[32%]"
                  >
                    Office Head / Secretary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOffices.map((office) => {
                  const formattedNumber = String(office.displayOrder).padStart(2, "0");

                  return (
                    <tr
                      key={office.id}
                      className="odd:bg-white even:bg-slate-50/60 hover:bg-burgundy-50/30 transition-colors divide-x divide-gray-200"
                    >
                      {/* 1. Office / Department */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">
                            #{formattedNumber}
                          </span>
                          <span className="font-bold text-gov-charcoal text-xs sm:text-sm leading-snug">
                            {office.name}
                          </span>
                        </div>
                      </td>

                      {/* 2. Abbreviation */}
                      <td className="py-3.5 px-4 align-top">
                        {office.acronym ? (
                          <span className="inline-flex items-center text-[11px] font-bold text-burgundy-800 bg-burgundy-50 border border-burgundy-200 px-2 py-0.5 rounded-xs font-mono">
                            {office.acronym}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs select-none">
                            —
                          </span>
                        )}
                      </td>

                      {/* 3. Office Head / Secretary */}
                      <td className="py-3.5 px-5 align-top">
                        {office.head ? (
                          <div>
                            <span className="font-bold text-gov-charcoal text-xs sm:text-[13px] block leading-snug">
                              {office.head}
                            </span>
                            {office.headTitle && (
                              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                {office.headTitle}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs select-none">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div
          role="status"
          className="bg-white border border-gray-200 rounded-xs p-10 text-center shadow-2xs max-w-md mx-auto my-12 space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-gov-charcoal">
              No municipal offices found
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Try another office name or acronym (e.g. Mayor, Health, MPDO, PESO).
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white rounded-xs text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Search</span>
            </button>
          </div>
        </div>
      )}

      {/* Directory Notes Card */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xs p-4 sm:p-5 text-xs text-slate-600 leading-relaxed shadow-2xs">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-burgundy-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <strong className="font-bold text-gov-charcoal block">
              Official Municipal Directory Note
            </strong>
            <p className="text-slate-500">
              This directory reflects the verified municipal offices of the Local Government Unit of San Felipe, Zambales. Official designations are updated continuously upon formal municipal administrative issuance. For public inquiries, please visit the Municipal Hall Complex during official business hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
