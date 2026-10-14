"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import {
  updateRole,
  updateRolePermissions,
  RoleError,
} from "@/server/roles/service";
import {
  updateRoleSchema,
  updateRolePermissionsSchema,
  type UpdateRoleInput,
} from "@/lib/validation/roles";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Server Action: Updates a role's label and description.
 */
export async function updateRoleAction(
  id: string,
  rawInput: UpdateRoleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const caller = await requireUser();
    const parsed = updateRoleSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: firstIssue, statusCode: 400 };
    }

    const updated = await updateRole(caller, id, parsed.data);

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${id}/edit`);
    return {
      success: true,
      data: { id: updated.id },
    };
  } catch (error) {
    if (error instanceof RoleError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to update role.";
    return { success: false, error: message, statusCode: 500 };
  }
}

/**
 * Server Action: Updates a role's assigned permission codes.
 */
export async function updateRolePermissionsAction(
  id: string,
  permissionCodes: string[],
  expectedUpdatedAt?: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const caller = await requireUser();
    const parsed = updateRolePermissionsSchema.safeParse({
      permissionCodes,
      expectedUpdatedAt,
    });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: firstIssue, statusCode: 400 };
    }

    await updateRolePermissions(
      caller,
      id,
      parsed.data.permissionCodes,
      parsed.data.expectedUpdatedAt
    );

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${id}/edit`);
    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    if (error instanceof RoleError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to update role permissions.";
    return { success: false, error: message, statusCode: 500 };
  }
}
