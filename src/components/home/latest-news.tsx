import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { NewsCard } from "@/components/home/news-card";
import { NEWS_DATA } from "@/config/homepage-data";

export function LatestNews() {
  return (
    <section className="py-14 sm:py-18 bg-slate-50/60 border-b border-gray-200">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
              NEWS & UPDATES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-charcoal tracking-tight">
              Latest News & Announcements
            </h2>
            <p className="mt-2 text-sm text-gov-muted max-w-3xl leading-relaxed">
              Official news releases, advisories, announcements, and press statements from the Municipal Government of San Felipe.
            </p>
          </div>

          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-burgundy-700 hover:text-burgundy-900 transition-colors shrink-0 group"
          >
            <span>View All News & Press Releases</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 2-Column Asymmetric News Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Featured Large Card (7 cols) */}
          <div className="lg:col-span-7">
            <NewsCard news={NEWS_DATA.featured} featured={true} />
          </div>

          {/* Secondary 3 Stacked Cards (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {NEWS_DATA.secondary.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
