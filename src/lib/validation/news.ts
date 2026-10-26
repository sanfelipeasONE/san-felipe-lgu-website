import { z } from "zod";

export const NEWS_TYPES = ["news", "announcement", "advisory", "notice"] as const;
export type NewsType = (typeof NEWS_TYPES)[number];

export const NEWS_CATEGORIES = [
  "GENERAL",
  "PUBLIC SAFETY & INFRASTRUCTURE",
  "COMMERCE & LICENSING",
  "ENVIRONMENT & NATURAL RESOURCES",
  "HEALTH & WELLNESS",
  "EDUCATION & YOUTH",
  "GOVERNANCE & LEGISLATION",
  "GENDER AND DEVELOPMENT (GAD)",
] as const;

export const newsDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Article title must be at least 5 characters long." })
    .max(200, { message: "Article title cannot exceed 200 characters." }),
  excerpt: z
    .string()
    .trim()
    .min(10, { message: "Article excerpt must be at least 10 characters long." })
    .max(500, { message: "Article excerpt cannot exceed 500 characters." }),
  body: z
    .string()
    .min(10, { message: "Article content must be at least 10 characters long." }),
  type: z.enum(NEWS_TYPES, {
    errorMap: () => ({ message: "Please select a valid publication type." }),
  }),
  category: z
    .string()
    .trim()
    .min(2, { message: "Please specify an article category." })
    .max(80),
  officeId: z.string().optional(),
  featuredImagePublicId: z.string().nullable().optional(),
  featuredImageUrl: z.string().nullable().optional(),
  featuredImageAlt: z.string().nullable().optional(),
  featuredImageWidth: z.number().int().positive().nullable().optional(),
  featuredImageHeight: z.number().int().positive().nullable().optional(),
  featuredImageFormat: z.string().nullable().optional(),
  featuredImageBytes: z.number().int().positive().nullable().optional(),
  expectedUpdatedAt: z.string().optional(), // For stale-write concurrency check
});

export type NewsDraftInput = z.infer<typeof newsDraftSchema>;

/**
 * Additional validation required when publishing an article.
 * Enforces that if a featured image is attached, alt text is strictly required.
 */
export function validateForPublish(data: NewsDraftInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length < 5) {
    errors.push("Title must be at least 5 characters to publish.");
  }

  if (!data.excerpt || data.excerpt.trim().length < 10) {
    errors.push("Excerpt must be at least 10 characters to publish.");
  }

  if (!data.body || data.body.trim().length < 20) {
    errors.push("Article body content must be at least 20 characters to publish.");
  }

  if (
    data.featuredImagePublicId &&
    (!data.featuredImageAlt || data.featuredImageAlt.trim().length < 3)
  ) {
    errors.push(
      "A meaningful image alt description is required before publishing with a featured image."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
