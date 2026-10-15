import { redirect } from "next/navigation";

export const instant = false;

interface ServicePageRedirectProps {
  params: Promise<{
    serviceKey: string;
  }>;
}

export default async function ServicePageRedirect({ params }: ServicePageRedirectProps) {
  const { serviceKey } = await params;
  redirect(`/admin/services/${serviceKey}/edit`);
}
