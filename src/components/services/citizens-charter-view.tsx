"use client";

import * as React from "react";
import { BookOpen, Search, ChevronDown } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ServiceEmptyState } from "@/components/services/service-empty-state";
import { getCanonicalOffices } from "@/config/offices-data";
import type { CitizensCharterEntry } from "@/config/services-data";
import { cn } from "@/lib/utils";

export interface CitizensCharterViewProps {
  entries: CitizensCharterEntry[];
}

export function CitizensCharterView({ entries }: CitizensCharterViewProps) {
  const offices = getCanonicalOffices();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedOffice, setSelectedOffice] = React.useState("all");
  const [selectedType, setSelectedType] = React.useState<"all" | "G2C" | "G2B" | "G2G">("all");
  const [expandedEntryId, setExpandedEntryId] = React.useState<string | null>(null);

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        entry.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.officeName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOffice = selectedOffice === "all" || entry.officeId === selectedOffice;
      const matchesType = selectedType === "all" || entry.transactionType === selectedType;
      return matchesSearch && matchesOffice && matchesType;
    });
  }, [entries, searchQuery, selectedOffice, selectedType]);

  return (
    <div className="py-10 sm:py-14 bg-slate-50/50">
      <Container>
        {/* Search & Office Filter Toolbar */}
        <ScrollReveal>
          <div className="bg-white border border-gray-200 rounded-xs p-4 mb-8 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search municipal service or transaction..."
                className="w-full pl-9 pr-3.5 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white transition-colors"
                aria-label="Search municipal services"
              />
            </div>

            {/* Office Filter Dropdown */}
            <div className="w-full md:w-64">
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="w-full px-3 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white transition-colors"
                aria-label="Filter by municipal office"
              >
                <option value="all">All Municipal Offices (18)</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name} ({office.acronym})
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {(["all", "G2C", "G2B", "G2G"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors whitespace-nowrap",
                    selectedType === type
                      ? "bg-burgundy-800 text-white"
                      : "bg-slate-100 text-gov-muted hover:bg-slate-200 hover:text-gov-charcoal"
                  )}
                >
                  {type === "all" ? "All Types" : type}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 3. Main Content: Empty State vs Published Entries */}
        <ScrollReveal delayMs={100}>
          {filteredEntries.length === 0 ? (
            <ServiceEmptyState
              icon={BookOpen}
              title="No Citizen's Charter entries are currently published on this website."
              description="Official Citizen's Charter information published by the Municipality of San Felipe will appear here."
              primaryAction={{
                label: "Explore Municipal Offices Directory",
                href: "/offices",
              }}
              secondaryAction={{
                label: "Emergency Hotlines",
                href: "/#emergency-hotlines",
              }}
              showContactHelp
            />
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const isExpanded = expandedEntryId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="bg-white border border-gray-200 rounded-xs shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                            {entry.transactionType}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-gold-50 text-gold-800 border border-gold-200">
                            {entry.classification}
                          </span>
                          {entry.officeName && (
                            <span className="text-[11px] font-semibold text-gov-muted">
                              {entry.officeName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gov-charcoal">
                          {entry.serviceName}
                        </h3>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-gov-muted transition-transform shrink-0 mt-1",
                          isExpanded && "rotate-180 text-burgundy-700"
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-gray-100 text-xs text-gov-charcoal space-y-6">
                        {/* Who May Avail */}
                        <div>
                          <h4 className="font-bold text-gov-charcoal uppercase tracking-wider text-[11px] mb-1.5">
                            Who May Avail:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gov-muted">
                            {entry.whoMayAvail.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Requirements */}
                        <div>
                          <h4 className="font-bold text-gov-charcoal uppercase tracking-wider text-[11px] mb-2">
                            Checklist of Requirements:
                          </h4>
                          <div className="border border-gray-200 rounded-xs overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-slate-600">
                                <tr>
                                  <th className="p-2.5">Document Requirement</th>
                                  <th className="p-2.5">Where to Secure</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {entry.requirements.map((req, i) => (
                                  <tr key={i}>
                                    <td className="p-2.5 font-medium">{req.document}</td>
                                    <td className="p-2.5 text-gov-muted">{req.whereToSecure}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Steps */}
                        <div>
                          <h4 className="font-bold text-gov-charcoal uppercase tracking-wider text-[11px] mb-2">
                            Procedure & Timeline:
                          </h4>
                          <div className="border border-gray-200 rounded-xs overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-slate-600">
                                <tr>
                                  <th className="p-2">#</th>
                                  <th className="p-2">Client Step</th>
                                  <th className="p-2">Agency Action</th>
                                  <th className="p-2">Fees</th>
                                  <th className="p-2">Time</th>
                                  <th className="p-2">Person</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-[11px]">
                                {entry.steps.map((st) => (
                                  <tr key={st.stepNumber}>
                                    <td className="p-2 font-bold text-burgundy-800">{st.stepNumber}</td>
                                    <td className="p-2">{st.clientAction}</td>
                                    <td className="p-2 text-gov-muted">{st.agencyAction}</td>
                                    <td className="p-2 font-mono">{st.fees}</td>
                                    <td className="p-2">{st.processingTime}</td>
                                    <td className="p-2 text-gov-muted">{st.responsiblePerson}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollReveal>
      </Container>
    </div>
  );
}
