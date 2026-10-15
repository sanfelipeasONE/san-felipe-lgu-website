import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getPublishedServicePage } from "@/server/services/service";
import { formatBytes } from "@/lib/validation/documents";
import { SITE_CONFIG } from "@/config/site";
import { FileText, Download, ShieldCheck, MapPin, Phone } from "lucide-react";

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
  const publishedPage = await getPublishedServicePage("citizens-charter");

  const validCharterDoc =
    publishedPage?.charterDocument &&
    publishedPage.charterDocument.status === "PUBLISHED" &&
    publishedPage.charterDocument.purpose === "CITIZENS_CHARTER"
      ? publishedPage.charterDocument
      : null;

  return (
    <div className="flex-1 flex flex-col">
      {validCharterDoc ? (
        <>
          {/* Compact Official Header Bar */}
          <section className="bg-white border-b border-gray-200">
            <Container>
              <div className="py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                      Official LGU Publication
                    </span>
                    <span className="text-xs text-gov-muted flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified PDF
                    </span>
                    <span className="text-xs text-gov-muted hidden sm:inline">
                      • {formatBytes(validCharterDoc.bytes)}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gov-charcoal">
                    {publishedPage?.title || "Citizen's Charter"}
                  </h1>
                  <p className="text-xs text-gov-muted mt-1 max-w-2xl leading-relaxed">
                    {publishedPage?.description ||
                      "Official municipal frontline service standards, procedural requirements, processing turnaround times, and fee schedules published by the Municipality of San Felipe, Zambales."}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href={`/documents/${validCharterDoc.id}/download`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            </Container>
          </section>

          {/* Desktop Viewport-Aware Portrait Native PDF Viewer */}
          <section className="hidden md:block py-3 sm:py-4 bg-slate-100 border-b border-gray-200">
            <Container>
              <div className="w-full bg-white rounded-xs border border-gray-300 shadow-2xs overflow-hidden">
                <iframe
                  src={`/documents/${validCharterDoc.id}/view#view=Fit`}
                  title={`${validCharterDoc.title} - Official Citizen's Charter PDF Handbook Viewer`}
                  className="w-full h-[calc(100dvh-220px)] min-h-[500px] border-0 block"
                  loading="lazy"
                />
              </div>
            </Container>
          </section>

          {/* Mobile Presentation (Screens < 768px) */}
          <section className="md:hidden py-6 bg-slate-50 border-b border-gray-200">
            <Container>
              <div className="bg-white rounded-xs border border-gray-200 p-6 shadow-2xs text-center space-y-4">
                <div className="w-12 h-12 bg-burgundy-50 border border-burgundy-100 rounded-full flex items-center justify-center mx-auto text-burgundy-800">
                  <FileText className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                    Official LGU Publication
                  </span>
                  <h2 className="text-base font-bold text-gov-charcoal mt-2">
                    {validCharterDoc.title}
                  </h2>
                  <p className="text-xs text-gov-muted mt-1">
                    PDF • {formatBytes(validCharterDoc.bytes)} • Official Municipal Frontline Service Handbook
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={`/documents/${validCharterDoc.id}/download`}
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>
                </div>

                <p className="text-[11px] text-gov-muted leading-relaxed pt-2">
                  Official municipal frontline service handbook. Tap Download PDF to save a local copy to your device.
                </p>
              </div>
            </Container>
          </section>
        </>
      ) : (
        /* Exactly ONE authoritative unavailable state when no PDF is attached */
        <>
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
          <section className="py-16 sm:py-20 bg-slate-50">
            <Container>
              <ScrollReveal>
                <div className="bg-white rounded-xs border border-gray-200 p-8 sm:p-10 text-center max-w-2xl mx-auto shadow-2xs">
                  <div className="w-12 h-12 bg-slate-100 text-gov-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-gov-muted" aria-hidden="true" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gov-charcoal mb-2">
                    Citizen&apos;s Charter PDF not currently available
                  </h2>
                  <p className="text-xs sm:text-sm text-gov-muted leading-relaxed mb-6">
                    The official Citizen&apos;s Charter PDF will be available here once published by the Municipality of San Felipe.
                  </p>
                  <div className="pt-6 border-t border-gray-100 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3 text-center sm:text-left">
                      In-Person Assistance &amp; Public Inquiries
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gov-muted">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-burgundy-700 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{SITE_CONFIG.contact.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-burgundy-700 shrink-0" aria-hidden="true" />
                        <span>{SITE_CONFIG.contact.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </Container>
          </section>
        </>
      )}
    </div>
  );
}
