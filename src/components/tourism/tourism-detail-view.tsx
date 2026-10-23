import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Clock,
  ArrowLeft,
  Compass,
  Hotel,
  Landmark,
  ShoppingBag,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { PublicTourismEntry } from "@/server/tourism/mapper";
import type { TourismCategory } from "@prisma/client";

export interface TourismDetailViewProps {
  entry: PublicTourismEntry;
  otherEntries: PublicTourismEntry[];
}

const CATEGORY_ICONS: Record<TourismCategory, React.ComponentType<{ className?: string }>> = {
  ATTRACTIONS: Compass,
  RESORTS: Hotel,
  CULTURE_AND_ARTS: Landmark,
  PRODUCTS: ShoppingBag,
};

export function TourismDetailView({ entry, otherEntries }: TourismDetailViewProps) {
  const Icon = CATEGORY_ICONS[entry.category] || Compass;

  const hasVisitorDetails = Boolean(
    entry.location ||
      entry.mapUrl ||
      entry.contactNumber ||
      entry.email ||
      entry.websiteUrl ||
      entry.operatingHours
  );

  return (
    <main className="py-6 sm:py-10 bg-slate-50/50 min-h-screen">
      <Container>
        {/* Navigation Breadcrumb Bar */}
        <div className="mb-6 bg-white border border-gray-200 px-4 py-2.5 rounded-xs shadow-2xs">
          <Breadcrumbs
            items={[
              { label: "Tourism" },
              { label: entry.categoryLabel, href: entry.categoryRoute },
              {
                label:
                  entry.title.length > 40
                    ? `${entry.title.slice(0, 40)}...`
                    : entry.title,
              },
            ]}
          />
        </div>

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={entry.categoryRoute}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-700 hover:text-burgundy-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {entry.categoryLabel}</span>
          </Link>
        </div>

        {/* Main Grid: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (Left 8 Cols) */}
          <article className="lg:col-span-8 bg-white border border-gray-200 rounded-xs shadow-2xs p-6 sm:p-10 space-y-8">
            {/* Header Area */}
            <div className="space-y-3 border-b border-gray-100 pb-6">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                <Icon className="w-3.5 h-3.5 text-burgundy-700" />
                <span>{entry.categoryLabel}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gov-charcoal tracking-tight leading-tight">
                {entry.title}
              </h1>

              {entry.location && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-burgundy-700 shrink-0" aria-hidden="true" />
                  <span>{entry.location}</span>
                </div>
              )}

              {/* Summary Lead */}
              <p className="text-sm sm:text-base text-gov-muted leading-relaxed pt-2">
                {entry.summary}
              </p>
            </div>

            {/* Featured Image */}
            {entry.featuredImage && (
              <div className="relative w-full aspect-16/10 rounded-xs overflow-hidden bg-slate-100 border border-slate-200">
                <Image
                  src={entry.featuredImage.src}
                  alt={entry.featuredImage.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 768px"
                  className="object-cover object-center"
                />
              </div>
            )}

            {/* HTML Body */}
            <div
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-4 pt-2"
              dangerouslySetInnerHTML={{ __html: entry.body }}
            />
          </article>

          {/* Right Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Visitor & Establishment Information Box */}
            {hasVisitorDetails && (
              <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Icon className="w-4 h-4 text-burgundy-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gov-charcoal">
                    Visitor &amp; Contact Info
                  </h2>
                </div>

                <dl className="space-y-3.5 text-xs">
                  {entry.location && (
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-burgundy-700 shrink-0" />
                        <span>Location</span>
                      </dt>
                      <dd className="text-slate-800 font-semibold pl-5">
                        {entry.location}
                      </dd>
                    </div>
                  )}

                  {entry.mapUrl && (
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <ExternalLink className="w-3.5 h-3.5 text-burgundy-700 shrink-0" />
                        <span>Map Coordinates / Link</span>
                      </dt>
                      <dd className="pl-5">
                        <a
                          href={entry.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-burgundy-700 hover:text-burgundy-900 font-semibold underline underline-offset-2 break-all"
                        >
                          View Map Directions
                        </a>
                      </dd>
                    </div>
                  )}

                  {entry.operatingHours && (
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-burgundy-700 shrink-0" />
                        <span>Schedule / Operating Hours</span>
                      </dt>
                      <dd className="text-slate-800 font-semibold pl-5">
                        {entry.operatingHours}
                      </dd>
                    </div>
                  )}

                  {entry.contactNumber && (
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <Phone className="w-3.5 h-3.5 text-burgundy-700 shrink-0" />
                        <span>Contact Number</span>
                      </dt>
                      <dd className="pl-5">
                        <a
                          href={`tel:${entry.contactNumber}`}
                          className="text-burgundy-700 hover:text-burgundy-900 font-semibold"
                        >
                          {entry.contactNumber}
                        </a>
                      </dd>
                    </div>
                  )}

                  {entry.email && (
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <Mail className="w-3.5 h-3.5 text-burgundy-700 shrink-0" />
                        <span>Email Address</span>
                      </dt>
                      <dd className="pl-5">
                        <a
                          href={`mailto:${entry.email}`}
                          className="text-burgundy-700 hover:text-burgundy-900 font-semibold break-all"
                        >
                          {entry.email}
                        </a>
                      </dd>
                    </div>
                  )}

                  {entry.websiteUrl && (
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <Globe className="w-3.5 h-3.5 text-burgundy-700 shrink-0" />
                        <span>Website</span>
                      </dt>
                      <dd className="pl-5">
                        <a
                          href={entry.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-burgundy-700 hover:text-burgundy-900 font-semibold underline underline-offset-2 break-all"
                        >
                          Visit Website
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Other Entries in Category */}
            {otherEntries.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gov-charcoal">
                    More in {entry.categoryLabel}
                  </h2>
                  <Link
                    href={entry.categoryRoute}
                    className="text-[11px] font-semibold text-burgundy-700 hover:text-burgundy-900"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-4">
                  {otherEntries.map((other) => (
                    <div
                      key={other.id}
                      className="flex items-start gap-3 group border-b border-gray-50 last:border-0 pb-3 last:pb-0"
                    >
                      <div className="relative w-14 h-14 rounded-xs overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {other.featuredImage ? (
                          <Image
                            src={other.featuredImage.src}
                            alt={other.featuredImage.alt}
                            fill
                            sizes="56px"
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Icon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <Link
                          href={`${other.categoryRoute}/${other.slug}`}
                          className="text-xs font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors line-clamp-2 leading-snug"
                        >
                          {other.title}
                        </Link>
                        {other.location && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {other.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </main>
  );
}
