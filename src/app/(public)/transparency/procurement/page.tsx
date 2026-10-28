import type { Metadata } from "next";
import { FileText, Download, Eye, MapPin, Info } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getPublishedDocuments } from "@/server/documents/service";

export const instant = false;

export const metadata: Metadata = {
  title: "Procurement & Bidding Notices | Municipality of San Felipe",
  description:
    "Official public procurement documents, invitations to bid, and procurement notices published by the Municipal Government of San Felipe, Zambales.",
};

export default async function ProcurementPage() {
  const procurementDocs = await getPublishedDocuments({
    purpose: "OTHER_PUBLIC_DOCUMENT",
    category: ["Procurement", "Bids and Awards Committee (BAC)"],
  });

  return (
    <main>
      <PageHeader
        eyebrow="TRANSPARENCY & ACCOUNTABILITY"
        title="Procurement"
        description="Official public procurement notices, bidding opportunities, and procurement publications issued by the Municipal Government of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Transparency" },
          { label: "Procurement" },
        ]}
      />

      <section className="py-10 sm:py-14 bg-slate-50/50 min-h-[420px]">
        <Container>
          <ScrollReveal>
            {procurementDocs.length === 0 ? (
              <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xs p-8 sm:p-10 shadow-2xs text-center space-y-4">
                <div className="w-12 h-12 bg-burgundy-50 border border-burgundy-100 rounded-full flex items-center justify-center mx-auto text-burgundy-800">
                  <FileText className="w-6 h-6" aria-hidden="true" />
                </div>

                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block">
                    Procurement Disclosures
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gov-charcoal mt-3">
                    No procurement documents are currently published.
                  </h2>
                  <div className="w-10 h-0.5 bg-gold-500 mx-auto mt-3 mb-3" aria-hidden="true" />
                </div>

                <p className="text-sm text-gov-muted max-w-xl mx-auto leading-relaxed">
                  Official procurement notices, bidding opportunities, and public disclosures issued by the Municipal Government of San Felipe will appear here as they are published.
                </p>

                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
                    Municipal Hall Compound, San Felipe, Zambales
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
                    Bids and Awards Committee (BAC) Secretariat
                  </span>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xs shadow-2xs divide-y divide-gray-100">
                {procurementDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700">
                          {doc.category || "Procurement"}
                        </span>
                        {doc.office?.name ? (
                          <span className="text-[11px] font-semibold text-gov-muted">
                            {doc.office.name}
                          </span>
                        ) : doc.category === "Bids and Awards Committee (BAC)" ? (
                          <span className="text-[11px] font-semibold text-burgundy-700">
                            Bids and Awards Committee (BAC)
                          </span>
                        ) : null}
                        <span className="text-[10px] font-mono font-bold text-burgundy-800 uppercase px-1.5 py-0.5 bg-burgundy-50 rounded-xs">
                          {doc.format} • {doc.fileSizeFormatted}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gov-charcoal">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-xs text-gov-muted leading-relaxed">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/documents/${doc.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-bold text-gov-charcoal bg-slate-100 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 transition-colors"
                        aria-label={`View ${doc.title}`}
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>View</span>
                      </a>
                      <a
                        href={`/documents/${doc.id}/download`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-bold text-white bg-burgundy-800 hover:bg-burgundy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 transition-colors shadow-2xs"
                        aria-label={`Download ${doc.title}`}
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </Container>
      </section>
    </main>
  );
}
