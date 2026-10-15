import * as React from "react";
import { Newspaper, FileText, Briefcase, Users } from "lucide-react";
import type { DashboardSummaryMetrics } from "@/server/dashboard/service";

interface SummaryMetricsProps {
  metrics: DashboardSummaryMetrics;
}

export function SummaryMetrics({ metrics }: SummaryMetricsProps) {
  const cards = [
    {
      title: "PUBLISHED NEWS",
      value: metrics.publishedNewsCount,
      subtitle: "Currently published articles",
      icon: Newspaper,
    },
    {
      title: "PUBLISHED DOCUMENTS",
      value: metrics.publishedDocumentsCount,
      subtitle: "Published official documents",
      icon: FileText,
    },
    {
      title: "ACTIVE JOB OPPORTUNITIES",
      value: metrics.activeJobsCount,
      subtitle: "Currently open vacancies",
      icon: Briefcase,
    },
    {
      title: "ACTIVE STAFF ACCOUNTS",
      value: metrics.activeStaffCount,
      subtitle: "Authorized active personnel",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white border border-gray-200/90 border-t-2 border-t-[#8B1E2D] rounded-xs p-4 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div className="w-7 h-7 rounded-xs bg-burgundy-50 border border-burgundy-100 flex items-center justify-center text-burgundy-700 shrink-0">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gov-charcoal">
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
