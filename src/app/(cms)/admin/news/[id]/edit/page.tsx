import * as React from "react";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminNewsById, NewsError } from "@/server/news/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { NewsForm } from "@/components/admin/news-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Article | San Felipe LGU CMS",
  description: "Edit municipal news and advisory publication",
};

interface EditNewsPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}

export default async function EditNewsPage({ params, searchParams }: EditNewsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.POSTS_UPDATE)) {
    redirect("/admin/news");
  }

  const { id } = await params;
  const sParams = searchParams ? await searchParams : undefined;

  let article;
  try {
    article = await getAdminNewsById(user, id);
  } catch (err) {
    if (err instanceof NewsError && err.statusCode === 404) {
      notFound();
    }
    // Office access violation or permission denial
    redirect("/admin/news");
  }

  const isGad =
    sParams?.returnTo === "gad" ||
    article.category === "GENDER AND DEVELOPMENT (GAD)";

  const breadcrumbs = isGad
    ? [
        { label: "Content Management" },
        { label: "GAD Corner", href: "/admin/gad" },
        { label: "Edit Article" },
      ]
    : [
        { label: "News & Advisories", href: "/admin/news" },
        { label: "Edit Article" },
      ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Edit: ${article.title}`}
        description="Modify editorial content, manage featured photography, and publish official announcements."
        breadcrumbs={breadcrumbs}
      />

      <AdminContent>
        <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs">
          <NewsForm
            user={user}
            initialData={{
              id: article.id,
              slug: article.slug,
              title: article.title,
              excerpt: article.excerpt,
              body: article.body,
              type: article.type,
              category: article.category,
              status: article.status,
              officeId: article.officeId,
              office: article.office,
              featuredImagePublicId: article.featuredImagePublicId,
              featuredImageUrl: article.featuredImageUrl,
              featuredImageAlt: article.featuredImageAlt,
              featuredImageWidth: article.featuredImageWidth,
              featuredImageHeight: article.featuredImageHeight,
              featuredImageFormat: article.featuredImageFormat,
              featuredImageBytes: article.featuredImageBytes,
              updatedAt: article.updatedAt.toISOString(),
            }}
            lockCategory={isGad}
            returnTo={isGad ? "gad" : undefined}
            backHref={isGad ? "/admin/gad" : "/admin/news"}
            backLabel={isGad ? "Back to GAD Corner" : "Back to News"}
          />
        </div>
      </AdminContent>
    </div>
  );
}
