"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowLeft,
  ExternalLink,
  Shield,
  FileCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_PURPOSES,
  DOCUMENT_PURPOSE_LABELS,
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  getFileExtension,
  formatBytes,
  type DocumentPurpose,
} from "@/lib/validation/documents";
import {
  createDocumentAction,
  updateDocumentAction,
  publishDocumentAction,
  archiveDocumentAction,
  deleteDocumentAction,
} from "@/app/(cms)/admin/documents/actions";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { ConcurrencyConflictBanner } from "@/components/admin/concurrency-conflict-banner";
import { toast } from "@/components/ui/toast";

interface OfficeOption {
  id: string;
  name: string;
}

interface DocumentFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    purpose?: DocumentPurpose;
    status: string;
    officeId: string;
    office: { id: string; name: string };
    originalFilename: string;
    format: string;
    bytes: number;
    downloadUrl: string;
    updatedAt: string;
  };
  isSystemScoped: boolean;
  offices?: OfficeOption[];
  userOfficeName?: string;
  canPublish?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
  defaultPurpose?: DocumentPurpose;
  defaultCategory?: string;
  lockPurpose?: boolean;
  lockCategory?: boolean;
  backHref?: string;
  backLabel?: string;
  returnTo?: string;
}

export function DocumentForm({
  mode,
  initialData,
  isSystemScoped,
  offices = [],
  userOfficeName,
  canPublish = false,
  canArchive = false,
  canDelete = false,
  defaultPurpose,
  defaultCategory,
  lockPurpose,
  lockCategory,
  backHref,
  backLabel,
  returnTo,
}: DocumentFormProps) {
  const router = useRouter();

  const isProcurementFlow =
    returnTo === "procurement" ||
    defaultCategory === "Procurement" ||
    (initialData?.purpose === "OTHER_PUBLIC_DOCUMENT" && initialData?.category === "Procurement");

  const effectiveLockPurpose = lockPurpose ?? isProcurementFlow;
  const effectiveLockCategory = lockCategory ?? isProcurementFlow;
  const effectiveBackHref =
    backHref || (isProcurementFlow ? "/admin/transparency/procurement" : "/admin/documents");
  const effectiveBackLabel =
    backLabel || (isProcurementFlow ? "Back to Procurement" : "Back to Documents");

  // Form State
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [category, setCategory] = React.useState(
    initialData?.category ?? (defaultCategory || "")
  );
  const [purpose, setPurpose] = React.useState<DocumentPurpose>(
    initialData?.purpose ?? (defaultPurpose || "DOWNLOADABLE_FORM")
  );
  const [officeId, setOfficeId] = React.useState(initialData?.officeId || offices[0]?.id || "");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Status & Feedback
  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = getFileExtension(file.name);
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
      setErrorMessage(
        `Invalid file type (.${ext}). Accepted formats: PDF, DOC, DOCX, XLS, XLSX.`
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File size exceeds 15 MB limit (received ${(file.size / (1024 * 1024)).toFixed(1)} MB).`
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage("Document title must be at least 3 characters.");
      return;
    }

    if (mode === "create" && !selectedFile) {
      setErrorMessage("Please select an official document file to upload.");
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category.trim());
      formData.append("purpose", purpose);
      if (isSystemScoped) {
        formData.append("officeId", officeId);
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (mode === "create") {
        const res = await createDocumentAction(formData);
        if (!res.success) {
          setErrorMessage(res.error || "Failed to create document.");
          toast.error(res.error || "Failed to create document.");
        } else {
          toast.success("Document uploaded successfully.");
          const nextEditUrl = isProcurementFlow
            ? `/admin/documents/${res.data!.id}/edit?returnTo=procurement`
            : `/admin/documents/${res.data!.id}/edit`;
          router.push(nextEditUrl);
          router.refresh();
        }
      } else {
        formData.append("expectedUpdatedAt", initialData!.updatedAt);
        const res = await updateDocumentAction(initialData!.id, formData);
        if (!res.success) {
          setErrorMessage(res.error || "Failed to update document.");
          toast.error(res.error || "Failed to update document.");
        } else {
          toast.success("Document updated successfully.");
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    setErrorMessage(null);
    setIsPending(true);

    try {
      const res = await deleteDocumentAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete document.");
        toast.error(res.error || "Failed to delete document.");
        setIsPending(false);
      } else {
        toast.success("Document permanently deleted.");
        router.push(effectiveBackHref);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while deleting.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsPending(false);
    }
  };

  const handlePublish = async () => {
    if (!initialData) return;
    setErrorMessage(null);
    setIsPending(true);

    try {
      const res = await publishDocumentAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to publish document.");
        toast.error(res.error || "Failed to publish document.");
      } else {
        toast.success("Document published successfully.");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while publishing.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!initialData) return;
    setShowArchiveDialog(false);
    setErrorMessage(null);
    setIsPending(true);

    try {
      const res = await archiveDocumentAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to archive document.");
        toast.error(res.error || "Failed to archive document.");
      } else {
        toast.success("Document archived successfully.");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while archiving.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSaveDraft} className="space-y-6 max-w-4xl">
      {/* Alert Banner */}
      {errorMessage && (
        errorMessage.includes("409") ||
        errorMessage.toLowerCase().includes("modified by another user") ||
        errorMessage.toLowerCase().includes("another session") ? (
          <ConcurrencyConflictBanner message="This document was modified in another session. Please reload the latest version before saving your changes." />
        ) : (
          <div role="alert" className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Operation Failed</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )
      )}

      {/* Main Metadata Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {mode === "create" ? "Document Metadata" : "Document Details"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official downloadable municipal forms, application templates, and civic guidelines.
            </p>
          </div>
          {initialData && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <StatusBadge status={initialData.status} />
            </div>
          )}
        </div>

        {/* Title Input */}
        <div>
          <label htmlFor="doc-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Document Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="doc-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Application for Mayor's Business Permit"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition"
          />
        </div>

        {/* Document Purpose Selector */}
        <div>
          <label htmlFor="doc-purpose" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Document Purpose <span className="text-rose-500">*</span>
          </label>
          {effectiveLockPurpose ? (
            <div className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-burgundy-700 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {DOCUMENT_PURPOSE_LABELS[purpose] || purpose}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium bg-slate-200/70 px-2 py-0.5 rounded">
                Fixed for {category || "Workflow"}
              </span>
            </div>
          ) : (
            <select
              id="doc-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as DocumentPurpose)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition"
            >
              {DOCUMENT_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {DOCUMENT_PURPOSE_LABELS[p]}
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-slate-500 mt-1">
            {purpose === "DOWNLOADABLE_FORM" && "Official forms and applications intended for citizen or business municipal transactions."}
            {purpose === "CITIZENS_CHARTER" && "Official Citizen's Charter guideline or frontline service standards document."}
            {purpose === "JOB_ATTACHMENT" && "Official supporting document attached to a municipal job opportunity vacancy."}
            {purpose === "OTHER_PUBLIC_DOCUMENT" && "Official public document published for general municipal transparency."}
          </p>
        </div>

        {/* Category & Office Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Dropdown */}
          <div>
            <label htmlFor="doc-category" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            {effectiveLockCategory ? (
              <div className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{category || "None"}</span>
                <span className="text-[11px] text-slate-500 font-medium bg-slate-200/70 px-2 py-0.5 rounded">
                  Fixed
                </span>
              </div>
            ) : (
              <select
                id="doc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition"
              >
                <option value="">-- Select Category --</option>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Office Ownership */}
          <div>
            <label htmlFor="doc-office" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Responsible Municipal Office <span className="text-rose-500">*</span>
            </label>
            {isSystemScoped ? (
              <select
                id="doc-office"
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition"
              >
                {offices.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-burgundy-600" />
                <span className="font-medium">{initialData?.office?.name || userOfficeName || "Assigned Office"}</span>
                <span className="text-[11px] text-slate-500 ml-auto">(Fixed by office scope)</span>
              </div>
            )}
          </div>
        </div>

        {/* Description Textarea */}
        <div>
          <label htmlFor="doc-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description & Instructions (Optional)
          </label>
          <textarea
            id="doc-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the document, required supporting attachments, or submission guidance..."
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition resize-y"
          />
        </div>
      </div>

      {/* File Management Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Official Document File
        </h3>

        {/* Current File Info (Edit Mode) */}
        {initialData && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-burgundy-100 text-burgundy-700 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {initialData.originalFilename}
                </p>
                <p className="text-xs text-slate-500">
                  {initialData.format.toUpperCase()} • {formatBytes(initialData.bytes)}
                </p>
              </div>
            </div>
            <a
              href={initialData.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-burgundy-700 bg-burgundy-50 hover:bg-burgundy-100 border border-burgundy-200 rounded-md transition shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Download Current File</span>
            </a>
          </div>
        )}

        {/* File Upload / Replacement Input */}
        <div>
          <label
            htmlFor="doc-file"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            {mode === "create" ? "Select Document File" : "Replace Document File (Optional)"}
            {mode === "create" && <span className="text-rose-500"> *</span>}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="doc-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-xs file:font-semibold
                file:bg-burgundy-50 file:text-burgundy-700
                hover:file:bg-burgundy-100
                cursor-pointer border border-slate-200 rounded-lg"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Supported formats: PDF, DOC, DOCX, XLS, XLSX. Maximum file size: 15 MB. Files are stored securely in official cloud storage.
          </p>

          {selectedFile && (
            <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
              <span className="font-medium truncate mr-2">
                Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <span className="text-blue-700 shrink-0 font-semibold">
                {mode === "create" ? "Ready to Upload" : "Will Replace Asset"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push(effectiveBackHref)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{effectiveBackLabel}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {mode === "edit" && canDelete && (
            <DestructiveConfirmDialog
              title="Permanently delete this document?"
              description="This action cannot be undone."
              warningText="The managed document file in cloud storage will be permanently removed upon deletion. Ensure no active service pages or job vacancies depend on this file."
              confirmLabel="Permanently Delete Document"
              isPending={isPending}
              onConfirm={handleDelete}
              triggerLabel="Delete Document"
            />
          )}

          {mode === "edit" && canArchive && initialData?.status !== "ARCHIVED" && (
            <button
              type="button"
              onClick={() => setShowArchiveDialog(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive Document</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{mode === "create" ? "Save as Draft" : "Save Changes"}</span>
          </button>

          {mode === "edit" && canPublish && initialData?.status !== "PUBLISHED" && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-burgundy-700 hover:bg-burgundy-800 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Publish Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Archiving Document */}
      <ConfirmationDialog
        isOpen={showArchiveDialog}
        title="Archive Municipal Document?"
        description="Are you sure you want to archive this document? It will be removed from public view immediately while retained in municipal archives."
        confirmLabel="Archive Document"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isPending}
        onConfirm={handleConfirmArchive}
        onCancel={() => setShowArchiveDialog(false)}
      />
    </form>
  );
}
