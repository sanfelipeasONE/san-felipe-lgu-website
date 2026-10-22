import * as React from "react";
import { Landmark, Shield } from "lucide-react";
import { Container } from "@/components/layout/container";
import {
  ExecutiveOfficialCard,
  CouncilorCard,
  ExOfficioCard,
} from "@/components/officials/official-card";
import { MUNICIPAL_OFFICIALS_DATA } from "@/config/officials-data";

export function OrganizationalTree() {
  const { executive, legislative } = MUNICIPAL_OFFICIALS_DATA;

  return (
    <section
      aria-label="Municipal Government Leadership Hierarchy"
      className="py-10 sm:py-14 bg-slate-50/50"
    >
      <Container>
        {/* ========================================================
            1. MAYOR (HON. ENGR. REINHARD "HART" E. JERESANO)
            ======================================================== */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xl">
            <ExecutiveOfficialCard official={executive.mayor} isMayor />
          </div>

          {/* Connector to Legislative Branch */}
          <div className="w-0.5 h-6 bg-rose-200/90" aria-hidden="true" />

          {/* Pill Badge: LEGISLATIVE BRANCH & PRESIDING OFFICER */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-2xs">
            <Landmark className="h-3 w-3 text-burgundy-700" aria-hidden="true" />
            <span>LEGISLATIVE BRANCH &amp; PRESIDING OFFICER</span>
          </div>

          {/* Connector to Vice Mayor */}
          <div className="w-0.5 h-6 bg-rose-200/90" aria-hidden="true" />
        </div>

        {/* ========================================================
            2. VICE MAYOR (HON. MARY ANN R. QUIBA)
            ======================================================== */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xl">
            <ExecutiveOfficialCard official={legislative.viceMayor} />
          </div>

          {/* Connector Down to Sangguniang Bayan */}
          <div className="w-0.5 h-8 bg-rose-200/90" aria-hidden="true" />
        </div>

        {/* ========================================================
            3. HORIZONTAL CONNECTOR & SANGGUNIANG BAYAN BADGE
            ======================================================== */}
        <div className="flex flex-col items-center mb-8">
          {/* Desktop Horizontal Line with 4 Branch Dots */}
          <div
            className="hidden lg:block relative w-full max-w-6xl mx-auto h-4"
            aria-hidden="true"
          >
            {/* Spanning Horizontal Bar */}
            <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-rose-200/90 -translate-y-1/2" />
            {/* 4 Red Dots positioned over each column */}
            <div className="absolute top-1/2 left-[12.5%] w-2.5 h-2.5 rounded-full bg-burgundy-800 border-2 border-white shadow-2xs -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-[37.5%] w-2.5 h-2.5 rounded-full bg-burgundy-800 border-2 border-white shadow-2xs -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-[62.5%] w-2.5 h-2.5 rounded-full bg-burgundy-800 border-2 border-white shadow-2xs -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-[87.5%] w-2.5 h-2.5 rounded-full bg-burgundy-800 border-2 border-white shadow-2xs -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Vertical Drop into Pill */}
          <div className="w-0.5 h-4 bg-rose-200/90" aria-hidden="true" />

          {/* Pill Badge: SANGGUNIANG BAYAN - MEMBERS */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-2xs">
            <Landmark className="h-3.5 w-3.5 text-burgundy-700" aria-hidden="true" />
            <span>SANGGUNIANG BAYAN - MEMBERS</span>
          </div>

          {/* Vertical Drop to Council Grid */}
          <div className="w-0.5 h-6 bg-rose-200/90" aria-hidden="true" />
        </div>

        {/* ========================================================
            4. 8 SANGGUNIANG BAYAN COUNCILORS (4x2 GRID)
            ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {legislative.regularMembers.map((member) => (
            <CouncilorCard key={member.id} official={member} />
          ))}
        </div>

        {/* ========================================================
            5. CONNECTOR & EX-OFFICIO MEMBERS SUBSECTION
            ======================================================== */}
        <div className="flex flex-col items-center mt-12 sm:mt-16 text-center">
          {/* Connector Line & Dot */}
          <div className="w-0.5 h-8 bg-rose-200/90" aria-hidden="true" />
          <div
            className="w-2.5 h-2.5 rounded-full bg-burgundy-800 border-2 border-white shadow-2xs mb-3"
            aria-hidden="true"
          />

          {/* Ex-Officio Pill */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100/90 border border-amber-300 text-amber-950 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Shield className="h-3.5 w-3.5 text-amber-800" aria-hidden="true" />
            <span>EX-OFFICIO MEMBERS OF THE SANGGUNIANG BAYAN</span>
          </div>

          {/* Neutral Institutional Subtitle per Section 4 (No legal citation) */}
          <p className="text-xs sm:text-[13px] text-slate-600 max-w-2xl mx-auto mt-2.5 mb-8 leading-relaxed">
            Sectoral representatives serving as ex-officio members of the Sangguniang Bayan.
          </p>

          {/* Ex-Officio Cards: Row 1 (LNB & SK Federation), Row 2 (IPMR centered) */}
          <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto">
            {/* Row 1: LNB President & SK Federation President */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {legislative.exOfficioMembers.slice(0, 2).map((exOfficio) => (
                <ExOfficioCard key={exOfficio.id} official={exOfficio} />
              ))}
            </div>

            {/* Row 2: IPMR centered below on desktop, stacked on mobile */}
            {legislative.exOfficioMembers[2] && (
              <div className="w-full md:w-[calc(50%-0.75rem)] md:mx-auto">
                <ExOfficioCard official={legislative.exOfficioMembers[2]} />
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
