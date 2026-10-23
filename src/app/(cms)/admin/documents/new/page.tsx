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

export const instant = false;

export const metadata: Metadata = {
  title: "Upload New Document | San Felipe LGU CMS",
  description: "Upload and prepare official municipal forms and documents for publication",
};

interface CreateDocumentPageProps {
  searchParams: Promise<{
    purpose?: string;
    category?: string;
    returnTo?: string;
  }>;
}

export default async function CreateDocumentPage({ searchParams }: CreateDocumentPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_CREATE)) {
    redirect("/admin/documents");
  }

  const params = await searchParams;
  const isProcurement =
    params.returnTo === "procurement" ||
    params.category === "Procurement" ||
    (params.purpose === "OTHER_PUBLIC_DOCUMENT" && params.category === "Procurement");

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

  const title = isProcurement ? "Add Procurement Document" : "Upload Municipal Document";
  const description = isProcurement
    ? "Upload official procurement notices, invitations to bid, and public disclosures for municipal transparency."
    : "Upload official application forms, procedural guidelines, or civic templates for citizen access.";

  const breadcrumbs = isProcurement
    ? [
        { label: "Transparency" },
        { label: "Procurement", href: "/admin/transparency/procurement" },
        { label: "Add Document" },
      ]
    : [
        { label: "Documents", href: "/admin/documents" },
        { label: "Upload Document" },
      ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />

      <AdminContent>
        <DocumentForm
          mode="create"
          isSystemScoped={isSystem}
          offices={officesList}
          userOfficeName={userOfficeName}
          defaultPurpose={isProcurement ? "OTHER_PUBLIC_DOCUMENT" : undefined}
          defaultCategory={isProcurement ? "Procurement" : params.category}
          lockPurpose={isProcurement}
          lockCategory={isProcurement}
          backHref={isProcurement ? "/admin/transparency/procurement" : "/admin/documents"}
          backLabel={isProcurement ? "Back to Procurement" : "Back to Documents"}
          returnTo={isProcurement ? "procurement" : params.returnTo}
        />
      </AdminContent>
    </div>
  );
}
