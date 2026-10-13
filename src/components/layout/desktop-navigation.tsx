"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { MAIN_NAV_ITEMS, NAV_DROPDOWN_ITEMS } from "@/config/site";
import { cn } from "@/lib/utils";

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-1">
      {MAIN_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        const dropdownLinks = NAV_DROPDOWN_ITEMS[item.title];
        const hasDropdown = Boolean(dropdownLinks);

        return (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              onClick={(e) => {
                if (item.href === "/services") {
                  e.preventDefault();
                }
              }}
              className={cn(
                "relative px-3.5 py-2 text-sm font-medium rounded-xs flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isActive
                  ? "text-burgundy-800 font-semibold"
                  : "text-gov-charcoal hover:text-burgundy-800"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-haspopup={hasDropdown ? "true" : undefined}
            >
              <span>{item.title}</span>
              {hasDropdown && (
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-180 group-focus-within:rotate-180",
                    isActive ? "text-burgundy-800" : "text-gray-400"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Thin underline that slides in under hovered/active item */}
              <span
                className={cn(
                  "absolute bottom-0 left-2 right-2 h-0.5 bg-burgundy-700 origin-left transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isActive
                    ? "opacity-100 scale-x-100"
                    : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 group-focus-within:opacity-100 group-focus-within:scale-x-100"
                )}
                aria-hidden="true"
              />
            </Link>

            {/* Dropdown: fades and drops 6px in 150ms */}
            {hasDropdown && dropdownLinks && (
              <div
                className="absolute top-full left-0 mt-1 min-w-[13.5rem] bg-white border border-gray-200 shadow-md rounded-xs py-1.5 z-40 opacity-0 -translate-y-1.5 invisible pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:visible group-focus-within:pointer-events-auto transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                {dropdownLinks.map((subItem) => {
                  const isSubActive =
                    subItem.href === "/#emergency-hotlines"
                      ? false
                      : pathname === subItem.href || pathname.startsWith(subItem.href + "/");

                  return (
                    <Link
                      key={subItem.title}
                      href={subItem.href}
                      onClick={(e) => {
                        if (subItem.href === "/#emergency-hotlines" && pathname === "/") {
                          const el = document.getElementById("emergency-hotlines");
                          if (el) {
                            e.preventDefault();
                            el.scrollIntoView({ behavior: "smooth" });
                            window.history.pushState(null, "", "/#emergency-hotlines");
                          }
                        }
                      }}
                      className={cn(
                        "block px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isSubActive
                          ? "bg-burgundy-50 text-burgundy-800 font-semibold"
                          : "text-gov-charcoal hover:text-burgundy-800 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:text-burgundy-800 focus-visible:outline-none"
                      )}
                    >
                      {subItem.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
