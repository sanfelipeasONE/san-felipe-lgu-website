"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { MAIN_NAV_ITEMS, NAV_DROPDOWN_ITEMS } from "@/config/site";
import { cn } from "@/lib/utils";
import { ASSETS } from "@/config/assets";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // User toggle overrides: key is menu title, value is boolean
  const [userOverrides, setUserOverrides] = React.useState<Record<string, boolean>>({});

  const isMenuExpanded = (title: string): boolean => {
    if (userOverrides[title] !== undefined) {
      return userOverrides[title];
    }
    if (title === "Government") return pathname.startsWith("/government");
    if (title === "Services") return pathname.startsWith("/services");
    if (title === "Tourism") return pathname.startsWith("/tourism");
    if (title === "Transparency") return pathname.startsWith("/transparency");
    return false;
  };

  const toggleMenu = (title: string) => {
    setUserOverrides((prev) => ({
      ...prev,
      [title]: !isMenuExpanded(title),
    }));
  };

  // Handle escape key to close menu
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setUserOverrides({});
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

  const handleLinkClick = (href?: string) => {
    setIsOpen(false);
    setUserOverrides({});

    if (href === "/#emergency-hotlines" && pathname === "/") {
      const el = document.getElementById("emergency-hotlines");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", "/#emergency-hotlines");
        }, 100);
      }
    }
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setUserOverrides({});
          }
          setIsOpen(!isOpen);
        }}
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
          onClick={() => {
            setIsOpen(false);
            setUserOverrides({});
          }}
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
            onClick={() => {
              setIsOpen(false);
              setUserOverrides({});
            }}
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

            const dropdownLinks = NAV_DROPDOWN_ITEMS[item.title];
            const hasDropdown = Boolean(dropdownLinks);
            const isExpanded = isMenuExpanded(item.title);

            if (hasDropdown && dropdownLinks) {
              const menuId = `mobile-${item.title.toLowerCase().replace(/\s+/g, "-")}-menu`;

              return (
                <div key={item.title} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.title)}
                    aria-expanded={isExpanded}
                    aria-controls={menuId}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-sm transition-colors text-left min-h-[44px]",
                      isActive
                        ? "bg-burgundy-50 text-burgundy-700 font-semibold border-l-4 border-burgundy-700"
                        : "text-gov-charcoal hover:bg-gray-100 hover:text-burgundy-700"
                    )}
                  >
                    <span>{item.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 text-gov-muted",
                        isExpanded && "rotate-180 text-burgundy-700"
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {isExpanded && (
                    <div
                      id={menuId}
                      className="pl-3.5 pr-2 py-1 space-y-1 ml-2 border-l-2 border-burgundy-200 bg-gray-50/70 rounded-xs"
                    >
                      {dropdownLinks.map((subItem) => {
                        const isSubActive =
                          subItem.href === "/#emergency-hotlines" || subItem.href === "/#contact-us"
                            ? false
                            : pathname === subItem.href || pathname.startsWith(subItem.href + "/");

                        return (
                          <Link
                            key={subItem.title}
                            href={subItem.href}
                            onClick={() => handleLinkClick(subItem.href)}
                            className={cn(
                              "flex items-center min-h-[44px] px-3 py-2 text-xs font-medium rounded-xs transition-colors",
                              isSubActive
                                ? "bg-burgundy-100 text-burgundy-800 font-semibold"
                                : "text-gov-charcoal hover:bg-white hover:text-burgundy-800"
                            )}
                            aria-current={isSubActive ? "page" : undefined}
                          >
                            {subItem.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleLinkClick(item.href)}
                className={cn(
                  "flex items-center min-h-[44px] px-3.5 py-2.5 text-sm font-medium rounded-sm transition-colors",
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

          {/* Standalone Mobile Contact Us link per Section 26 */}
          <Link
            href="/#contact-us"
            onClick={() => handleLinkClick("/#contact-us")}
            className="flex items-center min-h-[44px] px-3.5 py-2.5 text-sm font-medium rounded-sm transition-colors text-gov-charcoal hover:bg-gray-100 hover:text-burgundy-700"
          >
            Contact Us
          </Link>
        </nav>
      </div>
    </div>
  );
}
