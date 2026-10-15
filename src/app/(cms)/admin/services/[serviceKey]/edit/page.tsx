import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminServicePage } from "@/server/services/service";
import { getDocumentDownloadUrl } from "@/server/media/cloudinary-documents";
import { prisma } from "@/server/db/client";
import { isCanonicalServiceKey } from "@/config/services-canonical";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { ServicePageForm } from "@/components/admin/service-page-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Service Page | San Felipe LGU CMS",
  description: "Edit canonical municipal service page guidelines and structured content sections",
};

interface EditServicePageProps {
  params: Promise<{
    serviceKey: string;
  }>;
}

export default async function AdminEditServicePage({ params }: EditServicePageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.SERVICES_VIEW)) {
    redirect("/admin");
  }

  if (!hasPermission(user, PERMISSIONS.SERVICES_UPDATE)) {
    redirect("/admin/services");
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

  // Office scope security check: office-scoped users cannot access other offices' pages
  if (!isSystemScoped(user)) {
    if (!user.officeId || (servicePage.officeId && servicePage.officeId !== user.officeId)) {
      redirect("/admin/services");
    }
    if (!servicePage.officeId) {
      // Unassigned canonical service page requires system scope
      redirect("/admin/services");
    }
  }

  // Load municipal offices for system-scoped administrators
  let officesList: Array<{ id: string; name: string; shortName: string | null }> = [];
  if (isSystemScoped(user)) {
    officesList = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    });
  }

  // Load available Citizen's Charter documents if managing citizens-charter
  let charterDocuments: Array<{
    id: string;
    title: string;
    originalFilename: string;
    status: string;
    bytes: number;
    storageUrl: string;
    downloadUrl: string;
  }> = [];

  if (serviceKey === "citizens-charter") {
    const rawDocs = await prisma.document.findMany({
      where: {
        purpose: "CITIZENS_CHARTER",
        status: "PUBLISHED",
        ...(isSystemScoped(user) ? {} : { officeId: user.officeId! }),
      },
      select: {
        id: true,
        title: true,
        originalFilename: true,
        status: true,
        bytes: true,
        storageUrl: true,
        storagePublicId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    charterDocuments = rawDocs.map((d) => ({
      id: d.id,
      title: d.title,
      originalFilename: d.originalFilename,
      status: d.status,
      bytes: d.bytes,
      storageUrl: d.storageUrl,
      downloadUrl: getDocumentDownloadUrl(d.storagePublicId, d.originalFilename),
    }));
  }

  // Load available attachment documents if managing business-permits
  let attachmentDocuments: Array<{
    id: string;
    title: string;
    originalFilename: string;
    status: string;
    purpose: string;
    bytes: number;
    storageUrl: string;
    downloadUrl: string;
  }> = [];

  if (serviceKey === "business-permits") {
    const rawDocs = await prisma.document.findMany({
      where: {
        purpose: { in: ["DOWNLOADABLE_FORM", "OTHER_PUBLIC_DOCUMENT"] },
        status: "PUBLISHED",
        ...(isSystemScoped(user) ? {} : { officeId: user.officeId! }),
      },
      select: {
        id: true,
        title: true,
        originalFilename: true,
        status: true,
        purpose: true,
        bytes: true,
        storageUrl: true,
        storagePublicId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    attachmentDocuments = rawDocs.map((d) => ({
      id: d.id,
      title: d.title,
      originalFilename: d.originalFilename,
      status: d.status,
      purpose: d.purpose,
      bytes: d.bytes,
      storageUrl: d.storageUrl,
      downloadUrl: getDocumentDownloadUrl(d.storagePublicId, d.originalFilename),
    }));
  }

  const charterDocumentWithDownload = servicePage.charterDocument
    ? {
        ...servicePage.charterDocument,
        downloadUrl: getDocumentDownloadUrl(
          servicePage.charterDocument.storagePublicId,
          servicePage.charterDocument.originalFilename
        ),
      }
    : null;

  const attachmentDocumentWithDownload = servicePage.attachmentDocument
    ? {
        ...servicePage.attachmentDocument,
        downloadUrl: getDocumentDownloadUrl(
          servicePage.attachmentDocument.storagePublicId,
          servicePage.attachmentDocument.originalFilename
        ),
      }
    : null;

  const canPublish = hasPermission(user, PERMISSIONS.SERVICES_PUBLISH);

  return (
    <AdminContent>
      <AdminPageHeader
        title={`Edit: ${servicePage.title}`}
        description={`Manage published procedures, guidelines, and ordered content sections for /services/${servicePage.serviceKey}.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Municipal Services", href: "/admin/services" },
          { label: servicePage.title },
        ]}
      />

      <ServicePageForm
        servicePage={{
          ...servicePage,
          charterDocument: charterDocumentWithDownload,
          attachmentDocument: attachmentDocumentWithDownload,
        }}
        offices={officesList}
        charterDocuments={charterDocuments}
        attachmentDocuments={attachmentDocuments}
        isSystemScoped={isSystemScoped(user)}
        canPublish={canPublish}
      />
    </AdminContent>
  );
}
