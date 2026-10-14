"use client";

import * as React from "react";
import { X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { SessionUser } from "@/server/auth/session";

export interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: SessionUser;
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  user,
}: AdminMobileDrawerProps) {
  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard navigation: Escape key closes drawer
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Navigation Menu"
      className="fixed inset-0 z-50 lg:hidden flex"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gov-charcoal/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Close Button Header */}
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xs text-gray-400 hover:text-gov-charcoal hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-burgundy-700"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Component */}
        <div className="h-full flex-1 overflow-hidden">
          <AdminSidebar
            user={user}
            onNavigate={onClose}
            className="w-full border-r-0"
          />
        </div>
      </div>
    </div>
  );
}
