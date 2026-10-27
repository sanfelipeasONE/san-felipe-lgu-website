import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Building2 } from "lucide-react";
import type { NewsItem } from "@/config/homepage-data";
import { Badge } from "@/components/ui/badge";
import { ASSETS } from "@/config/assets";
import { cn } from "@/lib/utils";
import {
  CARD_INTERACTIVE_CLASSES,
  CARD_IMAGE_ZOOM_CLASSES,
  CARD_ARROW_SHIFT_CLASSES,
} from "@/lib/card-styles";

interface NewsCardProps {
  news: NewsItem;
  featured?: boolean;
}

export function NewsCard({ news, featured = false }: NewsCardProps) {
  if (featured) {
    return (
      <article
        className={cn(
          "bg-white border border-gray-200 rounded-xs overflow-hidden shadow-2xs flex flex-col justify-between h-full group",
          CARD_INTERACTIVE_CLASSES
        )}
      >
        <div>
          {/* Featured Graphic Banner with next/image via centralized registry */}
          <div className="relative h-60 sm:h-68 lg:h-76 w-full bg-slate-950 overflow-hidden">
            <Image
              src={news.imageUrl || ASSETS.news.placeholder.src}
              alt={news.imageAlt || news.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className={cn("object-cover object-center", CARD_IMAGE_ZOOM_CLASSES)}
            />
            {/* Top Badge Overlay */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
              <Badge variant="gold" className="font-bold shadow-xs">
                {news.category}
              </Badge>
              <span className="text-[11px] text-white/95 font-semibold bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-xs flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gold-400" />
                {news.date}
              </span>
            </div>
          </div>

          <div className="p-6">
            {news.publishingOffice && (
              <div className="flex items-center gap-1.5 text-xs text-burgundy-700 font-bold uppercase tracking-wider mb-2">
                <Building2 className="h-3.5 w-3.5" />
                <span>{news.publishingOffice}</span>
              </div>
            )}

            <h3 className="text-xl sm:text-2xl font-black text-gov-charcoal tracking-tight leading-snug mb-3 group-hover:text-burgundy-800 group-focus-within:text-burgundy-800 transition-colors duration-200">
              <Link href={news.href} className="focus-visible:outline-none focus-visible:underline">{news.title}</Link>
            </h3>

            <p className="text-xs sm:text-sm text-gov-muted leading-relaxed">
              {news.excerpt}
            </p>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Link
            href={news.href}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-burgundy-800 hover:text-burgundy-900 focus-visible:outline-none focus-visible:underline transition-colors duration-200"
          >
            <span>Read Full Advisory</span>
            <ArrowRight className={cn("h-3.5 w-3.5", CARD_ARROW_SHIFT_CLASSES)} />
          </Link>
        </div>
      </article>
    );
  }

  // Secondary Compact News Item Card
  return (
    <article
      className={cn(
        "bg-white border border-gray-200 rounded-xs p-5 shadow-2xs flex flex-col justify-between group",
        CARD_INTERACTIVE_CLASSES
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
          <Badge variant="burgundy">{news.category}</Badge>
          <span className="text-gray-400 flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3" />
            {news.date}
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-gov-charcoal tracking-tight leading-snug mb-2 group-hover:text-burgundy-800 group-focus-within:text-burgundy-800 transition-colors duration-200">
          <Link href={news.href} className="focus-visible:outline-none focus-visible:underline">{news.title}</Link>
        </h3>

        <p className="text-xs text-gov-muted leading-relaxed line-clamp-2">
          {news.excerpt}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        {news.publishingOffice ? (
          <span className="text-[11px] text-gray-500 font-medium">
            {news.publishingOffice}
          </span>
        ) : <span />}
        <Link
          href={news.href}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-burgundy-800 hover:text-burgundy-950 focus-visible:outline-none focus-visible:underline transition-colors duration-200"
        >
          <span>Read More</span>
          <ArrowRight className={cn("h-3 w-3", CARD_ARROW_SHIFT_CLASSES)} />
        </Link>
      </div>
    </article>
  );
}
