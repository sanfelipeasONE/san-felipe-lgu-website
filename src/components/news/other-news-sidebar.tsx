import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/config/news-data";
import { ASSETS } from "@/config/assets";

export interface OtherNewsSidebarProps {
  articles: NewsArticle[];
}

export function OtherNewsSidebar({ articles }: OtherNewsSidebarProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <aside aria-label="Other Municipal News" className="w-full">
      {/* Header matching reference design with clean underline */}
      <div className="border-b-2 border-burgundy-800 pb-1.5 mb-5 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wider text-gov-charcoal">
          OTHER NEWS
        </h2>
      </div>

      {/* Vertical Stack of Image-First Cards with Bottom Title Overlay */}
      <div className="space-y-4">
        {articles.map((item) => {
          const imgSrc = item.featuredImage?.src || ASSETS.news.placeholder.src;
          const imgAlt = item.featuredImage?.alt || item.title;

          return (
            <article key={item.id} className="group">
              <Link
                href={`/news/${item.slug}`}
                className="block relative w-full aspect-16/10 rounded-xs overflow-hidden bg-slate-900 shadow-2xs hover:shadow-xs transition-shadow"
              >
                {/* Background Image */}
                <Image
                  src={imgSrc}
                  alt={imgAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="object-cover object-center group-hover:scale-103 transition-transform duration-300"
                />

                {/* Dark Gradient Overlay for Title Legibility */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
                  aria-hidden="true"
                />

                {/* Date Tag on Top */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-[10px] font-semibold text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-xs">
                    {item.publishedAtFormatted}
                  </span>
                </div>

                {/* Bottom Overlay Title */}
                <div className="absolute bottom-0 inset-x-0 p-3 z-10">
                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-gold-300 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {/* Footer Link to All News */}
      <div className="mt-5 pt-3 border-t border-gray-100">
        <Link
          href="/news"
          className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 inline-flex items-center gap-1 group"
        >
          <span>View All Municipal News</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
