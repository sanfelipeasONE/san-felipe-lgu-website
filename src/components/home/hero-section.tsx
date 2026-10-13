import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/config/assets";

interface HeroSectionProps {
  /** Optional custom hero background image path */
  imageSrc?: string;
}

export function HeroSection({
  imageSrc = ASSETS.hero.aerialBackdrop.src,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-burgundy-950 text-white min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex items-center border-b-4 border-gold-600">
      {/* 1. Real Aerial Drone Photograph of San Felipe */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src={imageSrc}
          alt="Aerial view of the Municipality of San Felipe, Zambales"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center animate-hero-zoom"
        />
      </div>

      {/* Layer 1: Vibrant Civic Red / Burgundy Gradient Overlay matching reference atmosphere */}
      <div
        className="absolute inset-0 z-1 bg-gradient-to-r from-[#4a0d16]/92 via-[#8B1E2D]/72 to-[#651521]/45 max-sm:bg-[#4a0d16]/92 pointer-events-none"
        aria-hidden="true"
      />

      {/* Layer 2: Dimensional Vignette & Bottom Shadow */}
      <div
        className="absolute inset-0 z-2 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none"
        aria-hidden="true"
      />

      {/* Hero Content Container */}
      <Container className="relative z-10 py-14 sm:py-16 lg:py-20">
        <div className="max-w-2xl space-y-5 sm:space-y-6">
          {/* Institutional Government Eyebrow with Crisp Gold Accent Line (0ms delay) */}
          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs font-medium tracking-[0.22em] uppercase text-[#FDE047] animate-hero-eyebrow">
            <span className="h-0.5 w-6 bg-[#FDE047] shrink-0 shadow-2xs" aria-hidden="true" />
            <span className="drop-shadow-2xs">Republic of the Philippines &bull; Province of Zambales</span>
          </div>

          {/* Formal Municipal Identity Hierarchy (80ms delay) */}
          <div className="space-y-0.5 sm:space-y-1 animate-hero-heading">
            <span className="block text-lg sm:text-xl lg:text-2xl font-normal sm:font-medium text-[#E2E8F0] tracking-tight">
              Municipality of
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#FFFFFF] tracking-tight leading-none drop-shadow-xs">
              San Felipe
            </h1>
            <span className="block text-xs sm:text-sm font-medium uppercase tracking-[0.3em] text-[#FACC15] pt-1.5">
              Zambales
            </span>
          </div>

          {/* Official Website Label (160ms delay) */}
          <div className="pt-0.5 animate-hero-subtitle">
            <p className="text-sm sm:text-base font-medium text-white/90">
              Official Website of the Municipality of San Felipe, Zambales
            </p>
          </div>

          {/* Restrained Actions with Inter Medium (240ms delay) */}
          <div className="flex flex-wrap items-center gap-3 pt-2 animate-hero-buttons">
            <Link href="#services">
              <Button
                size="md"
                className="bg-white text-burgundy-900 hover:bg-gold-50 hover:text-burgundy-950 font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xs transition-all shadow-xs border border-white"
              >
                <span>Government Services</span>
                <ArrowRight className="h-4 w-4 ml-1.5 text-burgundy-800" aria-hidden="true" />
              </Button>
            </Link>

            <Link href="/offices">
              <Button
                variant="outline"
                size="md"
                className="bg-burgundy-950/70 hover:bg-burgundy-900 border border-white/75 hover:border-white text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xs transition-all shadow-2xs backdrop-blur-xs"
              >
                <span>Municipal Offices</span>
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
