"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import {
  createDocument,
  updateDocument,
  publishDocument,
  archiveDocument,
  deleteDocument,
  DocumentError,
} from "@/server/documents/service";
import { documentInputSchema } from "@/lib/validation/documents";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Creates a new municipal document in DRAFT status.
 */
export async function createDocumentAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();

    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || undefined;
    const category = formData.get("category")?.toString() || undefined;
    const purpose = formData.get("purpose")?.toString() || undefined;
    const officeId = formData.get("officeId")?.toString() || undefined;

    const parsed = documentInputSchema.safeParse({
      title,
      description: description || null,
      category: category || null,
      purpose,
      officeId,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return {
        success: false,
        error: "A valid document file (PDF, DOC, DOCX, XLS, XLSX) must be uploaded.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const doc = await createDocument(user, {
      input: parsed.data,
      fileBuffer,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });

    revalidatePath("/admin/documents");
    revalidatePath("/admin/transparency/procurement");
    revalidatePath("/admin/transparency/bac");
    revalidatePath("/services/downloadable-forms");
    revalidatePath("/transparency/procurement");
    revalidatePath("/transparency/bac");

    return {
      success: true,
      data: { id: doc.id },
    };
  } catch (err: unknown) {
    const message = err instanceof DocumentError ? err.message : "Failed to create document.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates document metadata and optionally replaces the uploaded file.
 */
export async function updateDocumentAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();

    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || undefined;
    const category = formData.get("category")?.toString() || undefined;
    const purpose = formData.get("purpose")?.toString() || undefined;
    const officeId = formData.get("officeId")?.toString() || undefined;
    const expectedUpdatedAt = formData.get("expectedUpdatedAt")?.toString() || undefined;

    const parsed = documentInputSchema.safeParse({
      title,
      description: description || null,
      category: category || null,
      purpose,
      officeId,
      expectedUpdatedAt,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const file = formData.get("file") as File | null;
    let filePayload: { fileBuffer: Buffer; filename: string; mimeType?: string; size: number } | undefined;

    if (file && file.size > 0 && file.name) {
      const arrayBuffer = await file.arrayBuffer();
      filePayload = {
        fileBuffer: Buffer.from(arrayBuffer),
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      };
    }

    const updated = await updateDocument(user, id, {
      input: parsed.data,
      file: filePayload,
    });

    revalidatePath("/admin/documents");
    revalidatePath("/admin/transparency/procurement");
    revalidatePath("/admin/transparency/bac");
    revalidatePath(`/admin/documents/${id}/edit`);
    revalidatePath("/services/downloadable-forms");
    revalidatePath("/transparency/procurement");
    revalidatePath("/transparency/bac");

    return {
      success: true,
      data: { id: updated.id },
    };
  } catch (err: unknown) {
    const message = err instanceof DocumentError ? err.message : "Failed to update document.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Publishes a document.
 */
export async function publishDocumentAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const published = await publishDocument(user, id, expectedUpdatedAt);

    revalidatePath("/admin/documents");
    revalidatePath("/admin/transparency/procurement");
    revalidatePath("/admin/transparency/bac");
    revalidatePath(`/admin/documents/${id}/edit`);
    revalidatePath("/services/downloadable-forms");
    revalidatePath("/transparency/procurement");
    revalidatePath("/transparency/bac");

    return {
      success: true,
      data: { id: published.id },
    };
  } catch (err: unknown) {
    const message = err instanceof DocumentError ? err.message : "Failed to publish document.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Archives a document.
 */
export async function archiveDocumentAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const archived = await archiveDocument(user, id, expectedUpdatedAt);

    revalidatePath("/admin/documents");
    revalidatePath("/admin/transparency/procurement");
    revalidatePath("/admin/transparency/bac");
    revalidatePath(`/admin/documents/${id}/edit`);
    revalidatePath("/services/downloadable-forms");
    revalidatePath("/transparency/procurement");
    revalidatePath("/transparency/bac");

    return {
      success: true,
      data: { id: archived.id },
    };
  } catch (err: unknown) {
    const message = err instanceof DocumentError ? err.message : "Failed to archive document.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Permanently deletes a Document.
 */
export async function deleteDocumentAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const result = await deleteDocument(user, id, expectedUpdatedAt);

    revalidatePath("/admin/documents");
    revalidatePath("/admin/transparency/procurement");
    revalidatePath("/admin/transparency/bac");
    revalidatePath("/services/downloadable-forms");
    revalidatePath("/transparency/procurement");
    revalidatePath("/transparency/bac");
    revalidatePath("/services/citizens-charter");

    return {
      success: true,
      data: { id: result.id },
    };
  } catch (err: unknown) {
    const message = err instanceof DocumentError ? err.message : "Failed to delete document.";
    return { success: false, error: message };
  }
}
