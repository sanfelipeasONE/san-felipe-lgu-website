import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { NewsGrid } from "@/components/news/news-grid";
import { getAllPublishedArticles } from "@/config/news-data";

export const metadata: Metadata = {
  title: "News & Announcements | Municipality of San Felipe, Zambales",
  description:
    "Stay informed about the latest news, announcements, advisories, and public notices from the Municipal Government of San Felipe, Zambales.",
};

export default function NewsArchivePage() {
  const allArticles = getAllPublishedArticles();

  return (
    <>
      {/* Restrained Content Header */}
      <PageHeader
        eyebrow="PUBLIC INFORMATION"
        title="News & Announcements"
        description="Stay informed about the latest news, announcements, advisories, and public notices from the Municipal Government of San Felipe, Zambales."
        breadcrumbs={[{ label: "News & Announcements" }]}
      />

      {/* Main Image-First Editorial Archive */}
      <main className="py-10 sm:py-14 bg-white">
        <Container>
          <NewsGrid articles={allArticles} />
        </Container>
      </main>
    </>
  );
}
