import type { TourismEntry, TourismCategory } from "@prisma/client";
import {
  TOURISM_CATEGORY_LABELS,
  TOURISM_CATEGORY_ROUTES,
} from "@/lib/validation/tourism";

export interface PublicTourismEntry {
  id: string;
  category: TourismCategory;
  categoryLabel: string;
  categoryRoute: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  location?: string | null;
  mapUrl?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  operatingHours?: string | null;
  publishedAt: Date;
  featuredImage?: {
    src: string;
    alt: string;
    width?: number | null;
    height?: number | null;
  } | null;
}

export function mapDbTourismToPublic(raw: TourismEntry): PublicTourismEntry {
  return {
    id: raw.id,
    category: raw.category,
    categoryLabel: TOURISM_CATEGORY_LABELS[raw.category] || raw.category,
    categoryRoute: TOURISM_CATEGORY_ROUTES[raw.category] || "/tourism/attractions",
    title: raw.title,
    slug: raw.slug,
    summary: raw.summary,
    body: raw.body,
    location: raw.location,
    mapUrl: raw.mapUrl,
    contactNumber: raw.contactNumber,
    email: raw.email,
    websiteUrl: raw.websiteUrl,
    operatingHours: raw.operatingHours,
    publishedAt: raw.publishedAt || raw.createdAt,
    featuredImage: raw.featuredImageUrl
      ? {
          src: raw.featuredImageUrl,
          alt: raw.featuredImageAlt || raw.title,
          width: raw.featuredImageWidth,
          height: raw.featuredImageHeight,
        }
      : null,
  };
}
