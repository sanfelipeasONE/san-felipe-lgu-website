"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import {
  createNewsArticle,
  updateNewsArticle,
  publishNewsArticle,
  archiveNewsArticle,
  removeNewsFeaturedImage,
  NewsError,
} from "@/server/news/service";
import {
  uploadNewsFeaturedImage,
  validateImageFile,
} from "@/server/media/cloudinary";
import { newsDraftSchema, type NewsDraftInput } from "@/lib/validation/news";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Creates a new News article draft.
 */
export async function createNewsAction(
  rawInput: NewsDraftInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const parsed = newsDraftSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const article = await createNewsArticle(user, parsed.data);

    revalidatePath("/admin/news");
    return {
      success: true,
      data: { id: article.id, slug: article.slug },
    };
  } catch (err: unknown) {
    const message = err instanceof NewsError ? err.message : "Failed to create news draft.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates an existing News article.
 */
export async function updateNewsAction(
  id: string,
  rawInput: NewsDraftInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const parsed = newsDraftSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const updated = await updateNewsArticle(user, id, parsed.data);

    revalidatePath("/admin/news");
    revalidatePath(`/admin/news/${id}/edit`);
    revalidatePath(`/news/${updated.slug}`);
    revalidatePath("/news");
    revalidatePath("/");

    return {
      success: true,
      data: { id: updated.id, slug: updated.slug },
    };
  } catch (err: unknown) {
    const message = err instanceof NewsError ? err.message : "Failed to update news article.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Publishes a News article (transitions DRAFT -> PUBLISHED).
 */
export async function publishNewsAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const published = await publishNewsArticle(user, id, expectedUpdatedAt);

    revalidatePath("/admin/news");
    revalidatePath(`/admin/news/${id}/edit`);
    revalidatePath(`/news/${published.slug}`);
    revalidatePath("/news");
    revalidatePath("/");

    return {
      success: true,
      data: { id: published.id, slug: published.slug },
    };
  } catch (err: unknown) {
    const message = err instanceof NewsError ? err.message : "Failed to publish news article.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Archives a News article (transitions PUBLISHED -> ARCHIVED).
 */
export async function archiveNewsAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const archived = await archiveNewsArticle(user, id, expectedUpdatedAt);

    revalidatePath("/admin/news");
    revalidatePath(`/admin/news/${id}/edit`);
    revalidatePath(`/news/${archived.slug}`);
    revalidatePath("/news");
    revalidatePath("/");

    return {
      success: true,
      data: { id: archived.id },
    };
  } catch (err: unknown) {
    const message = err instanceof NewsError ? err.message : "Failed to archive news article.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Uploads a featured image to Cloudinary.
 * Authenticates user, checks posts.create or posts.update permission,
 * validates file format and max 10MB size server-side.
 */
export async function uploadNewsImageAction(
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
      hasPermission(user, PERMISSIONS.POSTS_CREATE) ||
      hasPermission(user, PERMISSIONS.POSTS_UPDATE);

    if (!canUpload) {
      return {
        success: false,
        error: "You do not have permission to upload article images.",
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

    const result = await uploadNewsFeaturedImage(buffer);

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("[UPLOAD ACTION ERROR]", err);
    return {
      success: false,
      error: "Failed to upload image. Please try again or contact ICT Office.",
    };
  }
}

/**
 * Server Action: Removes an attached featured image from a News record.
 */
export async function removeNewsImageAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await removeNewsFeaturedImage(user, id);

    revalidatePath(`/admin/news/${id}/edit`);
    revalidatePath("/admin/news");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof NewsError ? err.message : "Failed to remove image.";
    return { success: false, error: message };
  }
}
