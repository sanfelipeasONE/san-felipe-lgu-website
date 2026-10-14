"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import {
  saveServiceDraftAction,
  publishServiceAction,
  unpublishServiceAction,
} from "@/app/(cms)/admin/services/actions";
import type { ServiceSectionInput } from "@/lib/validation/services";

export interface ServicePageFormProps {
  servicePage: {
    id: string;
    serviceKey: string;
    title: string;
    description: string | null;
    status: string;
    officeId: string | null;
    publishedAt: Date | string | null;
    updatedAt: Date | string;
    office?: { id: string; name: string; shortName: string | null } | null;
    sections: Array<{
      id: string;
      title: string;
      content: string;
      sortOrder: number;
    }>;
  };
  offices: Array<{ id: string; name: string; shortName: string | null }>;
  isSystemScoped: boolean;
  canPublish: boolean;
}

export function ServicePageForm({
  servicePage,
  offices,
  isSystemScoped,
  canPublish,
}: ServicePageFormProps) {
  const router = useRouter();

  // Form states
  const [title, setTitle] = React.useState(servicePage.title);
  const [description, setDescription] = React.useState(servicePage.description || "");
  const [officeId, setOfficeId] = React.useState(servicePage.officeId || "");
  const [sections, setSections] = React.useState<ServiceSectionInput[]>(
    servicePage.sections.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      sortOrder: s.sortOrder,
    }))
  );

  // Status & Concurrency
  const [status, setStatus] = React.useState(servicePage.status);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = React.useState(
    new Date(servicePage.updatedAt).toISOString()
  );

  // UI state
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isUnpublishing, setIsUnpublishing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Confirmation dialogs
  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
  const [showPublishDialog, setShowPublishDialog] = React.useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = React.useState(false);

  // Mark unsaved changes
  const markDirty = () => {
    setHasUnsavedChanges(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // ---------------------------------------------------------------------------
  // SECTION REORDERING & MANIPULATION
  // ---------------------------------------------------------------------------
  const handleAddSection = () => {
    markDirty();
    const newSection: ServiceSectionInput = {
      title: "",
      content: "",
      sortOrder: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (
    index: number,
    field: keyof ServiceSectionInput,
    value: unknown
  ) => {
    markDirty();
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    markDirty();
    setSections((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;

      // Update sortOrder
      return next.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
  };

  const handleConfirmDeleteSection = () => {
    if (deleteIndex === null) return;
    markDirty();
    setSections((prev) => {
      const next = prev.filter((_, idx) => idx !== deleteIndex);
      return next.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
    setDeleteIndex(null);
  };

  // ---------------------------------------------------------------------------
  // ACTIONS: SAVE DRAFT, PUBLISH, UNPUBLISH
  // ---------------------------------------------------------------------------
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await saveServiceDraftAction(servicePage.serviceKey, {
        title,
        description: description.trim() || null,
        officeId: isSystemScoped ? (officeId || null) : servicePage.officeId,
        sections,
        expectedUpdatedAt,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Failed to save draft changes.");
      } else {
        setHasUnsavedChanges(false);
        setSuccessMessage("Service page draft saved successfully.");
        if (result.data?.updatedAt) {
          setExpectedUpdatedAt(result.data.updatedAt);
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected network error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setShowPublishDialog(false);
    setIsPublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await publishServiceAction(servicePage.serviceKey, {
        title,
        description: description.trim() || null,
        officeId: isSystemScoped ? (officeId || null) : servicePage.officeId,
        sections,
        expectedUpdatedAt,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Failed to publish service page.");
      } else {
        setHasUnsavedChanges(false);
        setStatus("PUBLISHED");
        setSuccessMessage("Service page published successfully to the public portal.");
        if (result.data?.publishedAt) {
          setExpectedUpdatedAt(result.data.publishedAt);
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setShowUnpublishDialog(false);
    setIsUnpublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await unpublishServiceAction(servicePage.serviceKey);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to unpublish service page.");
      } else {
        setStatus("DRAFT");
        setSuccessMessage("Service page unpublished. Content reverted to draft status.");
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred while unpublishing.");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const publicUrl = `/services/${servicePage.serviceKey}`;
  const previewUrl = `/admin/services/${servicePage.serviceKey}/preview`;

  return (
    <div className="space-y-6">
      {/* Top Notification Alerts */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-rose-50 border border-rose-200 rounded-xs flex items-start gap-3 text-rose-800 shadow-2xs"
        >
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 text-xs">
            <span className="font-bold block mb-0.5">Operation Error</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xs flex items-start gap-3 text-emerald-800 shadow-2xs"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 text-xs">
            <span className="font-bold block mb-0.5">Success</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Page Metadata & Ordered Sections (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Page Details */}
          <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gov-charcoal">Service Page Identity</h2>
              <span className="text-[10px] font-mono font-semibold bg-slate-100 text-gov-muted px-2 py-0.5 rounded-xs">
                /{servicePage.serviceKey}
              </span>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="service-title"
                className="block text-xs font-bold text-gov-charcoal mb-1"
              >
                Page Title <span className="text-rose-600">*</span>
              </label>
              <input
                id="service-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Citizen's Charter"
                className="w-full px-3 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white"
                required
              />
            </div>

            {/* Summary / Description */}
            <div>
              <label
                htmlFor="service-desc"
                className="block text-xs font-bold text-gov-charcoal mb-1"
              >
                Overview / Summary
              </label>
              <textarea
                id="service-desc"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markDirty();
                }}
                placeholder="Brief summary or introductory statement describing this service module..."
                className="w-full px-3 py-2 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:bg-white resize-y"
              />
              <span className="text-[10px] text-gov-muted mt-1 block">
                Shown in the service page header and introductory overview section.
              </span>
            </div>
          </div>

          {/* Card 2: Ordered Content Sections */}
          <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gov-charcoal">
                  Content Sections ({sections.length})
                </h2>
                <p className="text-[11px] text-gov-muted mt-0.5">
                  Ordered semantic blocks for service standards, requirements, steps, and procedures.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSection}
                className="text-xs h-8 px-2.5 text-burgundy-800 border-burgundy-200 hover:bg-burgundy-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                <span>Add Section</span>
              </Button>
            </div>

            {sections.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xs">
                <FileText className="h-8 w-8 text-gov-muted/50 mx-auto mb-2" aria-hidden="true" />
                <h3 className="text-xs font-bold text-gov-charcoal mb-1">
                  No content sections added yet
                </h3>
                <p className="text-[11px] text-gov-muted max-w-sm mx-auto mb-3">
                  Click &quot;Add Section&quot; to author structured guidance for this municipal service.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSection}
                  className="text-xs text-burgundy-800 border-burgundy-300 hover:bg-burgundy-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  <span>Create First Section</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section, idx) => (
                  <div
                    key={section.id || `temp-section-${idx}`}
                    className="border border-gray-200 rounded-xs p-4 bg-slate-50/50 space-y-3.5"
                  >
                    {/* Section Top Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-burgundy-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gov-charcoal truncate">
                          {section.title || `Untitled Section #${idx + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        {/* Reorder Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, "up")}
                          className="p-1 rounded-xs text-gov-muted hover:text-gov-charcoal hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:pointer-events-none"
                          title="Move section up"
                          aria-label={`Move section ${idx + 1} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>

                        {/* Reorder Down */}
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => handleMoveSection(idx, "down")}
                          className="p-1 rounded-xs text-gov-muted hover:text-gov-charcoal hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:pointer-events-none"
                          title="Move section down"
                          aria-label={`Move section ${idx + 1} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => setDeleteIndex(idx)}
                          className="p-1 rounded-xs text-gov-muted hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                          title="Remove section"
                          aria-label={`Remove section ${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Section Heading Input */}
                    <div>
                      <label
                        htmlFor={`sec-title-${idx}`}
                        className="block text-[11px] font-bold text-gov-charcoal mb-1"
                      >
                        Section Heading <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id={`sec-title-${idx}`}
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          handleUpdateSection(idx, "title", e.target.value)
                        }
                        placeholder="e.g. Documentary Requirements, Processing Steps, Fees..."
                        className="w-full px-3 py-1.5 text-xs text-gov-charcoal bg-white border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                        required
                      />
                    </div>

                    {/* Section Rich Text Body */}
                    <div>
                      <label
                        id={`sec-body-label-${idx}`}
                        className="block text-[11px] font-bold text-gov-charcoal mb-1"
                      >
                        Section Content <span className="text-rose-600">*</span>
                      </label>
                      <TiptapEditor
                        value={section.content}
                        onChange={(html) =>
                          handleUpdateSection(idx, "content", html)
                        }
                        placeholder="Write detailed guidelines, instructions, or bulleted requirements..."
                        className="bg-white min-h-[140px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Publishing Controls & Attribution (1 col) */}
        <div className="space-y-6">
          {/* Card: Status & Actions */}
          <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-muted border-b border-gray-100 pb-2">
              Publication Status
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gov-muted">Current Status:</span>
              <StatusBadge status={status} size="sm" />
            </div>

            {hasUnsavedChanges && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xs text-[11px] text-amber-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>You have unsaved changes.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {/* Save Draft */}
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isPublishing || isUnpublishing}
                className="w-full text-xs h-9 font-semibold justify-center text-gov-charcoal hover:bg-slate-50 border-gray-300"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" aria-hidden="true" />
                    <span>Saving Draft...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-2 text-gov-muted" aria-hidden="true" />
                    <span>Save Draft</span>
                  </>
                )}
              </Button>

              {/* Preview Button */}
              <Link
                href={previewUrl}
                className="w-full inline-flex items-center justify-center text-xs h-9 font-semibold rounded-sm text-burgundy-800 hover:bg-burgundy-50 border border-transparent transition-colors"
              >
                <Eye className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                <span>Preview in CMS</span>
              </Link>

              {/* Publish Button */}
              {canPublish && status !== "PUBLISHED" && (
                <Button
                  type="button"
                  onClick={() => setShowPublishDialog(true)}
                  disabled={isSaving || isPublishing || isUnpublishing}
                  className="w-full text-xs h-9 font-bold justify-center bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" aria-hidden="true" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                      <span>Publish Service Page</span>
                    </>
                  )}
                </Button>
              )}

              {/* Re-Publish Button (if already published but has edits) */}
              {canPublish && status === "PUBLISHED" && (
                <Button
                  type="button"
                  onClick={() => setShowPublishDialog(true)}
                  disabled={isSaving || isPublishing || isUnpublishing || !hasUnsavedChanges}
                  className="w-full text-xs h-9 font-bold justify-center bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" aria-hidden="true" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                      <span>Update Published Content</span>
                    </>
                  )}
                </Button>
              )}

              {/* Unpublish Button */}
              {canPublish && status === "PUBLISHED" && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowUnpublishDialog(true)}
                  disabled={isSaving || isPublishing || isUnpublishing}
                  className="w-full text-xs h-8 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" aria-hidden="true" />
                  <span>Unpublish to Draft</span>
                </Button>
              )}
            </div>

            {/* Public Link */}
            {status === "PUBLISHED" && (
              <div className="border-t border-gray-100 pt-3">
                <Link
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-burgundy-800 hover:underline flex items-center justify-between group"
                >
                  <span>View Public Page</span>
                  <ExternalLink className="h-3.5 w-3.5 text-gov-muted group-hover:text-burgundy-800" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* Card: Responsible Office Attribution */}
          <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-muted border-b border-gray-100 pb-2">
              Responsible Office
            </h3>

            {isSystemScoped ? (
              <div>
                <label
                  htmlFor="office-select"
                  className="block text-[11px] font-bold text-gov-charcoal mb-1"
                >
                  Assigning Office
                </label>
                <select
                  id="office-select"
                  value={officeId}
                  onChange={(e) => {
                    setOfficeId(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-2.5 py-1.5 text-xs text-gov-charcoal bg-slate-50 border border-gray-200 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                >
                  <option value="">Municipal-Wide / Unassigned</option>
                  {offices.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} {off.shortName ? `(${off.shortName})` : ""}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gov-muted mt-1 block">
                  System administrators can assign this service page to a department.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gov-charcoal">
                <Building2 className="h-4 w-4 text-gov-muted shrink-0" aria-hidden="true" />
                <span className="font-semibold">
                  {servicePage.office?.name || "Municipal-Wide (System-Managed)"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Delete Section */}
      <ConfirmationDialog
        isOpen={deleteIndex !== null}
        title="Remove Content Section?"
        description="Are you sure you want to remove this section? This action will take effect upon saving your draft."
        confirmLabel="Remove Section"
        cancelLabel="Keep Section"
        variant="danger"
        onConfirm={handleConfirmDeleteSection}
        onCancel={() => setDeleteIndex(null)}
      />

      {/* Confirmation Dialog: Publish Page */}
      <ConfirmationDialog
        isOpen={showPublishDialog}
        title="Publish Service Page to Public Website?"
        description="This will immediately make your structured section content live on the official San Felipe municipal portal."
        confirmLabel="Confirm & Publish"
        cancelLabel="Cancel"
        variant="default"
        isLoading={isPublishing}
        onConfirm={handlePublish}
        onCancel={() => setShowPublishDialog(false)}
      />

      {/* Confirmation Dialog: Unpublish Page */}
      <ConfirmationDialog
        isOpen={showUnpublishDialog}
        title="Unpublish Service Page to Draft?"
        description="The service page content will be reverted to DRAFT status and hidden from the public website immediately."
        confirmLabel="Unpublish"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isUnpublishing}
        onConfirm={handleUnpublish}
        onCancel={() => setShowUnpublishDialog(false)}
      />
    </div>
  );
}
