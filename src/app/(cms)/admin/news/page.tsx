import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, Eye, Building2, Calendar } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminNewsList } from "@/server/news/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import type { NewsStatus } from "@prisma/client";

export const instant = false;

export const metadata: Metadata = {
  title: "News & Advisories Management | San Felipe LGU CMS",
  description: "Official municipal news, advisories, and press announcements management",
};

interface NewsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
    officeId?: string;
    page?: string;
  }>;
}

const NEWS_COLUMNS: DataTableColumn[] = [
  { key: "title", header: "Article Title", width: "35%" },
  { key: "status", header: "Status", width: "12%" },
  { key: "office", header: "Publishing Office", width: "23%" },
  { key: "publishedAt", header: "Publication Date", width: "15%" },
  { key: "actions", header: "Actions", width: "15%", align: "right" },
];

export default async function AdminNewsListPage({ searchParams }: NewsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.POSTS_VIEW)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search?.trim();
  const status = params.status as NewsStatus | undefined;
  const type = params.type;
  const officeId = params.officeId;

  const result = await getAdminNewsList(user, {
    page,
    pageSize: 10,
    search,
    status,
    type,
    officeId,
  });

  const canCreate = hasPermission(user, PERMISSIONS.POSTS_CREATE);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="News & Public Advisories"
        description="Draft, edit, publish, and manage official municipal press statements, public notices, and department advisories."
        breadcrumbs={[{ label: "News & Advisories" }]}
        actions={
          canCreate ? (
            <Link
              href="/admin/news/new"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-xs bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-8 px-3 shadow-2xs tracking-wide cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Create Article</span>
            </Link>
          ) : undefined
        }
      />

      <AdminContent>
        {/* News Table with Built-In Filter Bar */}
        <DataTable
          title="Municipal Publications"
          columns={NEWS_COLUMNS}
          data={result.articles}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search by title or excerpt..."
          searchValue={search}
          filters={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter Form */}
              <form method="GET" className="flex items-center gap-2 flex-wrap">
                {search && <input type="hidden" name="search" value={search} />}

                {/* Status Filter */}
                <select
                  name="status"
                  defaultValue={status || ""}
                  className="text-xs p-1.5 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-medium cursor-pointer"
                  aria-label="Filter by publication status"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Drafts</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

                {/* Type Filter */}
                <select
                  name="type"
                  defaultValue={type || ""}
                  className="text-xs p-1.5 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-medium cursor-pointer uppercase"
                  aria-label="Filter by publication type"
                >
                  <option value="">All Types</option>
                  <option value="news">News</option>
                  <option value="announcement">Announcements</option>
                  <option value="advisory">Advisories</option>
                  <option value="notice">Notices</option>
                </select>

                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs font-semibold border-gray-300"
                >
                  Apply
                </Button>
              </form>
            </div>
          }
          pagination={{
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            pageSize: result.pageSize,
          }}
          renderRow={(article) => (
            <tr key={article.id} className="hover:bg-slate-50/75 transition-colors">
              {/* Title & Excerpt */}
              <td className="px-4 py-3">
                <div className="space-y-0.5">
                  <Link
                    href={`/admin/news/${article.id}/edit`}
                    className="font-bold text-gov-charcoal hover:text-burgundy-800 transition-colors line-clamp-1 text-xs"
                  >
                    {article.title}
                  </Link>
                  <p className="text-[11px] text-gov-muted line-clamp-1">
                    {article.excerpt}
                  </p>
                </div>
              </td>

              {/* Status Badge */}
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={article.status} size="sm" />
              </td>

              {/* Publishing Office */}
              <td className="px-4 py-3 text-xs text-gov-charcoal whitespace-nowrap">
                {article.office ? (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-burgundy-700 shrink-0" />
                    <span className="truncate max-w-[180px]" title={article.office.name}>
                      {article.office.shortName || article.office.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-gov-muted italic">Municipal-Wide</span>
                )}
              </td>

              {/* Published Date */}
              <td className="px-4 py-3 text-[11px] text-gov-muted whitespace-nowrap">
                {article.publishedAt ? (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ) : (
                  <span className="italic text-gray-400">Not published</span>
                )}
              </td>

              {/* Action Buttons */}
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Authenticated Preview Link */}
                  <Link
                    href={`/admin/news/${article.id}/preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-xs text-gray-500 hover:text-burgundy-700 hover:bg-slate-100 transition-colors"
                    title="Preview Draft Article"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>

                  {/* Edit Link */}
                  <Link
                    href={`/admin/news/${article.id}/edit`}
                    className="p-1 rounded-xs text-gray-500 hover:text-burgundy-700 hover:bg-slate-100 transition-colors"
                    title="Edit Publication"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </td>
            </tr>
          )}
        />
      </AdminContent>
    </div>
  );
}
