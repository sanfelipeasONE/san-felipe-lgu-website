import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "burgundy" | "gold" | "outline" | "success";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-gov-surface text-gov-charcoal border border-gov-border",
    burgundy: "bg-burgundy-100 text-burgundy-900 border border-burgundy-500/20",
    gold: "bg-gold-100 text-gold-800 border border-gold-600/30",
    outline: "text-gov-charcoal border border-gov-border",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-medium uppercase tracking-wider",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
