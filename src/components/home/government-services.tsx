import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ServiceCard } from "@/components/home/service-card";
import { SERVICES_DATA } from "@/config/homepage-data";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function GovernmentServices() {
  return (
    <section id="services" className="py-14 sm:py-18 bg-white border-b border-gray-200">
      <Container>
        {/* Section Header with 400ms scroll reveal */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
                PUBLIC SERVICES & ASSISTANCE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-charcoal tracking-tight">
                Government Services
              </h2>
              <p className="mt-2 text-sm text-gov-muted max-w-3xl leading-relaxed">
                Quick access to essential municipal public services, documents, and frontline assistance for the residents, business owners, and visitors of San Felipe, Zambales.
              </p>
            </div>

            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-burgundy-700 hover:text-burgundy-900 focus-visible:outline-none focus-visible:underline transition-colors shrink-0 group"
            >
              <span>View All Government Services</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 group-focus-visible:translate-x-1 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
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
