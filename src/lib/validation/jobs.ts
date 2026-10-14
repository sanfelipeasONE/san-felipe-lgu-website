import { z } from "zod";

/**
 * Non-binding UI suggestions for employment classification inputs.
 * These are NOT enforced as a closed enum and are NOT seeded as municipal policy.
 */
export const ALLOWED_EMPLOYMENT_TYPES = [
  "Permanent",
  "Contractual",
  "Casual",
  "Co-Terminous",
] as const;

export type AllowedEmploymentType = (typeof ALLOWED_EMPLOYMENT_TYPES)[number];

/**
 * Strips HTML tags and excessive whitespace from plain-text input fields.
 */
export function sanitizePlainText(input?: string | null): string | null {
  if (!input) return null;
  const stripped = input.replace(/<[^>]*>/g, "").trim();
  return stripped.length > 0 ? stripped : null;
}

/**
 * Generates a clean URL-friendly slug from position title with optional unique suffix.
 */
export function generateJobSlug(title: string, suffix?: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const cleanBase = base.slice(0, 80) || "job-vacancy";
  const uniqueId = suffix || Math.random().toString(36).substring(2, 8);
  return `${cleanBase}-${uniqueId}`;
}

/**
 * Derives whether a job opportunity is currently closed based on closingDate
 * evaluated against Philippine Standard Time (Asia/Manila, UTC+8).
 *
 * Invariant: A vacancy with closing date YYYY-MM-DD remains OPEN for that entire
 * calendar date in Asia/Manila, and only becomes closed starting the following calendar day.
 * This is a PRESENTATION state and does not alter database lifecycle status.
 */
export function isJobClosed(
  closingDate?: Date | string | null,
  referenceDate?: Date
): boolean {
  if (!closingDate) return false;

  const current = referenceDate || new Date();

  // Format current/reference date in Asia/Manila (UTC+8) as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayStr = formatter.format(current);

  let closingStr: string;
  if (typeof closingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(closingDate.trim())) {
    closingStr = closingDate.trim();
  } else {
    const d = typeof closingDate === "string" ? new Date(closingDate) : closingDate;
    if (isNaN(d.getTime())) return false;
    closingStr = formatter.format(d);
  }

  // Strictly closed only when current calendar day in Manila is after closing calendar date
  return closingStr < todayStr;
}

/**
 * Zod validation schema for Job Opportunity input.
 */
export const jobOpportunityInputSchema = z
  .object({
    title: z
      .string()
      .min(3, "Position title must be at least 3 characters.")
      .max(200, "Position title cannot exceed 200 characters."),
    itemNumber: z
      .string()
      .max(50, "Plantilla item number cannot exceed 50 characters.")
      .nullish(),
    officeId: z.string().nullish(),
    employmentType: z
      .string()
      .max(50, "Employment type cannot exceed 50 characters.")
      .nullish(),
    salaryGrade: z
      .string()
      .max(30, "Salary grade cannot exceed 30 characters.")
      .nullish(),
    monthlySalary: z
      .string()
      .max(50, "Monthly salary cannot exceed 50 characters.")
      .nullish(),
    description: z
      .string()
      .max(5000, "Description cannot exceed 5000 characters.")
      .nullish(),
    education: z
      .string()
      .max(1000, "Education requirement cannot exceed 1000 characters.")
      .nullish(),
    training: z
      .string()
      .max(1000, "Training requirement cannot exceed 1000 characters.")
      .nullish(),
    experience: z
      .string()
      .max(1000, "Experience requirement cannot exceed 1000 characters.")
      .nullish(),
    eligibility: z
      .string()
      .max(1000, "Eligibility requirement cannot exceed 1000 characters.")
      .nullish(),
    competency: z
      .string()
      .max(1000, "Competency requirement cannot exceed 1000 characters.")
      .nullish(),
    applicationInstructions: z
      .string()
      .max(5000, "Application instructions cannot exceed 5000 characters.")
      .nullish(),
    postingDate: z.string().nullish(),
    closingDate: z.string().nullish(),
    attachmentDocumentId: z.string().nullish(),
    expectedUpdatedAt: z.string().nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.postingDate && data.postingDate.trim()) {
      const pDate = new Date(data.postingDate);
      if (isNaN(pDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Posting date is not a valid date format.",
          path: ["postingDate"],
        });
      }
    }

    if (data.closingDate && data.closingDate.trim()) {
      const cDate = new Date(data.closingDate);
      if (isNaN(cDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Closing date is not a valid date format.",
          path: ["closingDate"],
        });
      } else if (data.postingDate && data.postingDate.trim()) {
        const pDate = new Date(data.postingDate);
        if (!isNaN(pDate.getTime()) && cDate < pDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Closing date cannot be earlier than the posting date.",
            path: ["closingDate"],
          });
        }
      }
    }
  });

export type JobOpportunityInput = z.infer<typeof jobOpportunityInputSchema>;
