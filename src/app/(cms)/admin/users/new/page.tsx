import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { UserForm } from "@/components/admin/user-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Create Administrative Account | San Felipe LGU CMS",
  description: "Provision a new municipal administrator account with system-wide authority.",
};

export default async function NewUserPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Only authorized SYSTEM-scoped administrators may provision administrator accounts
  if (!hasPermission(user, PERMISSIONS.USERS_CREATE) || !isSystemScoped(user)) {
    redirect("/admin/users");
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Create Administrative Account"
        description="Provision a new municipal administrator account with system-wide authority across all municipal departments."
        breadcrumbs={[
          { label: "Accounts", href: "/admin/users" },
          { label: "New Account" },
        ]}
      />

      <AdminContent>
        <UserForm
          mode="create"
          isSystemScoped={true}
        />
      </AdminContent>
    </div>
  );
}
