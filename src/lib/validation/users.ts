import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Municipal email is required")
    .email("Please enter a valid municipal email address"),
  password: strongPasswordSchema,
  // Role & office are optional in the DTO because for Office Admin they are forced server-side
  roleId: z.string().trim().min(1, "Role selection is required").optional(),
  officeId: z.string().trim().min(1, "Office selection is required").nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Municipal email is required")
    .email("Please enter a valid municipal email address"),
  roleId: z.string().trim().min(1).optional(),
  officeId: z.string().trim().min(1).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: strongPasswordSchema,
  expectedUpdatedAt: z.string().optional(),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const setUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  expectedUpdatedAt: z.string().optional(),
});

export type SetUserStatusInput = z.infer<typeof setUserStatusSchema>;
