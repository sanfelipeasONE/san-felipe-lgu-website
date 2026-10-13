import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessPermitsView } from "@/components/services/business-permits-view";

export const metadata: Metadata = {
  title: "Business Permits",
  description:
    "Official regulatory guidelines, documentary checklists, and procedures for new business permit applications and annual permit renewals in the Municipality of San Felipe, Zambales.",
};

export default function BusinessPermitsPage() {
  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title="Business Permits"
        description="Guidelines, requirements, and regulatory procedures for new commercial establishment applications and annual business permit renewals in San Felipe, Zambales."
        breadcrumbs={[
          { label: "Services" },
          { label: "Business Permits" },
        ]}
      />

      <BusinessPermitsView />
    </main>
  );
}
