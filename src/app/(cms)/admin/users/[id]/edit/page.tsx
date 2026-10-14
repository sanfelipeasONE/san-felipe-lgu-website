import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { getUserById, UserError } from "@/server/users/service";
import { prisma } from "@/server/db/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminContent } from "@/components/admin/admin-content";
import { UserForm, type RoleOption, type OfficeOption } from "@/components/admin/user-form";

export const metadata: Metadata = {
  title: "Edit Staff Account | San Felipe LGU CMS",
  description: "Update municipal staff account details and operational status",
};

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  if (!hasPermission(user, PERMISSIONS.USERS_VIEW)) {
    redirect("/admin/users");
  }

  const { id } = await params;

  let targetUser;
  try {
    targetUser = await getUserById(user, id);
  } catch (error) {
    if (error instanceof UserError && error.statusCode === 403) {
      redirect("/admin/users");
    }
    notFound();
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
    userOfficeName = targetUser.office?.name || user.office?.name;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminPageHeader
        title={`Edit Staff Account: ${targetUser.name}`}
        description={`Manage identity details, office affiliation, and active credentials for ${targetUser.email}.`}
        breadcrumbs={[
          { label: "Staff Accounts", href: "/admin/users" },
          { label: targetUser.name },
        ]}
      />

      <AdminContent>
        <UserForm
          mode="edit"
          isSystemScoped={isSystem}
          userOfficeName={userOfficeName}
          roles={roles}
          offices={offices}
          initialData={{
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            status: targetUser.status,
            officeId: targetUser.officeId,
            roleId: targetUser.roleId,
            updatedAt: targetUser.updatedAt.toISOString(),
          }}
        />
      </AdminContent>
    </div>
  );
}
