"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import {
  createTourismEntry,
  updateTourismEntry,
  publishTourismEntry,
  archiveTourismEntry,
  deleteTourismEntry,
  removeTourismFeaturedImage,
  TourismError,
} from "@/server/tourism/service";
import {
  uploadTourismFeaturedImage,
  validateImageFile,
} from "@/server/media/cloudinary";
import {
  tourismDraftSchema,
  type TourismDraftInput,
  TOURISM_CATEGORY_ROUTES,
} from "@/lib/validation/tourism";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function revalidateTourismPaths(category?: string, slug?: string) {
  revalidatePath("/admin/tourism");
  revalidatePath("/tourism");
  revalidatePath("/tourism/attractions");
  revalidatePath("/tourism/resorts");
  revalidatePath("/tourism/culture-and-arts");
  revalidatePath("/tourism/products");
  if (category && slug && category in TOURISM_CATEGORY_ROUTES) {
    const route = TOURISM_CATEGORY_ROUTES[category as keyof typeof TOURISM_CATEGORY_ROUTES];
    revalidatePath(`${route}/${slug}`);
  }
}

/**
 * Server Action: Creates a new Tourism entry draft.
 */
export async function createTourismAction(
  rawInput: TourismDraftInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const parsed = tourismDraftSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const entry = await createTourismEntry(user, parsed.data);
    revalidateTourismPaths(entry.category, entry.slug);

    return {
      success: true,
      data: { id: entry.id, slug: entry.slug },
    };
  } catch (err: unknown) {
    const message = err instanceof TourismError ? err.message : "Failed to create tourism draft.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates an existing Tourism entry.
 */
export async function updateTourismAction(
  id: string,
  rawInput: TourismDraftInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const parsed = tourismDraftSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const updated = await updateTourismEntry(user, id, parsed.data);
    revalidatePath(`/admin/tourism/${id}/edit`);
    revalidateTourismPaths(updated.category, updated.slug);

    return {
      success: true,
      data: { id: updated.id, slug: updated.slug },
    };
  } catch (err: unknown) {
    const message = err instanceof TourismError ? err.message : "Failed to update tourism entry.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Publishes a Tourism entry (transitions DRAFT -> PUBLISHED).
 */
export async function publishTourismAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const published = await publishTourismEntry(user, id, expectedUpdatedAt);

    revalidatePath(`/admin/tourism/${id}/edit`);
    revalidateTourismPaths(published.category, published.slug);

    return {
      success: true,
      data: { id: published.id, slug: published.slug },
    };
  } catch (err: unknown) {
    const message = err instanceof TourismError ? err.message : "Failed to publish tourism entry.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Archives a Tourism entry (transitions PUBLISHED -> ARCHIVED).
 */
export async function archiveTourismAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const archived = await archiveTourismEntry(user, id, expectedUpdatedAt);

    revalidatePath(`/admin/tourism/${id}/edit`);
    revalidateTourismPaths(archived.category, archived.slug);

    return {
      success: true,
      data: { id: archived.id },
    };
  } catch (err: unknown) {
    const message = err instanceof TourismError ? err.message : "Failed to archive tourism entry.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Permanently deletes a Tourism entry.
 */
export async function deleteTourismAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const result = await deleteTourismEntry(user, id, expectedUpdatedAt);

    revalidateTourismPaths();

    return {
      success: true,
      data: { id: result.id },
    };
  } catch (err: unknown) {
    const message = err instanceof TourismError ? err.message : "Failed to delete tourism entry.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Uploads a featured image for a Tourism entry to Cloudinary.
 */
export async function uploadTourismImageAction(
  formData: FormData
): Promise<
  ActionResult<{
    publicId: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }>
> {
  try {
    const user = await requireUser();

    const canUpload =
      hasPermission(user, PERMISSIONS.TOURISM_CREATE) ||
      hasPermission(user, PERMISSIONS.TOURISM_UPDATE);

    if (!canUpload) {
      return {
        success: false,
        error: "You do not have permission to upload tourism images.",
      };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided for upload." };
    }

    const validation = validateImageFile({
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadTourismFeaturedImage(buffer);

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("[TOURISM UPLOAD ERROR]", err);
    return {
      success: false,
      error: "Failed to upload image. Please try again.",
    };
  }
}

/**
 * Server Action: Removes the featured image from a Tourism entry.
 */
export async function removeTourismImageAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await removeTourismFeaturedImage(user, id);

    revalidatePath(`/admin/tourism/${id}/edit`);
    revalidateTourismPaths();

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof TourismError ? err.message : "Failed to remove image.";
    return { success: false, error: message };
  }
}
