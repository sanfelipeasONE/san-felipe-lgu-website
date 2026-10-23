import * as React from "react";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminTourismById, TourismError } from "@/server/tourism/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { TourismForm } from "@/components/admin/tourism-form";
import { TOURISM_CATEGORY_LABELS } from "@/lib/validation/tourism";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Tourism Entry | San Felipe LGU CMS",
  description: "Edit municipal tourism entry details, featured imagery, and publication status",
};

interface EditTourismPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTourismPage({ params }: EditTourismPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.TOURISM_UPDATE)) {
    redirect("/admin/tourism");
  }

  const { id } = await params;

  let entry;
  try {
    entry = await getAdminTourismById(user, id);
  } catch (err) {
    if (err instanceof TourismError && err.statusCode === 404) {
      notFound();
    }
    redirect("/admin/tourism");
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Edit: ${entry.title}`}
        description={`Manage content, visitor details, and status for this ${TOURISM_CATEGORY_LABELS[entry.category]} entry.`}
        breadcrumbs={[
          { label: "Tourism", href: "/admin/tourism" },
          { label: entry.title },
        ]}
      />

      <AdminContent>
        <TourismForm
          user={user}
          initialCategory={entry.category}
          initialData={{
            id: entry.id,
            slug: entry.slug,
            category: entry.category,
            title: entry.title,
            summary: entry.summary,
            body: entry.body,
            location: entry.location,
            mapUrl: entry.mapUrl,
            contactNumber: entry.contactNumber,
            email: entry.email,
            websiteUrl: entry.websiteUrl,
            operatingHours: entry.operatingHours,
            status: entry.status,
            featuredImagePublicId: entry.featuredImagePublicId,
            featuredImageUrl: entry.featuredImageUrl,
            featuredImageAlt: entry.featuredImageAlt,
            featuredImageWidth: entry.featuredImageWidth,
            featuredImageHeight: entry.featuredImageHeight,
            featuredImageFormat: entry.featuredImageFormat,
            featuredImageBytes: entry.featuredImageBytes,
            updatedAt: entry.updatedAt.toISOString(),
          }}
        />
      </AdminContent>
    </div>
  );
}
