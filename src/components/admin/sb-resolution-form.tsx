"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  EyeOff,
  Archive,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  createResolutionAction,
  updateResolutionAction,
  publishResolutionAction,
  unpublishResolutionAction,
  archiveResolutionAction,
  deleteResolutionAction,
} from "@/app/(cms)/admin/transparency/sangguniang-bayan-resolutions/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";
import { toast } from "@/components/ui/toast";
import type { ResolutionStatus } from "@prisma/client";

interface SbResolutionFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    resolutionNumber: string;
    title: string;
    year: number;
    adoptedAt: string; // YYYY-MM-DD
    summary: string | null;
    status: ResolutionStatus;
    originalFilename: string | null;
    fileSizeFormatted: string | null;
    updatedAt: string;
  };
  permissions: {
    canUpdate: boolean;
    canPublish: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}

export function SbResolutionForm({
  mode,
  initialData,
  permissions,
}: SbResolutionFormProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [resolutionNumber, setResolutionNumber] = React.useState(
    initialData?.resolutionNumber ?? ""
  );
  const [title, setTitle] = React.useState(initialData?.title ?? "");
  const [year, setYear] = React.useState<string>(
    String(initialData?.year ?? currentYear)
  );
  const [adoptedAt, setAdoptedAt] = React.useState(
    initialData?.adoptedAt ?? new Date().toISOString().slice(0, 10)
  );
  const [summary, setSummary] = React.useState(initialData?.summary ?? "");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("resolutionNumber", resolutionNumber);
      formData.append("title", title);
      formData.append("year", year);
      formData.append("adoptedAt", adoptedAt);
      if (summary.trim()) {
        formData.append("summary", summary.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (mode === "create") {
        const result = await createResolutionAction(formData);
        if (!result.success || !result.data) {
          const msg = result.error || "Failed to create resolution draft.";
          setServerError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Sangguniang Bayan Resolution draft created.");
        router.push(
          `/admin/transparency/sangguniang-bayan-resolutions/${result.data.id}/edit`
        );
        router.refresh();
      } else if (initialData) {
        formData.append("expectedUpdatedAt", initialData.updatedAt);
        const result = await updateResolutionAction(initialData.id, formData);
        if (!result.success) {
          const msg = result.error || "Failed to update resolution.";
          setServerError(msg);
          toast.error(msg);
          return;
        }
        setSelectedFile(null);
        toast.success("Sangguniang Bayan Resolution updated.");
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!initialData) return;
    setServerError(null);
    setIsTransitioning(true);
    try {
      const res = await publishResolutionAction(initialData.id);
      if (!res.success) {
        setServerError(res.error || "Failed to publish resolution.");
        toast.error(res.error || "Failed to publish resolution.");
        return;
      }
      toast.success("Resolution published to the public Transparency portal.");
      router.refresh();
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleUnpublish = async () => {
    if (!initialData) return;
    setServerError(null);
    setIsTransitioning(true);
    try {
      const res = await unpublishResolutionAction(initialData.id);
      if (!res.success) {
        setServerError(res.error || "Failed to unpublish resolution.");
        toast.error(res.error || "Failed to unpublish resolution.");
        return;
      }
      toast.success("Resolution unpublished and returned to Draft.");
      router.refresh();
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleArchive = async () => {
    if (!initialData) return;
    setServerError(null);
    setIsTransitioning(true);
    try {
      const res = await archiveResolutionAction(initialData.id);
      if (!res.success) {
        setServerError(res.error || "Failed to archive resolution.");
        toast.error(res.error || "Failed to archive resolution.");
        return;
      }
      toast.success("Resolution archived and removed from public view.");
      router.refresh();
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    setServerError(null);
    setIsTransitioning(true);
    try {
      const res = await deleteResolutionAction(initialData.id);
      if (!res.success) {
        setServerError(res.error || "Failed to delete resolution.");
        toast.error(res.error || "Failed to delete resolution.");
        return;
      }
      toast.success("Sangguniang Bayan Resolution permanently deleted.");
      router.push("/admin/transparency/sangguniang-bayan-resolutions");
      router.refresh();
    } finally {
      setIsTransitioning(false);
    }
  };

  const hasExistingPdf = Boolean(initialData?.originalFilename);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/transparency/sangguniang-bayan-resolutions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-burgundy-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sangguniang Bayan Resolutions</span>
        </Link>

        {mode === "edit" && initialData && (
          <StatusBadge status={initialData.status} />
        )}
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="resolutionNumber"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Resolution Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="resolutionNumber"
              type="text"
              required
              value={resolutionNumber}
              onChange={(e) => setResolutionNumber(e.target.value)}
              placeholder="e.g. Resolution No. 2025-001"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
            />
          </div>

          <div>
            <label
              htmlFor="year"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Year <span className="text-rose-500">*</span>
            </label>
            <input
              id="year"
              type="number"
              min={1900}
              max={2100}
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Resolution Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Official title of the Sangguniang Bayan Resolution"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="adoptedAt"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Date Adopted <span className="text-rose-500">*</span>
            </label>
            <input
              id="adoptedAt"
              type="date"
              required
              value={adoptedAt}
              onChange={(e) => setAdoptedAt(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issuing Office
            </label>
            <div className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium">
              Office of the Sangguniang Bayan
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="summary"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Description / Summary
          </label>
          <textarea
            id="summary"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief description or summary of the resolution..."
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
          />
        </div>

        {/* PDF Upload Section */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <label
            htmlFor="pdfFile"
            className="block text-xs font-semibold text-slate-700"
          >
            PDF Attachment {mode === "create" ? "(Required before publishing)" : "(Upload to replace)"}
          </label>

          {mode === "edit" && initialData?.originalFilename && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-burgundy-700 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {initialData.originalFilename}
                  </p>
                  {initialData.fileSizeFormatted && (
                    <p className="text-[11px] text-slate-500">
                      PDF • {initialData.fileSizeFormatted}
                    </p>
                  )}
                </div>
              </div>
              {initialData.status === "PUBLISHED" && (
                <a
                  href={`/resolutions/${initialData.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy-700 hover:text-burgundy-900 shrink-0"
                >
                  <span>View Live PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <label
              htmlFor="pdfFile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{hasExistingPdf ? "Replace PDF File" : "Select PDF File"}</span>
            </label>
            <input
              id="pdfFile"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            {selectedFile && (
              <span className="text-xs text-emerald-700 font-medium truncate">
                Selected: {selectedFile.name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Accepted format: PDF (.pdf) up to 15 MB. Validated server-side before storage.
          </p>
        </div>

        {(mode === "create" || permissions.canUpdate) && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving || isTransitioning}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? "Saving..."
                  : mode === "create"
                    ? "Save Resolution Draft"
                    : "Save Changes"}
              </span>
            </button>
          </div>
        )}
      </form>

      {/* Lifecycle & Danger Zone (Edit Mode Only) */}
      {mode === "edit" && initialData && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Publication & Lifecycle Controls
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {permissions.canPublish && initialData.status !== "PUBLISHED" && (
              <button
                type="button"
                disabled={isTransitioning || isSaving || !hasExistingPdf}
                onClick={handlePublish}
                title={
                  !hasExistingPdf
                    ? "Upload a PDF attachment before publishing"
                    : undefined
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Resolution</span>
              </button>
            )}

            {permissions.canPublish && initialData.status === "PUBLISHED" && (
              <button
                type="button"
                disabled={isTransitioning || isSaving}
                onClick={handleUnpublish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Unpublish to Draft</span>
              </button>
            )}

            {permissions.canArchive && initialData.status !== "ARCHIVED" && (
              <button
                type="button"
                disabled={isTransitioning || isSaving}
                onClick={handleArchive}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Resolution</span>
              </button>
            )}

            {permissions.canDelete && (
              <DestructiveConfirmDialog
                title="Permanently delete this resolution?"
                description={`You are about to permanently delete ${initialData.resolutionNumber} (${initialData.title}) and its PDF attachment.`}
                warningText="This action cannot be undone."
                confirmLabel="Delete Resolution"
                triggerLabel="Delete Resolution"
                isPending={isTransitioning}
                onConfirm={handleDelete}
              />
            )}
          </div>

          {!hasExistingPdf && initialData.status !== "PUBLISHED" && (
            <p className="text-xs text-amber-700">
              A PDF attachment must be uploaded and saved before this resolution can be published.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
