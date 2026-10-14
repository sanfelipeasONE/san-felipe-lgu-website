import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CitizensCharterView } from "@/components/services/citizens-charter-view";
import { PublishedServiceSections } from "@/components/services/published-service-sections";
import { getCitizensCharterEntries } from "@/config/services-data";
import { getPublishedServicePage } from "@/server/services/service";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const publishedPage = await getPublishedServicePage("citizens-charter");
  return {
    title: publishedPage?.title || "Citizen's Charter",
    description:
      publishedPage?.description ||
      "Official frontline service standards, procedural requirements, processing turnaround times, and fee schedules published by the Municipality of San Felipe, Zambales.",
  };
}

export default async function CitizensCharterPage() {
  const [publishedPage, entries] = await Promise.all([
    getPublishedServicePage("citizens-charter"),
    Promise.resolve(getCitizensCharterEntries()),
  ]);

  const hasPublishedContent = Boolean(
    publishedPage && publishedPage.sections.length > 0
  );

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title={publishedPage?.title || "Citizen's Charter"}
        description={
          publishedPage?.description ||
          "Official Citizen's Charter service delivery standards, frontline procedural steps, and documentary requirements published by the Local Government Unit of San Felipe."
        }
        breadcrumbs={[
          { label: "Services" },
          { label: "Citizen's Charter" },
        ]}
      />

      {hasPublishedContent && publishedPage ? (
        <PublishedServiceSections
          office={publishedPage.office}
          sections={publishedPage.sections}
        />
      ) : (
        <CitizensCharterView entries={entries} />
      )}
    </main>
  );
}
