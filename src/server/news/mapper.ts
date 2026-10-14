import type { NewsArticle, NewsType } from "@/config/news-data";
import type { NewsItem } from "@/config/homepage-data";

interface DbOffice {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  officeHead?: string | null;
  email?: string | null;
  location?: string | null;
}

interface DbNewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  type: string;
  category: string;
  status: string;
  publishedAt: Date | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  office: DbOffice;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Maps a Prisma NewsArticle database record to the public NewsArticle format
 * required by the frozen Phase 9 UI components.
 */
export function mapDbArticleToPublicArticle(
  article: DbNewsArticle
): NewsArticle & { htmlBody: string } {
  const publishedDate = article.publishedAt || article.createdAt;
  const isoDate = publishedDate.toISOString();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(publishedDate);

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    body: [],
    htmlBody: article.body,
    type: (article.type as NewsType) || "news",
    category: article.category,
    publishingOffice: {
      id: article.office.id,
      name: article.office.name,
      slug: article.office.slug,
      acronym: article.office.shortName || undefined,
    },
    publishedAt: isoDate,
    publishedAtFormatted: formattedDate,
    year: String(publishedDate.getFullYear()),
    featuredImage: article.featuredImageUrl
      ? {
          src: article.featuredImageUrl,
          alt: article.featuredImageAlt || article.title,
          provenance: "VERIFIED_CLIENT_ASSET",
        }
      : undefined,
    attachments: [],
    isFeatured: false,
    isImportant: false,
    isPrototypeContent: false,
    status: "published",
  };
}

/**
 * Maps a Prisma NewsArticle database record to the NewsItem format
 * required by the homepage LatestNews section.
 */
export function mapDbArticleToHomepageItem(article: DbNewsArticle): NewsItem {
  const publishedDate = article.publishedAt || article.createdAt;
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(publishedDate);

  return {
    id: article.id,
    title: article.title,
    category: article.category.toUpperCase(),
    publishingOffice: article.office.shortName || article.office.name,
    date: formattedDate,
    excerpt: article.excerpt,
    href: `/news/${article.slug}`,
    imageUrl: article.featuredImageUrl || undefined,
    imageAlt: article.featuredImageAlt || article.title,
  };
}
