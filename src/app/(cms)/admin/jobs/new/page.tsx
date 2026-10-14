import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { OfficeStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { AdminContent } from "@/components/admin/admin-content";
import { JobForm, type OfficeOption, type DocumentOption } from "@/components/admin/job-form";

export const metadata: Metadata = {
  title: "Create Job Vacancy | San Felipe LGU CMS",
  description: "Draft a new official municipal career vacancy announcement",
};

export default async function NewJobOpportunityPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.JOBS_CREATE)) {
    redirect("/admin/jobs");
  }

  const isSystem = isSystemScoped(user);

  let offices: OfficeOption[] = [];
  let userOfficeName: string | undefined;

  if (isSystem) {
    offices = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    });
  } else {
    if (!user.officeId) {
      redirect("/admin/jobs");
    }
    const office = await prisma.office.findUnique({
      where: { id: user.officeId },
      select: { name: true },
    });
    userOfficeName = office?.name;
  }

  // Load available documents for attachment linking only if user has document view permission
  let documents: DocumentOption[] = [];
  if (hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    const docsWhere: Prisma.DocumentWhereInput = isSystem
      ? { office: { status: OfficeStatus.ACTIVE } }
      : { officeId: user.officeId! };

    const availableDocs = await prisma.document.findMany({
      where: docsWhere,
      select: {
        id: true,
        title: true,
        originalFilename: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    documents = availableDocs.map((d) => ({
      id: d.id,
      title: d.title,
      originalFilename: d.originalFilename,
    }));
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminContent>
        <JobForm
          mode="create"
          isSystemScoped={isSystem}
          offices={offices}
          documents={documents}
          userOfficeName={userOfficeName}
          canPublish={hasPermission(user, PERMISSIONS.JOBS_PUBLISH)}
          canArchive={hasPermission(user, PERMISSIONS.JOBS_ARCHIVE)}
        />
      </AdminContent>
    </div>
  );
}
