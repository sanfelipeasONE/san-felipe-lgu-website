import * as React from "react";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";
import type { ArticleBodyBlock } from "@/config/news-data";

export interface ArticleBodyProps {
  blocks: ArticleBodyBlock[];
}

export function ArticleBody({ blocks }: ArticleBodyProps) {
  return (
    <div className="prose-gov space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={index}
                className="text-lg sm:text-xl lg:text-2xl font-black text-gov-charcoal tracking-tight pt-4 pb-1 border-b border-gray-100"
              >
                {block.content}
              </h2>
            );

          case "h3":
            return (
              <h3
                key={index}
                className="text-base sm:text-lg font-extrabold text-gov-charcoal tracking-tight pt-2"
              >
                {block.content}
              </h3>
            );

          case "p":
            return (
              <p key={index} className="text-slate-700 leading-relaxed">
                {block.content}
              </p>
            );

          case "ul":
            return (
              <ul
                key={index}
                className="space-y-2.5 my-4 pl-4 sm:pl-6 list-disc marker:text-burgundy-700"
              >
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 pl-1 leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );

          case "callout": {
            const isWarning = block.calloutType === "warning";
            const isAdvisory = block.calloutType === "advisory";

            return (
              <aside
                key={index}
                className={`p-4 sm:p-5 rounded-xs my-6 border-l-4 text-xs sm:text-sm shadow-2xs ${
                  isAdvisory
                    ? "bg-burgundy-50/70 border-burgundy-700 text-burgundy-950 border border-gray-200 border-l-burgundy-700"
                    : isWarning
                    ? "bg-amber-50/70 border-amber-500 text-amber-950 border border-amber-200 border-l-amber-500"
                    : "bg-blue-50/70 border-blue-600 text-blue-950 border border-blue-200 border-l-blue-600"
                }`}
              >
                <div className="flex gap-3 items-start">
                  {isAdvisory ? (
                    <AlertCircle className="h-5 w-5 text-burgundy-700 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : isWarning ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <p className="leading-relaxed font-medium">{block.content}</p>
                </div>
              </aside>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
