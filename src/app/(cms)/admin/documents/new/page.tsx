import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { DocumentForm } from "@/components/admin/document-form";

export const metadata: Metadata = {
  title: "Upload New Document | San Felipe LGU CMS",
  description: "Upload and prepare official municipal forms and documents for publication",
};

export default async function CreateDocumentPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_CREATE)) {
    redirect("/admin/documents");
  }

  const isSystem = isSystemScoped(user);

  let officesList: Array<{ id: string; name: string }> = [];
  let userOfficeName: string | undefined;

  if (isSystem) {
    officesList = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else if (user.officeId) {
    const userOffice = await prisma.office.findUnique({
      where: { id: user.officeId },
      select: { name: true },
    });
    userOfficeName = userOffice?.name;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Upload Municipal Document"
        description="Upload official application forms, procedural guidelines, or civic templates for citizen access."
        breadcrumbs={[
          { label: "Downloadable Forms", href: "/admin/documents" },
          { label: "Upload Document" },
        ]}
      />

      <AdminContent>
        <DocumentForm
          mode="create"
          isSystemScoped={isSystem}
          offices={officesList}
          userOfficeName={userOfficeName}
        />
      </AdminContent>
    </div>
  );
}
