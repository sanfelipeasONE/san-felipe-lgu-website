import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublicPublishedTourismBySlug,
  getPublicOtherTourism,
} from "@/server/tourism/service";
import { mapDbTourismToPublic } from "@/server/tourism/mapper";
import { TourismDetailView } from "@/components/tourism/tourism-detail-view";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getPublicPublishedTourismBySlug("ATTRACTIONS", slug);

  if (!raw) {
    return {
      title: "Attraction Not Found | Municipality of San Felipe",
    };
  }

  const publishedDate = raw.publishedAt || raw.createdAt;

  return {
    title: `${raw.title} | Attractions | Municipality of San Felipe`,
    description: raw.summary,
    openGraph: {
      title: raw.title,
      description: raw.summary,
      type: "article",
      publishedTime: publishedDate.toISOString(),
      images: raw.featuredImageUrl
        ? [
            {
              url: raw.featuredImageUrl,
              width: raw.featuredImageWidth || 1200,
              height: raw.featuredImageHeight || 630,
              alt: raw.featuredImageAlt || raw.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function AttractionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const raw = await getPublicPublishedTourismBySlug("ATTRACTIONS", slug);

  if (!raw) {
    notFound();
  }

  const entry = mapDbTourismToPublic(raw);
  const otherDb = await getPublicOtherTourism("ATTRACTIONS", slug, 4);
  const otherEntries = otherDb.map(mapDbTourismToPublic);

  return <TourismDetailView entry={entry} otherEntries={otherEntries} />;
}
