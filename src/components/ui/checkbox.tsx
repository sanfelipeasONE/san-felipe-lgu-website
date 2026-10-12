import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={cn(
            "h-4 w-4 rounded-xs border-gov-border text-burgundy-700 accent-burgundy-700 focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:ring-offset-1 cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="text-sm text-gov-charcoal select-none cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
