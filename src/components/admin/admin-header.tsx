"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  LogOut,
  User,
  Shield,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutStaff } from "@/app/(auth)/staff/login/actions";
import { ASSETS } from "@/config/assets";
import { getAuthoritySummary } from "@/lib/authz/scope";
import type { SessionUser } from "@/server/auth/session";

export interface AdminHeaderProps {
  user: SessionUser;
  onOpenMobileMenu?: () => void;
  titleContext?: string;
}

export function AdminHeader({
  user,
  onOpenMobileMenu,
  titleContext = "Dashboard",
}: AdminHeaderProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close account dropdown on outside click or Escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const summary = getAuthoritySummary(user);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-xs text-gov-charcoal hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-burgundy-700"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Small screen branding badge */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-full border border-gold-600/70 overflow-hidden bg-white shrink-0">
            <Image
              src={ASSETS.branding.seal.src}
              alt={ASSETS.branding.seal.alt}
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-xs text-burgundy-800 tracking-tight truncate">
            SFZ CMS
          </span>
        </div>

        {/* Desktop breadcrumb / context */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <Link
            href="/admin"
            className="text-gov-muted hover:text-burgundy-700 transition-colors font-medium"
          >
            Municipal CMS
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gov-charcoal tracking-tight">
            {titleContext}
          </span>
        </div>
      </div>

      {/* Right: Authenticated Staff Identity & Account Menu */}
      <div className="flex items-center gap-3">
        {/* Office Affiliation Chip (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-gray-200 text-[11px] text-gov-charcoal font-medium">
          <Building2 className="h-3 w-3 text-burgundy-700 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[200px]" title={summary.scopeLabel}>
            {summary.scopeLabel}
          </span>
        </div>

        {/* Account Menu Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            aria-expanded={isAccountMenuOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 p-1.5 rounded-xs hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-burgundy-700 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-800 shrink-0 font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-gov-charcoal leading-tight truncate max-w-[140px]">
                {user.name}
              </span>
              <span className="block text-[10px] text-gov-muted leading-tight truncate max-w-[140px]">
                {summary.levelLabel}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block shrink-0" />
          </button>

          {/* Account Dropdown Popover */}
          {isAccountMenuOpen && (
            <div
              role="menu"
              aria-label="Staff account menu"
              className="absolute right-0 mt-1.5 w-72 bg-white rounded-xs border border-gray-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* User Overview */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3.5 w-3.5 text-burgundy-700 shrink-0" />
                  <span className="font-bold text-xs text-gov-charcoal truncate">
                    {user.name}
                  </span>
                </div>
                <span className="block text-xs text-gov-muted truncate">
                  {user.email}
                </span>

                <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-col gap-1 text-[11px] text-gov-muted">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-gold-600 shrink-0" />
                    <span>Role: {user.role.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-burgundy-700 shrink-0" />
                    <span className="truncate" title={summary.scopeLabel}>
                      {summary.scopeLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Action */}
              <div className="px-2 pt-2">
                <form action={logoutStaff}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 font-medium h-8"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2 shrink-0" />
                    <span>Sign Out</span>
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
