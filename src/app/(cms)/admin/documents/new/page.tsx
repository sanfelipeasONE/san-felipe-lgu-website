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

  const isBac =
    params.returnTo === "bac" ||
    params.category === "Bids and Awards Committee (BAC)" ||
    (params.purpose === "OTHER_PUBLIC_DOCUMENT" && params.category === "Bids and Awards Committee (BAC)");

  const isGad =
    params.returnTo === "gad" ||
    params.category === "Gender and Development (GAD)" ||
    (params.purpose === "OTHER_PUBLIC_DOCUMENT" && params.category === "Gender and Development (GAD)");

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

  const title = isGad
    ? "Upload GAD Resource"
    : isBac
    ? "Add BAC Document"
    : isProcurement
    ? "Add Procurement Document"
    : "Upload Municipal Document";

  const description = isGad
    ? "Upload official GAD plans, annual budgets, accomplishment narratives, and gender development public resources."
    : isBac
    ? "Upload official resolutions, bidding invitations, and public procurement disclosures issued by the Bids and Awards Committee."
    : isProcurement
    ? "Upload official procurement notices, invitations to bid, and public disclosures for municipal transparency."
    : "Upload official application forms, procedural guidelines, or civic templates for citizen access.";

  const breadcrumbs = isGad
    ? [
        { label: "Content Management" },
        { label: "GAD Corner", href: "/admin/gad" },
        { label: "Add Resource" },
      ]
    : isBac
    ? [
        { label: "Transparency" },
        { label: "Bids and Awards Committee (BAC)", href: "/admin/transparency/bac" },
        { label: "Add Document" },
      ]
    : isProcurement
    ? [
        { label: "Transparency" },
        { label: "Procurement", href: "/admin/transparency/procurement" },
        { label: "Add Document" },
      ]
    : [
        { label: "Documents", href: "/admin/documents" },
        { label: "Upload Document" },
      ];

  const defaultPurpose = isBac || isProcurement || isGad ? "OTHER_PUBLIC_DOCUMENT" : undefined;
  const defaultCategory = isBac
    ? "Bids and Awards Committee (BAC)"
    : isProcurement
    ? "Procurement"
    : isGad
    ? "Gender and Development (GAD)"
    : params.category;
  const lockPurpose = isBac || isProcurement || isGad;
  const lockCategory = isBac || isProcurement || isGad;
  const backHref = isBac
    ? "/admin/transparency/bac"
    : isProcurement
    ? "/admin/transparency/procurement"
    : isGad
    ? "/admin/gad"
    : "/admin/documents";
  const backLabel = isBac
    ? "Back to Bids and Awards Committee"
    : isProcurement
    ? "Back to Procurement"
    : isGad
    ? "Back to GAD Corner"
    : "Back to Documents";
  const returnTo = isBac ? "bac" : isProcurement ? "procurement" : isGad ? "gad" : params.returnTo;

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
          defaultPurpose={defaultPurpose}
          defaultCategory={defaultCategory}
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
