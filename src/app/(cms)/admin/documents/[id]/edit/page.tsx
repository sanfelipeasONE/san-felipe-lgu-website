import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminDocumentById, DocumentError } from "@/server/documents/service";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { DocumentForm } from "@/components/admin/document-form";
import type { DocumentPurpose } from "@/lib/validation/documents";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Document | San Felipe LGU CMS",
  description: "Update municipal document metadata, replace file asset, or manage lifecycle status",
};

interface EditDocumentPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
}

export default async function EditDocumentPage({
  params,
  searchParams,
}: EditDocumentPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    redirect("/admin/documents");
  }

  const { id } = await params;
  const sParams = searchParams ? await searchParams : undefined;

  let doc;
  try {
    doc = await getAdminDocumentById(user, id);
  } catch (err: unknown) {
    if (err instanceof DocumentError && err.statusCode === 404) {
      notFound();
    }
    // Office scope or permission failure
    redirect("/admin/documents");
  }

  const isProcurement =
    sParams?.returnTo === "procurement" ||
    (doc.purpose === "OTHER_PUBLIC_DOCUMENT" && doc.category === "Procurement");

  const isBac =
    sParams?.returnTo === "bac" ||
    (doc.purpose === "OTHER_PUBLIC_DOCUMENT" && doc.category === "Bids and Awards Committee (BAC)");

  const isSystem = isSystemScoped(user);

  let officesList: Array<{ id: string; name: string }> = [];
  if (isSystem) {
    officesList = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  const canPublish = hasPermission(user, PERMISSIONS.DOCUMENTS_PUBLISH);
  const canArchive = hasPermission(user, PERMISSIONS.DOCUMENTS_ARCHIVE);
  const canDelete =
    hasPermission(user, PERMISSIONS.DOCUMENTS_DELETE) &&
    (isSystem || user.officeId === doc.officeId);

  const breadcrumbs = isBac
    ? [
        { label: "Transparency" },
        { label: "Bids and Awards Committee (BAC)", href: "/admin/transparency/bac" },
        { label: doc.title },
      ]
    : isProcurement
    ? [
        { label: "Transparency" },
        { label: "Procurement", href: "/admin/transparency/procurement" },
        { label: doc.title },
      ]
    : [
        { label: "Documents", href: "/admin/documents" },
        { label: doc.title },
      ];

  const description = isBac
    ? "Update BAC resolution details, replace document asset, or manage publication status."
    : isProcurement
    ? "Update procurement notice details, replace document asset, or manage publication status."
    : "Update form metadata, replace the uploaded document file, or update publication status.";

  const lockPurpose = isBac || isProcurement;
  const lockCategory = isBac || isProcurement;
  const backHref = isBac
    ? "/admin/transparency/bac"
    : isProcurement
    ? "/admin/transparency/procurement"
    : "/admin/documents";
  const backLabel = isBac
    ? "Back to Bids and Awards Committee"
    : isProcurement
    ? "Back to Procurement"
    : "Back to Documents";
  const returnTo = isBac ? "bac" : isProcurement ? "procurement" : undefined;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Edit: ${doc.title}`}
        description={description}
        breadcrumbs={breadcrumbs}
      />

      <AdminContent>
        <DocumentForm
          mode="edit"
          initialData={{
            id: doc.id,
            title: doc.title,
            description: doc.description,
            category: doc.category,
            purpose: doc.purpose as DocumentPurpose,
            status: doc.status,
            officeId: doc.officeId,
            office: {
              id: doc.office.id,
              name: doc.office.name,
            },
            originalFilename: doc.originalFilename,
            format: doc.format,
            bytes: doc.bytes,
            downloadUrl: doc.downloadUrl,
            updatedAt: doc.updatedAt.toISOString(),
          }}
          isSystemScoped={isSystem}
          offices={officesList}
          userOfficeName={doc.office?.name}
          canPublish={canPublish}
          canArchive={canArchive}
          canDelete={canDelete}
          lockPurpose={lockPurpose}
          lockCategory={lockCategory}
          backHref={backHref}
          backLabel={backLabel}
          returnTo={returnTo}
        />
      </AdminContent>
    </div>
  );
}
