import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/config/assets";

interface HeroSectionProps {
  /** Optional custom hero background image path */
  imageSrc?: string;
  imageAlt?: string;
}

export function HeroSection({
  imageSrc = ASSETS.hero.vectorPanorama.src,
  imageAlt = ASSETS.hero.vectorPanorama.alt,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-burgundy-950 text-white border-b-4 border-gold-600">
      {/* 1. Desktop & Tablet Panoramic Backdrop (640px and above) */}
      <div className="hidden sm:block absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 100vw, 100vw"
          className="object-cover object-[75%_center] lg:object-center"
        />
      </div>

      {/* Single Smooth Left-to-Right Burgundy Gradient Overlay */}
      {/* Dark on left for text legibility, fading across center for artwork visibility, transparent on right for vibrant Municipal Hall & greenery */}
      <div
        className="hidden sm:block absolute inset-0 z-1 pointer-events-none bg-gradient-to-r from-burgundy-950/95 from-15% via-burgundy-950/45 via-48% to-transparent to-75%"
        aria-hidden="true"
      />

      {/* Hero Content Container */}
      <Container className="relative z-10 pt-10 pb-8 sm:py-16 lg:py-20 min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col justify-center">
        <div className="max-w-xl space-y-4 sm:space-y-5">
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
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#FFFFFF] tracking-tight leading-none drop-shadow-xs">
              San Felipe
            </h1>
            <span className="block text-xs sm:text-sm font-medium uppercase tracking-[0.3em] text-[#FACC15] pt-1 sm:pt-1.5">
              Zambales
            </span>
          </div>

          {/* Official Website Label (160ms delay) */}
          <div className="pt-0.5 animate-hero-subtitle">
            <p className="text-xs sm:text-base font-medium text-white/90">
              Official Website of the Municipality of San Felipe, Zambales
            </p>
          </div>

          {/* Action Call-to-Actions (240ms delay) */}
          <div className="space-y-2.5 pt-1 sm:pt-2 animate-hero-buttons">
            {/* Primary Action Row: Municipal Services & Municipal Offices */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="#services">
                <Button
                  size="md"
                  className="bg-white text-burgundy-900 hover:bg-gold-50 hover:text-burgundy-950 font-medium text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xs transition-all shadow-xs border border-white"
                >
                  <span>Municipal Services</span>
                  <ArrowRight className="h-4 w-4 ml-1.5 text-burgundy-800" aria-hidden="true" />
                </Button>
              </Link>

              <Link href="/offices">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-burgundy-950/70 hover:bg-burgundy-900 border border-white/75 hover:border-white text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xs transition-all shadow-2xs backdrop-blur-xs"
                >
                  <span>Municipal Offices</span>
                </Button>
              </Link>
            </div>

            {/* Secondary Action: Canonical News & Updates Link positioned directly below */}
            <div className="flex items-center">
              <Link href="/news">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-burgundy-950/60 hover:bg-burgundy-900/90 border border-gold-500/60 hover:border-gold-400 text-gold-100 hover:text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xs transition-all shadow-2xs backdrop-blur-xs focus-visible:ring-gold-400"
                >
                  <Newspaper className="h-4 w-4 mr-2 text-gold-400 shrink-0" aria-hidden="true" />
                  <span>News &amp; Updates</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Dedicated Mobile Artwork Presentation (visible below 640px) */}
        <div className="sm:hidden mt-8 w-full">
          <div className="relative w-full aspect-[2.71/1] overflow-hidden rounded-xs border border-gold-500/30 shadow-md">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover object-center"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
