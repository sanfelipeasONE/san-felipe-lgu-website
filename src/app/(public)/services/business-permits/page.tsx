import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BusinessPermitsView } from "@/components/services/business-permits-view";
import { getPublishedServicePage } from "@/server/services/service";
import { getDocumentDownloadUrl } from "@/server/media/cloudinary-documents";
import { formatBytes } from "@/lib/validation/documents";
import {
  Building2,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const publishedPage = await getPublishedServicePage("business-permits");
  return {
    title: publishedPage?.title || "Business Permits",
    description:
      publishedPage?.description ||
      "Online business permit application and renewal portal for the Municipality of San Felipe, Zambales.",
  };
}

export default async function BusinessPermitsPage() {
  const publishedPage = await getPublishedServicePage("business-permits");

  const hasPublishedContent = Boolean(
    publishedPage && publishedPage.sections.length > 0
  );

  return (
    <main>
      <PageHeader
        eyebrow="PUBLIC SERVICES"
        title={publishedPage?.title || "Business Permits"}
        description={
          publishedPage?.description ||
          "Apply for or renew business permits in the Municipality of San Felipe, Zambales."
        }
        breadcrumbs={[
          { label: "Services" },
          { label: "Business Permits" },
        ]}
      />

      <div className="py-10 sm:py-14 bg-slate-50/50">
        <Container>
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Primary Online Business Permit Portal Action (iBPLS) */}
            <ScrollReveal>
              <div className="bg-white border border-gray-200 rounded-xs p-8 sm:p-10 text-center shadow-2xs">
                {/* Clickable iBPLS Logo */}
                <div className="flex justify-center mb-6">
                  <a
                    href="https://bpbc.ibpls.com/sanfelipezambales/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open San Felipe iBPLS Business Permit Portal"
                    title="Open San Felipe iBPLS Business Permit Portal"
                    className="inline-block hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
                  >
                    <div className="relative w-64 sm:w-72 h-16 sm:h-18">
                      <Image
                        src="/images/ibpls-500x117.png"
                        alt="Integrated Business Permits and Licensing System (iBPLS)"
                        fill
                        sizes="(max-width: 640px) 256px, 288px"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </a>
                </div>

                {/* Portal Title & Concise Description */}
                <h2 className="text-xl sm:text-2xl font-bold text-gov-charcoal tracking-tight mb-2">
                  Online Business Permit Portal
                </h2>
                <p className="text-sm text-gov-muted max-w-lg mx-auto leading-relaxed mb-6">
                  Apply for or renew a business permit through the Integrated Business Permits and Licensing System (iBPLS).
                </p>

                {/* Primary Action Button */}
                <div>
                  <a
                    href="https://bpbc.ibpls.com/sanfelipezambales/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open San Felipe iBPLS Business Permit Portal"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-burgundy-800 hover:bg-burgundy-900 text-white text-sm font-semibold rounded-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                  >
                    <span>Open iBPLS Portal</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {hasPublishedContent && publishedPage ? (
              <>
                {/* Office Attribution (if assigned) */}
                {publishedPage.office && (
                  <ScrollReveal>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xs bg-white border border-gray-200 text-xs text-gov-charcoal shadow-2xs">
                      <Building2 className="h-4 w-4 text-burgundy-700 shrink-0" aria-hidden="true" />
                      <span>
                        Publishing Office: <strong>{publishedPage.office.name}</strong>
                      </span>
                    </div>
                  </ScrollReveal>
                )}

                {/* Optional Featured Image */}
                {publishedPage.featuredImageUrl && (
                  <ScrollReveal>
                    <div className="overflow-hidden rounded-xs border border-gray-200 bg-white shadow-2xs">
                      <div className="relative aspect-video w-full sm:aspect-[21/9]">
                        <Image
                          src={publishedPage.featuredImageUrl}
                          alt={publishedPage.featuredImageAlt || publishedPage.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 896px"
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>
                  </ScrollReveal>
                )}

                {/* Canonical Rich-Text Body */}
                <ScrollReveal>
                  <div className="bg-white border border-gray-200 rounded-xs p-6 sm:p-8 shadow-2xs">
                    <div
                      className="prose prose-sm sm:prose-base max-w-none text-gov-muted prose-headings:text-gov-charcoal prose-a:text-burgundy-800 prose-strong:text-gov-charcoal leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: publishedPage.sections[0]?.content || "",
                      }}
                    />
                  </div>
                </ScrollReveal>

                {/* Official Document Attachment Card (if present) */}
                {publishedPage.attachmentDocument && (
                  <ScrollReveal>
                    <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="p-3 bg-burgundy-50 border border-burgundy-100 rounded-xs text-burgundy-800 shrink-0">
                            <FileText className="w-6 h-6" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                                {publishedPage.attachmentDocument.purpose === "OTHER_PUBLIC_DOCUMENT"
                                  ? "Reference Document"
                                  : "Official Downloadable Form"}
                              </span>
                              <span className="text-xs text-gov-muted flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Verified PDF
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gov-charcoal">
                              {publishedPage.attachmentDocument.title}
                            </h3>
                            <p className="text-xs text-gov-muted mt-0.5">
                              {publishedPage.attachmentDocument.originalFilename} • PDF •{" "}
                              {formatBytes(publishedPage.attachmentDocument.bytes)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          <a
                            href={publishedPage.attachmentDocument.storageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:border-burgundy-800 text-gov-charcoal hover:text-burgundy-800 text-xs font-semibold rounded-xs transition-colors shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open PDF</span>
                          </a>
                          <a
                            href={getDocumentDownloadUrl(
                              publishedPage.attachmentDocument.storagePublicId,
                              publishedPage.attachmentDocument.originalFilename
                            )}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                )}
              </>
            ) : (
              <BusinessPermitsView />
            )}
          </div>
        </Container>
      </div>
    </main>
  );
}
