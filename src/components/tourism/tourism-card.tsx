import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight, Compass, Hotel, Landmark, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicTourismEntry } from "@/server/tourism/mapper";
import type { TourismCategory } from "@prisma/client";

export interface TourismCardProps {
  entry: PublicTourismEntry;
  className?: string;
}

const CATEGORY_ICONS: Record<TourismCategory, React.ComponentType<{ className?: string }>> = {
  ATTRACTIONS: Compass,
  RESORTS: Hotel,
  CULTURE_AND_ARTS: Landmark,
  PRODUCTS: ShoppingBag,
};

export function TourismCard({ entry, className }: TourismCardProps) {
  const Icon = CATEGORY_ICONS[entry.category] || Compass;
  const detailHref = `${entry.categoryRoute}/${entry.slug}`;

  return (
    <article
      className={cn(
        "flex flex-col bg-white border border-gray-200 rounded-xs overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 group text-left",
        className
      )}
    >
      {/* Featured Image or Placeholder */}
      <Link
        href={detailHref}
        tabIndex={-1}
        aria-hidden="true"
        className="block relative w-full aspect-16/10 bg-slate-100 overflow-hidden"
      >
        {entry.featuredImage ? (
          <Image
            src={entry.featuredImage.src}
            alt={entry.featuredImage.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400">
            <Icon className="w-10 h-10 mb-1 text-slate-300" />
            <span className="text-[11px] font-medium tracking-wide uppercase">
              San Felipe Tourism
            </span>
          </div>
        )}

        {/* Category Pill Tag Overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-white/95 text-burgundy-900 shadow-2xs backdrop-blur-xs border border-gray-100">
            <Icon className="w-3 h-3 text-burgundy-700" />
            {entry.categoryLabel}
          </span>
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div className="space-y-2">
          {/* Location if present */}
          {entry.location && (
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
              <span className="truncate">{entry.location}</span>
            </div>
          )}

          {/* Headline */}
          <h3 className="text-base sm:text-lg font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors leading-snug line-clamp-2">
            <Link
              href={detailHref}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
            >
              {entry.title}
            </Link>
          </h3>

          {/* Excerpt / Summary */}
          <p className="text-xs sm:text-[13px] text-gov-muted leading-relaxed line-clamp-3">
            {entry.summary}
          </p>
        </div>

        {/* Footer Link */}
        <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">
            Municipal Directory
          </span>
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 text-xs font-bold text-burgundy-700 hover:text-burgundy-900 transition-colors"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
