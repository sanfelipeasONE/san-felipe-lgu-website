import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut, User, Building2, Shield, Mail, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { logoutStaff } from "@/app/(auth)/staff/login/actions";
import { ASSETS } from "@/config/assets";

export const instant = false;

export const metadata: Metadata = {
  title: "Municipal Admin Overview",
  description: "San Felipe LGU Staff & Multi-Office CMS Administrative Console",
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  // Server-side authentication guard: unauthenticated requests are redirected
  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  const officeLabel = user.office
    ? `${user.office.name}${user.office.shortName ? ` (${user.office.shortName})` : ""}`
    : "System-wide Administration (All Offices)";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Utility Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Branding */}
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 rounded-full border border-gold-600/70 overflow-hidden bg-white shrink-0 shadow-2xs">
                <Image
                  src={ASSETS.branding.seal.src}
                  alt={ASSETS.branding.seal.alt}
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-700 block">
                  Municipal Government of San Felipe
                </span>
                <span className="text-sm font-bold text-gov-charcoal tracking-tight block">
                  Staff & Multi-Office CMS
                </span>
              </div>
            </div>

            {/* Logout Action */}
            <form action={logoutStaff}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-gray-300 text-gov-charcoal hover:text-burgundy-700 hover:border-burgundy-700 font-semibold text-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>
        </Container>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-10 sm:py-14">
        <Container>
          {/* Welcome Banner */}
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1">
                AUTHENTICATED SESSION ACTIVE
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gov-charcoal tracking-tight">
                Welcome, {user.name}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-gov-muted leading-relaxed">
                You are securely signed in to the Municipality of San Felipe Staff Portal.
              </p>
            </div>

            {/* Authenticated Staff Identity Card */}
            <div className="bg-white border border-gray-200 rounded-xs shadow-2xs overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-burgundy-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gov-charcoal">
                    Staff Identity & Authorization Context
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                {/* Full Name */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Full Name
                  </span>
                  <p className="font-semibold text-gov-charcoal text-sm">{user.name}</p>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Municipal Email
                  </span>
                  <p className="font-semibold text-gov-charcoal flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </p>
                </div>

                {/* Assigned Office */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Assigned Municipal Office
                  </span>
                  <p className="font-semibold text-gov-charcoal flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{officeLabel}</span>
                  </p>
                </div>

                {/* System Role */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Role & Authority Scope
                  </span>
                  <p className="font-semibold text-gov-charcoal flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.role.name}</span>
                    {user.isSystemScope && (
                      <span className="text-[10px] font-bold uppercase bg-burgundy-50 text-burgundy-800 px-1.5 py-0.5 rounded-xs border border-burgundy-200">
                        System-Wide
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Security Boundary Notice */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gov-muted gap-2">
                <span>
                  Server-side session verified via PostgreSQL and secure HttpOnly cookie.
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  Session ID: {user.sessionId.slice(0, 10)}...
                </span>
              </div>
            </div>

            {/* Upcoming Modules Information */}
            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xs text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold block mb-0.5">Phase 10 Foundation Established:</strong>
              Authentication and server session verification are active. Multi-office CMS content publishing workflows (news management, documents, announcements) will be built in Phase 11.
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
