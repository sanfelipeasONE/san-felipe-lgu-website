import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/config/news-data";
import { ASSETS } from "@/config/assets";
import { CARD_IMAGE_ZOOM_CLASSES } from "@/lib/card-styles";

export interface NewsCardProps {
  article: NewsArticle;
  className?: string;
}

/**
 * Clean open editorial news card matching Phase 4.1 simplified reference design.
 * Features a 4:3 image, publication date, strong headline, excerpt, and subtle office metadata.
 */
export function NewsCard({ article, className }: NewsCardProps) {
  const imageSrc = article.featuredImage?.src || ASSETS.news.placeholder.src;
  const imageAlt = article.featuredImage?.alt || article.title;

  return (
    <article className={cn("flex flex-col group text-left", className)}>
      {/* Featured Image with 4:3 Aspect Ratio */}
      <Link
        href={`/news/${article.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="block relative w-full aspect-4/3 bg-slate-100 rounded-xs overflow-hidden"
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className={cn("object-cover object-center", CARD_IMAGE_ZOOM_CLASSES)}
        />
      </Link>

      {/* Content Area */}
      <div className="pt-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Publication Date & Restrained Content Type */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <time dateTime={article.publishedAt}>
              {article.publishedAtFormatted}
            </time>
            <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700">
              {article.type === "notice" ? "Public Notice" : article.type}
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-base sm:text-[17px] font-black text-gov-charcoal group-hover:text-burgundy-800 transition-colors duration-200 line-clamp-2 leading-snug tracking-tight mb-2">
            <Link
              href={`/news/${article.slug}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
            >
              {article.title}
            </Link>
          </h3>

          {/* Excerpt */}
          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed line-clamp-3 mb-2.5">
            {article.excerpt}
          </p>
        </div>

        {/* Subtle Publishing Office attribution */}
        <span className="text-[11px] font-semibold text-slate-400 block truncate pt-1">
          {article.publishingOffice.name}
        </span>
      </div>
    </article>
  );
}
