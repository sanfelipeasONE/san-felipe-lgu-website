import * as React from "react";
import type { PublishedContentDistribution } from "@/server/dashboard/service";

interface PublishedContentDonutProps {
  distribution: PublishedContentDistribution;
}

export function PublishedContentDonut({ distribution }: PublishedContentDonutProps) {
  const { news, documents, jobs, total } = distribution;

  const radius = 54;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke dash offsets for each segment
  const newsPercent = total > 0 ? news / total : 0;
  const docsPercent = total > 0 ? documents / total : 0;
  const jobsPercent = total > 0 ? jobs / total : 0;

  const newsDash = newsPercent * circumference;
  const docsDash = docsPercent * circumference;
  const jobsDash = jobsPercent * circumference;

  // Arc 1 (News): starts at -90 deg (12 o'clock)
  const newsOffset = 0;
  // Arc 2 (Docs): follows News
  const docsOffset = -newsDash;
  // Arc 3 (Jobs): follows Docs
  const jobsOffset = -(newsDash + docsDash);

  return (
    <div className="bg-white border border-gray-200/90 rounded-xs p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="pb-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gov-charcoal tracking-tight">
          Published Content
        </h2>
        <p className="text-xs text-gov-muted mt-0.5">
          Current published content by type.
        </p>
      </div>

      {/* Donut Chart */}
      <div className="my-auto py-4 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg
            viewBox="0 0 140 140"
            className="w-full h-full -rotate-90 select-none"
            role="img"
            aria-label={`Published content breakdown: ${total} total items (${news} news, ${documents} documents, ${jobs} jobs)`}
          >
            {/* Background ring */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />

            {total > 0 && (
              <>
                {/* News Segment (#8B1E2D) */}
                {news > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#8B1E2D"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${newsDash} ${circumference - newsDash}`}
                    strokeDashoffset={newsOffset}
                  >
                    <title>{`News & Advisories: ${news} (${Math.round(newsPercent * 100)}%)`}</title>
                  </circle>
                )}

                {/* Documents Segment (#C9A227) */}
                {documents > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#C9A227"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${docsDash} ${circumference - docsDash}`}
                    strokeDashoffset={docsOffset}
                  >
                    <title>{`Documents: ${documents} (${Math.round(docsPercent * 100)}%)`}</title>
                  </circle>
                )}

                {/* Jobs Segment (#475569) */}
                {jobs > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#475569"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${jobsDash} ${circumference - jobsDash}`}
                    strokeDashoffset={jobsOffset}
                  >
                    <title>{`Job Opportunities: ${jobs} (${Math.round(jobsPercent * 100)}%)`}</title>
                  </circle>
                )}
              </>
            )}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-gov-charcoal tracking-tight leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Published
            </span>
          </div>
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
        <div className="flex items-center justify-between text-gov-charcoal">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#8B1E2D] shrink-0" aria-hidden="true" />
            <span className="text-slate-600">News & Advisories</span>
          </span>
          <span className="font-bold">{news.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-gov-charcoal">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C9A227] shrink-0" aria-hidden="true" />
            <span className="text-slate-600">Documents</span>
          </span>
          <span className="font-bold">{documents.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-gov-charcoal">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#475569] shrink-0" aria-hidden="true" />
            <span className="text-slate-600">Job Opportunities</span>
          </span>
          <span className="font-bold">{jobs.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
