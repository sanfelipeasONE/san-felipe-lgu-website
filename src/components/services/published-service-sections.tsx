import * as React from "react";
import { Building2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export interface PublishedServiceSectionsProps {
  office?: {
    id: string;
    name: string;
    shortName: string | null;
  } | null;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    sortOrder: number;
  }>;
}

export function PublishedServiceSections({
  office,
  sections,
}: PublishedServiceSectionsProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="py-10 sm:py-14 bg-slate-50/50">
      <Container>
        {/* Office Attribution (if assigned) */}
        {office && (
          <ScrollReveal>
            <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xs bg-white border border-gray-200 text-xs text-gov-charcoal shadow-2xs">
              <Building2 className="h-4 w-4 text-burgundy-700 shrink-0" aria-hidden="true" />
              <span>
                Publishing Office: <strong>{office.name}</strong>
              </span>
            </div>
          </ScrollReveal>
        )}

        {/* Ordered Content Sections */}
        <div className="space-y-6 max-w-4xl">
          {sections.map((section, idx) => (
            <ScrollReveal key={section.id} delayMs={idx * 40}>
              <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-2xs space-y-3">
                <div className="border-b border-gray-100 pb-2.5">
                  <h3 className="text-base sm:text-lg font-bold text-gov-charcoal">
                    {section.title}
                  </h3>
                </div>

                <div
                  className="prose prose-sm max-w-none text-gov-muted prose-headings:text-gov-charcoal prose-a:text-burgundy-800 prose-strong:text-gov-charcoal leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
