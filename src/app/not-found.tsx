import * as React from "react";
import Link from "next/link";
import { Home, Building2, PhoneCall, ArrowRight, SearchX } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Municipal Header & Navigation */}
      <SiteHeader />

      {/* 404 Main Landmark */}
      <main id="main-content" className="flex-1 py-16 sm:py-24 bg-slate-50/60 border-b border-gray-200">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            {/* Visual Civic Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-burgundy-50 border border-burgundy-200/80 text-burgundy-800 flex items-center justify-center mx-auto mb-6 shadow-2xs">
              <SearchX className="h-8 w-8" aria-hidden="true" />
            </div>

            {/* Official Status Eyebrow */}
            <span className="text-xs font-bold uppercase tracking-wider text-burgundy-700 block mb-2">
              404 &bull; Page Not Found
            </span>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-charcoal tracking-tight mb-4">
              The requested municipal page could not be located.
            </h1>

            {/* Institutional Body Description */}
            <p className="text-sm sm:text-base text-gov-muted leading-relaxed mb-8">
              The page, document, or link you are seeking may have been updated, relocated, or is temporarily unavailable on the official digital portal of the Municipality of San Felipe, Zambales.
            </p>

            {/* Civic Action Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
              <Link
                href="/"
                className="p-4 bg-white border border-gray-200 rounded-xs shadow-2xs hover:border-burgundy-700 hover:shadow-xs transition-all group flex flex-col justify-between"
              >
                <div>
                  <Home className="h-5 w-5 text-burgundy-700 mb-2" aria-hidden="true" />
                  <h2 className="text-xs font-bold text-gov-charcoal group-hover:text-burgundy-700 transition-colors">
                    Home Portal
                  </h2>
                  <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                    Return to the San Felipe official portal home.
                  </p>
                </div>
                <div className="mt-3 flex items-center text-[11px] font-bold text-burgundy-700">
                  <span>Visit Home</span>
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/offices"
                className="p-4 bg-white border border-gray-200 rounded-xs shadow-2xs hover:border-burgundy-700 hover:shadow-xs transition-all group flex flex-col justify-between"
              >
                <div>
                  <Building2 className="h-5 w-5 text-burgundy-700 mb-2" aria-hidden="true" />
                  <h2 className="text-xs font-bold text-gov-charcoal group-hover:text-burgundy-700 transition-colors">
                    Municipal Offices
                  </h2>
                  <p className="text-[11px] text-gov-muted mt-1 leading-snug">
                    Directory of 18 municipal departments &amp; desks.
                  </p>
                </div>
                <div className="mt-3 flex items-center text-[11px] font-bold text-burgundy-700">
                  <span>View Directory</span>
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/#emergency-hotlines"
                className="p-4 bg-burgundy-900 border border-burgundy-950 text-white rounded-xs shadow-2xs hover:bg-burgundy-950 transition-all group flex flex-col justify-between"
              >
                <div>
                  <PhoneCall className="h-5 w-5 text-gold-400 mb-2" aria-hidden="true" />
                  <h2 className="text-xs font-bold text-white group-hover:text-gold-300 transition-colors">
                    Emergency Hotlines
                  </h2>
                  <p className="text-[11px] text-white/80 mt-1 leading-snug">
                    24/7 disaster, medical, police, &amp; fire contacts.
                  </p>
                </div>
                <div className="mt-3 flex items-center text-[11px] font-bold text-gold-400">
                  <span>Emergency Directory</span>
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>

            {/* Direct Return Button */}
            <div>
              <Link href="/">
                <Button variant="primary" size="md" className="font-bold text-xs uppercase tracking-wider">
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      {/* Civic Footer */}
      <SiteFooter />
    </div>
  );
}
