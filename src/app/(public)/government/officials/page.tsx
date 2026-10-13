import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { OrganizationalTree } from "@/components/officials/organizational-tree";

export const metadata: Metadata = {
  title: "Municipal Officials",
  description:
    "Meet the elected executive and legislative leaders serving the constituents of the Municipality of San Felipe, Zambales.",
};

export default function MunicipalOfficialsPage() {
  return (
    <>
      {/* Header strictly matching approved design */}
      <PageHeader
        eyebrow="SAN FELIPE, ZAMBALES"
        title="Municipal Officials"
        description="Meet the elected executive and legislative leaders serving the constituents of the Municipality of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Government", href: "/government" },
          { label: "Municipal Officials" },
        ]}
      />

      {/* Municipal Government Leadership Tree */}
      <OrganizationalTree />
    </>
  );
}
