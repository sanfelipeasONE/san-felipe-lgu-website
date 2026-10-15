import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CitizensCharterView } from "@/components/services/citizens-charter-view";
import { PublishedServiceSections } from "@/components/services/published-service-sections";
import { getCitizensCharterEntries } from "@/config/services-data";
import { getPublishedServicePage } from "@/server/services/service";
import { getDocumentDownloadUrl } from "@/server/media/cloudinary-documents";
import { formatBytes } from "@/lib/validation/documents";
import { FileText, Download, ExternalLink, ShieldCheck, Info } from "lucide-react";

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

  const validCharterDoc =
    publishedPage?.charterDocument &&
    publishedPage.charterDocument.status === "PUBLISHED" &&
    publishedPage.charterDocument.purpose === "CITIZENS_CHARTER"
      ? publishedPage.charterDocument
      : null;

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

      {/* Official Managed Citizen's Charter PDF Section */}
      <section className="py-8 bg-slate-50 border-b border-gray-200">
        <Container>
          {validCharterDoc ? (
            <ScrollReveal>
              <div className="bg-white rounded-xs border border-gray-200 shadow-sm overflow-hidden space-y-0">
                {/* Header Information Card & Explicit Actions */}
                <div className="p-6 sm:p-8 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-burgundy-50 border border-burgundy-100 rounded-xs text-burgundy-800 shrink-0">
                      <FileText className="w-8 h-8" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                          Official LGU Publication
                        </span>
                        <span className="text-xs text-gov-muted flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Verified PDF
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-gov-charcoal">
                        {validCharterDoc.title}
                      </h2>
                      <p className="text-xs text-gov-muted mt-1">
                        {validCharterDoc.originalFilename} • PDF • {formatBytes(validCharterDoc.bytes)} • Official Municipal Frontline Service Handbook
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <a
                      href={validCharterDoc.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:border-burgundy-800 text-gov-charcoal hover:text-burgundy-800 text-xs font-semibold rounded-xs transition-colors shadow-2xs flex-1 sm:flex-initial"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open PDF</span>
                    </a>
                    <a
                      href={getDocumentDownloadUrl(
                        validCharterDoc.storagePublicId,
                        validCharterDoc.originalFilename
                      )}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs flex-1 sm:flex-initial"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>

                {/* Embedded Native PDF Viewer */}
                <div className="relative w-full bg-slate-100 border-b border-gray-200">
                  <iframe
                    src={`${validCharterDoc.storageUrl}#view=FitH`}
                    title={`${validCharterDoc.title} - Official Citizen's Charter PDF Handbook Viewer`}
                    className="w-full h-[75vh] min-h-[600px] border-0"
                    loading="lazy"
                  />
                </div>

                {/* Mobile & Browser Helper Notice */}
                <div className="p-4 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gov-muted gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gov-muted shrink-0" aria-hidden="true" />
                    <span>
                      Viewing on a mobile device or browser without inline PDF support? Use the <strong>Open PDF</strong> or <strong>Download PDF</strong> buttons above to read the complete handbook.
                    </span>
                  </div>
                  <a
                    href={validCharterDoc.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-semibold text-burgundy-800 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Full Screen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ) : (
            /* Honest Public Empty State when no official Charter PDF is associated */
            <ScrollReveal>
              <div className="bg-white rounded-xs border border-gray-200 p-8 sm:p-10 text-center max-w-2xl mx-auto shadow-2xs">
                <div className="w-12 h-12 bg-slate-100 text-gov-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-gov-muted" aria-hidden="true" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gov-charcoal mb-2">
                  Citizen&apos;s Charter PDF not currently available
                </h2>
                <p className="text-xs sm:text-sm text-gov-muted leading-relaxed">
                  The official Citizen&apos;s Charter PDF will be available here once published by the Municipality of San Felipe.
                </p>
              </div>
            </ScrollReveal>
          )}
        </Container>
      </section>

      {hasPublishedContent && publishedPage ? (
        <PublishedServiceSections
          office={publishedPage.office}
          sections={publishedPage.sections}
        />
      ) : !validCharterDoc ? (
        <CitizensCharterView entries={entries} />
      ) : null}
    </main>
  );
}
