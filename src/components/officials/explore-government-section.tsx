import * as React from "react";
import Link from "next/link";
import { Building2, Landmark, Scale, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import {
  CARD_INTERACTIVE_CLASSES,
  CARD_ARROW_SHIFT_CLASSES,
} from "@/lib/card-styles";

export function ExploreGovernmentSection() {
  const governmentLinks = [
    {
      title: "Municipal Offices",
      description:
        "Frontline departments, regulatory units, and municipal administrative services.",
      href: "/offices",
      icon: Building2,
      actionText: "Browse All Offices",
    },
    {
      title: "About San Felipe",
      description:
        "History, vision, mission, and institutional direction of the municipality.",
      href: "/about",
      icon: Landmark,
      actionText: "Learn About San Felipe",
    },
    {
      title: "Citizen Services",
      description:
        "Frontline public services, downloadable forms, business permits, and Citizen's Charter.",
      href: "/services/citizens-charter",
      icon: Scale,
      actionText: "Explore Services",
    },
  ];

  return (
    <section
      aria-label="Explore Municipal Government"
      className="py-12 sm:py-14 bg-white border-b border-gray-200"
    >
      <Container>
        <div className="max-w-2xl mb-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
            MUNICIPAL DIRECTORY & SERVICES
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gov-charcoal tracking-tight">
            Explore Your Municipal Government
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-gov-muted leading-relaxed">
            Discover the executive departments, public service desks, and legislative bodies working for San Felipe, Zambales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {governmentLinks.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "bg-slate-50/60 border border-gray-200 rounded-xs p-5 shadow-2xs flex flex-col justify-between group",
                  CARD_INTERACTIVE_CLASSES
                )}
              >
                <div>
                  <div className="w-10 h-10 rounded-xs bg-burgundy-50 border border-burgundy-200/80 text-burgundy-800 flex items-center justify-center mb-4 shadow-2xs">
                    <IconComponent className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-burgundy-900 mb-1.5 group-hover:text-burgundy-700 group-focus-within:text-burgundy-700 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200/80">
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-xs font-bold text-burgundy-700 hover:text-burgundy-900 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs transition-colors duration-200"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight
                      className={cn("h-3.5 w-3.5 ml-1", CARD_ARROW_SHIFT_CLASSES)}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
