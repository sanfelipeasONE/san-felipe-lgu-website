import * as React from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Container } from "@/components/layout/container";
import { OfficeCard } from "@/components/home/office-card";
import { OFFICES_DATA } from "@/config/homepage-data";
import { Button } from "@/components/ui/button";

export function MunicipalOfficesPreview() {
  return (
    <section className="py-14 sm:py-18 bg-white border-b border-gray-200">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
              DEPARTMENTS & FRONTLINE OFFICES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-charcoal tracking-tight">
              Our Municipal Offices
            </h2>
            <p className="mt-2 text-sm text-gov-muted max-w-3xl leading-relaxed">
              Discover the functions and services of our municipal departments, dedicated to serving the needs of the people of San Felipe.
            </p>
          </div>

          <Link href="/offices">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gov-charcoal hover:border-burgundy-700 hover:text-burgundy-700"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              <span>View All Offices</span>
            </Button>
          </Link>
        </div>

        {/* 3x3 Grid of 9 Municipal Offices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {OFFICES_DATA.map((office) => (
            <OfficeCard key={office.name} office={office} />
          ))}
        </div>
      </Container>
    </section>
  );
}
