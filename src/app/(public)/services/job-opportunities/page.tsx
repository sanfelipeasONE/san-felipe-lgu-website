import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { JobOpportunitiesView } from "@/components/services/job-opportunities-view";
import { PublishedServiceSections } from "@/components/services/published-service-sections";
import { getJobOpportunities } from "@/config/services-data";
import { getPublishedServicePage } from "@/server/services/service";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const publishedPage = await getPublishedServicePage("job-opportunities");
  return {
    title: publishedPage?.title || "Job Opportunities",
    description:
      publishedPage?.description ||
      "Official career opportunities, vacant position notices, and civil service recruitment bulletins for the Municipal Local Government Unit of San Felipe, Zambales.",
  };
}

export default async function JobOpportunitiesPage() {
  const [publishedPage, opportunities] = await Promise.all([
    getPublishedServicePage("job-opportunities"),
    Promise.resolve(getJobOpportunities()),
  ]);

  const hasPublishedContent = Boolean(
    publishedPage && publishedPage.sections.length > 0
  );

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title={publishedPage?.title || "Job Opportunities"}
        description={
          publishedPage?.description ||
          "Official vacant position notices, civil service career opportunities, and personnel recruitment bulletins published by the Municipality of San Felipe, Zambales."
        }
        breadcrumbs={[
          { label: "Services" },
          { label: "Job Opportunities" },
        ]}
      />

      {hasPublishedContent && publishedPage && (
        <PublishedServiceSections
          office={publishedPage.office}
          sections={publishedPage.sections}
        />
      )}

      {/* Phase 15 Boundary: Structured Job Vacancy Repository remains in safe empty state */}
      <JobOpportunitiesView opportunities={opportunities} />
    </main>
  );
}
