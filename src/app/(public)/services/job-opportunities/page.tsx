import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { JobOpportunitiesView } from "@/components/services/job-opportunities-view";
import { PublishedServiceSections } from "@/components/services/published-service-sections";
import { getPublishedServicePage } from "@/server/services/service";
import { getPublishedJobOpportunities } from "@/server/jobs/service";
import type { JobOpportunity } from "@/config/services-data";

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
  const [publishedPage, publishedJobs] = await Promise.all([
    getPublishedServicePage("job-opportunities"),
    getPublishedJobOpportunities(),
  ]);

  const hasPublishedContent = Boolean(
    publishedPage && publishedPage.sections.length > 0
  );

  // Map database published vacancies to public view model
  const opportunities: JobOpportunity[] = publishedJobs.map((job) => ({
    id: job.id,
    slug: job.slug,
    positionTitle: job.positionTitle,
    itemNumber: job.itemNumber,
    officeId: job.officeId,
    officeName: job.officeName,
    employmentType: job.employmentType || undefined,
    salaryGrade: job.salaryGrade,
    monthlySalary: job.monthlySalary,
    description: job.description,
    postingDate: job.postingDate,
    closingDate: job.closingDate,
    educationRequirement: job.educationRequirement,
    trainingRequirement: job.trainingRequirement,
    experienceRequirement: job.experienceRequirement,
    eligibilityRequirement: job.eligibilityRequirement,
    competencyRequirements: job.competencyRequirements,
    applicationInstructions: job.applicationInstructions,
    officialAttachmentUrl: job.officialAttachmentUrl,
    status: job.status,
  }));

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

      {/* Database-backed municipal job vacancy announcements repository */}
      <JobOpportunitiesView opportunities={opportunities} />
    </main>
  );
}
