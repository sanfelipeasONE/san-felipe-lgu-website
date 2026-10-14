import * as React from "react";
import { cn } from "@/lib/utils";

export interface AdminContentProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "full" | "narrow";
}

export function AdminContent({
  children,
  className,
  maxWidth = "default",
}: AdminContentProps) {
  const maxWidthClasses = {
    default: "max-w-7xl",
    full: "max-w-full",
    narrow: "max-w-4xl",
  };

  return (
    <div
      className={cn(
        "flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8",
        className
      )}
    >
      <div className={cn("mx-auto space-y-6 sm:space-y-8", maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </div>
  );
}
