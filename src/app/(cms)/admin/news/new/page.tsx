import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { NewsForm } from "@/components/admin/news-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Create Article | San Felipe LGU CMS",
  description: "Draft a new municipal publication or department advisory",
};

interface CreateNewsPageProps {
  searchParams?: Promise<{
    category?: string;
    returnTo?: string;
  }>;
}

export default async function CreateNewsPage({ searchParams }: CreateNewsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.POSTS_CREATE)) {
    redirect("/admin/news");
  }

  const params = searchParams ? await searchParams : undefined;
  const isGad =
    params?.returnTo === "gad" ||
    params?.category === "GENDER AND DEVELOPMENT (GAD)";

  const title = isGad ? "Draft GAD Article" : "Draft New Article";
  const description = isGad
    ? "Compose and prepare official announcements, releases, or advisories for the Gender and Development (GAD) Corner."
    : "Compose and prepare official announcements, department press releases, or emergency advisories.";
  const breadcrumbs = isGad
    ? [
        { label: "Content Management" },
        { label: "GAD Corner", href: "/admin/gad" },
        { label: "Draft Article" },
      ]
    : [
        { label: "News & Advisories", href: "/admin/news" },
        { label: "Draft Article" },
      ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />

      <AdminContent>
        <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs">
          <NewsForm
            user={user}
            defaultCategory={isGad ? "GENDER AND DEVELOPMENT (GAD)" : params?.category}
            lockCategory={isGad}
            returnTo={isGad ? "gad" : params?.returnTo}
            backHref={isGad ? "/admin/gad" : "/admin/news"}
            backLabel={isGad ? "Back to GAD Corner" : "Back to News"}
          />
        </div>
      </AdminContent>
    </div>
  );
}
