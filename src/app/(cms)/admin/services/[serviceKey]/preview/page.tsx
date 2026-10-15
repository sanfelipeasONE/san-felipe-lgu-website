import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Layers,
  FileText,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminServicePage } from "@/server/services/service";
import { formatBytes } from "@/lib/validation/documents";
import { isCanonicalServiceKey } from "@/config/services-canonical";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const instant = false;

export const metadata: Metadata = {
  title: "Service Page CMS Preview | San Felipe LGU CMS",
  description: "Internal authenticated preview of draft service page content",
};

interface PreviewServicePageProps {
  params: Promise<{
    serviceKey: string;
  }>;
}

export default async function AdminServicePreviewPage({ params }: PreviewServicePageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.SERVICES_VIEW)) {
    redirect("/admin");
  }

  const { serviceKey } = await params;

  if (!isCanonicalServiceKey(serviceKey)) {
    notFound();
  }

  let servicePage;
  try {
    servicePage = await getAdminServicePage(user, serviceKey);
  } catch {
    notFound();
  }

  // Office scope check
  if (!isSystemScoped(user)) {
    if (!user.officeId || (servicePage.officeId && servicePage.officeId !== user.officeId)) {
      redirect("/admin/services");
    }
  }

  const isCitizensCharter = servicePage.serviceKey === "citizens-charter";
  const isBusinessPermits = servicePage.serviceKey === "business-permits";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Internal Draft Preview Sticky Warning Banner */}
      <div className="bg-amber-500 text-amber-950 px-4 py-3 sticky top-0 z-50 border-b border-amber-600 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-900" aria-hidden="true" />
            <span>
              <strong>CMS DRAFT PREVIEW:</strong> You are previewing unpublished draft content for{" "}
              <code className="bg-amber-600/30 px-1 py-0.5 rounded font-mono">
                /services/{servicePage.serviceKey}
              </code>
              . This content is NOT visible to the public.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/services/${servicePage.serviceKey}/edit`}
              className="inline-flex items-center h-7 px-2.5 rounded-xs text-xs bg-white text-amber-950 border border-amber-400 hover:bg-amber-100 font-bold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              <span>Return to Editor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Public Page Presentation Simulation */}
      <main className="flex-1 pb-16">
        <PageHeader
          eyebrow="PUBLIC SERVICES PREVIEW"
          title={servicePage.title}
          description={
            servicePage.description ||
            "Official municipal frontline guidelines and procedural standards published by the Local Government Unit of San Felipe."
          }
          breadcrumbs={[
            { label: "Services" },
            { label: servicePage.title },
          ]}
        />

        <Container className="py-10">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Office Attribution Badge (if assigned) */}
            {servicePage.office && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-white border border-gray-200 text-xs text-gov-charcoal shadow-2xs">
                <Building2 className="h-4 w-4 text-burgundy-700" aria-hidden="true" />
                <span>
                  Publishing Office: <strong>{servicePage.office.name}</strong>
                </span>
              </div>
            )}

            {/* BRANCH A: CITIZEN'S CHARTER PREVIEW */}
            {isCitizensCharter && (
              <>
                {servicePage.charterDocument ? (
                  <div className="bg-white rounded-xs border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 bg-burgundy-50 border border-burgundy-100 rounded-xs text-burgundy-800 shrink-0">
                          <FileText className="w-6 h-6" aria-hidden="true" />
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
                          <h2 className="text-base sm:text-lg font-bold text-gov-charcoal">
                            {servicePage.charterDocument.title}
                          </h2>
                          <p className="text-xs text-gov-muted mt-0.5">
                            {servicePage.charterDocument.originalFilename} • PDF •{" "}
                            {formatBytes(servicePage.charterDocument.bytes)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={servicePage.charterDocument.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gov-charcoal text-xs font-semibold rounded-xs shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open PDF</span>
                        </a>
                      </div>
                    </div>

                    <div className="relative w-full bg-slate-100">
                      <iframe
                        src={`${servicePage.charterDocument.storageUrl}#view=FitH`}
                        title="Citizen's Charter PDF Preview"
                        className="w-full h-[600px] border-0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xs p-10 text-center shadow-2xs">
                    <FileText className="h-10 w-10 text-gov-muted/50 mx-auto mb-3" aria-hidden="true" />
                    <h2 className="text-sm font-bold text-gov-charcoal mb-1">
                      No Citizen&apos;s Charter handbook attached
                    </h2>
                    <p className="text-xs text-gov-muted max-w-md mx-auto mb-4">
                      Upload the official handbook PDF in the editor to make it available for citizens.
                    </p>
                    <Link
                      href={`/admin/services/${servicePage.serviceKey}/edit`}
                      className="inline-flex items-center h-8 px-3 rounded-xs text-xs font-medium bg-burgundy-800 text-white hover:bg-burgundy-900 transition-colors"
                    >
                      <span>Upload Charter PDF</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* BRANCH B: BUSINESS PERMITS PREVIEW */}
            {isBusinessPermits && (
              <div className="space-y-6">
                {servicePage.featuredImageUrl && (
                  <div className="overflow-hidden rounded-xs border border-gray-200 bg-white shadow-2xs">
                    <div className="relative aspect-video w-full sm:aspect-[21/9]">
                      <Image
                        src={servicePage.featuredImageUrl}
                        alt={servicePage.featuredImageAlt || servicePage.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 896px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                )}

                {servicePage.sections.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xs p-6 sm:p-8 shadow-2xs">
                    <div
                      className="prose prose-sm sm:prose-base max-w-none text-gov-muted prose-headings:text-gov-charcoal prose-a:text-burgundy-800 prose-strong:text-gov-charcoal leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: servicePage.sections[0]?.content || "",
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xs p-10 text-center shadow-2xs">
                    <Layers className="h-10 w-10 text-gov-muted/50 mx-auto mb-3" aria-hidden="true" />
                    <h2 className="text-sm font-bold text-gov-charcoal mb-1">
                      No guidelines content authored yet
                    </h2>
                    <p className="text-xs text-gov-muted max-w-md mx-auto mb-4">
                      Write guidelines and requirements in the editor.
                    </p>
                    <Link
                      href={`/admin/services/${servicePage.serviceKey}/edit`}
                      className="inline-flex items-center h-8 px-3 rounded-xs text-xs font-medium bg-burgundy-800 text-white hover:bg-burgundy-900 transition-colors"
                    >
                      <span>Edit Content in Editor</span>
                    </Link>
                  </div>
                )}

                {servicePage.attachmentDocument && (
                  <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 bg-burgundy-50 border border-burgundy-100 rounded-xs text-burgundy-800 shrink-0">
                          <FileText className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                              {servicePage.attachmentDocument.purpose === "OTHER_PUBLIC_DOCUMENT"
                                ? "Reference Document"
                                : "Official Downloadable Form"}
                            </span>
                            <span className="text-xs text-gov-muted flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Verified PDF
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-gov-charcoal">
                            {servicePage.attachmentDocument.title}
                          </h3>
                          <p className="text-xs text-gov-muted mt-0.5">
                            {servicePage.attachmentDocument.originalFilename} • PDF •{" "}
                            {formatBytes(servicePage.attachmentDocument.bytes)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={servicePage.attachmentDocument.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:border-burgundy-800 text-gov-charcoal text-xs font-semibold rounded-xs shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open PDF</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BRANCH C: GENERIC SERVICES PREVIEW */}
            {!isCitizensCharter && !isBusinessPermits && (
              <>
                {servicePage.sections.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xs p-10 text-center shadow-2xs">
                    <Layers className="h-10 w-10 text-gov-muted/50 mx-auto mb-3" aria-hidden="true" />
                    <h2 className="text-sm font-bold text-gov-charcoal mb-1">
                      No content sections added yet
                    </h2>
                    <p className="text-xs text-gov-muted max-w-md mx-auto mb-4">
                      This service page does not contain any published content sections. In public view, this will render the neutral service empty state.
                    </p>
                    <Link
                      href={`/admin/services/${servicePage.serviceKey}/edit`}
                      className="inline-flex items-center h-8 px-3 rounded-xs text-xs font-medium bg-burgundy-800 text-white hover:bg-burgundy-900 transition-colors"
                    >
                      <span>Add Sections in Editor</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {servicePage.sections.map((section) => (
                      <div
                        key={section.id}
                        className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs space-y-3"
                      >
                        <div className="border-b border-gray-100 pb-2">
                          <h2 className="text-base sm:text-lg font-bold text-gov-charcoal">
                            {section.title}
                          </h2>
                        </div>

                        <div
                          className="prose prose-sm max-w-none text-gov-muted prose-headings:text-gov-charcoal prose-a:text-burgundy-800 prose-strong:text-gov-charcoal leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}
