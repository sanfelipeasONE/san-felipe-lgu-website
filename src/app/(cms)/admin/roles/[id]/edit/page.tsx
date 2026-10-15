import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getRoleById, listPermissionCatalog, RoleError } from "@/server/roles/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { RolePermissionForm } from "@/components/admin/role-permission-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Configure Role Permissions | San Felipe LGU CMS",
  description: "Assign and tune granular permissions for system roles",
};

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Strictly System-Scope only with settings.manage
  if (!isSystemScoped(user) || !hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) {
    redirect("/admin/roles");
  }

  const { id } = await params;

  let role;
  let catalog;
  try {
    [role, catalog] = await Promise.all([
      getRoleById(user, id),
      listPermissionCatalog(user),
    ]);
  } catch (error) {
    if (error instanceof RoleError && error.statusCode === 403) {
      redirect("/admin/roles");
    }
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Configure Role: ${role.name}`}
        description={`Configure granular system capabilities, edit operational description, and assign permissions for ${role.slug}.`}
        breadcrumbs={[
          { label: "Roles & Permissions", href: "/admin/roles" },
          { label: role.name },
        ]}
      />

      <AdminContent>
        <RolePermissionForm
          role={{
            ...role,
            updatedAt: role.updatedAt.toISOString(),
          }}
          catalog={catalog}
        />
      </AdminContent>
    </div>
  );
}
