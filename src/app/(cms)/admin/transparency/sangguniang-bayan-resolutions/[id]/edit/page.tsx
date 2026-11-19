import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import {
  getAdminResolutionById,
  ResolutionError,
} from "@/server/resolutions/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { SbResolutionForm } from "@/components/admin/sb-resolution-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Sangguniang Bayan Resolution | San Felipe LGU CMS",
  description: "Edit Sangguniang Bayan Resolution metadata, PDF attachment, and publication status.",
};

interface EditSbResolutionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSbResolutionPage({
  params,
}: EditSbResolutionPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!isSystemScoped(user) && !hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_VIEW)) {
    redirect("/admin");
  }

  const { id } = await params;

  let resolution;
  try {
    resolution = await getAdminResolutionById(user, id);
  } catch (err) {
    if (err instanceof ResolutionError && err.statusCode === 403) {
      redirect("/admin");
    }
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Edit ${resolution.resolutionNumber}`}
        description={resolution.title}
        breadcrumbs={[
          { label: "Transparency" },
          {
            label: "Sangguniang Bayan Resolutions",
            href: "/admin/transparency/sangguniang-bayan-resolutions",
          },
          { label: resolution.resolutionNumber },
        ]}
      />

      <AdminContent>
        <SbResolutionForm
          mode="edit"
          initialData={{
            id: resolution.id,
            resolutionNumber: resolution.resolutionNumber,
            title: resolution.title,
            year: resolution.year,
            adoptedAt: resolution.adoptedAt.toISOString().slice(0, 10),
            summary: resolution.summary,
            status: resolution.status,
            originalFilename: resolution.originalFilename,
            fileSizeFormatted: resolution.fileSizeFormatted,
            updatedAt: resolution.updatedAt.toISOString(),
          }}
          permissions={{
            canUpdate:
              isSystemScoped(user) ||
              hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_UPDATE),
            canPublish:
              isSystemScoped(user) ||
              hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_PUBLISH),
            canArchive:
              isSystemScoped(user) ||
              hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_ARCHIVE),
            canDelete:
              isSystemScoped(user) ||
              hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_DELETE),
          }}
        />
      </AdminContent>
    </div>
  );
}
