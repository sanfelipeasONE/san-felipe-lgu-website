import { z } from "zod";

export const updateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(100, "Role name must not exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .nullable()
    .optional(),
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const updateRolePermissionsSchema = z.object({
  permissionCodes: z
    .array(z.string().trim().min(1))
    .nonempty("At least one permission is required for a role"),
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateRolePermissionsInput = z.infer<
  typeof updateRolePermissionsSchema
>;
