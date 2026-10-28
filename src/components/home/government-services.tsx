import * as React from "react";
import { Container } from "@/components/layout/container";
import { ServiceCard } from "@/components/home/service-card";
import { SERVICES_DATA } from "@/config/homepage-data";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function GovernmentServices() {
  return (
    <section id="services" className="pt-8 sm:pt-10 pb-14 sm:pb-16 bg-white border-b border-gray-200/80">
      <Container>
        {/* Section Header with 400ms scroll reveal */}
        <ScrollReveal>
          <div className="mb-8 max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
              PUBLIC SERVICES & ASSISTANCE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-charcoal tracking-tight">
              Municipal Services
            </h2>
            <p className="mt-2 text-sm text-gov-muted leading-relaxed">
              Quick access to essential municipal public services, documents, and frontline assistance for the residents, business owners, and visitors of San Felipe, Zambales.
            </p>
          </div>
        </ScrollReveal>

        {/* Services Grid (4 in top row, 5th in second row) staggered 50ms apart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES_DATA.map((service, index) => (
            <ScrollReveal key={service.id} staggerIndex={index} className="h-full">
              <ServiceCard service={service} />
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
