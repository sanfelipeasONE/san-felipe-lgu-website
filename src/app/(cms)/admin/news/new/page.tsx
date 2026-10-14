import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { NewsForm } from "@/components/admin/news-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Create Article | San Felipe LGU CMS",
  description: "Draft a new municipal publication or department advisory",
};

export default async function CreateNewsPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.POSTS_CREATE)) {
    redirect("/admin/news");
  }

  let officesList: Array<{ id: string; name: string; shortName: string | null }> = [];
  if (isSystemScoped(user)) {
    officesList = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    });
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Draft New Article"
        description="Compose and prepare official announcements, department press releases, or emergency advisories."
        breadcrumbs={[
          { label: "News & Advisories", href: "/admin/news" },
          { label: "Draft Article" },
        ]}
      />

      <AdminContent>
        <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs">
          <NewsForm user={user} offices={officesList} />
        </div>
      </AdminContent>
    </div>
  );
}
