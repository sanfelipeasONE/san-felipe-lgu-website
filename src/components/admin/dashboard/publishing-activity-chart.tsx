import * as React from "react";
import type { PublishingActivityData } from "@/server/dashboard/service";

interface PublishingActivityChartProps {
  data: PublishingActivityData;
}

export function PublishingActivityChart({ data }: PublishingActivityChartProps) {
  const { months, maxCount, totalPeriodPublished } = data;

  // Compute nice Y-axis max (at least 6 or 12 for clean grid lines)
  const yMax = Math.max(12, Math.ceil((maxCount + 2) / 3) * 3);
  const yTicks = [0, Math.round(yMax / 4), Math.round(yMax / 2), Math.round((yMax * 3) / 4), yMax];

  // SVG coordinates setup
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingLeft = 36;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const numPoints = months.length;
  const xStep = numPoints > 1 ? chartWidth / (numPoints - 1) : chartWidth;

  const getX = (index: number) => paddingLeft + index * xStep;
  const getY = (val: number) => paddingTop + chartHeight - (val / yMax) * chartHeight;

  // Build point coordinates for each series
  const newsPoints = months.map((m, i) => ({ x: getX(i), y: getY(m.news), val: m.news, label: m.label }));
  const docPoints = months.map((m, i) => ({ x: getX(i), y: getY(m.documents), val: m.documents, label: m.label }));
  const jobPoints = months.map((m, i) => ({ x: getX(i), y: getY(m.jobs), val: m.jobs, label: m.label }));

  const toPathString = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="bg-white border border-gray-200/90 rounded-xs p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-gov-charcoal tracking-tight">
            Content Publishing Activity
          </h2>
          <p className="text-xs text-gov-muted mt-0.5">
            Published municipal content over the last 6 months.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#8B1E2D]" aria-hidden="true" />
            <span>News</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C9A227]" aria-hidden="true" />
            <span>Documents</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#475569]" aria-hidden="true" />
            <span>Jobs</span>
          </span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[480px] max-h-[240px] text-slate-400 select-none"
          role="img"
          aria-label="Content publishing activity over the last 6 months line chart"
        >
          <desc>
            Line chart showing monthly count of published News, Documents, and Job Opportunities over the last six months.
          </desc>

          {/* Horizontal Grid lines & Y-ticks */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : "3 3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono select-none"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {months.map((m, i) => {
            const x = getX(i);
            return (
              <text
                key={m.monthKey}
                x={x}
                y={svgHeight - 10}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-medium select-none"
              >
                {m.label}
              </text>
            );
          })}

          {/* Series Polyline: Jobs (#475569) */}
          <path
            d={toPathString(jobPoints)}
            fill="none"
            stroke="#475569"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {jobPoints.map((p, i) => (
            <circle
              key={`job-${i}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#475569"
              strokeWidth="2"
            >
              <title>{`${p.label}: ${p.val} Job Opportunities published`}</title>
            </circle>
          ))}

          {/* Series Polyline: Documents (#C9A227) */}
          <path
            d={toPathString(docPoints)}
            fill="none"
            stroke="#C9A227"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {docPoints.map((p, i) => (
            <circle
              key={`doc-${i}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#C9A227"
              strokeWidth="2"
            >
              <title>{`${p.label}: ${p.val} Documents published`}</title>
            </circle>
          ))}

          {/* Series Polyline: News (#8B1E2D) */}
          <path
            d={toPathString(newsPoints)}
            fill="none"
            stroke="#8B1E2D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {newsPoints.map((p, i) => (
            <circle
              key={`news-${i}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#8B1E2D"
              strokeWidth="2"
            >
              <title>{`${p.label}: ${p.val} News articles published`}</title>
            </circle>
          ))}
        </svg>
      </div>

      {totalPeriodPublished === 0 && (
        <div className="mt-2 py-2 text-center text-xs text-slate-400 bg-slate-50/70 rounded-xs border border-dashed border-gray-200">
          No publication activity recorded in the last 6 months.
        </div>
      )}
    </div>
  );
}
