import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { ASSETS } from "@/config/assets";
import { getCurrentUser } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Staff Portal Login | Municipality of San Felipe",
  description:
    "Secure administrative login portal for authorized personnel of the Municipal Government of San Felipe, Zambales.",
};

export default async function StaffLoginPage() {
  const user = await getCurrentUser();
  if (user && user.status === "ACTIVE") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {/* Municipal Identity Header */}
        <div className="text-center flex flex-col items-center">
          {/* Official San Felipe Municipal Seal */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border border-gold-600/60 overflow-hidden bg-white shadow-2xs">
            <Image
              src={ASSETS.branding.seal.src}
              alt={ASSETS.branding.seal.alt}
              width={72}
              height={72}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mt-3">
            REPUBLIC OF THE PHILIPPINES
          </span>
          <span className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900 block mt-0.5">
            MUNICIPALITY OF SAN FELIPE
          </span>
          <span className="text-xs sm:text-sm text-slate-500 block mt-0.5">
            Province of Zambales
          </span>

          {/* Thin Gold Civic Divider */}
          <div className="w-10 h-0.5 bg-amber-500 mx-auto mt-2.5 mb-3" aria-hidden="true" />

          {/* Portal Title & Subtitle */}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Staff Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Authorized Personnel Access
          </p>
        </div>

        {/* Login Card Container */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-sm mt-6">
          <div className="mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Use your authorized municipal staff account.
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Return to Public Website */}
        <Link
          href="/"
          className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mt-6 focus-visible:outline-2 focus-visible:outline-burgundy-700 rounded-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Back to Municipal Website</span>
        </Link>

        {/* Official Portal Subtext */}
        <div className="text-[11px] text-slate-400 text-center mt-6 space-y-0.5 leading-normal">
          <p>Municipality of San Felipe, Zambales</p>
          <p>Official Staff Portal</p>
        </div>
      </div>
    </div>
  );
}
