import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Edit,
  Download,
  FileText,
  Newspaper,
  Eye,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminNewsList } from "@/server/news/service";
import { getAdminDocumentsList, formatBytes } from "@/server/documents/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import type { DocumentStatus, NewsStatus } from "@prisma/client";

export const instant = false;

export const metadata: Metadata = {
  title: "GAD Corner | San Felipe LGU CMS",
  description: "Manage official Gender and Development (GAD) news, publications, annual plans, and resources",
};

interface GadAdminPageProps {
  searchParams: Promise<{
    tab?: "news" | "resources";
    search?: string;
    status?: string;
    page?: string;
  }>;
}

interface AdminNewsRow {
  id: string;
  title: string;
  excerpt: string;
  type: string;
  status: NewsStatus;
  office?: { name: string } | null;
}

interface AdminDocRow {
  id: string;
  title: string;
  description: string | null;
  format: string;
  bytes: number;
  status: DocumentStatus;
  office?: { name: string } | null;
}

const GAD_NEWS_COLUMNS: DataTableColumn[] = [
  { key: "title", header: "Article Title", width: "40%" },
  { key: "office", header: "Attributed Office", width: "22%" },
  { key: "type", header: "Type", width: "13%" },
  { key: "status", header: "Status", width: "12%" },
  { key: "actions", header: "Actions", width: "13%", align: "right" },
];

const GAD_RESOURCE_COLUMNS: DataTableColumn[] = [
  { key: "title", header: "Document Title", width: "38%" },
  { key: "office", header: "Responsible Office", width: "22%" },
  { key: "file", header: "File Asset", width: "15%" },
  { key: "status", header: "Status", width: "12%" },
  { key: "actions", header: "Actions", width: "13%", align: "right" },
];

export default async function AdminGadPage({ searchParams }: GadAdminPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  const canViewNews = hasPermission(user, PERMISSIONS.POSTS_VIEW);
  const canViewDocs = hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW);

  if (!canViewNews && !canViewDocs) {
    redirect("/admin");
  }

  const params = await searchParams;

  // Resolve activeTab based on user permissions and requested tab
  let activeTab: "news" | "resources";
  if (params.tab === "resources") {
    activeTab = canViewDocs ? "resources" : "news";
  } else if (params.tab === "news") {
    activeTab = canViewNews ? "news" : "resources";
  } else {
    activeTab = canViewNews ? "news" : "resources";
  }

  // Enforce access boundaries
  if (activeTab === "news" && !canViewNews) {
    redirect("/admin");
  }
  if (activeTab === "resources" && !canViewDocs) {
    redirect("/admin");
  }
  const page = Number(params.page) || 1;
  const search = params.search?.trim();

  const canCreateNews = hasPermission(user, PERMISSIONS.POSTS_CREATE);
  const canCreateDocs = hasPermission(user, PERMISSIONS.DOCUMENTS_CREATE);

  // 1. Fetch data based on active tab
  let newsResult = { articles: [] as AdminNewsRow[], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  let docsResult = { documents: [] as AdminDocRow[], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  if (activeTab === "news") {
    newsResult = await getAdminNewsList(user, {
      page,
      pageSize: 10,
      search,
      status: params.status as NewsStatus | undefined,
      category: "GENDER AND DEVELOPMENT (GAD)",
    });
  } else {
    docsResult = await getAdminDocumentsList(user, {
      page,
      pageSize: 10,
      search,
      status: params.status as DocumentStatus | undefined,
      category: "Gender and Development (GAD)",
      purpose: "OTHER_PUBLIC_DOCUMENT",
    });
  }

  const addNewsHref = `/admin/news/new?category=${encodeURIComponent("GENDER AND DEVELOPMENT (GAD)")}&returnTo=gad`;
  const addDocHref = `/admin/documents/new?purpose=OTHER_PUBLIC_DOCUMENT&category=${encodeURIComponent("Gender and Development (GAD)")}&returnTo=gad`;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Gender and Development (GAD) Corner"
        description="Administer official news, announcements, publications, and public resources for the Gender and Development (GAD) Corner."
        breadcrumbs={[
          { label: "Content Management" },
          { label: "GAD Corner" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/gad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs h-9 px-3.5 shadow-2xs gap-1.5 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>View Public Page</span>
            </Link>

            {activeTab === "news" && canCreateNews && (
              <Link
                href={addNewsHref}
                className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Draft GAD Article</span>
              </Link>
            )}

            {activeTab === "resources" && canCreateDocs && (
              <Link
                href={addDocHref}
                className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add GAD Resource</span>
              </Link>
            )}
          </div>
        }
      />

      <AdminContent>
        {/* Tab Switcher - only show tabs user is permitted to view */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
          {canViewNews && (
            <Link
              href="/admin/gad?tab=news"
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                activeTab === "news"
                  ? "border-burgundy-800 text-burgundy-900 bg-white rounded-t-xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
              }`}
            >
              <Newspaper className="w-4 h-4 text-burgundy-700" />
              <span>GAD News ({activeTab === "news" ? newsResult.total : "Manage"})</span>
            </Link>
          )}
          {canViewDocs && (
            <Link
              href="/admin/gad?tab=resources"
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                activeTab === "resources"
                  ? "border-burgundy-800 text-burgundy-900 bg-white rounded-t-xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
              }`}
            >
              <FileText className="w-4 h-4 text-burgundy-700" />
              <span>GAD Resources ({activeTab === "resources" ? docsResult.total : "Manage"})</span>
            </Link>
          )}
        </div>

        {/* TAB 1: GAD NEWS */}
        {activeTab === "news" && (
          <div className="space-y-4">
            <DataTable
              columns={GAD_NEWS_COLUMNS}
              data={newsResult.articles}
              renderRow={(article: AdminNewsRow) => (
                <tr key={article.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <Link
                        href={`/admin/news/${article.id}/edit?returnTo=gad`}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-burgundy-800 transition-colors line-clamp-1"
                      >
                        {article.title}
                      </Link>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {article.excerpt}
                      </p>
                    </div>
                  </td>
                  <td className="p-3.5 text-xs text-slate-600">
                    {article.office?.name || "—"}
                  </td>
                  <td className="p-3.5 text-xs">
                    <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                      {article.type}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/admin/news/${article.id}/edit?returnTo=gad`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-burgundy-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xs transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                  </td>
                </tr>
              )}
            />

            {newsResult.total === 0 && !search && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-10 text-center space-y-4 max-w-2xl mx-auto my-8">
                <div className="w-14 h-14 bg-burgundy-50 border border-burgundy-100 rounded-full flex items-center justify-center mx-auto text-burgundy-700">
                  <Newspaper className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block">
                    Municipal GAD Corner
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    No GAD News Articles Yet
                  </h3>
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Compose press releases, activity reports, and public advisories. Published entries will appear immediately on the public GAD Corner.
                </p>
                {canCreateNews && (
                  <div className="pt-2">
                    <Link
                      href={addNewsHref}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-burgundy-700 hover:bg-burgundy-800 rounded-lg shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Draft First GAD Article</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GAD RESOURCES */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            <DataTable
              columns={GAD_RESOURCE_COLUMNS}
              data={docsResult.documents}
              renderRow={(doc: AdminDocRow) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <Link
                        href={`/admin/documents/${doc.id}/edit?returnTo=gad`}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-burgundy-800 transition-colors line-clamp-1"
                      >
                        {doc.title}
                      </Link>
                      {doc.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-xs text-slate-600">
                    {doc.office?.name || "—"}
                  </td>
                  <td className="p-3.5 text-xs text-slate-500">
                    <span className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-700 mr-1.5">
                      {doc.format}
                    </span>
                    <span>{formatBytes(doc.bytes)}</span>
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <Link
                      href={`/admin/documents/${doc.id}/edit?returnTo=gad`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-burgundy-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xs transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                    <a
                      href={`/documents/${doc.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xs transition-colors"
                      title="Preview Document"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              )}
            />

            {docsResult.total === 0 && !search && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-10 text-center space-y-4 max-w-2xl mx-auto my-8">
                <div className="w-14 h-14 bg-burgundy-50 border border-burgundy-100 rounded-full flex items-center justify-center mx-auto text-burgundy-700">
                  <FileText className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block">
                    GAD Resources & Disclosures
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    No GAD Resources Yet
                  </h3>
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Official GAD plans, budgets, accomplishment reports, and policy guidelines managed here will be published directly to GAD Resources.
                </p>
                {canCreateDocs && (
                  <div className="pt-2">
                    <Link
                      href={addDocHref}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-burgundy-700 hover:bg-burgundy-800 rounded-lg shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First GAD Resource</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AdminContent>
    </div>
  );
}
