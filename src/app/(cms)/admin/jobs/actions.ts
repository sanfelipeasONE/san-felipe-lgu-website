"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/authz/guard";
import {
  createJobOpportunity,
  updateJobOpportunity,
  publishJobOpportunity,
  archiveJobOpportunity,
  deleteJobOpportunity,
  JobError,
} from "@/server/jobs/service";
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
