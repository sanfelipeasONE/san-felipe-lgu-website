import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { OfficeDirectory } from "@/components/offices/office-directory";
import { getCanonicalOffices } from "@/config/offices-data";

export const metadata: Metadata = {
  title: "Municipal Offices",
  description:
    "Directory of offices serving the Municipality of San Felipe, Zambales.",
};

export default function MunicipalOfficesPage() {
  const offices = getCanonicalOffices();

  return (
    <>
      {/* Compact Government Page Header */}
      <PageHeader
        eyebrow="MUNICIPAL GOVERNMENT"
        title="Municipal Offices"
        description="Directory of offices serving the Municipality of San Felipe, Zambales."
        breadcrumbs={[{ label: "Municipal Offices" }]}
      />

      {/* Directory Grid */}
      <main className="py-10 sm:py-14 bg-slate-50/50">
        <Container>
          <OfficeDirectory offices={offices} />
        </Container>
      </main>
    </>
  );
}
