import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { prisma } from "@/server/db/client";
import { ensureTourismRole, ensureSangguniangBayanRole, SB_ADMIN_ROLE_SLUG, SB_OFFICE_SLUG, TOURISM_ROLE_SLUG } from "@/server/roles/service";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { UserForm, type RoleOption } from "@/components/admin/user-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Create Account | San Felipe LGU CMS",
  description: "Provision an authorized municipal administrator or dedicated content manager account.",
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

  await ensureTourismRole();
  await ensureSangguniangBayanRole();

  const [dbRoles, sbOffice] = await Promise.all([
    prisma.role.findMany({
      where: {
        slug: { in: ["super-admin", TOURISM_ROLE_SLUG, SB_ADMIN_ROLE_SLUG] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isSystemScope: true,
        tier: true,
      },
      orderBy: [{ isSystemScope: "desc" }, { name: "asc" }],
    }),
    prisma.office.findUnique({
      where: { slug: SB_OFFICE_SLUG },
      select: { id: true, name: true, shortName: true },
    }),
  ]);

  const roles: RoleOption[] = dbRoles.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    isSystemScope: r.isSystemScope,
    tier: r.tier,
  }));

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Create Account"
        description="Provision an authorized Super Administrator, Tourism Content Manager, or Sangguniang Bayan Admin account."
        breadcrumbs={[
          { label: "Accounts", href: "/admin/users" },
          { label: "New Account" },
        ]}
      />

      <AdminContent>
        <UserForm
          mode="create"
          isSystemScoped={true}
          roles={roles}
          sangguniangBayanOffice={sbOffice ?? undefined}
        />
      </AdminContent>
    </div>
  );
}
