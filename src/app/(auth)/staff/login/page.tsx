import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { ASSETS } from "@/config/assets";
import { getCurrentUser } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Staff CMS Login | Municipality of San Felipe",
  description:
    "Secure administrative login portal for authorized personnel of the Municipal Government of San Felipe, Zambales.",
};

export default async function StaffLoginPage() {
  const user = await getCurrentUser();
  if (user && user.status === "ACTIVE") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gov-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Return to Public Website */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-burgundy-700 hover:text-burgundy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Return to San Felipe Public Portal
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Civic Header / Identity */}
        <div className="bg-white border border-gov-border rounded-t-xs p-6 text-center border-b-2 border-b-burgundy-700">
          {/* Verified Municipal Seal Asset */}
          <div className="mx-auto relative w-18 h-18 rounded-full border-2 border-gold-600/70 shadow-xs overflow-hidden mb-3 bg-white">
            <Image
              src={ASSETS.branding.seal.src}
              alt={ASSETS.branding.seal.alt}
              width={72}
              height={72}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block">
            Municipal Government of San Felipe
          </span>
          <h1 className="text-xl font-bold text-gov-charcoal tracking-tight mt-1">
            Staff & Multi-Office CMS
          </h1>
          <p className="text-xs text-gov-muted mt-1">
            Authorized Municipal Personnel Access Only
          </p>
        </div>

        {/* Login Card Body */}
        <div className="bg-white border-x border-b border-gov-border rounded-b-xs p-6 sm:p-8 shadow-xs">
          <LoginForm />

          {/* Legal Compliance Warning Notice */}
          <div className="mt-8 pt-6 border-t border-gov-border">
            <div className="flex items-start gap-2.5 text-[11px] text-gov-muted leading-relaxed bg-gov-surface p-3 rounded-xs border border-gov-border">
              <ShieldAlert className="h-4 w-4 text-burgundy-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gov-charcoal font-semibold block">
                  Authorized Personnel Only
                </strong>
                This system is intended for authorized personnel of the Municipal Government of San Felipe. System activity may be logged for security and administrative purposes.
              </div>
            </div>
          </div>
        </div>

        {/* Technical Support Attribution */}
        <p className="text-center text-xs text-gov-muted mt-6">
          Managed by the Municipal Information and Communications Technology Office (ICTO).
        </p>
      </div>
    </div>
  );
}
