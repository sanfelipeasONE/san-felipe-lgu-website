import * as React from "react";
import { cn } from "@/lib/utils";

export interface AdminSectionProps {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "subtle" | "bordered";
  className?: string;
  bodyClassName?: string;
}

export function AdminSection({
  title,
  description,
  headerActions,
  children,
  variant = "default",
  className,
  bodyClassName,
}: AdminSectionProps) {
  const variantClasses = {
    default: "bg-white border border-gray-200 shadow-2xs",
    subtle: "bg-slate-50 border border-gray-200",
    bordered: "bg-white border-2 border-gray-200",
  };

  const hasHeader = Boolean(title || description || headerActions);

  return (
    <section
      className={cn(
        "rounded-xs overflow-hidden",
        variantClasses[variant],
        className
      )}
    >
      {hasHeader && (
        <div className="px-5 py-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-bold tracking-tight text-gov-charcoal">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-gov-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
