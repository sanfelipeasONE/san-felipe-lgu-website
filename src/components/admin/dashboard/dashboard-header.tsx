import * as React from "react";
import Link from "next/link";
import { Plus, Upload, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  user: SessionUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const isSystem = user.isSystemScope;

  const canUploadDoc = hasPermission(user, "documents.create");
  const canCreateNews = hasPermission(user, "posts.create");

  const officeName = user.office?.name
    ? user.office.shortName
      ? `${user.office.name} (${user.office.shortName})`
      : user.office.name
    : "Assigned Office";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-gray-200/80">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gov-charcoal">
          Dashboard
        </h1>
        <p className="text-xs text-gov-muted mt-0.5">
          Overview of municipal website content and administrative activity.
        </p>
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-1.5">
          {isSystem ? (
            <span>System-Wide &bull; {user.role.name} &bull; All Municipal Offices</span>
          ) : (
            <span>
              {officeName} &bull; {user.role.name}
            </span>
          )}
          <span>&bull;</span>
          <Link
            href="/admin/account/security"
            className="text-burgundy-700 hover:text-burgundy-900 font-semibold inline-flex items-center gap-1 hover:underline transition-colors"
          >
            <span>Manage Account Security</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Permission-aware action buttons matching Stitch layout */}
      {(canUploadDoc || canCreateNews) && (
        <div className="flex items-center gap-2.5 shrink-0">
          {canUploadDoc && (
            <Link href="/admin/documents/new">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 text-xs font-semibold border-gray-300 text-gov-charcoal hover:bg-slate-50 shadow-2xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                <span>Upload Document</span>
              </Button>
            </Link>
          )}

          {canCreateNews && (
            <Link href="/admin/news/new">
              <Button
                size="sm"
                className="h-9 px-3.5 text-xs font-semibold bg-[#8B1E2D] hover:bg-[#651521] text-white shadow-2xs border border-transparent"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Create News Article</span>
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
