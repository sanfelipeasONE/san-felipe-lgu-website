import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminLoadingStateProps {
  label?: string;
  className?: string;
  inline?: boolean;
}

export function AdminLoadingState({
  label = "Loading municipal records...",
  className,
  inline = false,
}: AdminLoadingStateProps) {
  if (inline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("inline-flex items-center gap-2 text-xs text-gov-muted", className)}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-burgundy-700" aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "py-12 sm:py-16 text-center flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xs",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-burgundy-700 mb-3" aria-hidden="true" />
      <span className="text-xs sm:text-sm font-medium text-gov-charcoal">
        {label}
      </span>
      <span className="sr-only">Please wait while the system completes this request.</span>
    </div>
  );
}
