import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-sm border bg-white px-3 py-2 text-sm text-gov-charcoal placeholder:text-gov-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60 transition-colors",
          error
            ? "border-red-600 focus-visible:ring-red-600"
            : "border-gov-border focus-visible:border-burgundy-700 focus-visible:ring-burgundy-700",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
