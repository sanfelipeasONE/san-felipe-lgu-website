"use client";

import * as React from "react";
import {
  FolderDown,
  Search,
  Download,
  Eye,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ServiceEmptyState } from "@/components/services/service-empty-state";
import { getCanonicalOffices } from "@/config/offices-data";
import type { DownloadableForm, FormCategory } from "@/config/services-data";
import { cn } from "@/lib/utils";

export interface DownloadableFormsViewProps {
  forms: DownloadableForm[];
}

const FORM_CATEGORIES: Array<"all" | FormCategory> = [
  "all",
  "Business & Licensing",
  "Civil Registry",
  "Building & Engineering",
  "Taxation & Revenue",
  "Social Services",
  "General Administration",
];

export function DownloadableFormsView({ forms }: DownloadableFormsViewProps) {
  const offices = getCanonicalOffices();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<"all" | FormCategory>("all");
  const [selectedOffice, setSelectedOffice] = React.useState("all");

  const filteredForms = React.useMemo(() => {
    return forms.filter((form) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || form.category === selectedCategory;
      const matchesOffice = selectedOffice === "all" || form.officeId === selectedOffice;
      return matchesSearch && matchesCategory && matchesOffice;
    });
  }, [forms, searchQuery, selectedCategory, selectedOffice]);

  return (
    <div className="py-10 sm:py-14 bg-slate-50/50">
      <Container>
        {/* Search & Category Filter Toolbar */}
        <ScrollReveal>
          <div className="bg-white border border-gray-200 rounded-xs p-4 mb-6 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search forms by title, keyword, or document type..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white transition-colors"
                  aria-label="Search downloadable forms"
                />
              </div>

              {/* Office dropdown */}
              <div className="w-full sm:w-64">
                <select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white transition-colors"
                  aria-label="Filter forms by issuing office"
                >
                  <option value="all">All Issuing Offices</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
              {FORM_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors whitespace-nowrap",
                    selectedCategory === category
                      ? "bg-burgundy-800 text-white"
                      : "bg-slate-100 text-gov-muted hover:bg-slate-200 hover:text-gov-charcoal"
                  )}
                >
                  {category === "all" ? "All Categories" : category}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 3. Main Content: Empty State vs Forms Directory List */}
        <ScrollReveal delayMs={100}>
          {filteredForms.length === 0 ? (
            <ServiceEmptyState
              icon={FolderDown}
              title="No downloadable forms are currently published on this website."
              description="Official downloadable forms published by the Municipality of San Felipe will appear here."
              primaryAction={{
                label: "View Municipal Offices Directory",
                href: "/offices",
              }}
              secondaryAction={{
                label: "Check Business Permits Guidelines",
                href: "/services/business-permits",
              }}
              showContactHelp
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xs shadow-2xs divide-y divide-gray-100">
              {filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700">
                        {form.category}
                      </span>
                      {form.officeName && (
                        <span className="text-[11px] font-semibold text-gov-muted">
                          {form.officeName}
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold text-burgundy-800 uppercase px-1.5 py-0.5 bg-burgundy-50 rounded-xs">
                        {form.fileType} • {form.fileSize}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gov-charcoal">
                      {form.title}
                    </h3>
                    <p className="text-xs text-gov-muted leading-relaxed">
                      {form.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {form.fileUrl && (
                      <>
                        <a
                          href={form.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-bold text-gov-charcoal bg-slate-100 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 transition-colors"
                          aria-label={`View ${form.title}`}
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>View</span>
                        </a>
                        <a
                          href={form.fileUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-bold text-white bg-burgundy-800 hover:bg-burgundy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 transition-colors shadow-2xs"
                          aria-label={`Download ${form.title}`}
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Download</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>
      </Container>
    </div>
  );
}
