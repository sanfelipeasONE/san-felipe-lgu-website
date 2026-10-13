import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { OFFICIALS_DATA } from "@/config/homepage-data";
import { ASSETS } from "@/config/assets";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function MunicipalOfficialsPreview() {
  const { mayor, viceMayor } = OFFICIALS_DATA;

  return (
    <section className="py-16 sm:py-20 bg-slate-50/80 border-b border-gray-200">
      <Container>
        {/* Centered Section Heading (pure fade-only, no vertical translation) */}
        <ScrollReveal variant="fade-only">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
              LEADERSHIP & SERVICE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-charcoal tracking-tight">
              Municipal Officials
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gov-muted leading-relaxed">
              Leading San Felipe with transparency, accountability, and dedicated public service for the welfare of every resident from every barangay.
            </p>
          </div>
        </ScrollReveal>

        {/* 2-Column Leadership Preview Grid with Equal Heights (pure fade-only, no tilt or parallax) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-stretch">
          {/* Mayor Card */}
          <ScrollReveal variant="fade-only" staggerIndex={0} className="h-full">
            <div className="bg-white border border-gray-200 rounded-xs p-6 sm:p-7 shadow-xs hover:border-burgundy-700/60 focus-within:border-burgundy-700/60 transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col sm:flex-row gap-6 justify-between h-full">
              {/* Verified Mayor Portrait from Centralized Assets */}
              <div className="shrink-0 flex flex-col items-center mx-auto sm:mx-0">
                <div className="relative w-36 h-48 sm:w-44 sm:h-56 rounded-xs border border-gold-600/60 shadow-xs overflow-hidden bg-white">
                  <Image
                    src={ASSETS.officials.mayor.src}
                    alt={ASSETS.officials.mayor.alt}
                    fill
                    sizes="(max-width: 640px) 144px, 176px"
                    className="object-contain object-center"
                    priority
                  />
                </div>
              </div>

              {/* Mayor Information & Message */}
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block">
                    {mayor.officeTitle}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-burgundy-900 tracking-tight leading-tight mt-1">
                    {mayor.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {mayor.subtitle}
                  </p>
                </div>

                {/* Quote bubble */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-xs p-4 relative text-xs sm:text-[13px] text-slate-700 leading-relaxed italic mt-2 shadow-2xs">
                  <Quote className="h-4 w-4 text-burgundy-700/20 absolute top-2 right-2" aria-hidden="true" />
                  &ldquo;{mayor.quote}&rdquo;
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Vice Mayor Card */}
          <ScrollReveal variant="fade-only" staggerIndex={1} className="h-full">
            <div className="bg-white border border-gray-200 rounded-xs p-6 sm:p-7 shadow-xs hover:border-burgundy-700/60 focus-within:border-burgundy-700/60 transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col sm:flex-row gap-6 justify-between h-full">
              {/* Verified Vice Mayor Portrait from Centralized Assets */}
              <div className="shrink-0 flex flex-col items-center mx-auto sm:mx-0">
                <div className="relative w-36 h-48 sm:w-44 sm:h-56 rounded-xs border border-gold-600/60 shadow-xs overflow-hidden bg-white">
                  <Image
                    src={ASSETS.officials.viceMayor.src}
                    alt={ASSETS.officials.viceMayor.alt}
                    fill
                    sizes="(max-width: 640px) 144px, 176px"
                    className="object-contain object-center"
                    priority
                  />
                </div>
              </div>

              {/* Vice Mayor Info */}
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block">
                    {viceMayor.officeTitle}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-burgundy-900 tracking-tight leading-tight mt-1">
                    {viceMayor.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {viceMayor.subtitle}
                  </p>
                  {viceMayor.committee && (
                    <span className="inline-block text-[10px] font-bold text-burgundy-800 bg-burgundy-50 border border-burgundy-200/80 px-2 py-0.5 rounded-xs mt-1">
                      {viceMayor.committee}
                    </span>
                  )}
                </div>

                {/* Quote bubble */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-xs p-4 relative text-xs sm:text-[13px] text-slate-700 leading-relaxed italic mt-2 shadow-2xs">
                  <Quote className="h-4 w-4 text-burgundy-700/20 absolute top-2 right-2" aria-hidden="true" />
                  &ldquo;{viceMayor.quote}&rdquo;
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Center CTA Button (fade-only) */}
        <ScrollReveal variant="fade-only" className="text-center">
          <Link href="/government" className="group inline-block">
            <Button
              variant="primary"
              size="lg"
              className="bg-burgundy-800 hover:bg-burgundy-900 text-white font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-xs shadow-xs"
            >
              <span>Meet All Municipal Officials & Councilors</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-focus-visible:translate-x-1 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Button>
          </Link>
        </ScrollReveal>
      </Container>
    </section>
  );
}
