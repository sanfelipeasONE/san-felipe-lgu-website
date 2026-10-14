import { z } from "zod";

export const updateOfficeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Office name must be at least 2 characters")
    .max(150, "Office name must not exceed 150 characters"),
  shortName: z
    .string()
    .trim()
    .max(20, "Acronym must not exceed 20 characters")
    .nullable()
    .optional(),
  location: z
    .string()
    .trim()
    .max(200, "Location must not exceed 200 characters")
    .nullable()
    .optional(),
  officeHours: z
    .string()
    .trim()
    .max(100, "Office hours must not exceed 100 characters")
    .nullable()
    .optional(),
  officeHead: z
    .string()
    .trim()
    .max(100, "Office head must not exceed 100 characters")
    .nullable()
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid official email address")
    .or(z.literal(""))
    .nullable()
    .optional(),
  phone: z
    .string()
    .trim()
    .max(50, "Phone number must not exceed 50 characters")
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .nullable()
    .optional(),
  mandate: z
    .string()
    .trim()
    .max(2000, "Mandate must not exceed 2000 characters")
    .nullable()
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>;
