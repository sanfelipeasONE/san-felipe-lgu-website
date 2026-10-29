import * as React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { AUTHORITATIVE_BARANGAYS, AUTHORITATIVE_BARANGAY_COUNT } from "@/config/barangays-data";
import { Info, ExternalLink, Phone } from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "Barangay Emergency Hotlines | Municipality of San Felipe",
  description:
    "Authoritative emergency contact directory and official communications channels for the 11 barangays of the Municipality of San Felipe, Zambales.",
};

export default function BarangayEmergencyHotlinesPage() {
  return (
    <>
      <PageHeader
        eyebrow="EMERGENCY & DISASTER RESPONSE"
        title="Barangay Emergency Hotlines"
        description="Emergency response and community coordination directory for the 11 barangays of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Emergency Hotlines", href: "/#emergency-hotlines" },
          { label: "Barangays" },
        ]}
        className="pt-6 pb-6 sm:pt-8 sm:pb-8"
      />

      <section className="pt-6 pb-12 sm:pt-8 sm:pb-16 bg-slate-50/50">
        <Container>
          {/* Restrained Directory Summary Header */}
          <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-3 border-b border-gray-200">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gov-charcoal tracking-tight">
                Barangay Directory
              </h2>
              <span className="text-xs font-normal text-slate-500">
                ({AUTHORITATIVE_BARANGAY_COUNT} barangays)
              </span>
            </div>
            <p className="text-xs text-gov-muted">
              Emergency contact numbers and official Facebook channels for the barangays of San Felipe.
            </p>
          </div>

          {/* Unified Modern Directory Surface (Row-and-Column) */}
          <div className="bg-white border border-gray-200 rounded-xs shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group bg-burgundy-900 text-white border-b-2 border-gold-500">
                <tr>
                  <th
                    scope="col"
                    className="py-2.5 px-5 sm:px-6 text-[11px] font-semibold uppercase tracking-wider text-white w-[30%]"
                  >
                    Barangay
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 px-5 sm:px-6 text-[11px] font-semibold uppercase tracking-wider text-white w-[35%]"
                  >
                    Emergency Hotline
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 px-5 sm:px-6 text-[11px] font-semibold uppercase tracking-wider text-white w-[35%]"
                  >
                    Official Facebook
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 md:divide-gray-100">
                {AUTHORITATIVE_BARANGAYS.map((brgy) => {
                  const rawDigits = brgy.phone ? brgy.phone.replace(/\D/g, "") : "";
                  const telHref = rawDigits ? `tel:${rawDigits}` : undefined;

                  return (
                    <tr
                      key={brgy.id}
                      className="block md:table-row p-4 md:p-0 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Column 1: Barangay Name */}
                      <td className="block md:table-cell py-1.5 md:py-3 px-0 md:px-6 align-middle">
                        <span className="font-medium text-gov-charcoal text-sm sm:text-base leading-snug">
                          {brgy.name}
                        </span>
                      </td>

                      {/* Column 2: Emergency Hotline */}
                      <td className="block md:table-cell py-1.5 md:py-3 px-0 md:px-6 align-middle">
                        <span className="md:hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                          Emergency Hotline
                        </span>
                        {brgy.isContactProvided && brgy.phone && telHref ? (
                          <a
                            href={telHref}
                            className="inline-flex items-center gap-1.5 font-mono text-sm sm:text-[15px] font-medium text-burgundy-800 hover:text-burgundy-950 hover:underline tracking-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-burgundy-700 rounded-2xs"
                            aria-label={`Call Barangay ${brgy.name} at ${brgy.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
                            <span>{brgy.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">
                            Not yet provided
                          </span>
                        )}
                      </td>

                      {/* Column 3: Official Facebook */}
                      <td className="block md:table-cell py-1.5 md:py-3 px-0 md:px-6 align-middle">
                        {brgy.facebook ? (
                          <a
                            href={brgy.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-normal text-slate-600 hover:text-burgundy-800 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-burgundy-700 rounded-2xs"
                            aria-label={`Visit Barangay ${brgy.name} Facebook Page`}
                          >
                            <span>Facebook Page</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">Not available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Directory Notes Card */}
          <div className="mt-8 bg-white border border-gray-200 rounded-xs p-4 sm:p-5 text-xs text-slate-600 leading-relaxed shadow-2xs">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-burgundy-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <strong className="font-bold text-gov-charcoal block">
                  Official Barangay Directory Note
                </strong>
                <p className="text-slate-500">
                  This directory reflects the 11 verified barangays of the Municipality of San Felipe, Zambales. Official barangay emergency hotlines and verified social media links are published for public safety and community coordination.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
