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
    <main>
      <PageHeader
        eyebrow="24/7 EMERGENCY & DISASTER RESPONSE"
        title="Barangay Emergency Hotlines"
        description="Emergency response and community coordination directory for the 11 barangays of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Emergency Hotlines", href: "/#emergency-hotlines" },
          { label: "Barangays" },
        ]}
      />

      <section className="py-10 sm:py-14 bg-slate-50/70 min-h-[460px]">
        <Container>
          {/* Directory Count Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-2 border-b border-gray-200">
            <span>
              Showing{" "}
              <strong className="text-gov-charcoal font-bold">
                {AUTHORITATIVE_BARANGAY_COUNT}
              </strong>{" "}
              barangays
            </span>
          </div>

          {/* Directory Table */}
          <div className="bg-white border border-gray-300 rounded-xs shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-burgundy-900 text-white border-b-2 border-gold-500 divide-x divide-burgundy-800/80">
                    <th
                      scope="col"
                      className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-1/3 sm:w-[35%]"
                    >
                      Barangay
                    </th>
                    <th
                      scope="col"
                      className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-1/3 sm:w-[35%]"
                    >
                      Emergency Hotline
                    </th>
                    <th
                      scope="col"
                      className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-1/3 sm:w-[30%]"
                    >
                      Facebook Page
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {AUTHORITATIVE_BARANGAYS.map((brgy) => (
                    <tr
                      key={brgy.id}
                      className="odd:bg-white even:bg-slate-50/60 hover:bg-burgundy-50/30 transition-colors divide-x divide-gray-200"
                    >
                      {/* Column 1: Barangay Name */}
                      <td className="py-3.5 px-5 align-middle">
                        <span className="font-bold text-gov-charcoal text-xs sm:text-sm leading-snug">
                          {brgy.name}
                        </span>
                      </td>

                      {/* Column 2: Emergency Hotline */}
                      <td className="py-3.5 px-5 align-middle">
                        {brgy.isContactProvided && brgy.phone ? (
                          <a
                            href={`tel:${brgy.phone.replace(/\D/g, "")}`}
                            className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-burgundy-800 hover:text-burgundy-900 hover:underline"
                            aria-label={`Call Barangay ${brgy.name} at ${brgy.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
                            <span>{brgy.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 text-xs sm:text-sm font-medium">
                            Not yet provided
                          </span>
                        )}
                      </td>

                      {/* Column 3: Facebook Page */}
                      <td className="py-3.5 px-5 align-middle">
                        {brgy.facebook ? (
                          <a
                            href={brgy.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-burgundy-700 hover:text-burgundy-900 hover:underline"
                            aria-label={`Visit Barangay ${brgy.name} Facebook page`}
                          >
                            <span>Visit Facebook Page</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </main>
  );
}
