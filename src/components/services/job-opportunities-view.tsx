"use client";

import * as React from "react";
import Image from "next/image";
import {
  Briefcase,
  Search,
  Calendar,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ServiceEmptyState } from "@/components/services/service-empty-state";
import { getCanonicalOffices } from "@/config/offices-data";
import type { JobOpportunity, EmploymentType } from "@/config/services-data";
import { cn } from "@/lib/utils";

export interface JobOpportunitiesViewProps {
  opportunities: JobOpportunity[];
}

const EMPLOYMENT_TYPES: Array<"all" | EmploymentType> = [
  "all",
  "Permanent",
  "Contractual",
  "Casual",
  "Co-Terminous",
];

export function JobOpportunitiesView({ opportunities }: JobOpportunitiesViewProps) {
  const offices = getCanonicalOffices();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<"all" | EmploymentType>("all");
  const [selectedOffice, setSelectedOffice] = React.useState("all");
  const [expandedJobId, setExpandedJobId] = React.useState<string | null>(null);

  const filteredJobs = React.useMemo(() => {
    return opportunities.filter((job) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        job.positionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.officeName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || job.employmentType === selectedType;
      const matchesOffice = selectedOffice === "all" || job.officeId === selectedOffice;
      return matchesSearch && matchesType && matchesOffice;
    });
  }, [opportunities, searchQuery, selectedType, selectedOffice]);

  return (
    <div className="py-10 sm:py-14 bg-slate-50/50">
      <Container>
        {/* Filter Toolbar */}
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
                  placeholder="Search vacancies by position title or office..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white transition-colors"
                  aria-label="Search job opportunities"
                />
              </div>

              {/* Office dropdown */}
              <div className="w-full sm:w-64">
                <select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white transition-colors"
                  aria-label="Filter vacancies by municipal office"
                >
                  <option value="all">All Municipal Offices</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Employment Type Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
              {EMPLOYMENT_TYPES.map((type) => (
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
                  {type === "all" ? "All Classifications" : type}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 3. Main Content: Empty State vs Vacancy Cards */}
        <ScrollReveal delayMs={100}>
          {filteredJobs.length === 0 ? (
            <ServiceEmptyState
              icon={Briefcase}
              title="There are currently no job opportunities published on this website."
              description="Official career opportunities and personnel notices published by the Municipality of San Felipe will appear here."
              primaryAction={{
                label: "Explore Municipal Offices Directory",
                href: "/offices",
              }}
              secondaryAction={{
                label: "About San Felipe LGU",
                href: "/about",
              }}
              showContactHelp
            />
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className="bg-white border border-gray-200 rounded-xs shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {job.employmentType && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                              {job.employmentType}
                            </span>
                          )}
                          {job.salaryGrade && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700">
                              SG {job.salaryGrade}
                            </span>
                          )}
                          {job.officeName && (
                            <span className="text-[11px] font-semibold text-gov-muted">
                              {job.officeName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gov-charcoal">
                          {job.positionTitle}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gov-muted pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gold-700" aria-hidden="true" />
                            Posted: {job.postingDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-burgundy-700" aria-hidden="true" />
                            Closing: {job.closingDate}
                          </span>
                        </div>
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
                      <div className="p-5 pt-0 border-t border-gray-100 text-xs text-gov-charcoal space-y-4">
                        {job.featuredImageUrl && (
                          <div className="relative aspect-video sm:aspect-21/9 w-full rounded-xs overflow-hidden border border-gray-200 shadow-2xs mt-4">
                            <Image
                              src={job.featuredImageUrl}
                              alt={job.featuredImageAlt || job.positionTitle}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 700px"
                            />
                          </div>
                        )}
                        {job.description && (
                          <div className="pt-2">
                            <span className="font-bold text-gov-charcoal uppercase block mb-1.5">
                              Job Overview / Detailed Duties
                            </span>
                            <div
                              className="prose prose-xs max-w-none text-gov-charcoal/90 leading-relaxed bg-slate-50 p-3.5 rounded-xs border border-gray-200/80"
                              dangerouslySetInnerHTML={{ __html: job.description }}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-slate-50 rounded-xs border border-gray-200/80">
                            <span className="font-bold text-gov-charcoal uppercase block mb-1">Education</span>
                            <span className="text-gov-muted">{job.educationRequirement ?? "None Required"}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xs border border-gray-200/80">
                            <span className="font-bold text-gov-charcoal uppercase block mb-1">Training</span>
                            <span className="text-gov-muted">{job.trainingRequirement ?? "None Required"}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xs border border-gray-200/80">
                            <span className="font-bold text-gov-charcoal uppercase block mb-1">Experience</span>
                            <span className="text-gov-muted">{job.experienceRequirement ?? "None Required"}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xs border border-gray-200/80">
                            <span className="font-bold text-gov-charcoal uppercase block mb-1">Eligibility</span>
                            <span className="text-gov-muted">{job.eligibilityRequirement ?? "None Required"}</span>
                          </div>
                        </div>

                        {job.competencyRequirements && job.competencyRequirements.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-xs border border-gray-200/80">
                            <span className="font-bold text-gov-charcoal uppercase block mb-1">Competencies</span>
                            <p className="text-gov-muted">{job.competencyRequirements.join(", ")}</p>
                          </div>
                        )}

                        {job.applicationInstructions && job.applicationInstructions.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-xs border border-gray-200/80">
                            <span className="font-bold text-gov-charcoal uppercase block mb-1">Application Instructions</span>
                            <p className="text-gov-muted">{job.applicationInstructions.join(" ")}</p>
                          </div>
                        )}

                        {job.officialAttachmentUrl && (
                          <div className="pt-2 flex items-center justify-end">
                            <a
                              href={job.officialAttachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-burgundy-800 hover:bg-burgundy-900 text-white rounded-xs text-xs font-semibold transition-colors shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Official Vacancy Bulletin (PDF)</span>
                            </a>
                          </div>
                        )}
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
