"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  RefreshCw,
  FileCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ServiceEmptyState } from "@/components/services/service-empty-state";
import { BUSINESS_PERMIT_TRACKS, type BusinessPermitTrack } from "@/config/services-data";
import { cn } from "@/lib/utils";

export function BusinessPermitsView() {
  const [activeTrackId, setActiveTrackId] = React.useState<"new-business" | "renewal">("new-business");
  const activeTrack: BusinessPermitTrack =
    BUSINESS_PERMIT_TRACKS.find((t) => t.id === activeTrackId) ?? BUSINESS_PERMIT_TRACKS[0];

  return (
    <div className="py-10 sm:py-14 bg-slate-50/50">
      <Container>
        {/* 1. Track Switcher Navigation */}
        <ScrollReveal>
          <div className="flex border-b border-gray-200 mb-8 max-w-xl">
            <button
              type="button"
              onClick={() => setActiveTrackId("new-business")}
              className={cn(
                "flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700",
                activeTrackId === "new-business"
                  ? "border-burgundy-800 text-burgundy-900 bg-white rounded-t-xs"
                  : "border-transparent text-gov-muted hover:text-gov-charcoal hover:bg-white/50"
              )}
            >
              <Building2 className="w-4 h-4 text-burgundy-700" aria-hidden="true" />
              <span>New Business Application</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTrackId("renewal")}
              className={cn(
                "flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700",
                activeTrackId === "renewal"
                  ? "border-burgundy-800 text-burgundy-900 bg-white rounded-t-xs"
                  : "border-transparent text-gov-muted hover:text-gov-charcoal hover:bg-white/50"
              )}
            >
              <RefreshCw className="w-4 h-4 text-burgundy-700" aria-hidden="true" />
              <span>Business Permit Renewal</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Main Track Content (Restrained Pending State) */}
        <ScrollReveal delayMs={50}>
          {!activeTrack.isPublished ? (
            <div className="space-y-8">
              <ServiceEmptyState
                icon={FileCheck}
                title="Business permit information is pending publication."
                description="Official guidelines, requirements, and procedures published by the Municipality of San Felipe will appear here."
                primaryAction={{
                  label: "View Municipal Offices Directory",
                  href: "/offices",
                }}
                secondaryAction={{
                  label: "Go to Downloadable Forms",
                  href: "/services/downloadable-forms",
                }}
                showContactHelp
              />

              {/* 4. Architectural Relationship Notice: Canonical Forms Integration */}
              <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xs bg-burgundy-50 text-burgundy-700 shrink-0">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="text-xs text-gov-muted">
                    <h4 className="text-sm font-bold text-gov-charcoal mb-1">
                      Downloadable Forms Integration
                    </h4>
                    <p className="leading-relaxed mb-3">
                      All official business permit application forms and templates will be centrally cataloged in the{" "}
                      <strong>Downloadable Forms</strong> repository when published.
                    </p>
                    <Link
                      href="/services/downloadable-forms"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-800 hover:text-burgundy-900 group"
                    >
                      <span>Browse official municipal form templates</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs space-y-6">
              {/* Published Content Structure (Ready for CMS population) */}
              {activeTrack.requirements.length > 0 && (
                <div>
                  <h3 className="font-bold text-base text-gov-charcoal mb-2">Requirements</h3>
                  <ul className="list-disc list-inside text-sm text-gov-muted space-y-1">
                    {activeTrack.requirements.map((req, i) => (
                      <li key={i}>{req.item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTrack.procedure.length > 0 && (
                <div>
                  <h3 className="font-bold text-base text-gov-charcoal mb-2">Procedure</h3>
                  <ol className="list-decimal list-inside text-sm text-gov-muted space-y-2">
                    {activeTrack.procedure.map((step) => (
                      <li key={step.stepNumber}>
                        <strong>{step.title}:</strong> {step.description}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {activeTrack.feesNote && (
                <div>
                  <h3 className="font-bold text-base text-gov-charcoal mb-1">Fees &amp; Charges</h3>
                  <p className="text-sm text-gov-muted">{activeTrack.feesNote}</p>
                </div>
              )}

              {activeTrack.processingTimeNote && (
                <div>
                  <h3 className="font-bold text-base text-gov-charcoal mb-1">Processing Time</h3>
                  <p className="text-sm text-gov-muted">{activeTrack.processingTimeNote}</p>
                </div>
              )}
            </div>
          )}
        </ScrollReveal>
      </Container>
    </div>
  );
}
