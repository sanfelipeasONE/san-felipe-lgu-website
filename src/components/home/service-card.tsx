import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Building,
  Download,
  Briefcase,
  Phone,
  ArrowRight,
} from "lucide-react";
import type { ServiceItem } from "@/config/homepage-data";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: ServiceItem;
}

const iconMap = {
  "file-text": FileText,
  building: Building,
  download: Download,
  briefcase: Briefcase,
  phone: Phone,
};

export function ServiceCard({ service }: ServiceCardProps) {
  const IconComponent = iconMap[service.iconName] || FileText;

  return (
    <div
      className={cn(
        "bg-white border border-gray-200/90 rounded-xs p-6 shadow-2xs hover:shadow-xs hover:border-burgundy-700 focus-within:border-burgundy-700 focus-within:shadow-xs transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-between border-t-4 h-full min-h-[220px] group",
        service.topAccentColor
      )}
    >
      <div>
        {/* Icon box */}
        <div className="w-11 h-11 rounded-xs bg-slate-50 border border-slate-200/90 flex items-center justify-center text-burgundy-800 mb-4 group-hover:bg-burgundy-50 group-focus-within:bg-burgundy-50 transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]">
          <IconComponent className="h-5 w-5" />
        </div>

        <h3 className="text-base font-bold text-gov-charcoal tracking-tight leading-snug mb-2 group-hover:text-burgundy-800 group-focus-within:text-burgundy-800 transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]">
          {service.title}
        </h3>

        <p className="text-xs sm:text-[13px] text-gov-muted leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-gray-100">
        <Link
          href={service.href}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 focus-visible:outline-none focus-visible:underline transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
          <span>{service.actionText}</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 group-focus-within:translate-x-1 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]" />
        </Link>
      </div>
    </div>
  );
}
