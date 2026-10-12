import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { ASSETS } from "@/config/assets";

export function SiteHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
      <Container>
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Brand Identity / Official Seal */}
          <Link
            href="/"
            className="flex items-center space-x-3.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs p-1 shrink-0"
          >
            {/* Verified Municipal Seal Asset via centralized mapping */}
            <div className="relative w-13 h-13 shrink-0 rounded-full border border-gold-600/60 shadow-2xs overflow-hidden group-hover:scale-102 transition-transform bg-white">
              <Image
                src={ASSETS.branding.seal.src}
                alt={ASSETS.branding.seal.alt}
                width={52}
                height={52}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                REPUBLIC OF THE PHILIPPINES
              </span>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-burgundy-900 leading-tight">
                Municipality of San Felipe
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                PROVINCE OF ZAMBALES
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <DesktopNavigation />

          {/* Actions & Utilities */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Search Affordance */}
            <button
              type="button"
              aria-label="Search portal"
              className="p-2 text-slate-600 hover:text-burgundy-700 hover:bg-slate-100 rounded-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              title="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>


            {/* Mobile Hamburger Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </Container>
    </header>
  );
}
