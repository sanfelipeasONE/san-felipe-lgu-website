import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Navigation,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MUNICIPAL_CONTACT_DATA } from "@/config/homepage-data";
import { getDirectionsUrl } from "@/config/location";
import { MunicipalMap } from "@/components/home/municipal-map";

export function MunicipalContactSection() {
  return (
    <section id="contact-us" className="scroll-mt-20 py-14 sm:py-18 bg-white border-b border-gray-200">
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
                    <a
                      href={`tel:${MUNICIPAL_CONTACT_DATA.phone.replace(/[^0-9+]/g, "")}`}
                      className="text-gov-charcoal leading-snug font-mono hover:text-burgundy-700 hover:underline transition-colors block"
                    >
                      {MUNICIPAL_CONTACT_DATA.phone}
                    </a>
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
                    <a
                      href={`mailto:${MUNICIPAL_CONTACT_DATA.email}`}
                      className="text-gov-charcoal leading-snug hover:text-burgundy-700 hover:underline transition-colors block"
                    >
                      {MUNICIPAL_CONTACT_DATA.email}
                    </a>
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
                    <a
                      href={MUNICIPAL_CONTACT_DATA.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gov-charcoal leading-snug hover:text-burgundy-700 hover:underline transition-colors block"
                    >
                      {MUNICIPAL_CONTACT_DATA.facebook}
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200 flex flex-wrap gap-3">
              <a href={`mailto:${MUNICIPAL_CONTACT_DATA.email}`}>
                <Button variant="primary" size="sm" className="font-bold text-xs uppercase tracking-wider bg-burgundy-800 hover:bg-burgundy-900 cursor-pointer">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  <span>Send a Message</span>
                </Button>
              </a>
              <a
                href={getDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="font-bold text-xs uppercase tracking-wider border-gray-300 hover:border-burgundy-700 hover:text-burgundy-800">
                  <Navigation className="h-3.5 w-3.5 mr-1.5 text-burgundy-700" />
                  <span>Get Directions</span>
                  <ExternalLink className="h-3 w-3 ml-1 text-slate-400" />
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Leaflet Map (7 cols) */}
          <div id="municipal-map" className="lg:col-span-7 flex flex-col justify-between h-full">
            <MunicipalMap />

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
