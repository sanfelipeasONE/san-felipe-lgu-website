import * as React from "react";
import { AlertCircle, Bell, Newspaper, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsType } from "@/config/news-data";

export interface NewsBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: NewsType;
  showIcon?: boolean;
}

export function NewsBadge({
  type,
  showIcon = true,
  className,
  ...props
}: NewsBadgeProps) {
  const config = {
    advisory: {
      label: "Advisory",
      icon: AlertCircle,
      classes: "bg-burgundy-50 text-burgundy-800 border-burgundy-200/90",
    },
    announcement: {
      label: "Announcement",
      icon: Bell,
      classes: "bg-blue-50 text-blue-800 border-blue-200/90",
    },
    news: {
      label: "News",
      icon: Newspaper,
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
    },
    notice: {
      label: "Public Notice",
      icon: FileText,
      classes: "bg-amber-50 text-amber-900 border-amber-200/90",
    },
  }[type];

  const IconComponent = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider border shadow-2xs",
        config.classes,
        className
      )}
      {...props}
    >
      {showIcon && <IconComponent className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
