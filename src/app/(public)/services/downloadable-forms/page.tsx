import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DownloadableFormsView } from "@/components/services/downloadable-forms-view";
import { PublishedServiceSections } from "@/components/services/published-service-sections";
import { getPublishedServicePage } from "@/server/services/service";
import { getPublishedDocuments } from "@/server/documents/service";
import type { DownloadableForm, FormCategory, FormFileType } from "@/config/services-data";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const publishedPage = await getPublishedServicePage("downloadable-forms");
  return {
    title: publishedPage?.title || "Downloadable Forms",
    description:
      publishedPage?.description ||
      "Official municipal form templates, permit applications, civil registry requests, and public document kits from the Municipality of San Felipe, Zambales.",
  };
}

export default async function DownloadableFormsPage() {
  const [publishedPage, publishedDocs] = await Promise.all([
    getPublishedServicePage("downloadable-forms"),
    getPublishedDocuments(),
  ]);

  const hasPublishedContent = Boolean(
    publishedPage && publishedPage.sections.length > 0
  );

  // Map database published documents to public view model
  const forms: DownloadableForm[] = publishedDocs.map((doc) => ({
    id: doc.id,
    slug: doc.id,
    title: doc.title,
    description: doc.description || "",
    officeId: doc.office?.id || "",
    officeName: doc.office?.name || "General LGU",
    category: (doc.category as FormCategory) || "General Administration",
    fileType: (doc.format as FormFileType) || "PDF",
    fileSize: doc.fileSizeFormatted,
    fileUrl: `/documents/${doc.id}/download`,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : undefined,
    isAvailable: true,
  }));

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title={publishedPage?.title || "Downloadable Forms"}
        description={
          publishedPage?.description ||
          "Official government forms, permit application templates, and administrative document kits issued by the offices of the Municipality of San Felipe, Zambales."
        }
        breadcrumbs={[
          { label: "Services" },
          { label: "Downloadable Forms" },
        ]}
      />

      {hasPublishedContent && publishedPage && (
        <PublishedServiceSections
          office={publishedPage.office}
          sections={publishedPage.sections}
        />
      )}

      {/* Database-backed municipal downloadable forms repository */}
      <DownloadableFormsView forms={forms} />
    </main>
  );
}
