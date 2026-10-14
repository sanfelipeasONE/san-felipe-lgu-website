import * as React from "react";
import Link from "next/link";
import { FolderOpen, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost" | "gold";
  };
  className?: string;
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xs border border-dashed border-gray-300 bg-slate-50/50 p-8 sm:p-12 text-center flex flex-col items-center justify-center",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gov-muted shadow-2xs mb-3.5">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <h3 className="text-sm font-bold text-gov-charcoal tracking-tight">
        {title}
      </h3>

      <p className="mt-1 text-xs sm:text-sm text-gov-muted max-w-md leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center font-medium transition-colors rounded-sm select-none cursor-pointer bg-burgundy-700 text-white hover:bg-burgundy-800 active:bg-burgundy-900 border border-burgundy-800 shadow-xs h-8 px-3 text-xs tracking-wide"
            >
              {action.label}
            </Link>
          ) : (
            <Button
              onClick={action.onClick}
              variant={action.variant || "primary"}
              size="sm"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
