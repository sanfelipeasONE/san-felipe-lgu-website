"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import {
  createJobOpportunity,
  updateJobOpportunity,
  publishJobOpportunity,
  archiveJobOpportunity,
  deleteJobOpportunity,
  removeJobFeaturedImage,
  JobError,
} from "@/server/jobs/service";
import {
  uploadJobFeaturedImage,
  validateImageFile,
} from "@/server/media/cloudinary";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import { jobOpportunityInputSchema } from "@/lib/validation/jobs";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Creates a new vacancy in DRAFT status.
 */
export async function createJobAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();

    const title = formData.get("title")?.toString() || "";
    const itemNumber = formData.get("itemNumber")?.toString() || undefined;
    const officeId = formData.get("officeId")?.toString() || undefined;
    const employmentType = formData.get("employmentType")?.toString() || undefined;
    const salaryGrade = formData.get("salaryGrade")?.toString() || undefined;
    const monthlySalary = formData.get("monthlySalary")?.toString() || undefined;
    const description = formData.get("description")?.toString() || undefined;
    const education = formData.get("education")?.toString() || undefined;
    const training = formData.get("training")?.toString() || undefined;
    const experience = formData.get("experience")?.toString() || undefined;
    const eligibility = formData.get("eligibility")?.toString() || undefined;
    const competency = formData.get("competency")?.toString() || undefined;
    const applicationInstructions = formData.get("applicationInstructions")?.toString() || undefined;
    const postingDate = formData.get("postingDate")?.toString() || undefined;
    const closingDate = formData.get("closingDate")?.toString() || undefined;
    const attachmentDocumentId = formData.get("attachmentDocumentId")?.toString() || undefined;

    const featuredImagePublicId = formData.get("featuredImagePublicId")?.toString() || undefined;
    const featuredImageUrl = formData.get("featuredImageUrl")?.toString() || undefined;
    const featuredImageAlt = formData.get("featuredImageAlt")?.toString() || undefined;
    const featuredImageWidth = formData.get("featuredImageWidth") ? Number(formData.get("featuredImageWidth")) : undefined;
    const featuredImageHeight = formData.get("featuredImageHeight") ? Number(formData.get("featuredImageHeight")) : undefined;
    const featuredImageFormat = formData.get("featuredImageFormat")?.toString() || undefined;
    const featuredImageBytes = formData.get("featuredImageBytes") ? Number(formData.get("featuredImageBytes")) : undefined;

    const parsed = jobOpportunityInputSchema.safeParse({
      title,
      itemNumber,
      officeId,
      employmentType,
      salaryGrade,
      monthlySalary,
      description,
      education,
      training,
      experience,
      eligibility,
      competency,
      applicationInstructions,
      postingDate,
      closingDate,
      attachmentDocumentId,
      featuredImagePublicId,
      featuredImageUrl,
      featuredImageAlt,
      featuredImageWidth,
      featuredImageHeight,
      featuredImageFormat,
      featuredImageBytes,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const job = await createJobOpportunity(user, parsed.data);

    revalidatePath("/admin/jobs");
    revalidatePath("/services/job-opportunities");

    return {
      success: true,
      data: { id: job.id },
    };
  } catch (err: unknown) {
    const message = err instanceof JobError ? err.message : "Failed to create job opportunity.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates an existing vacancy.
 */
export async function updateJobAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();

    const title = formData.get("title")?.toString() || "";
    const itemNumber = formData.get("itemNumber")?.toString() || undefined;
    const officeId = formData.get("officeId")?.toString() || undefined;
    const employmentType = formData.get("employmentType")?.toString() || undefined;
    const salaryGrade = formData.get("salaryGrade")?.toString() || undefined;
    const monthlySalary = formData.get("monthlySalary")?.toString() || undefined;
    const description = formData.get("description")?.toString() || undefined;
    const education = formData.get("education")?.toString() || undefined;
    const training = formData.get("training")?.toString() || undefined;
    const experience = formData.get("experience")?.toString() || undefined;
    const eligibility = formData.get("eligibility")?.toString() || undefined;
    const competency = formData.get("competency")?.toString() || undefined;
    const applicationInstructions = formData.get("applicationInstructions")?.toString() || undefined;
    const postingDate = formData.get("postingDate")?.toString() || undefined;
    const closingDate = formData.get("closingDate")?.toString() || undefined;
    const attachmentDocumentId = formData.get("attachmentDocumentId")?.toString() || undefined;
    const expectedUpdatedAt = formData.get("expectedUpdatedAt")?.toString() || undefined;

    const featuredImagePublicId = formData.get("featuredImagePublicId")?.toString() || undefined;
    const featuredImageUrl = formData.get("featuredImageUrl")?.toString() || undefined;
    const featuredImageAlt = formData.get("featuredImageAlt")?.toString() || undefined;
    const featuredImageWidth = formData.get("featuredImageWidth") ? Number(formData.get("featuredImageWidth")) : undefined;
    const featuredImageHeight = formData.get("featuredImageHeight") ? Number(formData.get("featuredImageHeight")) : undefined;
    const featuredImageFormat = formData.get("featuredImageFormat")?.toString() || undefined;
    const featuredImageBytes = formData.get("featuredImageBytes") ? Number(formData.get("featuredImageBytes")) : undefined;

    const parsed = jobOpportunityInputSchema.safeParse({
      title,
      itemNumber,
      officeId,
      employmentType,
      salaryGrade,
      monthlySalary,
      description,
      education,
      training,
      experience,
      eligibility,
      competency,
      applicationInstructions,
      postingDate,
      closingDate,
      attachmentDocumentId,
      featuredImagePublicId,
      featuredImageUrl,
      featuredImageAlt,
      featuredImageWidth,
      featuredImageHeight,
      featuredImageFormat,
      featuredImageBytes,
      expectedUpdatedAt,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      };
    }

    const updated = await updateJobOpportunity(user, id, parsed.data);

    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${id}/edit`);
    revalidatePath("/services/job-opportunities");

    return {
      success: true,
      data: { id: updated.id },
    };
  } catch (err: unknown) {
    const message = err instanceof JobError ? err.message : "Failed to update job opportunity.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Direct publish by authorized staff / admin.
 */
export async function publishJobAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const published = await publishJobOpportunity(user, id, expectedUpdatedAt);

    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${id}/edit`);
    revalidatePath("/services/job-opportunities");

    return {
      success: true,
      data: { id: published.id },
    };
  } catch (err: unknown) {
    const message = err instanceof JobError ? err.message : "Failed to publish job opportunity.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Archives a vacancy.
 */
export async function archiveJobAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const archived = await archiveJobOpportunity(user, id, expectedUpdatedAt);

    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${id}/edit`);
    revalidatePath("/services/job-opportunities");

    return {
      success: true,
      data: { id: archived.id },
    };
  } catch (err: unknown) {
    const message = err instanceof JobError ? err.message : "Failed to archive job opportunity.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Permanently deletes a Job Opportunity.
 */
export async function deleteJobAction(
  id: string,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const result = await deleteJobOpportunity(user, id, expectedUpdatedAt);

    revalidatePath("/admin/jobs");
    revalidatePath("/services/job-opportunities");

    return {
      success: true,
      data: { id: result.id },
    };
  } catch (err: unknown) {
    const message = err instanceof JobError ? err.message : "Failed to delete job opportunity.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Uploads an image asset for a job opportunity.
 */
export async function uploadJobImageAction(
  formData: FormData
): Promise<ActionResult<{
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}>> {
  try {
    const user = await requireUser();
    const canUpload =
      hasPermission(user, PERMISSIONS.JOBS_CREATE) ||
      hasPermission(user, PERMISSIONS.JOBS_UPDATE);

    if (!canUpload) {
      return {
        success: false,
        error: "You do not have permission to upload job images.",
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
    const result = await uploadJobFeaturedImage(buffer);

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("[JOB UPLOAD ACTION ERROR]", err);
    return {
      success: false,
      error: "Failed to upload image. Please try again or contact ICT Office.",
    };
  }
}

/**
 * Server Action: Removes an attached featured image from a Job Opportunity record.
 */
export async function removeJobImageAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await removeJobFeaturedImage(user, id);

    revalidatePath(`/admin/jobs/${id}/edit`);
    revalidatePath("/admin/jobs");
    revalidatePath("/services/job-opportunities");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof JobError ? err.message : "Failed to remove image.";
    return { success: false, error: message };
  }
}

