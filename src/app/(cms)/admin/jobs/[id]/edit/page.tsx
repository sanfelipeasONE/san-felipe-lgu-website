import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminJobById, JobError } from "@/server/jobs/service";
import { OfficeStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { AdminContent } from "@/components/admin/admin-content";
import { JobForm, type OfficeOption, type DocumentOption } from "@/components/admin/job-form";

export const metadata: Metadata = {
  title: "Edit Job Vacancy | San Felipe LGU CMS",
  description: "Edit vacancy announcement details, qualification standards, and publication status",
};

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobOpportunityPage({ params }: EditJobPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.JOBS_VIEW)) {
    redirect("/admin/jobs");
  }

  const { id } = await params;

  let job;
  try {
    job = await getAdminJobById(user, id);
  } catch (err: unknown) {
    if (err instanceof JobError && err.statusCode === 404) {
      notFound();
    }
    if (err instanceof JobError && err.statusCode === 403) {
      redirect("/admin/jobs?error=forbidden");
    }
    throw err;
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
    userOfficeName = job.office.name;
  }

  // Load available documents for attachment linking only if user has document view permission
  let documents: DocumentOption[] = [];
  if (hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    const docsWhere: Prisma.DocumentWhereInput = isSystem
      ? { office: { status: OfficeStatus.ACTIVE } }
      : { officeId: job.officeId };

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
          mode="edit"
          initialData={{
            id: job.id,
            title: job.title,
            itemNumber: job.itemNumber,
            officeId: job.officeId,
            employmentType: job.employmentType,
            salaryGrade: job.salaryGrade,
            monthlySalary: job.monthlySalary,
            description: job.description,
            education: job.education,
            training: job.training,
            experience: job.experience,
            eligibility: job.eligibility,
            competency: job.competency,
            applicationInstructions: job.applicationInstructions,
            postingDate: job.postingDate ? job.postingDate.toISOString() : null,
            closingDate: job.closingDate ? job.closingDate.toISOString() : null,
            status: job.status,
            isClosed: job.isClosed,
            attachmentDocumentId: job.attachmentDocumentId,
            updatedAt: job.updatedAt.toISOString(),
          }}
          isSystemScoped={isSystem}
          offices={offices}
          documents={documents}
          userOfficeName={userOfficeName}
          canPublish={hasPermission(user, PERMISSIONS.JOBS_PUBLISH)}
          canArchive={hasPermission(user, PERMISSIONS.JOBS_ARCHIVE)}
          canDelete={
            hasPermission(user, PERMISSIONS.JOBS_DELETE) &&
            (isSystem || user.officeId === job.officeId)
          }
        />
      </AdminContent>
    </div>
  );
}
