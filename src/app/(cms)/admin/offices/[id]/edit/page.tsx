import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getOfficeById, OfficeError } from "@/server/offices/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { OfficeForm } from "@/components/admin/office-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Municipal Office | San Felipe LGU CMS",
  description: "Update official municipal department profile and operational details",
};

interface EditOfficePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOfficePage({ params }: EditOfficePageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Strictly System-Scope only
  if (!isSystemScoped(user) || !hasPermission(user, PERMISSIONS.OFFICES_UPDATE)) {
    redirect("/admin/offices");
  }

  const { id } = await params;

  let office;
  try {
    office = await getOfficeById(user, id);
  } catch (error) {
    if (error instanceof OfficeError && error.statusCode === 403) {
      redirect("/admin/offices");
    }
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Edit Department: ${office.name}`}
        description={`Update physical location, department head, public schedule, and operational status for ${office.name}.`}
        breadcrumbs={[
          { label: "Municipal Offices", href: "/admin/offices" },
          { label: office.name },
        ]}
      />

      <AdminContent>
        <OfficeForm
          initialData={{
            id: office.id,
            name: office.name,
            shortName: office.shortName,
            slug: office.slug,
            location: office.location,
            officeHours: office.officeHours,
            officeHead: office.officeHead,
            email: office.email,
            phone: office.phone,
            description: office.description,
            mandate: office.mandate,
            status: office.status,
            updatedAt: office.updatedAt.toISOString(),
          }}
        />
      </AdminContent>
    </div>
  );
}
