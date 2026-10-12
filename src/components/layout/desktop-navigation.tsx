"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/config/site";
import { cn } from "@/lib/utils";

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-1.5">
      {MAIN_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        const hasDropdown = item.title === "Government" || item.title === "Offices";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3.5 py-2 text-sm font-medium transition-colors rounded-xs flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:ring-offset-1",
              isActive
                ? "bg-burgundy-700 text-white font-semibold shadow-2xs"
                : "text-gov-charcoal hover:text-burgundy-700 hover:bg-gray-100/70"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span>{item.title}</span>
            {hasDropdown && (
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isActive ? "text-white/80" : "text-gray-400"
                )}
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
