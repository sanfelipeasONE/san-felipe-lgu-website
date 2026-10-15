import * as React from "react";
import type { OfficeContentDistributionData } from "@/server/dashboard/service";

interface OfficeDistributionPanelProps {
  distribution: OfficeContentDistributionData;
}

export function OfficeDistributionPanel({ distribution }: OfficeDistributionPanelProps) {
  const { offices, totalActiveItems, reportingOfficeCount, isOfficeScoped } = distribution;

  const maxCount = Math.max(...offices.map((o) => o.count), 1);

  return (
    <div className="bg-white border border-gray-200/90 rounded-xs p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-gov-charcoal tracking-tight">
              Published Content by Office
            </h2>
            <p className="text-xs text-gov-muted mt-0.5">
              Published website content attributed to municipal offices.
            </p>
          </div>

          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-xs shrink-0 shadow-2xs">
            {isOfficeScoped
              ? "Assigned Office"
              : `${reportingOfficeCount} Active Office${reportingOfficeCount === 1 ? "" : "s"}`}
          </span>
        </div>

        {/* Office Bars */}
        <div className="mt-4 space-y-3.5 max-h-[380px] overflow-y-auto pr-1.5">
          {offices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xs border border-dashed border-gray-200">
              No published content is currently attributed to municipal offices.
            </div>
          ) : (
            offices.map((office) => {
              const displayName = office.shortName
                ? `${office.name} (${office.shortName})`
                : office.name;
              const percent = maxCount > 0 ? (office.count / maxCount) * 100 : 0;

              return (
                <div key={office.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate pr-2 max-w-[280px] sm:max-w-md">
                      {displayName}
                    </span>
                    <span className="font-bold text-gov-charcoal shrink-0 font-mono">
                      {office.count.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-xs overflow-hidden">
                    <div
                      className="bg-[#8B1E2D] h-full rounded-xs transition-all duration-300"
                      style={{ width: `${percent}%` }}
                      role="progressbar"
                      aria-valuenow={office.count}
                      aria-valuemin={0}
                      aria-valuemax={maxCount}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer info line */}
      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Aggregated active items count: {totalActiveItems.toLocaleString()}</span>
        <span className="font-medium text-slate-500">Direct municipal attribution active</span>
      </div>
    </div>
  );
}
