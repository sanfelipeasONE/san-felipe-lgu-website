import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Layers,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminServicePage } from "@/server/services/service";
import { isCanonicalServiceKey } from "@/config/services-canonical";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

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
          {/* Office Attribution Badge (if assigned) */}
          {servicePage.office && (
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-white border border-gray-200 text-xs text-gov-charcoal shadow-2xs">
              <Building2 className="h-4 w-4 text-burgundy-700" aria-hidden="true" />
              <span>
                Publishing Office: <strong>{servicePage.office.name}</strong>
              </span>
            </div>
          )}

          {/* Sections List */}
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
            <div className="space-y-6 max-w-4xl">
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
        </Container>
      </main>
    </div>
  );
}
