import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { TourismForm } from "@/components/admin/tourism-form";
import { TOURISM_CATEGORIES } from "@/lib/validation/tourism";
import type { TourismCategory } from "@prisma/client";

export const instant = false;

export const metadata: Metadata = {
  title: "Create Tourism Entry | San Felipe LGU CMS",
  description: "Draft a new municipal attraction, resort, cultural site, or local product entry",
};

interface CreateTourismPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function CreateTourismPage({ searchParams }: CreateTourismPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.TOURISM_CREATE)) {
    redirect("/admin/tourism");
  }

  const params = await searchParams;
  let initialCategory: TourismCategory = "ATTRACTIONS";
  if (params.category && (TOURISM_CATEGORIES as readonly string[]).includes(params.category)) {
    initialCategory = params.category as TourismCategory;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Create Tourism Entry"
        description="Draft a new municipal attraction, hospitality accommodation, cultural heritage entry, or local trade product."
        breadcrumbs={[
          { label: "Tourism", href: "/admin/tourism" },
          { label: "Create Entry" },
        ]}
      />

      <AdminContent>
        <TourismForm user={user} initialCategory={initialCategory} />
      </AdminContent>
    </div>
  );
}
