import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function GovernmentPrograms() {
  return (
    <section
      id="programs-services"
      className="py-12 sm:py-16 bg-slate-50/60 border-y border-gray-200 scroll-mt-28"
    >
      <Container>
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-charcoal tracking-tight">
              Government Programs &amp; Online Services
            </h2>
            <div className="h-0.5 w-12 bg-burgundy-700 mx-auto mt-2.5 mb-3" />
            <p className="text-sm text-gov-muted leading-relaxed">
              Quick access to government programs and online services.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Program Directory Items (Balanced 4-column desktop, 2x2 tablet, stacked mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* 1. iBPLS */}
          <ScrollReveal staggerIndex={0}>
            <a
              href="https://bpbc.ibpls.com/sanfelipezambales/login"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open San Felipe iBPLS Business Permit Portal"
              title="Open San Felipe iBPLS Business Permit Portal"
              className="group flex flex-col items-center text-center p-6 sm:p-7 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 h-full"
            >
              <div className="h-24 sm:h-28 flex items-center justify-center mb-4">
                <div className="relative w-48 sm:w-56 h-14 sm:h-16">
                  <Image
                    src="/images/ibpls-500x117.png"
                    alt="Integrated Business Permits and Licensing System (iBPLS)"
                    fill
                    sizes="(max-width: 640px) 192px, 224px"
                    className="object-contain group-hover:scale-105 transition-transform duration-150"
                  />
                </div>
              </div>
              <h3 className="inline-flex items-center gap-1.5 text-base font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                <span>iBPLS</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-burgundy-700" aria-hidden="true" />
              </h3>
              <p className="text-xs text-gov-muted mt-1">
                Business Permits &amp; Licensing
              </p>
            </a>
          </ScrollReveal>

          {/* 2. Freedom of Information (FOI) */}
          <ScrollReveal staggerIndex={1}>
            <a
              href="https://www.foi.gov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Freedom of Information Philippines"
              title="Open Freedom of Information Philippines"
              className="group flex flex-col items-center text-center p-6 sm:p-7 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 h-full"
            >
              <div className="h-24 sm:h-28 flex items-center justify-center mb-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <Image
                    src="/images/foi-logo-160x160.png"
                    alt="Freedom of Information Philippines (FOI)"
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-contain group-hover:scale-105 transition-transform duration-150"
                  />
                </div>
              </div>
              <h3 className="inline-flex items-center gap-1.5 text-base font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                <span>Freedom of Information</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-burgundy-700" aria-hidden="true" />
              </h3>
              <p className="text-xs text-gov-muted mt-1">
                FOI Philippines
              </p>
            </a>
          </ScrollReveal>

          {/* 3. Gender and Development (GAD) */}
          <ScrollReveal staggerIndex={2}>
            <Link
              href="/gad"
              aria-label="Open Gender and Development (GAD) Corner"
              title="Open Gender and Development (GAD) Corner"
              className="group flex flex-col items-center text-center p-6 sm:p-7 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 h-full"
            >
              <div className="h-24 sm:h-28 flex items-center justify-center mb-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <Image
                    src="/images/gad-logo.png"
                    alt="Gender and Development (GAD) Official Seal"
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-contain group-hover:scale-105 transition-transform duration-150"
                  />
                </div>
              </div>
              <h3 className="text-base font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                GAD Corner
              </h3>
              <p className="text-xs text-gov-muted mt-1">
                News &amp; Resources
              </p>
            </Link>
          </ScrollReveal>

          {/* 4. Transparency Seal */}
          <ScrollReveal staggerIndex={3}>
            <Link
              href="/transparency"
              aria-label="Open Transparency Seal and Municipal Disclosures"
              title="Open Transparency Seal and Municipal Disclosures"
              className="group flex flex-col items-center text-center p-6 sm:p-7 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 h-full"
            >
              <div className="h-24 sm:h-28 flex items-center justify-center mb-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <Image
                    src="/images/transparency-seal.png"
                    alt="Philippine Transparency Seal"
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-contain group-hover:scale-105 transition-transform duration-150"
                  />
                </div>
              </div>
              <h3 className="text-base font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                Transparency Seal
              </h3>
              <p className="text-xs text-gov-muted mt-1">
                Procurement &amp; BAC
              </p>
            </Link>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
