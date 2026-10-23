import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, Download, Building2, FileSpreadsheet, FileText } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getAdminDocumentsList, formatBytes } from "@/server/documents/service";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import type { DocumentStatus } from "@prisma/client";

export const instant = false;

export const metadata: Metadata = {
  title: "Procurement Management | San Felipe LGU CMS",
  description: "Official municipal procurement notices, bidding opportunities, and public disclosures",
};

interface ProcurementPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    officeId?: string;
    page?: string;
  }>;
}

const PROCUREMENT_COLUMNS: DataTableColumn[] = [
  { key: "title", header: "Document Title", width: "35%" },
  { key: "office", header: "Owning Office", width: "22%" },
  { key: "file", header: "File Asset", width: "15%" },
  { key: "status", header: "Status", width: "13%" },
  { key: "actions", header: "Actions", width: "15%", align: "right" },
];

export default async function AdminProcurementListPage({ searchParams }: ProcurementPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search?.trim();
  const status = params.status as DocumentStatus | undefined;
  const officeId = params.officeId;

  // Dedicated Procurement query: strictly locked to purpose=OTHER_PUBLIC_DOCUMENT and category="Procurement"
  const result = await getAdminDocumentsList(user, {
    page,
    pageSize: 10,
    search,
    status,
    category: "Procurement",
    purpose: "OTHER_PUBLIC_DOCUMENT",
    officeId,
  });

  // Load offices for filter (SYSTEM scope only)
  let officesList: Array<{ id: string; name: string }> = [];
  if (isSystemScoped(user)) {
    officesList = await prisma.office.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  const canCreate = hasPermission(user, PERMISSIONS.DOCUMENTS_CREATE);
  const canUpdate = hasPermission(user, PERMISSIONS.DOCUMENTS_UPDATE);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Procurement & Bidding"
        description="Manage official public procurement notices, invitations to bid, and transparency disclosures issued by the Municipal Government of San Felipe."
        breadcrumbs={[
          { label: "Transparency" },
          { label: "Procurement" },
        ]}
        actions={
          canCreate ? (
            <Link
              href="/admin/documents/new?purpose=OTHER_PUBLIC_DOCUMENT&category=Procurement&returnTo=procurement"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Procurement Document</span>
            </Link>
          ) : undefined
        }
      />

      <AdminContent>
        {result.total === 0 && !search && !status && !officeId ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-10 text-center space-y-4 max-w-2xl mx-auto my-8">
            <div className="w-14 h-14 bg-burgundy-50 border border-burgundy-100 rounded-full flex items-center justify-center mx-auto text-burgundy-700">
              <FileSpreadsheet className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block">
                Transparency & Accountability
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                No Procurement Documents Yet
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Official procurement notices, bidding invitations, and disclosure records managed here will be published to the public Transparency portal.
            </p>
            {canCreate && (
              <div className="pt-2">
                <Link
                  href="/admin/documents/new?purpose=OTHER_PUBLIC_DOCUMENT&category=Procurement&returnTo=procurement"
                  className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Procurement Document</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <DataTable
            columns={PROCUREMENT_COLUMNS}
            data={result.documents}
            keyExtractor={(doc) => doc.id}
            searchPlaceholder="Search procurement by title, description, or filename..."
            searchValue={search}
            pagination={{
              currentPage: result.page,
              totalPages: result.totalPages,
              totalItems: result.total,
              pageSize: result.pageSize,
            }}
            filters={
              <div className="flex flex-wrap items-center gap-2">
                {/* Fixed scope badge */}
                <span className="text-xs text-burgundy-700 font-semibold bg-burgundy-50 border border-burgundy-100 px-2.5 py-1 rounded-md">
                  Category: Procurement
                </span>

                {/* Status Filter */}
                <select
                  defaultValue={status || ""}
                  name="status"
                  className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-burgundy-600"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

                {/* Office Filter for System Scoped */}
                {isSystemScoped(user) && officesList.length > 0 && (
                  <select
                    defaultValue={officeId || ""}
                    name="officeId"
                    className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-burgundy-600"
                  >
                    <option value="">All Offices</option>
                    {officesList.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            }
            renderRow={(doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                {/* Title & Filename */}
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-burgundy-50 text-burgundy-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{doc.originalFilename}</p>
                    </div>
                  </div>
                </td>

                {/* Office */}
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.office?.name || "General LGU"}</span>
                  </div>
                </td>

                {/* File details */}
                <td className="px-4 py-3.5 align-middle">
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 uppercase">{doc.format}</span>
                    <span className="text-slate-400 mx-1">•</span>
                    <span>{formatBytes(doc.bytes)}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5 align-middle">
                  <StatusBadge status={doc.status} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 align-middle text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download File"
                      className="p-1.5 text-slate-500 hover:text-burgundy-700 hover:bg-burgundy-50 rounded transition"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {canUpdate && (
                      <Link
                        href={`/admin/documents/${doc.id}/edit?returnTo=procurement`}
                        title="Edit Procurement Document"
                        className="p-1.5 text-slate-500 hover:text-burgundy-700 hover:bg-burgundy-50 rounded transition"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </AdminContent>
    </div>
  );
}
