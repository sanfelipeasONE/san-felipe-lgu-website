"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  FileCheck,
  Archive,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  createJobAction,
  updateJobAction,
  publishJobAction,
  archiveJobAction,
  deleteJobAction,
} from "@/app/(cms)/admin/jobs/actions";
import { ALLOWED_EMPLOYMENT_TYPES } from "@/lib/validation/jobs";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";

export interface OfficeOption {
  id: string;
  name: string;
  shortName: string | null;
}

export interface DocumentOption {
  id: string;
  title: string;
  originalFilename: string;
}

export interface JobFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    itemNumber?: string | null;
    officeId: string;
    employmentType?: string | null;
    salaryGrade?: string | null;
    monthlySalary?: string | null;
    description?: string | null;
    education?: string | null;
    training?: string | null;
    experience?: string | null;
    eligibility?: string | null;
    competency?: string | null;
    applicationInstructions?: string | null;
    postingDate?: string | null;
    closingDate?: string | null;
    status: string;
    isClosed?: boolean;
    attachmentDocumentId?: string | null;
    updatedAt: string;
  };
  isSystemScoped: boolean;
  offices?: OfficeOption[];
  documents?: DocumentOption[];
  userOfficeName?: string;
  canPublish?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
}

export function JobForm({
  mode,
  initialData,
  isSystemScoped,
  offices = [],
  documents = [],
  userOfficeName,
  canPublish = false,
  canArchive = false,
  canDelete = false,
}: JobFormProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [itemNumber, setItemNumber] = React.useState(initialData?.itemNumber || "");
  const [officeId, setOfficeId] = React.useState(initialData?.officeId || offices[0]?.id || "");
  const [employmentType, setEmploymentType] = React.useState(initialData?.employmentType || "");
  const [salaryGrade, setSalaryGrade] = React.useState(initialData?.salaryGrade || "");
  const [monthlySalary, setMonthlySalary] = React.useState(initialData?.monthlySalary || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [education, setEducation] = React.useState(initialData?.education || "");
  const [training, setTraining] = React.useState(initialData?.training || "");
  const [experience, setExperience] = React.useState(initialData?.experience || "");
  const [eligibility, setEligibility] = React.useState(initialData?.eligibility || "");
  const [competency, setCompetency] = React.useState(initialData?.competency || "");
  const [applicationInstructions, setApplicationInstructions] = React.useState(
    initialData?.applicationInstructions || ""
  );
  const [postingDate, setPostingDate] = React.useState(
    initialData?.postingDate ? initialData.postingDate.substring(0, 10) : ""
  );
  const [closingDate, setClosingDate] = React.useState(
    initialData?.closingDate ? initialData.closingDate.substring(0, 10) : ""
  );
  const [attachmentDocumentId, setAttachmentDocumentId] = React.useState(
    initialData?.attachmentDocumentId || ""
  );

  // Status & Feedback
  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("itemNumber", itemNumber);
      if (isSystemScoped) {
        formData.set("officeId", officeId);
      }
      formData.set("employmentType", employmentType);
      formData.set("salaryGrade", salaryGrade);
      formData.set("monthlySalary", monthlySalary);
      formData.set("description", description);
      formData.set("education", education);
      formData.set("training", training);
      formData.set("experience", experience);
      formData.set("eligibility", eligibility);
      formData.set("competency", competency);
      formData.set("applicationInstructions", applicationInstructions);
      if (postingDate) formData.set("postingDate", postingDate);
      if (closingDate) formData.set("closingDate", closingDate);
      if (attachmentDocumentId) formData.set("attachmentDocumentId", attachmentDocumentId);

      if (mode === "create") {
        const result = await createJobAction(formData);
        if (!result.success || !result.data) {
          setErrorMessage(result.error || "Failed to create job opportunity.");
          setIsPending(false);
          return;
        }

        router.push(`/admin/jobs/${result.data.id}/edit?created=true`);
      } else {
        if (initialData?.updatedAt) {
          formData.set("expectedUpdatedAt", initialData.updatedAt);
        }

        const result = await updateJobAction(initialData!.id, formData);
        if (!result.success) {
          setErrorMessage(result.error || "Failed to update job opportunity.");
          setIsPending(false);
          return;
        }

        setSuccessMessage("Job opportunity saved successfully.");
        setIsPending(false);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsPending(false);
    }
  };

  const handlePublish = async () => {
    if (!initialData) return;
    if (!confirm("Are you sure you want to publish this job opportunity to the public portal?")) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await publishJobAction(initialData.id, initialData.updatedAt);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to publish job opportunity.");
        setIsPending(false);
        return;
      }

      setSuccessMessage("Job opportunity published successfully!");
      setIsPending(false);
      router.refresh();
    } catch {
      setErrorMessage("An error occurred while publishing.");
      setIsPending(false);
    }
  };

  const handleArchive = async () => {
    if (!initialData) return;
    if (
      !confirm(
        "Are you sure you want to archive this job opportunity? It will be removed from public display but preserved in administrative records."
      )
    ) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await archiveJobAction(initialData.id, initialData.updatedAt);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to archive job opportunity.");
        setIsPending(false);
        return;
      }

      setSuccessMessage("Job opportunity archived successfully.");
      setIsPending(false);
      router.refresh();
    } catch {
      setErrorMessage("An error occurred while archiving.");
      setIsPending(false);
    }
  };

  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await deleteJobAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete job opportunity.");
        setIsDeleting(false);
      } else {
        router.push("/admin/jobs");
      }
    } catch {
      setErrorMessage("An unexpected error occurred during job opportunity deletion.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-1.5 text-xs text-gov-muted hover:text-burgundy-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Job Opportunities
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gov-charcoal flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-burgundy-800" />
            {mode === "create" ? "Create New Vacancy Announcement" : "Edit Job Opportunity"}
          </h1>
        </div>

        {initialData && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs border ${
                initialData.status === "PUBLISHED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : initialData.status === "ARCHIVED"
                  ? "bg-slate-100 text-slate-700 border-slate-300"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {initialData.status}
            </span>
            {initialData.isClosed && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-xs bg-red-50 text-red-700 border border-red-200">
                Closed / Passed Deadline
              </span>
            )}
          </div>
        )}
      </div>

      {/* Feedback Banners */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xs flex items-start gap-3 text-red-800 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xs flex items-start gap-3 text-emerald-800 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xs shadow-2xs p-6 space-y-6">
          <h2 className="text-sm font-bold text-gov-charcoal uppercase tracking-wider pb-2 border-b border-gray-100">
            Basic Vacancy Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Position Title */}
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="job-title" className="block text-xs font-semibold text-gov-charcoal">
                Position Title <span className="text-red-600">*</span>
              </label>
              <input
                id="job-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Administrative Officer IV, Municipal Health Officer"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Plantilla Item Number */}
            <div className="space-y-1">
              <label htmlFor="job-item" className="block text-xs font-semibold text-gov-charcoal">
                Plantilla Item Number <span className="text-gov-muted font-normal">(Optional)</span>
              </label>
              <input
                id="job-item"
                type="text"
                value={itemNumber}
                onChange={(e) => setItemNumber(e.target.value)}
                placeholder="e.g. MHO-2026-01"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Owning Office */}
            <div className="space-y-1">
              <label htmlFor="job-office" className="block text-xs font-semibold text-gov-charcoal">
                Owning Municipal Office <span className="text-red-600">*</span>
              </label>
              {isSystemScoped ? (
                <div className="relative">
                  <select
                    id="job-office"
                    required
                    value={officeId}
                    onChange={(e) => setOfficeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                  >
                    {offices.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.name} {off.shortName ? `(${off.shortName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xs text-gov-charcoal font-medium">
                  <Building2 className="w-3.5 h-3.5 text-gov-muted" />
                  <span>{userOfficeName || "Assigned Municipal Office"}</span>
                  <span className="text-[10px] text-gov-muted ml-auto font-normal">
                    (Derived from your office assignment)
                  </span>
                </div>
              )}
            </div>

            {/* Employment Type */}
            <div className="space-y-1">
              <label htmlFor="job-type" className="block text-xs font-semibold text-gov-charcoal">
                Employment Classification <span className="text-gov-muted font-normal">(Optional)</span>
              </label>
              <input
                id="job-type"
                type="text"
                list="employment-type-suggestions"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                placeholder="e.g. Permanent, Casual, Contract of Service, or leave blank"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
              <datalist id="employment-type-suggestions">
                {ALLOWED_EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>

            {/* Salary Grade */}
            <div className="space-y-1">
              <label htmlFor="job-sg" className="block text-xs font-semibold text-gov-charcoal">
                Salary Grade <span className="text-gov-muted font-normal">(e.g. 11, SG 15)</span>
              </label>
              <input
                id="job-sg"
                type="text"
                value={salaryGrade}
                onChange={(e) => setSalaryGrade(e.target.value)}
                placeholder="e.g. 11"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Monthly Salary */}
            <div className="space-y-1">
              <label htmlFor="job-salary" className="block text-xs font-semibold text-gov-charcoal">
                Monthly Salary / Compensation <span className="text-gov-muted font-normal">(Optional)</span>
              </label>
              <input
                id="job-salary"
                type="text"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="e.g. ₱27,000.00 / month"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Posting Date */}
            <div className="space-y-1">
              <label htmlFor="job-posting-date" className="block text-xs font-semibold text-gov-charcoal">
                Posting Date <span className="text-gov-muted font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  id="job-posting-date"
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                />
              </div>
            </div>

            {/* Closing Date */}
            <div className="space-y-1">
              <label htmlFor="job-closing-date" className="block text-xs font-semibold text-gov-charcoal">
                Closing Date / Deadline <span className="text-gov-muted font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  id="job-closing-date"
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                />
              </div>
            </div>

            {/* Overview / Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-gov-charcoal">
                Job Overview / Detailed Duties <span className="text-gov-muted font-normal">(Article-style content with formatting)</span>
              </label>
              <TiptapEditor value={description} onChange={setDescription} />
            </div>
          </div>

          <h2 className="text-sm font-bold text-gov-charcoal uppercase tracking-wider pt-4 pb-2 border-b border-gray-100">
            Qualification Standards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="space-y-1">
              <label htmlFor="job-edu" className="block text-xs font-semibold text-gov-charcoal">
                Education Requirement
              </label>
              <textarea
                id="job-edu"
                rows={2}
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. Bachelor's degree relevant to the job, High School Graduate"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Training */}
            <div className="space-y-1">
              <label htmlFor="job-train" className="block text-xs font-semibold text-gov-charcoal">
                Training Requirement
              </label>
              <textarea
                id="job-train"
                rows={2}
                value={training}
                onChange={(e) => setTraining(e.target.value)}
                placeholder="e.g. 4 hours of relevant training, None Required"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label htmlFor="job-exp" className="block text-xs font-semibold text-gov-charcoal">
                Experience Requirement
              </label>
              <textarea
                id="job-exp"
                rows={2}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 1 year of relevant experience, None Required"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Eligibility */}
            <div className="space-y-1">
              <label htmlFor="job-elig" className="block text-xs font-semibold text-gov-charcoal">
                Eligibility Requirement
              </label>
              <textarea
                id="job-elig"
                rows={2}
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="e.g. Career Service (Professional) / Second Level Eligibility, RA 1080"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Competency */}
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="job-comp" className="block text-xs font-semibold text-gov-charcoal">
                Core & Functional Competencies <span className="text-gov-muted font-normal">(Optional)</span>
              </label>
              <textarea
                id="job-comp"
                rows={2}
                value={competency}
                onChange={(e) => setCompetency(e.target.value)}
                placeholder="e.g. Records management, public coordination, proficient in office productivity suites"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>

            {/* Application Instructions */}
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="job-instructions" className="block text-xs font-semibold text-gov-charcoal">
                Application Instructions & Documentary Requirements <span className="text-gov-muted font-normal">(Optional)</span>
              </label>
              <textarea
                id="job-instructions"
                rows={3}
                value={applicationInstructions}
                onChange={(e) => setApplicationInstructions(e.target.value)}
                placeholder="e.g. Interested applicants may submit their Personal Data Sheet (CS Form No. 212) to the Municipal Human Resource Management Office..."
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              />
            </div>
          </div>

          <h2 className="text-sm font-bold text-gov-charcoal uppercase tracking-wider pt-4 pb-2 border-b border-gray-100">
            Official Vacancy Notice Attachment
          </h2>

          {/* Official Attachment Selector */}
          <div className="space-y-2">
            <label htmlFor="job-attachment" className="block text-xs font-semibold text-gov-charcoal">
              Link Official Document Attachment <span className="text-gov-muted font-normal">(Reuses Phase 14 Document Storage)</span>
            </label>
            <div className="relative">
              <select
                id="job-attachment"
                value={attachmentDocumentId}
                onChange={(e) => setAttachmentDocumentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              >
                <option value="">-- No Document Attachment --</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.originalFilename})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-gov-muted">
              Select an official vacancy notice or publication bulletin uploaded via CMS Documents.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/admin/jobs"
            className="px-4 py-2 text-xs font-semibold text-gov-muted hover:text-gov-charcoal border border-gray-300 rounded-xs bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Save Button */}
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-burgundy-800 hover:bg-burgundy-900 rounded-xs disabled:opacity-50 transition-colors shadow-2xs"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === "create" ? "Save as Draft" : "Save Changes"}
            </button>

            {/* Direct Publish Button */}
            {mode === "edit" && canPublish && initialData?.status !== "PUBLISHED" && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xs disabled:opacity-50 transition-colors shadow-2xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Publish Directly
              </button>
            )}

            {/* Archive Button */}
            {mode === "edit" && canArchive && initialData?.status !== "ARCHIVED" && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xs disabled:opacity-50 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
            )}

            {/* Permanent Delete Action */}
            {mode === "edit" && canDelete && initialData?.id && (
              <DestructiveConfirmDialog
                title="Permanently delete this item?"
                description="This action cannot be undone."
                warningText="This job vacancy announcement will be completely removed from the database and public portal. Any linked attachment document in the Document Library will NOT be deleted."
                confirmLabel="Permanently Delete Vacancy"
                isPending={isDeleting}
                onConfirm={handleDelete}
                triggerLabel="Delete"
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
