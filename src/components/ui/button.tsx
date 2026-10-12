import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-burgundy-700 text-white hover:bg-burgundy-800 active:bg-burgundy-900 border border-burgundy-800 shadow-xs",
      secondary:
        "bg-gov-surface text-gov-charcoal hover:bg-gray-200 border border-gov-border",
      outline:
        "border border-burgundy-700 text-burgundy-700 bg-white hover:bg-burgundy-50 active:bg-burgundy-100",
      ghost:
        "text-gov-charcoal hover:bg-gray-100 active:bg-gray-200",
      gold:
        "bg-gold-600 text-gov-charcoal hover:bg-gold-500 active:bg-gold-700 border border-gold-700 font-semibold shadow-xs",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs tracking-wide",
      md: "h-10 px-4 text-sm tracking-wide",
      lg: "h-12 px-6 text-base tracking-wide",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
