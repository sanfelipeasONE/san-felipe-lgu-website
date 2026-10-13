import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ArticleBody } from "@/components/news/article-body";
import { ArticleAttachments } from "@/components/news/article-attachments";
import { PublishingOfficeCard } from "@/components/news/publishing-office-card";
import { OtherNewsSidebar } from "@/components/news/other-news-sidebar";
import {
  getAllPublishedArticles,
  getArticleBySlug,
  getOtherArticles,
} from "@/config/news-data";
import { ASSETS } from "@/config/assets";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPublishedArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Notice Not Found",
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      images: [
        {
          url: article.featuredImage?.src || ASSETS.news.placeholder.src,
          width: 800,
          height: 450,
          alt: article.title,
        },
      ],
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const otherArticles = getOtherArticles(article.slug, 4);
  const imageSrc = article.featuredImage?.src || ASSETS.news.placeholder.src;
  const imageAlt = article.featuredImage?.alt || article.title;

  return (
    <div className="py-6 sm:py-10 bg-white">
      <Container>
        {/* Navigation Breadcrumb Bar matching reference design */}
        <div className="mb-6 bg-slate-100/70 border border-slate-200/80 px-4 py-2.5 rounded-xs">
          <Breadcrumbs
            items={[
              { label: "News & Announcements", href: "/news" },
              {
                label:
                  article.title.length > 50
                    ? `${article.title.slice(0, 50)}...`
                    : article.title,
              },
            ]}
          />
        </div>

        {/* 2-Column Layout on Desktop: Main Article Left (8 cols), Other News Sidebar Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Article Column */}
          <article className="lg:col-span-8">
            {/* Article Headline at top */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gov-charcoal uppercase leading-tight tracking-tight mb-2">
              {article.title}
            </h1>

            {/* Publication Date */}
            <div className="text-xs text-slate-500 font-medium mb-6">
              <time dateTime={article.publishedAt}>
                {article.publishedAtFormatted}
              </time>
              <span className="mx-2 text-slate-300" aria-hidden="true">&bull;</span>
              <span className="text-slate-600 font-semibold">{article.publishingOffice.name}</span>
            </div>

            {/* Featured Image directly below date matching reference */}
            <div className="mb-8 rounded-xs overflow-hidden bg-slate-100 relative w-full aspect-16/10 border border-gray-200 shadow-2xs">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover object-center"
                priority
              />
            </div>

            {/* Article Body Content */}
            <div className="space-y-6">
              {/* Excerpt Lead */}
              <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed pb-4 border-b border-gray-100">
                {article.excerpt}
              </p>

              {/* Structured Body Blocks */}
              <ArticleBody blocks={article.body} />

              {/* Downloadable Attachments (if applicable) */}
              <ArticleAttachments attachments={article.attachments} />

              {/* Publishing Office Attribution */}
              <PublishingOfficeCard office={article.publishingOffice} />

              {/* Back to All News link */}
              <div className="pt-4 border-t border-gray-100">
                <Link
                  href="/news"
                  className="inline-flex items-center text-xs font-bold text-burgundy-700 hover:text-burgundy-900 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  <span>Back to All News &amp; Announcements</span>
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar: OTHER NEWS */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <OtherNewsSidebar articles={otherArticles} />
          </aside>
        </div>
      </Container>
    </div>
  );
}
