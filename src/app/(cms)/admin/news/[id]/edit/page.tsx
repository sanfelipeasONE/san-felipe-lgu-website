import * as React from "react";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminNewsById, NewsError } from "@/server/news/service";
import { prisma } from "@/server/db/client";
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
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.POSTS_UPDATE)) {
    redirect("/admin/news");
  }

  const { id } = await params;

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
        title={`Edit: ${article.title}`}
        description="Modify editorial content, manage featured photography, and publish official announcements."
        breadcrumbs={[
          { label: "News & Advisories", href: "/admin/news" },
          { label: "Edit Article" },
        ]}
      />

      <AdminContent>
        <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs">
          <NewsForm
            user={user}
            offices={officesList}
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
          />
        </div>
      </AdminContent>
    </div>
  );
}
