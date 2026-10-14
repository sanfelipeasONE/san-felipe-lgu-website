import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication guard: unauthenticated or non-active users are redirected to staff login
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
