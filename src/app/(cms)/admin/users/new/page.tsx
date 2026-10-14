import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { UserForm, type RoleOption, type OfficeOption } from "@/components/admin/user-form";

export const metadata: Metadata = {
  title: "Create Staff Account | San Felipe LGU CMS",
  description: "Provision a new municipal staff user account",
};

export default async function NewUserPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.USERS_CREATE)) {
    redirect("/admin/users");
  }

  const isSystem = isSystemScoped(user);

  let offices: OfficeOption[] = [];
  let roles: RoleOption[] = [];
  let userOfficeName: string | undefined;

  if (isSystem) {
    offices = await prisma.office.findMany({
      where: {
        status: "ACTIVE",
        slug: { not: "icto" },
      },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    });

    const dbRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isSystemScope: true,
        tier: true,
      },
      orderBy: [{ isSystemScope: "desc" }, { name: "asc" }],
    });

    roles = dbRoles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      isSystemScope: r.isSystemScope,
      tier: r.tier,
    }));
  } else {
    if (!user.officeId) {
      redirect("/admin/users");
    }
    const office = await prisma.office.findUnique({
      where: { id: user.officeId },
      select: { name: true },
    });
    userOfficeName = office?.name;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title="Create Staff Account"
        description={
          isSystem
            ? "Provision a new municipal user account, select system or department role authority, and assign office affiliation."
            : `Provision a new ordinary Staff account assigned to the ${userOfficeName || "your department"}.`
        }
        breadcrumbs={[
          { label: "Staff Accounts", href: "/admin/users" },
          { label: "New Account" },
        ]}
      />

      <AdminContent>
        <UserForm
          mode="create"
          isSystemScoped={isSystem}
          userOfficeName={userOfficeName}
          roles={roles}
          offices={offices}
        />
      </AdminContent>
    </div>
  );
}
