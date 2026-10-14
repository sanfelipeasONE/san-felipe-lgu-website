"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import {
  updateServicePage,
  publishServicePage,
  unpublishServicePage,
  ServiceError,
} from "@/server/services/service";
import {
  servicePageDraftSchema,
  serviceKeySchema,
  type ServicePageDraftInput,
} from "@/lib/validation/services";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Saves service page draft content and sections.
 */
export async function saveServiceDraftAction(
  serviceKey: string,
  rawInput: ServicePageDraftInput
): Promise<ActionResult<{ serviceKey: string; updatedAt: string }>> {
  try {
    const user = await requireUser();

    const keyValidation = serviceKeySchema.safeParse(serviceKey);
    if (!keyValidation.success) {
      return { success: false, error: "Invalid canonical service key." };
    }

    const parsed = servicePageDraftSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const updated = await updateServicePage(user, keyValidation.data, parsed.data);

    // Revalidate CMS and public routes
    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${serviceKey}/edit`);
    revalidatePath(`/admin/services/${serviceKey}/preview`);
    revalidatePath(`/services/${serviceKey}`);

    return {
      success: true,
      data: {
        serviceKey: updated?.serviceKey || serviceKey,
        updatedAt: updated?.updatedAt.toISOString() || new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof ServiceError ? err.message : "Failed to save service content.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Publishes a canonical service page to the public website.
 */
export async function publishServiceAction(
  serviceKey: string,
  rawInput?: ServicePageDraftInput
): Promise<ActionResult<{ serviceKey: string; publishedAt: string }>> {
  try {
    const user = await requireUser();

    const keyValidation = serviceKeySchema.safeParse(serviceKey);
    if (!keyValidation.success) {
      return { success: false, error: "Invalid canonical service key." };
    }

    let parsedInput: ServicePageDraftInput | undefined;
    if (rawInput) {
      const parsed = servicePageDraftSchema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.errors.map((e) => e.message).join(" "),
        };
      }
      parsedInput = parsed.data;
    }

    const published = await publishServicePage(user, keyValidation.data, parsedInput);

    // Invalidate public and CMS caches
    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${serviceKey}/edit`);
    revalidatePath(`/admin/services/${serviceKey}/preview`);
    revalidatePath(`/services/${serviceKey}`);
    revalidatePath("/services");
    revalidatePath("/");

    return {
      success: true,
      data: {
        serviceKey: published.serviceKey,
        publishedAt: published.publishedAt?.toISOString() || new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof ServiceError ? err.message : "Failed to publish service page.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Unpublishes a service page back to DRAFT.
 */
export async function unpublishServiceAction(
  serviceKey: string
): Promise<ActionResult<{ serviceKey: string }>> {
  try {
    const user = await requireUser();

    const keyValidation = serviceKeySchema.safeParse(serviceKey);
    if (!keyValidation.success) {
      return { success: false, error: "Invalid canonical service key." };
    }

    const unpublished = await unpublishServicePage(user, keyValidation.data);

    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${serviceKey}/edit`);
    revalidatePath(`/admin/services/${serviceKey}/preview`);
    revalidatePath(`/services/${serviceKey}`);
    revalidatePath("/services");
    revalidatePath("/");

    return {
      success: true,
      data: {
        serviceKey: unpublished.serviceKey,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof ServiceError ? err.message : "Failed to unpublish service page.";
    return { success: false, error: message };
  }
}
