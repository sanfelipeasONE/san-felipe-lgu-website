import { z } from "zod";
import {
  getFileExtension,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  sanitizeFilename,
  validateDocumentContent,
} from "@/lib/validation/documents";

export const RESOLUTION_STATUS_LABELS: Record<"DRAFT" | "PUBLISHED" | "ARCHIVED", string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const resolutionInputSchema = z.object({
  resolutionNumber: z
    .string()
    .trim()
    .min(1, "Resolution number is required")
    .max(100, "Resolution number must not exceed 100 characters"),
  title: z
    .string()
    .trim()
    .min(3, "Resolution title must be at least 3 characters")
    .max(300, "Resolution title must not exceed 300 characters"),
  year: z.coerce
    .number()
    .int("Year must be a valid integer")
    .min(1900, "Year must be 1900 or later")
    .max(2100, "Year must not exceed 2100"),
  adoptedAt: z
    .string()
    .trim()
    .min(1, "Date adopted is required")
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Date adopted must be a valid date",
    }),
  summary: z
    .string()
    .trim()
    .max(3000, "Description / summary must not exceed 3000 characters")
    .optional()
    .nullable(),
  expectedUpdatedAt: z.string().optional(),
});

export type ResolutionInput = z.infer<typeof resolutionInputSchema>;

const ALLOWED_PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/octet-stream",
]);

/**
 * Validates an uploaded Sangguniang Bayan Resolution PDF attachment:
 * - Non-empty and <= 15 MB
 * - .pdf extension only
 * - Valid MIME type (application/pdf or application/octet-stream fallback)
 * - Authentic %PDF- magic bytes (rejects executables, scripts, spoofed files)
 */
export function validateResolutionPdfFile(params: {
  buffer: Buffer | Uint8Array;
  filename: string;
  mimeType: string;
  size: number;
}): { valid: boolean; error?: string; cleanFilename: string } {
  const cleanFilename = sanitizeFilename(params.filename || "resolution.pdf");
  const ext = getFileExtension(cleanFilename);

  if (ext !== "pdf") {
    return {
      valid: false,
      error: "Only PDF files (.pdf) are allowed for Sangguniang Bayan Resolutions.",
      cleanFilename,
    };
  }

  if (params.size <= 0 || params.buffer.length === 0) {
    return {
      valid: false,
      error: "The uploaded PDF file is empty.",
      cleanFilename,
    };
  }

  if (params.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "The uploaded PDF file exceeds the 15 MB maximum limit.",
      cleanFilename,
    };
  }

  const normalizedMime = (params.mimeType || "application/octet-stream").toLowerCase().trim();
  if (!ALLOWED_PDF_MIME_TYPES.has(normalizedMime)) {
    return {
      valid: false,
      error: "Invalid file MIME type. Only PDF attachments are permitted.",
      cleanFilename,
    };
  }

  const contentCheck = validateDocumentContent(params.buffer, "pdf");
  if (!contentCheck.valid) {
    return {
      valid: false,
      error: contentCheck.error || "Invalid PDF file content.",
      cleanFilename,
    };
  }

  return {
    valid: true,
    cleanFilename,
  };
}
