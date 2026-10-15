import * as React from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PublicSealSplash } from "@/components/layout/public-seal-splash";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Official Municipal Seal Initial Entry Experience */}
      <PublicSealSplash />

      {/* Accessibility: Skip link */}
      <a href="#main-content" className="sr-only skip-to-content">
        Skip to main content
      </a>

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
