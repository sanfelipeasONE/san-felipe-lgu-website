import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { OFFICIALS_DATA } from "@/config/homepage-data";
import { ASSETS } from "@/config/assets";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function MunicipalOfficialsPreview() {
  const { mayor, viceMayor } = OFFICIALS_DATA;

  return (
    <section className="py-16 sm:py-20 bg-slate-50/70 border-b border-gray-200">
      <Container>
        {/* Section Header: Dignified Civic Editorial Presentation */}
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-burgundy-700 block mb-1.5 font-mono">
              MUNICIPAL LEADERSHIP
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-charcoal tracking-tight">
              Serving the Municipality of San Felipe
            </h2>
            <div className="w-12 h-0.5 bg-gold-500 mx-auto mt-3.5 mb-3" aria-hidden="true" />
            <p className="text-sm sm:text-base text-gov-muted leading-relaxed">
              Executive and legislative leadership dedicated to transparent governance, responsive public service, and the welfare of every resident across all 10 barangays.
            </p>
          </div>
        </ScrollReveal>

        {/* Cohesive Editorial Leadership Panel: Executive & Legislative Wings */}
        <ScrollReveal variant="fade-up" delayMs={100} className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200/90 rounded-xs shadow-2xs overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* 1. Office of the Municipal Mayor (Executive) */}
              <article className="p-7 sm:p-9 group flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 justify-center mx-auto w-fit max-w-full">
                  {/* Formal Photographic Frame */}
                  <Link
                    href="/government/officials#mayor"
                    className="shrink-0 focus-visible:outline-2 focus-visible:outline-burgundy-700 focus-visible:outline-offset-2 rounded-xs block"
                    aria-label="View official profile of Municipal Mayor Reinhard Jeresano"
                  >
                    <div className="relative w-36 h-48 sm:w-40 sm:h-52 rounded-xs border border-slate-200/90 bg-slate-50/70 p-1.5 shadow-2xs transition-colors duration-200 group-hover:border-burgundy-700/40">
                      <div className="relative w-full h-full overflow-hidden rounded-2xs bg-white">
                        <Image
                          src={ASSETS.officials.mayor.src}
                          alt={ASSETS.officials.mayor.alt}
                          fill
                          sizes="(max-width: 640px) 144px, 160px"
                          className="object-contain object-center transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transform-none"
                          priority
                        />
                      </div>
                    </div>
                  </Link>

                  {/* Official Details */}
                  <div className="text-center sm:text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block">
                      Municipal Mayor
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-gov-charcoal tracking-tight leading-snug mt-1">
                      <Link
                        href="/government/officials#mayor"
                        className="hover:text-burgundy-800 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-burgundy-700 focus-visible:outline-offset-2 rounded-xs"
                      >
                        {mayor.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Municipality of San Felipe, Zambales
                    </p>
                  </div>
                </div>
              </article>

              {/* 2. Office of the Sangguniang Bayan (Legislative) */}
              <article className="p-7 sm:p-9 group flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 justify-center mx-auto w-fit max-w-full">
                  {/* Formal Photographic Frame */}
                  <Link
                    href="/government/officials#vice-mayor"
                    className="shrink-0 focus-visible:outline-2 focus-visible:outline-burgundy-700 focus-visible:outline-offset-2 rounded-xs block"
                    aria-label="View official profile of Municipal Vice Mayor Mary Ann Quiba"
                  >
                    <div className="relative w-36 h-48 sm:w-40 sm:h-52 rounded-xs border border-slate-200/90 bg-slate-50/70 p-1.5 shadow-2xs transition-colors duration-200 group-hover:border-burgundy-700/40">
                      <div className="relative w-full h-full overflow-hidden rounded-2xs bg-white">
                        <Image
                          src={ASSETS.officials.viceMayor.src}
                          alt={ASSETS.officials.viceMayor.alt}
                          fill
                          sizes="(max-width: 640px) 144px, 160px"
                          className="object-contain object-center transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transform-none"
                          priority
                        />
                      </div>
                    </div>
                  </Link>

                  {/* Official Details */}
                  <div className="text-center sm:text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block">
                      Municipal Vice Mayor &amp; SB Presiding Officer
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-gov-charcoal tracking-tight leading-snug mt-1">
                      <Link
                        href="/government/officials#vice-mayor"
                        className="hover:text-burgundy-800 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-burgundy-700 focus-visible:outline-offset-2 rounded-xs"
                      >
                        HON. MARY ANN R. QUIBA
                      </Link>
                    </h3>
                    {viceMayor.committee && (
                      <p className="text-[11px] text-slate-600 font-medium mt-1">
                        {viceMayor.committee}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </ScrollReveal>

        {/* Civic CTA: Full Officials Directory Link */}
        <ScrollReveal variant="fade-up" delayMs={200} className="text-center mt-10">
          <Link href="/government/officials" className="inline-block">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-gov-charcoal hover:border-burgundy-700 hover:text-burgundy-800 font-bold text-xs uppercase tracking-wider px-6 py-2.5 shadow-2xs"
            >
              <span>Meet All Municipal Officials &amp; Sangguniang Bayan Members</span>
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Button>
          </Link>
        </ScrollReveal>
      </Container>
    </section>
  );
}
