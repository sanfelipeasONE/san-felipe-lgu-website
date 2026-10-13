import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Building2, ArrowRight } from "lucide-react";
import { NewsBadge } from "@/components/news/news-badge";
import type { NewsArticle } from "@/config/news-data";
import { ASSETS } from "@/config/assets";
import { cn } from "@/lib/utils";
import {
  CARD_INTERACTIVE_CLASSES,
  CARD_IMAGE_ZOOM_CLASSES,
  CARD_ARROW_SHIFT_CLASSES,
} from "@/lib/card-styles";

export interface FeaturedNewsProps {
  primary: NewsArticle;
  secondary: NewsArticle[];
}

export function FeaturedNews({ primary, secondary }: FeaturedNewsProps) {
  const primaryImgSrc = primary.featuredImage?.src || ASSETS.news.placeholder.src;
  const primaryImgAlt = primary.featuredImage?.alt || primary.title;

  return (
    <section aria-label="Featured Municipal News" className="mb-12">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block">
            FEATURED DISPATCHES
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-gov-charcoal">
            Top Announcements &amp; Priority Briefings
          </h2>
        </div>
      </div>

      {/* Asymmetric 2-Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Primary Featured Article (Left 7 Cols) */}
        <article
          className={cn(
            "lg:col-span-7 bg-white border border-gray-200 rounded-xs overflow-hidden shadow-xs flex flex-col justify-between group",
            CARD_INTERACTIVE_CLASSES
          )}
        >
          <div>
            {/* Primary Landscape Image */}
            <Link
              href={`/news/${primary.slug}`}
              tabIndex={-1}
              aria-hidden="true"
              className="block relative w-full h-64 sm:h-76 md:h-84 bg-slate-900 overflow-hidden"
            >
              <Image
                src={primaryImgSrc}
                alt={primaryImgAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className={cn("object-cover object-center", CARD_IMAGE_ZOOM_CLASSES)}
                priority
              />
              <div className="absolute top-4 left-4 z-10">
                <NewsBadge type={primary.type} />
              </div>
            </Link>

            {/* Primary Content */}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-burgundy-700 uppercase tracking-wider text-[11px]">
                  <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{primary.publishingOffice.name}</span>
                </div>
                <span className="text-gray-300" aria-hidden="true">&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <time dateTime={primary.publishedAt}>{primary.publishedAtFormatted}</time>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-gov-charcoal tracking-tight leading-tight group-hover:text-burgundy-800 group-focus-within:text-burgundy-800 transition-colors duration-200 mb-3">
                <Link
                  href={`/news/${primary.slug}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
                >
                  {primary.title}
                </Link>
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {primary.excerpt}
              </p>
            </div>
          </div>

          <div className="p-6 pt-0">
            <Link
              href={`/news/${primary.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white rounded-xs text-xs font-bold uppercase tracking-wider transition-colors duration-200 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
            >
              <span>Read Full Priority Advisory</span>
              <ArrowRight className={cn("h-3.5 w-3.5", CARD_ARROW_SHIFT_CLASSES)} aria-hidden="true" />
            </Link>
          </div>
        </article>

        {/* Secondary Articles Column (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          {secondary.map((article) => {
            const secondaryImgSrc =
              article.featuredImage?.src || ASSETS.news.placeholder.src;

            return (
              <article
                key={article.id}
                className={cn(
                  "bg-white border border-gray-200 rounded-xs p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row lg:flex-col gap-4 group justify-between",
                  CARD_INTERACTIVE_CLASSES
                )}
              >
                <div className="flex gap-4 items-start">
                  {/* Thumbnail */}
                  <Link
                    href={`/news/${article.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="relative w-28 h-20 sm:w-32 sm:h-24 lg:w-32 lg:h-24 shrink-0 rounded-xs overflow-hidden bg-slate-900 border border-gray-100"
                  >
                    <Image
                      src={secondaryImgSrc}
                      alt={article.title}
                      fill
                      sizes="130px"
                      className={cn("object-cover object-center", CARD_IMAGE_ZOOM_CLASSES)}
                    />
                  </Link>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <NewsBadge type={article.type} showIcon={false} />
                      <span className="text-[11px] text-slate-400">
                        {article.publishedAtFormatted}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-gov-charcoal group-hover:text-burgundy-800 group-focus-within:text-burgundy-800 transition-colors duration-200 line-clamp-2 leading-snug mb-1">
                      <Link
                        href={`/news/${article.slug}`}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
                      >
                        {article.title}
                      </Link>
                    </h4>

                    <span className="text-[11px] font-semibold text-slate-500 block truncate">
                      {article.publishingOffice.name}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/news/${article.slug}`}
                    className="inline-flex items-center text-xs font-bold text-burgundy-700 hover:text-burgundy-900 transition-colors duration-200"
                  >
                    <span>Read Details</span>
                    <ArrowRight className={cn("h-3 w-3 ml-1", CARD_ARROW_SHIFT_CLASSES)} aria-hidden="true" />
                  </Link>

                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {article.category}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
