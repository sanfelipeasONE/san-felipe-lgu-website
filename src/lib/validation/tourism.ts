import { z } from "zod";
import type { TourismCategory } from "@prisma/client";

export const TOURISM_CATEGORIES = [
  "ATTRACTIONS",
  "RESORTS",
  "CULTURE_AND_ARTS",
  "PRODUCTS",
] as const;

export const TOURISM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const TOURISM_CATEGORY_LABELS: Record<TourismCategory, string> = {
  ATTRACTIONS: "Attractions",
  RESORTS: "Resorts",
  CULTURE_AND_ARTS: "Culture & Arts",
  PRODUCTS: "Local Products",
};

export const TOURISM_CATEGORY_DESCRIPTIONS: Record<TourismCategory, string> = {
  ATTRACTIONS: "Natural attractions, scenic coastlines, and eco-tourism destinations.",
  RESORTS: "Accredited beach resorts, surf camps, and hospitality accommodations.",
  CULTURE_AND_ARTS: "Historical landmarks, indigenous heritage, traditions, and festivals.",
  PRODUCTS: "Authentic local delicacies, handicrafts, agricultural yield, and native goods.",
};

export const TOURISM_CATEGORY_ROUTES: Record<TourismCategory, string> = {
  ATTRACTIONS: "/tourism/attractions",
  RESORTS: "/tourism/resorts",
  CULTURE_AND_ARTS: "/tourism/culture-and-arts",
  PRODUCTS: "/tourism/products",
};

export const ROUTE_TO_CATEGORY: Record<string, TourismCategory> = {
  "attractions": "ATTRACTIONS",
  "resorts": "RESORTS",
  "culture-and-arts": "CULTURE_AND_ARTS",
  "products": "PRODUCTS",
};

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val === "") return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid web address starting with http:// or https://" }
  );

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val === "") return true;
      return z.string().email().safeParse(val).success;
    },
    { message: "Must be a valid email address." }
  );

export const tourismDraftSchema = z.object({
  category: z.enum(TOURISM_CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid tourism category." }),
  }),
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters long." })
    .max(200, { message: "Title cannot exceed 200 characters." }),
  summary: z
    .string()
    .trim()
    .min(10, { message: "Summary must be at least 10 characters long." })
    .max(500, { message: "Summary cannot exceed 500 characters." }),
  body: z
    .string()
    .min(10, { message: "Rich content must be at least 10 characters long." }),

  // Optional visitor and establishment details
  location: z.string().trim().max(200).optional().nullable(),
  mapUrl: optionalUrlSchema,
  contactNumber: z.string().trim().max(50).optional().nullable(),
  email: optionalEmailSchema,
  websiteUrl: optionalUrlSchema,
  operatingHours: z.string().trim().max(100).optional().nullable(),

  // Featured image metadata
  featuredImagePublicId: z.string().nullable().optional(),
  featuredImageUrl: z.string().nullable().optional(),
  featuredImageAlt: z.string().nullable().optional(),
  featuredImageWidth: z.number().int().positive().nullable().optional(),
  featuredImageHeight: z.number().int().positive().nullable().optional(),
  featuredImageFormat: z.string().nullable().optional(),
  featuredImageBytes: z.number().int().positive().nullable().optional(),

  expectedUpdatedAt: z.string().optional(),
});

export type TourismDraftInput = z.infer<typeof tourismDraftSchema>;

/**
 * Validation rules for transitioning a Tourism entry to PUBLISHED.
 * Enforces that if a featured image is attached, alt text is strictly required.
 */
export function validateTourismForPublish(data: TourismDraftInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push("Title must be at least 3 characters to publish.");
  }

  if (!data.summary || data.summary.trim().length < 10) {
    errors.push("Summary must be at least 10 characters to publish.");
  }

  if (!data.body || data.body.trim().length < 20) {
    errors.push("Content body must be at least 20 characters to publish.");
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
