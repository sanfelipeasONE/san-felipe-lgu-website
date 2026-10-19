import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Municipal Office | San Felipe LGU CMS",
  description: "Official municipal department profiles and operational directory",
};

export default async function EditOfficePage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  // Municipal offices module is not exposed as a normal CMS administration module
  redirect("/admin");
}
