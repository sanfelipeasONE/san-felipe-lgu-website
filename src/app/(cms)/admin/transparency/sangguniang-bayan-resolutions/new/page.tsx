import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getCanonicalSangguniangBayanOffice } from "@/server/resolutions/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { SbResolutionForm } from "@/components/admin/sb-resolution-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Add Sangguniang Bayan Resolution | San Felipe LGU CMS",
  description: "Create a new Sangguniang Bayan Resolution draft and attach its PDF document.",
};

export default async function NewSbResolutionPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!isSystemScoped(user) && !hasPermission(user, PERMISSIONS.SB_RESOLUTIONS_CREATE)) {
    redirect("/admin/transparency/sangguniang-bayan-resolutions");
  }

  const sbOffice = await getCanonicalSangguniangBayanOffice();
  if (!user.isSystemScope && user.officeId !== sbOffice.id) {
    redirect("/admin");
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Add Sangguniang Bayan Resolution"
        description="Draft a new Sangguniang Bayan Resolution and upload its official PDF attachment."
        breadcrumbs={[
          { label: "Transparency" },
          {
            label: "Sangguniang Bayan Resolutions",
            href: "/admin/transparency/sangguniang-bayan-resolutions",
          },
          { label: "New Resolution" },
        ]}
      />

      <AdminContent>
        <SbResolutionForm
          mode="create"
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
