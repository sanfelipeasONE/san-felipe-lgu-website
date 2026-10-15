"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import {
  createUser,
  updateUser,
  setUserStatus,
  resetUserCredential,
  deleteUser,
  UserError,
} from "@/server/users/service";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validation/users";
import type { UserStatus } from "@prisma/client";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Server Action: Creates a new municipal user account.
 */
export async function createUserAction(
  rawInput: CreateUserInput
): Promise<ActionResult<{ id: string; email: string }>> {
  try {
    const caller = await requireUser();
    const parsed = createUserSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: firstIssue, statusCode: 400 };
    }

    const created = await createUser(caller, parsed.data);

    revalidatePath("/admin/users");
    return {
      success: true,
      data: { id: created.id, email: created.email },
    };
  } catch (error) {
    if (error instanceof UserError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to create user account.";
    return { success: false, error: message, statusCode: 500 };
  }
}

/**
 * Server Action: Updates an existing municipal user account.
 */
export async function updateUserAction(
  id: string,
  rawInput: UpdateUserInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const caller = await requireUser();
    const parsed = updateUserSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: firstIssue, statusCode: 400 };
    }

    const updated = await updateUser(caller, id, parsed.data);

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}/edit`);
    return {
      success: true,
      data: { id: updated.id },
    };
  } catch (error) {
    if (error instanceof UserError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to update user account.";
    return { success: false, error: message, statusCode: 500 };
  }
}

/**
 * Server Action: Changes user status (ACTIVE, INACTIVE, SUSPENDED).
 */
export async function setUserStatusAction(
  id: string,
  newStatus: UserStatus,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string; status: UserStatus }>> {
  try {
    const caller = await requireUser();
    const updated = await setUserStatus(caller, id, newStatus, expectedUpdatedAt);

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}/edit`);
    return {
      success: true,
      data: { id: updated.id, status: updated.status },
    };
  } catch (error) {
    if (error instanceof UserError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to update account status.";
    return { success: false, error: message, statusCode: 500 };
  }
}

/**
 * Server Action: Resets a user's password credential.
 */
export async function resetUserPasswordAction(
  id: string,
  passwordPlaintext: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const caller = await requireUser();
    const parsed = resetPasswordSchema.safeParse({
      password: passwordPlaintext,
      expectedUpdatedAt,
    });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Password does not meet complexity requirements.";
      return { success: false, error: firstIssue, statusCode: 400 };
    }

    await resetUserCredential(caller, id, parsed.data.password, expectedUpdatedAt);

    revalidatePath(`/admin/users/${id}/edit`);
    return { success: true, data: { success: true } };
  } catch (error) {
    if (error instanceof UserError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to reset user password.";
    return { success: false, error: message, statusCode: 500 };
  }
}

/**
 * Server Action: Permanently deletes an eligible municipal user account.
 */
export async function deleteUserAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string; email: string }>> {
  try {
    const caller = await requireUser();
    const result = await deleteUser(caller, id, expectedUpdatedAt);

    revalidatePath("/admin/users");
    return {
      success: true,
      data: { id: result.id, email: result.email },
    };
  } catch (error) {
    if (error instanceof UserError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to delete user account.";
    return { success: false, error: message, statusCode: 500 };
  }
}

