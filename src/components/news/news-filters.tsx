import * as React from "react";
import { Search, RotateCcw } from "lucide-react";

export interface NewsFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  selectedOffice: string;
  onOfficeChange: (val: string) => void;
  selectedYear: string;
  onYearChange: (val: string) => void;
  onReset: () => void;
  isFiltered: boolean;
  filterOptions: {
    types: { value: string; label: string }[];
    offices: { value: string; label: string }[];
    years: { value: string; label: string }[];
  };
}

export function NewsFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedOffice,
  onOfficeChange,
  selectedYear,
  onYearChange,
  onReset,
  isFiltered,
  filterOptions,
}: NewsFiltersProps) {
  return (
    <div
      role="search"
      aria-label="Filter news and announcements"
      className="bg-white border border-gray-200 rounded-xs p-4 sm:p-5 shadow-2xs mb-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
        {/* Search Bar Input (5 cols on lg) */}
        <div className="lg:col-span-5 relative">
          <label htmlFor="news-search-input" className="sr-only">
            Search news and announcements
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="news-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search news, advisories, keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/60 border border-gray-200 rounded-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Content Type Filter (2 cols on lg) */}
        <div className="lg:col-span-2">
          <label htmlFor="filter-type-select" className="sr-only">
            Filter by content type
          </label>
          <select
            id="filter-type-select"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50/60 border border-gray-200 rounded-xs text-gov-charcoal font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-700 transition-all cursor-pointer"
          >
            {filterOptions.types.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Office Filter (3 cols on lg) */}
        <div className="lg:col-span-3">
          <label htmlFor="filter-office-select" className="sr-only">
            Filter by publishing office
          </label>
          <select
            id="filter-office-select"
            value={selectedOffice}
            onChange={(e) => onOfficeChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50/60 border border-gray-200 rounded-xs text-gov-charcoal font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-700 transition-all cursor-pointer truncate"
          >
            {filterOptions.offices.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter & Reset (2 cols on lg) */}
        <div className="lg:col-span-2 flex items-center gap-2">
          <label htmlFor="filter-year-select" className="sr-only">
            Filter by publication year
          </label>
          <select
            id="filter-year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50/60 border border-gray-200 rounded-xs text-gov-charcoal font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-700 transition-all cursor-pointer"
          >
            {filterOptions.years.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              title="Reset all filters"
              aria-label="Reset all filters"
              className="p-2 text-slate-500 hover:text-burgundy-700 hover:bg-slate-100 rounded-xs border border-gray-200 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
