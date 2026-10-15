"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import { updateOffice, OfficeError } from "@/server/offices/service";
import {
  updateOfficeSchema,
  type UpdateOfficeInput,
} from "@/lib/validation/offices";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Server Action: Updates a municipal office's metadata and status.
 */
export async function updateOfficeAction(
  id: string,
  rawInput: UpdateOfficeInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const caller = await requireUser();
    const parsed = updateOfficeSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: firstIssue, statusCode: 400 };
    }

    const updated = await updateOffice(caller, id, parsed.data);

    revalidatePath("/admin/offices");
    revalidatePath(`/admin/offices/${id}/edit`);
    revalidatePath("/offices");
    return {
      success: true,
      data: { id: updated.id },
    };
  } catch (error) {
    if (error instanceof OfficeError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const message = error instanceof Error ? error.message : "Failed to update municipal office.";
    return { success: false, error: message, statusCode: 500 };
  }
}
