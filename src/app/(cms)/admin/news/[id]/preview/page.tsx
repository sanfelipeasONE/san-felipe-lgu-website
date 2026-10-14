import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Edit, Building2 } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminNewsById, NewsError } from "@/server/news/service";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StatusBadge } from "@/components/admin/status-badge";
import { ASSETS } from "@/config/assets";

export const instant = false;

export const metadata: Metadata = {
  title: "Draft Preview | San Felipe LGU CMS",
  description: "Authenticated staff preview of municipal news draft",
};

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsDraftPreviewPage({ params }: PreviewPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.POSTS_VIEW)) {
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
    redirect("/admin/news");
  }

  const imageSrc = article.featuredImageUrl || ASSETS.news.placeholder.src;
  const imageAlt = article.featuredImageAlt || article.title;
  const publishedDateFormatted = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Unpublished Draft";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Prominent Preview Mode Banner */}
      <div className="bg-amber-500 text-gov-charcoal border-b border-amber-600 px-4 py-2.5 shadow-xs sticky top-0 z-40">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider bg-black text-amber-300 px-2 py-0.5 rounded-2xs text-[10px]">
                STAFF PREVIEW ONLY
              </span>
              <span className="font-semibold text-black">
                This publication is not live. Status:
              </span>
              <StatusBadge status={article.status} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/news/${article.id}/edit`}
                className="inline-flex items-center justify-center font-medium transition-colors rounded-xs h-7 px-2.5 text-xs tracking-wide bg-white border border-amber-700 text-gov-charcoal hover:bg-amber-50 cursor-pointer shadow-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                <span>Return to Editor</span>
              </Link>
              <Link
                href="/admin/news"
                className="inline-flex items-center justify-center font-medium transition-colors rounded-xs h-7 px-2.5 text-xs tracking-wide text-black hover:bg-amber-600/30 cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                <span>News List</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Article Preview Surface (matches public presentation) */}
      <main className="py-6 sm:py-10 bg-white flex-1">
        <Container>
          {/* Breadcrumb Bar */}
          <div className="mb-6 bg-slate-100/70 border border-slate-200/80 px-4 py-2.5 rounded-xs">
            <Breadcrumbs
              items={[
                { label: "Municipal CMS", href: "/admin" },
                { label: "News & Advisories", href: "/admin/news" },
                {
                  label:
                    article.title.length > 50
                      ? `${article.title.slice(0, 50)}...`
                      : article.title,
                },
              ]}
            />
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Headline */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gov-charcoal uppercase leading-tight tracking-tight mb-2">
              {article.title}
            </h1>

            {/* Date & Publishing Office */}
            <div className="text-xs text-slate-500 font-medium mb-6">
              <span>{publishedDateFormatted}</span>
              <span className="mx-2 text-slate-300" aria-hidden="true">&bull;</span>
              <span className="text-slate-700 font-bold">{article.office.name}</span>
            </div>

            {/* Featured Image */}
            <div className="mb-8 rounded-xs overflow-hidden bg-slate-100 relative w-full aspect-16/10 border border-gray-200 shadow-2xs">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover object-center"
                priority
              />
            </div>

            {/* Excerpt Lead */}
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed pb-4 border-b border-gray-100">
              {article.excerpt}
            </p>

            {/* Sanitized HTML Body */}
            <div
              className="mt-6 prose prose-sm sm:prose-base max-w-none text-gov-charcoal leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />

            {/* Publishing Office Attribution Card */}
            <div className="mt-10 p-5 rounded-xs bg-slate-50 border border-gray-200 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-700 shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block">
                  OFFICIAL PUBLISHING OFFICE
                </span>
                <h3 className="text-sm font-bold text-gov-charcoal mt-0.5">
                  {article.office.name}
                </h3>
                <p className="text-xs text-gov-muted mt-0.5">
                  Municipality of San Felipe, Zambales
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
