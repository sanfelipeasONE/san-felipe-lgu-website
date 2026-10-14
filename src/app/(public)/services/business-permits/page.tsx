import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessPermitsView } from "@/components/services/business-permits-view";
import { PublishedServiceSections } from "@/components/services/published-service-sections";
import { getPublishedServicePage } from "@/server/services/service";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const publishedPage = await getPublishedServicePage("business-permits");
  return {
    title: publishedPage?.title || "Business Permits",
    description:
      publishedPage?.description ||
      "Official regulatory guidelines, documentary checklists, and procedures for new business permit applications and annual permit renewals in the Municipality of San Felipe, Zambales.",
  };
}

export default async function BusinessPermitsPage() {
  const publishedPage = await getPublishedServicePage("business-permits");

  const hasPublishedContent = Boolean(
    publishedPage && publishedPage.sections.length > 0
  );

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title={publishedPage?.title || "Business Permits"}
        description={
          publishedPage?.description ||
          "Guidelines, requirements, and regulatory procedures for new commercial establishment applications and annual business permit renewals in San Felipe, Zambales."
        }
        breadcrumbs={[
          { label: "Services" },
          { label: "Business Permits" },
        ]}
      />

      {hasPublishedContent && publishedPage ? (
        <PublishedServiceSections
          office={publishedPage.office}
          sections={publishedPage.sections}
        />
      ) : (
        <BusinessPermitsView />
      )}
    </main>
  );
}
