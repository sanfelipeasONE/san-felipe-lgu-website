import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, FileCheck, Banknote, Landmark, FileText, Scale } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { TRANSPARENCY_DATA } from "@/config/homepage-data";
import { cn } from "@/lib/utils";
import {
  CARD_INTERACTIVE_CLASSES,
  CARD_ARROW_SHIFT_CLASSES,
} from "@/lib/card-styles";

const transparencyIcons = [
  ShieldCheck,
  Banknote,
  Landmark,
  FileCheck,
  FileText,
  Scale,
];

export function TransparencySection() {
  return (
    <section className="py-14 sm:py-18 bg-white border-b border-gray-200">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
              PUBLIC ACCOUNTABILITY & COMPLIANCE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-charcoal tracking-tight">
              Transparency & Good Governance
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gov-muted max-w-3xl leading-relaxed">
              Access municipal records, financial reports, procurement information, and other government documents in compliance with national transparency standards.
            </p>
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-gray-300 text-gray-400 font-bold cursor-not-allowed"
            >
              <span>Transparency Portal (Pending CMS)</span>
            </Button>
          </div>
        </div>

        {/* 6-Card Transparency Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {TRANSPARENCY_DATA.map((item, index) => {
            const Icon = transparencyIcons[index] || ShieldCheck;
            return (
              <div
                key={item.code}
                className={cn(
                  "bg-gov-surface border border-gray-200/90 rounded-xs p-5 sm:p-6 shadow-2xs hover:bg-white flex flex-col justify-between h-full group",
                  CARD_INTERACTIVE_CLASSES
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xs bg-white border border-gray-200 flex items-center justify-center text-burgundy-700 group-hover:bg-burgundy-800 group-hover:text-white transition-colors duration-200">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-gray-100 text-slate-700 px-2 py-0.5 rounded-xs border border-gray-200">
                      {item.code}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gov-charcoal tracking-tight leading-snug mb-2 group-hover:text-burgundy-800 group-focus-within:text-burgundy-800 transition-colors duration-200">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-gov-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-200/80">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-700 hover:text-burgundy-900 focus-visible:outline-none focus-visible:underline transition-colors duration-200 group"
                  >
                    <span>Inspect Records</span>
                    <ArrowRight className={cn("h-3.5 w-3.5", CARD_ARROW_SHIFT_CLASSES)} />
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
