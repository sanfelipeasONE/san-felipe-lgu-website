import * as React from "react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({
  title,
  eyebrow,
  description,
  breadcrumbs,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "bg-gov-surface border-b border-gov-border py-8 sm:py-10",
        className
      )}
      {...props}
    >
      <Container>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {eyebrow && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block mb-1.5">
                {eyebrow}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gov-charcoal">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-base text-gov-muted max-w-3xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </Container>
    </div>
  );
}
