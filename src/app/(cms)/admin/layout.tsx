import Image from "next/image";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/authz/guard";
import { ASSETS } from "@/config/assets";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Server-side authorization check (deny-by-default)
    await requireUser();
  } catch {
    // Unauthenticated or inactive users redirected to staff login
    redirect("/staff/login");
  }

  return (
    <div className="min-h-screen bg-gov-surface flex flex-col">
      <header className="bg-burgundy-900 text-white px-6 py-4 flex items-center justify-between border-b border-burgundy-800">
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 rounded-full border border-gold-400 bg-white overflow-hidden shrink-0">
            <Image
              src={ASSETS.branding.seal.src}
              alt={ASSETS.branding.seal.alt}
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm tracking-wide">
            San Felipe LGU Staff CMS
          </span>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
