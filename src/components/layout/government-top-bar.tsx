import * as React from "react";
import { Container } from "@/components/layout/container";

export function GovernmentTopBar() {
  return (
    <aside
      aria-label="Philippine Government Affiliation"
      className="bg-gray-100 text-gov-charcoal text-[11px] border-b border-gov-border py-1"
    >
      <Container>
        <div className="flex h-6 items-center justify-between">
          <div className="flex items-center space-x-2 text-gov-muted">
            <span className="font-bold tracking-wider text-gov-charcoal uppercase">
              GOVPH
            </span>
            <span className="text-gray-300" aria-hidden="true">|</span>
            <span className="font-medium text-gov-charcoal">
              REPUBLIC OF THE PHILIPPINES
            </span>
            <span className="hidden md:inline text-gray-300" aria-hidden="true">&bull;</span>
            <span className="hidden md:inline text-gray-500">
              All content is in the public domain unless otherwise stated.
            </span>
          </div>

          <div className="flex items-center space-x-3 text-gov-muted text-[11px]">
            <span className="hidden sm:inline font-medium">
              Philippine Standard Time
            </span>
            <span className="hidden sm:inline text-gray-300" aria-hidden="true">|</span>
            <a
              href="#main-content"
              className="text-burgundy-700 hover:underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-burgundy-700 rounded-xs"
            >
              Skip to Content
            </a>
          </div>
        </div>
      </Container>
    </aside>
  );
}
