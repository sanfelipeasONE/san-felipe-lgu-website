import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CitizensCharterView } from "@/components/services/citizens-charter-view";
import { getCitizensCharterEntries } from "@/config/services-data";

export const metadata: Metadata = {
  title: "Citizen's Charter",
  description:
    "Official frontline service standards, procedural requirements, processing turnaround times, and fee schedules published by the Municipality of San Felipe, Zambales.",
};

export default function CitizensCharterPage() {
  const entries = getCitizensCharterEntries();

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title="Citizen's Charter"
        description="Official Citizen's Charter service delivery standards, frontline procedural steps, and documentary requirements published by the Local Government Unit of San Felipe."
        breadcrumbs={[
          { label: "Services" },
          { label: "Citizen's Charter" },
        ]}
      />

      <CitizensCharterView entries={entries} />
    </main>
  );
}
