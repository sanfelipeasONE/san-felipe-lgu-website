import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DownloadableFormsView } from "@/components/services/downloadable-forms-view";
import { PublishedServiceSections } from "@/components/services/published-service-sections";
import { getDownloadableForms } from "@/config/services-data";
import { getPublishedServicePage } from "@/server/services/service";

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
  const [publishedPage, forms] = await Promise.all([
    getPublishedServicePage("downloadable-forms"),
    Promise.resolve(getDownloadableForms()),
  ]);

  const hasPublishedContent = Boolean(
    publishedPage && publishedPage.sections.length > 0
  );

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

      {/* Phase 14 Boundary: Downloadable Forms Repository remains in safe empty state */}
      <DownloadableFormsView forms={forms} />
    </main>
  );
}
