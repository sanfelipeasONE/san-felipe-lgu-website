import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { OfficeDirectory } from "@/components/offices/office-directory";
import { getPublicCanonicalOffices } from "@/server/offices/service";

export const instant = false;

export const metadata: Metadata = {
  title: "Municipal Offices",
  description:
    "Directory of offices serving the Municipality of San Felipe, Zambales.",
};

export default async function MunicipalOfficesPage() {
  const offices = await getPublicCanonicalOffices();

  return (
    <>
      {/* Compact Government Page Header */}
      <PageHeader
        eyebrow="MUNICIPAL GOVERNMENT"
        title="Municipal Offices"
        description="Directory of offices serving the Municipality of San Felipe, Zambales."
        breadcrumbs={[{ label: "Municipal Offices" }]}
        className="pt-6 pb-6 sm:pt-8 sm:pb-8"
      />

      {/* Directory Section */}
      <section className="pt-6 pb-12 sm:pt-8 sm:pb-16 bg-slate-50/50">
        <Container>
          <OfficeDirectory offices={offices} />
        </Container>
      </section>
    </>
  );
}
