import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import type { NewsArticle } from "@/config/news-data";

export interface RelatedNewsProps {
  articles: NewsArticle[];
}

export function RelatedNews({ articles }: RelatedNewsProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Related News"
      className="mt-16 pt-12 border-t border-gray-200"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg sm:text-xl font-black text-gov-charcoal tracking-tight">
          Related News &amp; Announcements
        </h2>

        <Link
          href="/news"
          className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 inline-flex items-center gap-1 group"
        >
          <span>View All News</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
