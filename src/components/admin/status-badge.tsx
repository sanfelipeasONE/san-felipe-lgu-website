import * as React from "react";
import {
  FileEdit,
  CheckCircle2,
  Archive,
  MinusCircle,
  AlertOctagon,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ContentStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  | "INACTIVE"
  | "SUSPENDED"
  | "ACTIVE";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  classes: string;
  iconClasses: string;
}

const STATUS_CONFIGS: Record<ContentStatus, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    icon: FileEdit,
    classes: "bg-amber-50 text-amber-800 border-amber-300",
    iconClasses: "text-amber-600",
  },
  PUBLISHED: {
    label: "Published",
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-800 border-emerald-300",
    iconClasses: "text-emerald-600",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    classes: "bg-slate-100 text-slate-700 border-slate-300",
    iconClasses: "text-slate-500",
  },
  INACTIVE: {
    label: "Inactive",
    icon: MinusCircle,
    classes: "bg-gray-100 text-gray-700 border-gray-300",
    iconClasses: "text-gray-500",
  },
  SUSPENDED: {
    label: "Suspended",
    icon: AlertOctagon,
    classes: "bg-rose-50 text-rose-800 border-rose-300",
    iconClasses: "text-rose-600",
  },
  ACTIVE: {
    label: "Active",
    icon: ShieldCheck,
    classes: "bg-emerald-50 text-emerald-800 border-emerald-300",
    iconClasses: "text-emerald-600",
  },
};

export interface StatusBadgeProps {
  status: ContentStatus | string;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  size = "sm",
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const normalized = (status?.toUpperCase() || "DRAFT") as ContentStatus;
  const config = STATUS_CONFIGS[normalized] || {
    label: status,
    icon: MinusCircle,
    classes: "bg-gray-100 text-gray-700 border-gray-300",
    iconClasses: "text-gray-500",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border transition-colors select-none",
        config.classes,
        sizeClasses[size],
        className
      )}
      role="status"
    >
      {showIcon && (
        <Icon
          className={cn("shrink-0", iconSizes[size], config.iconClasses)}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
