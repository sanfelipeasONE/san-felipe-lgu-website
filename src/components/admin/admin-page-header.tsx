import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 py-5 sm:py-6",
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Admin Breadcrumb" className="mb-2">
              <ol className="flex items-center gap-1.5 text-xs text-gov-muted flex-wrap">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <li key={idx} className="flex items-center gap-1.5">
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          className="hover:text-burgundy-700 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            isLast ? "font-semibold text-gov-charcoal" : ""
                          )}
                          aria-current={isLast ? "page" : undefined}
                        >
                          {crumb.label}
                        </span>
                      )}
                      {!isLast && (
                        <ChevronRight
                          className="h-3 w-3 text-gray-400 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gov-charcoal">
              {title}
            </h1>
            {badge}
          </div>

          {description && (
            <p className="mt-1 text-xs sm:text-sm text-gov-muted max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
