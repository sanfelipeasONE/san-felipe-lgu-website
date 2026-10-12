import * as React from "react";
import { FileText } from "lucide-react";
import type { ArticleAttachment } from "@/config/news-data";

export interface ArticleAttachmentsProps {
  attachments?: ArticleAttachment[];
}

export function ArticleAttachments({ attachments }: ArticleAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <section aria-label="Official Attachments" className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        Attachments
      </h3>

      <div className="space-y-2">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-3 rounded-xs border border-gray-200 bg-slate-50/60 text-xs gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="h-4 w-4 text-burgundy-700 shrink-0" aria-hidden="true" />
              <span className="font-semibold text-gov-charcoal truncate">
                {att.name}
              </span>
              <span className="text-slate-400 shrink-0">
                ({att.fileType} • {att.fileSize})
              </span>
            </div>

            <span className="text-[11px] text-slate-400 italic shrink-0">
              Document Pending Client Submission
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
