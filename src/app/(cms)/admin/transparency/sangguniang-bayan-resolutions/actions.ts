"use server";

import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/authz/guard";
import {
  createResolution,
  updateResolution,
  publishResolution,
  unpublishResolution,
  archiveResolution,
  deleteResolution,
  ResolutionError,
} from "@/server/resolutions/service";
import { resolutionInputSchema } from "@/lib/validation/resolutions";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function revalidateResolutionPaths(id?: string) {
  revalidatePath("/admin/transparency/sangguniang-bayan-resolutions");
  if (id) {
    revalidatePath(`/admin/transparency/sangguniang-bayan-resolutions/${id}/edit`);
  }
  revalidatePath("/transparency");
  revalidatePath("/transparency/sangguniang-bayan-resolutions");
}

function handleActionError(err: unknown, fallback: string): ActionResult<never> {
  if (err instanceof ResolutionError || err instanceof AuthError) {
    return { success: false, error: err.message };
  }
  console.error("[SB-RESOLUTIONS-ACTION]", err);
  return { success: false, error: fallback };
}

/**
 * Server Action: Creates a new Sangguniang Bayan Resolution draft.
 */
export async function createResolutionAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();

    const parsed = resolutionInputSchema.safeParse({
      resolutionNumber: formData.get("resolutionNumber")?.toString() ?? "",
      title: formData.get("title")?.toString() ?? "",
      year: formData.get("year")?.toString() ?? "",
      adoptedAt: formData.get("adoptedAt")?.toString() ?? "",
      summary: formData.get("summary")?.toString() || null,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(" "),
      };
    }

    const file = formData.get("file") as File | null;
    let filePayload: {
      buffer: Buffer;
      filename: string;
      mimeType: string;
      size: number;
    } | null = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      filePayload = {
        buffer: Buffer.from(arrayBuffer),
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      };
    }

    const created = await createResolution(user, {
      input: parsed.data,
      file: filePayload,
    });

    revalidateResolutionPaths(created.id);
    return { success: true, data: { id: created.id } };
  } catch (err) {
    return handleActionError(err, "Failed to create Sangguniang Bayan Resolution.");
  }
}

/**
 * Server Action: Updates an existing Sangguniang Bayan Resolution.
 */
export async function updateResolutionAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  try {
    const user = await requireUser();

    const parsed = resolutionInputSchema.safeParse({
      resolutionNumber: formData.get("resolutionNumber")?.toString() ?? "",
      title: formData.get("title")?.toString() ?? "",
      year: formData.get("year")?.toString() ?? "",
      adoptedAt: formData.get("adoptedAt")?.toString() ?? "",
      summary: formData.get("summary")?.toString() || null,
      expectedUpdatedAt: formData.get("expectedUpdatedAt")?.toString() || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(" "),
      };
    }

    const file = formData.get("file") as File | null;
    let filePayload: {
      buffer: Buffer;
      filename: string;
      mimeType: string;
      size: number;
    } | null = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      filePayload = {
        buffer: Buffer.from(arrayBuffer),
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      };
    }

    const updated = await updateResolution(user, id, {
      input: parsed.data,
      file: filePayload,
    });

    revalidateResolutionPaths(updated.id);
    return {
      success: true,
      data: { id: updated.id, updatedAt: updated.updatedAt.toISOString() },
    };
  } catch (err) {
    return handleActionError(err, "Failed to update Sangguniang Bayan Resolution.");
  }
}

/**
 * Server Action: Publishes a Sangguniang Bayan Resolution.
 */
export async function publishResolutionAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const published = await publishResolution(user, id);
    revalidateResolutionPaths(published.id);
    return { success: true, data: { id: published.id } };
  } catch (err) {
    return handleActionError(err, "Failed to publish Sangguniang Bayan Resolution.");
  }
}

/**
 * Server Action: Unpublishes a Sangguniang Bayan Resolution back to DRAFT.
 */
export async function unpublishResolutionAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const unpublished = await unpublishResolution(user, id);
    revalidateResolutionPaths(unpublished.id);
    return { success: true, data: { id: unpublished.id } };
  } catch (err) {
    return handleActionError(err, "Failed to unpublish Sangguniang Bayan Resolution.");
  }
}

/**
 * Server Action: Archives a Sangguniang Bayan Resolution.
 */
export async function archiveResolutionAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const archived = await archiveResolution(user, id);
    revalidateResolutionPaths(archived.id);
    return { success: true, data: { id: archived.id } };
  } catch (err) {
    return handleActionError(err, "Failed to archive Sangguniang Bayan Resolution.");
  }
}

/**
 * Server Action: Permanently deletes a Sangguniang Bayan Resolution.
 */
export async function deleteResolutionAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    await deleteResolution(user, id);
    revalidateResolutionPaths(id);
    return { success: true, data: { id } };
  } catch (err) {
    return handleActionError(err, "Failed to delete Sangguniang Bayan Resolution.");
  }
}
