"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/config/site";
import { cn } from "@/lib/utils";
import { ASSETS } from "@/config/assets";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // Handle escape key to close menu
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className="p-2 text-gov-charcoal hover:text-burgundy-700 hover:bg-gray-100 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:ring-offset-1"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-navigation-menu"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-4/5 max-w-sm bg-white shadow-xl transition-transform duration-200 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gov-border">
          <div className="flex items-center space-x-2.5">
            <div className="relative w-8 h-8 rounded-full border border-gold-600/70 overflow-hidden shrink-0 bg-white">
              <Image
                src={ASSETS.branding.seal.src}
                alt={ASSETS.branding.seal.alt}
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-extrabold text-sm text-burgundy-900">
              San Felipe Portal
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="p-1.5 text-gov-muted hover:text-gov-charcoal hover:bg-gray-100 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Mobile Navigation" className="flex-1 overflow-y-auto p-4 space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3.5 py-2.5 text-sm font-medium rounded-sm transition-colors",
                  isActive
                    ? "bg-burgundy-50 text-burgundy-700 font-semibold border-l-4 border-burgundy-700"
                    : "text-gov-charcoal hover:bg-gray-100 hover:text-burgundy-700"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
