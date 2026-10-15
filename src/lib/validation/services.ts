import { z } from "zod";
import { CANONICAL_SERVICE_KEYS } from "@/config/services-canonical";

export const serviceKeySchema = z.enum(CANONICAL_SERVICE_KEYS, {
  errorMap: () => ({ message: "Invalid service key. Must be one of the four canonical service routes." }),
});

export const serviceSectionInputSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Section heading is required.")
    .max(200, "Section heading cannot exceed 200 characters."),
  content: z
    .string()
    .trim()
    .min(1, "Section content is required.")
    .max(50000, "Section content is too long (maximum 50,000 characters)."),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type ServiceSectionInput = z.infer<typeof serviceSectionInputSchema>;

export const servicePageDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Page title must be at least 3 characters.")
    .max(200, "Page title cannot exceed 200 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Summary/description cannot exceed 2,000 characters.")
    .optional()
    .nullable(),
  officeId: z
    .string()
    .trim()
    .optional()
    .nullable(),
  sections: z.array(serviceSectionInputSchema).default([]),
  charterDocumentId: z.string().trim().optional().nullable(),
  expectedUpdatedAt: z.string().optional(),
});

export type ServicePageDraftInput = z.infer<typeof servicePageDraftSchema>;

export interface ServicePublishValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates whether a service page is structurally ready for public publication.
 */
export function validateServicePageForPublish(input: {
  title: string;
  description?: string | null;
  sections: Array<{ title: string; content: string }>;
}): ServicePublishValidationResult {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 3) {
    errors.push("Service title must be at least 3 characters long.");
  }

  if (!input.sections || input.sections.length === 0) {
    errors.push("A published service page must contain at least one content section.");
  } else {
    input.sections.forEach((s, idx) => {
      if (!s.title || s.title.trim().length === 0) {
        errors.push(`Section #${idx + 1} is missing a heading.`);
      }
      if (!s.content || s.content.trim().length === 0 || s.content.trim() === "<p></p>") {
        errors.push(`Section #${idx + 1} ("${s.title || "Untitled"}") has empty content.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
