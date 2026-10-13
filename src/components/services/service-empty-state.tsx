import * as React from "react";
import Link from "next/link";
import { type LucideIcon, MapPin, Phone, Mail } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { cn } from "@/lib/utils";

export interface ServiceEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  disclaimer?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  showContactHelp?: boolean;
  className?: string;
}

export function ServiceEmptyState({
  icon: Icon,
  title,
  description,
  disclaimer,
  primaryAction,
  secondaryAction,
  showContactHelp = true,
  className,
}: ServiceEmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xs shadow-2xs p-8 sm:p-12 max-w-3xl mx-auto text-center",
        className
      )}
    >
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-full bg-burgundy-50 border border-burgundy-100 flex items-center justify-center mx-auto mb-5 text-burgundy-700 shadow-2xs">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h3 className="text-xl sm:text-2xl font-bold text-gov-charcoal tracking-tight mb-3">
        {title}
      </h3>

      {/* Primary Narrative */}
      <p className="text-sm sm:text-base text-gov-muted max-w-2xl mx-auto leading-relaxed mb-6">
        {description}
      </p>

      {/* Formal Civic Disclaimer */}
      {disclaimer && (
        <div className="bg-slate-50 border border-gray-200/80 rounded-xs px-4 py-3 mb-6 text-xs text-gov-muted leading-relaxed max-w-xl mx-auto text-left flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-600 shrink-0 mt-1.5" aria-hidden="true" />
          <span>{disclaimer}</span>
        </div>
      )}

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider text-white bg-burgundy-800 hover:bg-burgundy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 transition-colors shadow-2xs"
            >
              {primaryAction.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider text-gov-charcoal bg-white border border-gray-300 hover:bg-gray-50 hover:text-burgundy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 transition-colors"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}

      {/* Direct In-Person Civic Assistance Bar */}
      {showContactHelp && (
        <div className="pt-6 border-t border-gray-100 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3 text-center sm:text-left">
            In-Person Assistance &amp; Public Inquiries
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gov-muted">
            <div className="flex items-start gap-2 sm:col-span-3">
              <MapPin className="w-4 h-4 text-burgundy-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{SITE_CONFIG.contact.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-burgundy-700 shrink-0" aria-hidden="true" />
              <a
                href={`tel:${SITE_CONFIG.contact.phone.replace(/\D/g, "")}`}
                className="hover:text-burgundy-800 transition-colors font-medium text-gov-charcoal"
              >
                {SITE_CONFIG.contact.phone}
              </a>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Mail className="w-4 h-4 text-burgundy-700 shrink-0" aria-hidden="true" />
              <a
                href={`mailto:${SITE_CONFIG.contact.email}`}
                className="hover:text-burgundy-800 transition-colors font-medium text-gov-charcoal"
              >
                {SITE_CONFIG.contact.email}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
