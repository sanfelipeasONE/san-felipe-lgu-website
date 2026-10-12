import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Navigation,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MUNICIPAL_CONTACT_DATA } from "@/config/homepage-data";

export function MunicipalContactSection() {
  return (
    <section className="py-14 sm:py-18 bg-white border-b border-gray-200">
      <Container>
        {/* Section Header */}
        <div className="mb-10 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
            VISIT SAN FELIPE
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-charcoal tracking-tight">
            Visit the Municipal Government
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gov-muted leading-relaxed">
            We welcome all residents and visitors to the Municipal Hall of San Felipe, Zambales. Here is how to find and reach us.
          </p>
        </div>

        {/* 2-Column Contact & Map Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Contact Details Panel (5 cols) */}
          <div className="lg:col-span-5 bg-gov-surface border border-gray-200/90 rounded-xs p-6 sm:p-7 shadow-2xs flex flex-col justify-between h-full">
            <div>
              <div className="border-b border-gray-200/90 pb-4 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block">
                  Municipal Government Center
                </span>
                <h3 className="text-xl font-black text-gov-charcoal tracking-tight mt-0.5">
                  {MUNICIPAL_CONTACT_DATA.hallName}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {MUNICIPAL_CONTACT_DATA.hallSubtitle}
                </p>
              </div>

              {/* Contact Information List */}
              <ul className="space-y-4 text-xs sm:text-[13px] text-gov-charcoal">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xs bg-white border border-gray-200 flex items-center justify-center text-burgundy-700 shrink-0 mt-0.5 shadow-2xs">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Physical Location:
                    </strong>
                    <span className="text-gov-charcoal leading-snug">
                      {MUNICIPAL_CONTACT_DATA.address}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xs bg-white border border-gray-200 flex items-center justify-center text-burgundy-700 shrink-0 mt-0.5 shadow-2xs">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Office Hours:
                    </strong>
                    <span className="text-gov-charcoal leading-snug">
                      {MUNICIPAL_CONTACT_DATA.hours}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xs bg-white border border-gray-200 flex items-center justify-center text-burgundy-700 shrink-0 mt-0.5 shadow-2xs">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Trunkline:
                    </strong>
                    <span className="text-gov-charcoal leading-snug font-mono">
                      {MUNICIPAL_CONTACT_DATA.phone}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xs bg-white border border-gray-200 flex items-center justify-center text-burgundy-700 shrink-0 mt-0.5 shadow-2xs">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Official Inquiries:
                    </strong>
                    <span className="text-gov-charcoal leading-snug">
                      {MUNICIPAL_CONTACT_DATA.email}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xs bg-white border border-gray-200 flex items-center justify-center text-burgundy-700 shrink-0 mt-0.5 shadow-2xs">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Official Facebook:
                    </strong>
                    <span className="text-gov-charcoal leading-snug">
                      {MUNICIPAL_CONTACT_DATA.facebook}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200 flex flex-wrap gap-3">
              <Link href="/contact">
                <Button variant="primary" size="sm" className="font-bold text-xs uppercase tracking-wider bg-burgundy-800 hover:bg-burgundy-900">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  <span>Send a Message</span>
                </Button>
              </Link>
              <Link href="#municipal-map">
                <Button variant="outline" size="sm" className="font-bold text-xs uppercase tracking-wider border-gray-300 hover:border-burgundy-700 hover:text-burgundy-800">
                  <Navigation className="h-3.5 w-3.5 mr-1.5 text-burgundy-700" />
                  <span>Get Directions</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Styled Map Representation (7 cols) */}
          <div id="municipal-map" className="lg:col-span-7 flex flex-col justify-between h-full">
            <div className="bg-slate-100 border border-gray-200 rounded-xs overflow-hidden shadow-2xs relative h-84 sm:h-96 flex flex-col justify-between p-4">
              {/* Map Illustration Background */}
              <div className="absolute inset-0 bg-emerald-50/40" />

              {/* Coastline / West Philippine Sea Representation */}
              <div
                className="absolute inset-y-0 left-0 w-1/4 bg-blue-100/70 border-r border-blue-200 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest -rotate-90">
                  West Philippine Sea
                </span>
              </div>

              {/* National Highway Path Representation */}
              <div
                className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-amber-200/90 border-x border-amber-400/80 flex items-center justify-center"
                aria-hidden="true"
              >
                <div className="w-0.5 h-full border-r border-dashed border-amber-600/70" />
              </div>

              {/* Highway Label */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 border border-amber-400 px-2.5 py-0.5 rounded-xs text-[9px] font-bold text-amber-900 uppercase tracking-wider shadow-2xs">
                Olongapo - Bugallon National Highway
              </div>

              {/* Map Marker Pin Callout */}
              <div className="relative z-10 m-auto flex flex-col items-center">
                <div className="bg-white border-2 border-burgundy-700 px-3.5 py-2 rounded-xs shadow-md text-center max-w-xs animate-bounce">
                  <div className="flex items-center justify-center gap-1.5 text-burgundy-900 font-bold text-xs">
                    <MapPin className="h-4 w-4 text-burgundy-700 fill-burgundy-700" />
                    <span>San Felipe Municipal Hall</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Poblacion, San Felipe, Zambales
                  </span>
                </div>
                <div className="w-3 h-3 bg-burgundy-700 rotate-45 -mt-1.5" />
              </div>

              {/* Map Controls Watermark */}
              <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-600 bg-white/90 backdrop-blur-xs p-2 rounded-xs border border-gray-200 shadow-2xs">
                <span>San Felipe Geographic Gateway Map Preview</span>
                <span className="font-bold text-burgundy-800">Province of Zambales</span>
              </div>
            </div>

            {/* Travel / Accessibility Advisory Note */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-gray-200 rounded-xs flex items-start gap-2.5 text-xs text-gov-muted leading-relaxed">
              <AlertCircle className="h-4 w-4 text-burgundy-700 shrink-0 mt-0.5" />
              <span>{MUNICIPAL_CONTACT_DATA.mapAdvisory}</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
