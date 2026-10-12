import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-xs text-gov-muted", className)}
      {...props}
    >
      <ol className="flex items-center space-x-1.5 flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-burgundy-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
              {isLast || !item.href ? (
                <span
                  className="font-semibold text-gov-charcoal"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-burgundy-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
