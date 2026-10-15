"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { ASSETS } from "@/config/assets";
import { getVisibleNavSections } from "@/config/admin-navigation";
import { getAuthoritySummary } from "@/lib/authz/scope";
import { logoutStaff } from "@/app/(auth)/staff/login/actions";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/server/auth/session";

export interface AdminSidebarProps {
  user: SessionUser;
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({
  user,
  onNavigate,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const visibleSections = React.useMemo(() => getVisibleNavSections(user), [user]);
  const summary = getAuthoritySummary(user);

  return (
    <aside
      className={cn(
        "w-64 xl:w-72 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 select-none",
        className
      )}
    >
      {/* Top Branding Header */}
      <div className="h-16 px-5 border-b border-gray-200 flex items-center gap-3 bg-white shrink-0">
        <div className="relative w-9 h-9 rounded-full border border-gold-600/70 overflow-hidden bg-white shrink-0 shadow-2xs">
          <Image
            src={ASSETS.branding.seal.src}
            alt={ASSETS.branding.seal.alt}
            width={36}
            height={36}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-burgundy-700 leading-tight truncate">
            Municipality of San Felipe
          </span>
          <span className="block text-xs font-bold text-gov-charcoal tracking-tight leading-tight truncate">
            Staff & Multi-Office CMS
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav
        aria-label="Admin Navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
      >
        {visibleSections.map((section) => (
          <div key={section.key} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gov-muted/80">
              {section.title}
            </h3>

            <ul className="space-y-0.5 mt-1.5" role="list">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isItemActive = pathname === item.href;
                const hasActiveChild = Boolean(
                  item.children?.some(
                    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
                  )
                );

                if (item.isImplemented) {
                  return (
                    <li key={item.id} className="space-y-0.5">
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-2.5 px-3 py-2 rounded-xs text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-burgundy-700",
                          isItemActive
                            ? "bg-burgundy-50 text-burgundy-800 border-l-3 border-burgundy-700 font-bold"
                            : hasActiveChild
                            ? "text-burgundy-900 bg-slate-50 font-bold"
                            : "text-gov-charcoal hover:bg-slate-100 hover:text-burgundy-800"
                        )}
                        aria-current={isItemActive ? "page" : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isItemActive || hasActiveChild
                              ? "text-burgundy-700"
                              : "text-gov-muted group-hover:text-burgundy-700"
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate flex-1">{item.label}</span>
                      </Link>

                      {item.children && item.children.length > 0 && (
                        <ul className="ml-5 pl-3 border-l border-gray-200 space-y-0.5 mt-0.5" role="list">
                          {item.children.map((child) => {
                            const isChildActive =
                              pathname === child.href || pathname.startsWith(`${child.href}/`);
                            return (
                              <li key={child.id}>
                                <Link
                                  href={child.href}
                                  onClick={onNavigate}
                                  className={cn(
                                    "block px-2.5 py-1.5 rounded-xs text-[11px] font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-burgundy-700",
                                    isChildActive
                                      ? "bg-burgundy-50 text-burgundy-800 font-bold"
                                      : "text-gov-muted hover:text-gov-charcoal hover:bg-slate-100"
                                  )}
                                  aria-current={isChildActive ? "page" : undefined}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                // Unimplemented item: Accessible non-navigating representation
                return (
                  <li key={item.id}>
                    <div
                      aria-disabled="true"
                      title={`${item.label} (${item.phaseLabel || "Upcoming"}) - ${item.description}`}
                      className="group flex items-center gap-2.5 px-3 py-2 rounded-xs text-xs text-gray-400 cursor-not-allowed select-none"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="truncate flex-1 font-medium">{item.label}</span>
                      {item.phaseLabel && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs bg-gray-100 text-gray-500 border border-gray-200">
                          {item.phaseLabel}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom User Card & Quick Logout */}
      <div className="p-3 border-t border-gray-200 bg-slate-50 shrink-0">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xs bg-white border border-gray-200 shadow-2xs">
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-gov-charcoal truncate">
              {user.name}
            </span>
            <span
              className="block text-[10px] text-gov-muted truncate"
              title={summary.scopeLabel}
            >
              {summary.scopeLabel}
            </span>
          </div>

          <form action={logoutStaff}>
            <button
              type="submit"
              className="p-1.5 text-gray-400 hover:text-rose-700 hover:bg-rose-50 rounded-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-600"
              title="Sign out of administrative portal"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
