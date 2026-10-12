import * as React from "react";
import { GovernmentTopBar } from "@/components/layout/government-top-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Accessibility: Skip link */}
      <a href="#main-content" className="sr-only skip-to-content">
        Skip to main content
      </a>

      {/* Official PH Government Bar */}
      <GovernmentTopBar />

      {/* Municipal Header & Navigation */}
      <SiteHeader />

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Civic Footer */}
      <SiteFooter />
    </div>
  );
}
