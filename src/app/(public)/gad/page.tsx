import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getPublicPublishedNews } from "@/server/news/service";
import { getPublishedDocuments, formatBytes } from "@/server/documents/service";

export const instant = false;

export const metadata: Metadata = {
  title: "Gender and Development (GAD) Corner | Municipality of San Felipe",
  description:
    "News, announcements, resources, and official GAD documents from the Municipal Government of San Felipe, Zambales.",
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default async function GadCornerPage() {
  // 1. Fetch published GAD News
  const newsResult = await getPublicPublishedNews({
    category: "GENDER AND DEVELOPMENT (GAD)",
    pageSize: 12,
  });
  const gadArticles = newsResult.articles;

  // 2. Fetch published GAD Resources
  const gadResources = await getPublishedDocuments({
    purpose: "OTHER_PUBLIC_DOCUMENT",
    category: "Gender and Development (GAD)",
  });

  return (
    <main className="min-h-screen bg-white">
      {/* 1. Straightforward Municipal Content Header */}
      <div className="border-b border-gray-200 bg-slate-50/50 py-10 sm:py-12">
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 max-w-4xl">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
              <Image
                src="/images/gad-logo.png"
                alt="Gender and Development (GAD) Official Seal"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gov-charcoal tracking-tight">
                Gender and Development (GAD) Corner
              </h1>
              <div className="h-0.5 w-12 bg-burgundy-700 mt-2 mb-2.5" />
              <p className="text-sm text-gov-muted max-w-2xl leading-relaxed">
                News, announcements, resources, and official GAD documents from the Municipal Government of San Felipe.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* 2. Main Editorial Content Area */}
      <Container className="py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-10 lg:gap-12 items-start">

          {/* COLUMN 1: GAD NEWS (2/3 width on Desktop) */}
          <section id="gad-news" className="space-y-6">
            <div className="border-b border-gray-200 pb-3">
              <h2 className="text-xl font-bold text-gov-charcoal">
                GAD News
              </h2>
            </div>

            {gadArticles.length > 0 ? (
              <div className="divide-y divide-gray-100 space-y-6">
                {gadArticles.map((article, index) => (
                  <ScrollReveal key={article.id} staggerIndex={index}>
                    <article className="pt-6 first:pt-0">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {article.featuredImageUrl && (
                          <div className="relative w-full sm:w-40 h-28 shrink-0 overflow-hidden rounded-xs bg-slate-100">
                            <Image
                              src={article.featuredImageUrl}
                              alt={article.featuredImageAlt || article.title}
                              fill
                              sizes="(max-width: 640px) 100vw, 160px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          {article.publishedAt && (
                            <time
                              dateTime={new Date(article.publishedAt).toISOString()}
                              className="text-xs text-slate-500 block"
                            >
                              {formatDate(article.publishedAt)}
                            </time>
                          )}
                          <h3 className="text-base sm:text-lg font-bold text-gov-charcoal leading-snug hover:text-burgundy-800 transition-colors">
                            <Link href={`/news/${article.slug}`}>
                              {article.title}
                            </Link>
                          </h3>
                          <p className="text-xs sm:text-sm text-gov-muted line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                          <div className="pt-1">
                            <Link
                              href={`/news/${article.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy-800 hover:text-burgundy-900 group"
                            >
                              <span>Read more</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic py-2">
                No GAD news has been published yet.
              </p>
            )}
          </section>

          {/* COLUMN 2: GAD RESOURCES (1/3 width on Desktop) */}
          <section id="gad-resources" className="space-y-6">
            <div className="border-b border-gray-200 pb-3">
              <h2 className="text-xl font-bold text-gov-charcoal">
                GAD Resources
              </h2>
            </div>

            {gadResources.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {gadResources.map((doc, index) => (
                  <ScrollReveal key={doc.id} staggerIndex={index}>
                    <li className="py-3.5 first:pt-0">
                      <h3 className="text-sm font-semibold text-gov-charcoal leading-snug mb-1">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-xs text-gov-muted line-clamp-2 mb-2">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <a
                          href={`/documents/${doc.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-burgundy-800 hover:text-burgundy-900 hover:underline"
                        >
                          <span>View document</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                        <span className="text-slate-300" aria-hidden="true">&bull;</span>
                        <a
                          href={`/documents/${doc.id}/download`}
                          className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-gov-charcoal hover:underline"
                        >
                          <span>Download</span>
                          <Download className="w-3 h-3" aria-hidden="true" />
                        </a>
                        <span className="text-[11px] text-slate-400 ml-auto uppercase">
                          {doc.format} ({formatBytes(doc.bytes)})
                        </span>
                      </div>
                    </li>
                  </ScrollReveal>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic py-2">
                No GAD resources have been published yet.
              </p>
            )}
          </section>

        </div>
      </Container>
    </main>
  );
}
