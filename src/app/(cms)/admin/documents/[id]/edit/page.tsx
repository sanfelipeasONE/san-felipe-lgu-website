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

export const metadata: Metadata = {
  title: "Edit Document | San Felipe LGU CMS",
  description: "Update municipal document metadata, replace file asset, or manage lifecycle status",
};

interface EditDocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    redirect("/admin/documents");
  }

  const { id } = await params;

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

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Edit: ${doc.title}`}
        description="Update form metadata, replace the uploaded document file, or update publication status."
        breadcrumbs={[
          { label: "Documents", href: "/admin/documents" },
          { label: doc.title },
        ]}
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
        />
      </AdminContent>
    </div>
  );
}
