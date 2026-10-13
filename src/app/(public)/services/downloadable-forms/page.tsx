import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DownloadableFormsView } from "@/components/services/downloadable-forms-view";
import { getDownloadableForms } from "@/config/services-data";

export const metadata: Metadata = {
  title: "Downloadable Forms",
  description:
    "Official municipal form templates, permit applications, civil registry requests, and public document kits from the Municipality of San Felipe, Zambales.",
};

export default function DownloadableFormsPage() {
  const forms = getDownloadableForms();

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title="Downloadable Forms"
        description="Official government forms, permit application templates, and administrative document kits issued by the offices of the Municipality of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Services" },
          { label: "Downloadable Forms" },
        ]}
      />

      <DownloadableFormsView forms={forms} />
    </main>
  );
}
