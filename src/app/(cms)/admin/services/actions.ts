"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import {
  updateServicePage,
  publishServicePage,
  unpublishServicePage,
  uploadAndAttachCharterPdf,
  removeCharterDocumentAssociation,
  attachExistingCharterDocument,
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
  serviceKey: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ serviceKey: string }>> {
  try {
    const user = await requireUser();

    const keyValidation = serviceKeySchema.safeParse(serviceKey);
    if (!keyValidation.success) {
      return { success: false, error: "Invalid canonical service key." };
    }

    const unpublished = await unpublishServicePage(user, keyValidation.data, expectedUpdatedAt);

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

/**
 * Server Action: Directly uploads and publishes an official Citizen's Charter PDF.
 * Reuses the managed Document pipeline and automatically links to ServicePage.
 */
export async function uploadCharterPdfAction(
  formData: FormData
): Promise<
  ActionResult<{
    documentId: string;
    title: string;
    originalFilename: string;
    storageUrl: string;
    downloadUrl: string;
    bytes: number;
  }>
> {
  try {
    const user = await requireUser();

    const serviceKey = formData.get("serviceKey")?.toString() || "citizens-charter";
    if (serviceKey !== "citizens-charter") {
      return { success: false, error: "Direct PDF upload is only supported for Citizen's Charter." };
    }

    const title = formData.get("title")?.toString() || undefined;
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return { success: false, error: "A valid PDF file must be selected." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const doc = await uploadAndAttachCharterPdf(user, "citizens-charter", {
      fileBuffer,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      title,
    });

    // Revalidate affected routes
    revalidatePath("/admin/services");
    revalidatePath("/admin/services/citizens-charter/edit");
    revalidatePath("/admin/services/citizens-charter/preview");
    revalidatePath("/services/citizens-charter");
    revalidatePath("/admin/documents");

    return {
      success: true,
      data: {
        documentId: doc.id,
        title: doc.title,
        originalFilename: doc.originalFilename,
        storageUrl: doc.storageUrl,
        downloadUrl: doc.downloadUrl,
        bytes: doc.bytes,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof ServiceError ? err.message : "Failed to upload Citizen's Charter PDF.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Disconnects the Citizen's Charter document association without deleting the Document.
 */
export async function removeCharterAssociationAction(
  serviceKey: string
): Promise<ActionResult<{ serviceKey: string }>> {
  try {
    const user = await requireUser();

    if (serviceKey !== "citizens-charter") {
      return { success: false, error: "Invalid canonical service key." };
    }

    await removeCharterDocumentAssociation(user, serviceKey);

    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${serviceKey}/edit`);
    revalidatePath(`/admin/services/${serviceKey}/preview`);
    revalidatePath(`/services/${serviceKey}`);
    revalidatePath("/admin/documents");

    return {
      success: true,
      data: { serviceKey },
    };
  } catch (err: unknown) {
    const message = err instanceof ServiceError ? err.message : "Failed to remove Charter association.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Links an existing PUBLISHED CITIZENS_CHARTER document to the service page.
 */
export async function linkExistingCharterDocumentAction(
  serviceKey: string,
  documentId: string
): Promise<ActionResult<{ serviceKey: string; documentId: string }>> {
  try {
    const user = await requireUser();

    if (serviceKey !== "citizens-charter") {
      return { success: false, error: "Invalid canonical service key." };
    }

    if (!documentId || !documentId.trim()) {
      return { success: false, error: "A valid document ID must be provided." };
    }

    await attachExistingCharterDocument(user, serviceKey, documentId.trim());

    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${serviceKey}/edit`);
    revalidatePath(`/admin/services/${serviceKey}/preview`);
    revalidatePath(`/services/${serviceKey}`);
    revalidatePath("/admin/documents");

    return {
      success: true,
      data: { serviceKey, documentId },
    };
  } catch (err: unknown) {
    const message = err instanceof ServiceError ? err.message : "Failed to link existing document.";
    return { success: false, error: message };
  }
}
