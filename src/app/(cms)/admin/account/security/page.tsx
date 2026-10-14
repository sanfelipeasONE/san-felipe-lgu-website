import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, listUserSessions } from "@/server/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { AccountSecurityManager } from "@/components/admin/account-security-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Account Security | San Felipe LGU CMS",
  description: "Manage your active municipal administrative login sessions.",
};

export default async function AccountSecurityPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Load current user's active sessions from PostgreSQL
  const rawSessions = await listUserSessions(user.id, user.sessionId);

  const sessions = rawSessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAt: s.createdAt.toISOString(),
    lastUsedAt: s.lastUsedAt?.toISOString() || null,
    isCurrent: s.isCurrent,
  }));

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Account Security"
        description="Review and manage active administrative sessions across your devices."
        breadcrumbs={[{ label: "Account Security" }]}
      />

      <AdminContent>
        <AccountSecurityManager
          userEmail={user.email}
          sessions={sessions}
        />
      </AdminContent>
    </div>
  );
}
