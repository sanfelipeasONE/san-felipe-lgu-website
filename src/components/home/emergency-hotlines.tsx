import * as React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { EMERGENCY_DATA, type EmergencyItem } from "@/config/homepage-data";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function EmergencyHotlines() {
  return (
    <section
      id="emergency-hotlines"
      className="bg-burgundy-900 text-white py-14 sm:py-18 border-y-4 border-gold-600 shadow-inner"
    >
      <Container>
        {/* Section Header with zero-delay scroll reveal (never delays content) */}
        <ScrollReveal delayMs={0}>
          <div className="mb-10 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 block mb-1.5">
              24/7 EMERGENCY & DISASTER RESPONSE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Emergency Hotlines
            </h2>
          </div>
        </ScrollReveal>

        {/* 4 Emergency Cards with 50ms stagger and 150ms hover/focus-visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {EMERGENCY_DATA.map((item: EmergencyItem, index: number) => (
            <ScrollReveal key={item.name} staggerIndex={index} className="h-full">
              <div
                className="bg-white text-gov-charcoal rounded-xs p-6 shadow-xs border-t-4 border-t-burgundy-700 flex flex-col justify-between h-full hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-gold-500/60 transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div>
                  {/* Agency Seal / Logo */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 bg-white shadow-2xs shrink-0">
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block leading-tight">
                        {item.office}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-[17px] font-extrabold text-gov-charcoal tracking-tight leading-snug">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Emergency Hotline:
                  </div>
                  {item.numbers.map((num, i) => (
                    <a
                      key={i}
                      href={`tel:${num.replace(/\D/g, "")}`}
                      className="font-mono text-base sm:text-[17px] font-black text-burgundy-900 hover:text-burgundy-700 focus-visible:outline-none focus-visible:text-burgundy-700 tracking-tight block hover:underline transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      aria-label={`Call ${item.name} at ${num}`}
                    >
                      {num}
                    </a>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
