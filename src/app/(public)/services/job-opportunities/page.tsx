import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { JobOpportunitiesView } from "@/components/services/job-opportunities-view";
import { getJobOpportunities } from "@/config/services-data";

export const metadata: Metadata = {
  title: "Job Opportunities",
  description:
    "Official career opportunities, vacant position notices, and civil service recruitment bulletins for the Municipal Local Government Unit of San Felipe, Zambales.",
};

export default function JobOpportunitiesPage() {
  const opportunities = getJobOpportunities();

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title="Job Opportunities"
        description="Official vacant position notices, civil service career opportunities, and personnel recruitment bulletins published by the Municipality of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Services" },
          { label: "Job Opportunities" },
        ]}
      />

      <JobOpportunitiesView opportunities={opportunities} />
    </main>
  );
}
