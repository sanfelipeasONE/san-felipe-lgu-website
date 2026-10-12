import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badge?: string;
  centered?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  badge,
  centered = false,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-8",
        centered ? "text-center mx-auto max-w-2xl" : "",
        className
      )}
      {...props}
    >
      {badge && (
        <span className="inline-block text-xs font-semibold tracking-wider uppercase text-burgundy-700 bg-burgundy-50 border border-burgundy-100 px-2.5 py-0.5 rounded-xs mb-2">
          {badge}
        </span>
      )}
      <div className={cn("flex items-center gap-3", centered ? "justify-center" : "")}>
        <div className="h-6 w-1 bg-burgundy-700 rounded-xs shrink-0" aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gov-charcoal">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="mt-2 text-base text-gov-muted leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
