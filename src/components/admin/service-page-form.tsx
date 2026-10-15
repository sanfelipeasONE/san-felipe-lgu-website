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
  Loader2,
  FileText,
  ExternalLink,
  Upload,
  Download,
  RefreshCw,
  FileUp,
  X,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { ConcurrencyConflictBanner } from "@/components/admin/concurrency-conflict-banner";
import { toast } from "@/components/ui/toast";
import { FeaturedImageUploader } from "@/components/admin/featured-image-uploader";
import {
  saveServiceDraftAction,
  publishServiceAction,
  unpublishServiceAction,
  uploadCharterPdfAction,
  removeCharterAssociationAction,
  linkExistingCharterDocumentAction,
  uploadServiceImageAction,
  uploadServiceAttachmentAction,
  linkExistingServiceAttachmentAction,
  removeServiceAttachmentAction,
} from "@/app/(cms)/admin/services/actions";
import { formatBytes } from "@/lib/validation/documents";
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
    featuredImageUrl?: string | null;
    featuredImageAlt?: string | null;
    featuredImagePublicId?: string | null;
    featuredImageWidth?: number | null;
    featuredImageHeight?: number | null;
    featuredImageFormat?: string | null;
    featuredImageBytes?: number | null;
    office?: { id: string; name: string; shortName: string | null } | null;
    sections: Array<{
      id: string;
      title: string;
      content: string;
      sortOrder: number;
    }>;
    charterDocumentId?: string | null;
    charterDocument?: {
      id: string;
      title: string;
      originalFilename: string;
      storagePublicId: string;
      storageUrl: string;
      downloadUrl?: string;
      format: string;
      mimeType: string;
      bytes: number;
      status: string;
      publishedAt?: Date | string | null;
    } | null;
    attachmentDocumentId?: string | null;
    attachmentDocument?: {
      id: string;
      title: string;
      originalFilename: string;
      storagePublicId: string;
      storageUrl: string;
      downloadUrl?: string;
      format: string;
      mimeType: string;
      bytes: number;
      status: string;
      purpose: string;
      publishedAt?: Date | string | null;
    } | null;
  };
  offices: Array<{ id: string; name: string; shortName: string | null }>;
  charterDocuments?: Array<{
    id: string;
    title: string;
    originalFilename: string;
    status: string;
    bytes?: number;
    storageUrl?: string;
    downloadUrl?: string;
  }>;
  attachmentDocuments?: Array<{
    id: string;
    title: string;
    originalFilename: string;
    status: string;
    purpose: string;
    bytes?: number;
    storageUrl?: string;
    downloadUrl?: string;
  }>;
  isSystemScoped: boolean;
  canPublish: boolean;
}

export function ServicePageForm({
  servicePage,
  offices,
  charterDocuments = [],
  attachmentDocuments = [],
  isSystemScoped,
  canPublish,
}: ServicePageFormProps) {
  const router = useRouter();

  const isCitizensCharter = servicePage.serviceKey === "citizens-charter";
  const isBusinessPermits = servicePage.serviceKey === "business-permits";

  // Form states
  const [title, setTitle] = React.useState(servicePage.title);
  const [description, setDescription] = React.useState(servicePage.description || "");
  const [officeId, setOfficeId] = React.useState(servicePage.officeId || "");
  const [charterDocumentId, setCharterDocumentId] = React.useState(servicePage.charterDocumentId || "");
  const [sections, setSections] = React.useState<ServiceSectionInput[]>(
    servicePage.sections.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      sortOrder: s.sortOrder,
    }))
  );

  // Business Permits single-body state (defensively preserves and consolidates multi-section legacy data if present)
  const [body, setBody] = React.useState<string>(() => {
    if (!servicePage.sections || servicePage.sections.length === 0) return "";
    if (servicePage.sections.length === 1) return servicePage.sections[0].content;
    return servicePage.sections
      .map((s) => (s.title && s.title !== servicePage.title ? `<h2>${s.title}</h2>${s.content}` : s.content))
      .join("");
  });

  // Business Permits featured image state
  const [featuredImage, setFeaturedImage] = React.useState<{
    url?: string | null;
    alt?: string | null;
    publicId?: string | null;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    bytes?: number | null;
  } | null>(
    servicePage.featuredImageUrl
      ? {
          url: servicePage.featuredImageUrl,
          alt: servicePage.featuredImageAlt,
          publicId: servicePage.featuredImagePublicId,
          width: servicePage.featuredImageWidth,
          height: servicePage.featuredImageHeight,
          format: servicePage.featuredImageFormat,
          bytes: servicePage.featuredImageBytes,
        }
      : null
  );

  // Official Citizen's Charter PDF workflow states
  const [activeCharterDoc, setActiveCharterDoc] = React.useState(
    servicePage.charterDocument || null
  );
  const [isUploadingPdf, setIsUploadingPdf] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = React.useState("");
  const [isReplacing, setIsReplacing] = React.useState(false);
  const [showRemoveCharterDialog, setShowRemoveCharterDialog] = React.useState(false);
  const [isRemovingCharter, setIsRemovingCharter] = React.useState(false);
  const [isLinkingExisting, setIsLinkingExisting] = React.useState(false);

  // Business Permits Attachment Document states
  const [activeAttachmentDoc, setActiveAttachmentDoc] = React.useState(
    servicePage.attachmentDocument || null
  );
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);
  const [attachmentUploadError, setAttachmentUploadError] = React.useState<string | null>(null);
  const [selectedAttachmentFile, setSelectedAttachmentFile] = React.useState<File | null>(null);
  const [attachmentTitle, setAttachmentTitle] = React.useState("");
  const [attachmentPurpose, setAttachmentPurpose] = React.useState<"DOWNLOADABLE_FORM" | "OTHER_PUBLIC_DOCUMENT">("DOWNLOADABLE_FORM");
  const [isReplacingAttachment, setIsReplacingAttachment] = React.useState(false);
  const [showRemoveAttachmentDialog, setShowRemoveAttachmentDialog] = React.useState(false);
  const [isRemovingAttachment, setIsRemovingAttachment] = React.useState(false);
  const [selectedExistingAttachmentId, setSelectedExistingAttachmentId] = React.useState("");
  const [isLinkingExistingAttachment, setIsLinkingExistingAttachment] = React.useState(false);

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Confirmation dialogs
  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
  const [showPublishDialog, setShowPublishDialog] = React.useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = React.useState(false);

  // Mark unsaved changes
  const markDirty = () => {
    setHasUnsavedChanges(true);
    setErrorMessage(null);
  };

  // ---------------------------------------------------------------------------
  // CITIZEN'S CHARTER PDF ACTIONS
  // ---------------------------------------------------------------------------
  const handleDirectPdfUpload = async () => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files (.pdf) are permitted for the official Citizen's Charter.");
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setUploadError(
        `File size exceeds 15 MB limit (received ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`
      );
      return;
    }

    setIsUploadingPdf(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("serviceKey", "citizens-charter");
    formData.append("file", selectedFile);
    if (pdfTitle.trim()) {
      formData.append("title", pdfTitle.trim());
    }

    const res = await uploadCharterPdfAction(formData);
    setIsUploadingPdf(false);

    if (!res.success || !res.data) {
      setUploadError(res.error || "Failed to upload Citizen's Charter PDF.");
      return;
    }

    if (res.data.servicePageUpdatedAt) {
      setExpectedUpdatedAt(res.data.servicePageUpdatedAt);
    }
    setActiveCharterDoc({
      id: res.data.documentId,
      title: res.data.title,
      originalFilename: res.data.originalFilename,
      storagePublicId: "",
      storageUrl: res.data.storageUrl,
      downloadUrl: res.data.downloadUrl,
      format: "pdf",
      mimeType: "application/pdf",
      bytes: res.data.bytes,
      status: "PUBLISHED",
    });
    setCharterDocumentId(res.data.documentId);
    setIsReplacing(false);
    setSelectedFile(null);
    setPdfTitle("");
    toast.success("Citizen's Charter PDF uploaded.");
    router.refresh();
  };

  const handleRemoveCharterAssociation = async () => {
    setIsRemovingCharter(true);
    setUploadError(null);

    const res = await removeCharterAssociationAction("citizens-charter");
    setIsRemovingCharter(false);
    setShowRemoveCharterDialog(false);

    if (!res.success) {
      setUploadError(res.error || "Failed to remove Charter association.");
      toast.error(res.error || "Failed to remove Charter association.");
      return;
    }

    if (res.data?.servicePageUpdatedAt) {
      setExpectedUpdatedAt(res.data.servicePageUpdatedAt);
    }
    setActiveCharterDoc(null);
    setCharterDocumentId("");
    toast.success("Citizen's Charter removed.");
    router.refresh();
  };

  const handleLinkExistingDocument = async (docId: string) => {
    if (!docId) return;

    setIsLinkingExisting(true);
    setUploadError(null);

    const res = await linkExistingCharterDocumentAction("citizens-charter", docId);
    setIsLinkingExisting(false);

    if (!res.success) {
      setUploadError(res.error || "Failed to associate existing document.");
      return;
    }

    if (res.data?.servicePageUpdatedAt) {
      setExpectedUpdatedAt(res.data.servicePageUpdatedAt);
    }
    const found = charterDocuments.find((d) => d.id === docId);
    if (found) {
      setActiveCharterDoc({
        id: found.id,
        title: found.title,
        originalFilename: found.originalFilename,
        storagePublicId: "",
        storageUrl: found.storageUrl || "",
        downloadUrl: found.downloadUrl,
        format: "pdf",
        mimeType: "application/pdf",
        bytes: found.bytes || 0,
        status: found.status,
      });
      setCharterDocumentId(found.id);
    }
    toast.success("Citizen's Charter document associated.");
    router.refresh();
  };

  // ---------------------------------------------------------------------------
  // BUSINESS PERMITS ATTACHMENT ACTIONS
  // ---------------------------------------------------------------------------
  const handleDirectAttachmentUpload = async () => {
    if (!selectedAttachmentFile) return;

    if (!selectedAttachmentFile.name.toLowerCase().endsWith(".pdf")) {
      setAttachmentUploadError("Only PDF files (.pdf) are permitted for official attachments.");
      return;
    }

    if (selectedAttachmentFile.size > 15 * 1024 * 1024) {
      setAttachmentUploadError(
        `File size exceeds 15 MB limit (received ${(selectedAttachmentFile.size / (1024 * 1024)).toFixed(1)} MB).`
      );
      return;
    }

    setIsUploadingAttachment(true);
    setAttachmentUploadError(null);

    const formData = new FormData();
    formData.append("serviceKey", servicePage.serviceKey);
    formData.append("file", selectedAttachmentFile);
    formData.append("purpose", attachmentPurpose);
    if (attachmentTitle.trim()) {
      formData.append("title", attachmentTitle.trim());
    }

    const res = await uploadServiceAttachmentAction(formData);
    setIsUploadingAttachment(false);

    if (!res.success || !res.data) {
      setAttachmentUploadError(res.error || "Failed to upload service document.");
      return;
    }

    if (res.data.servicePageUpdatedAt) {
      setExpectedUpdatedAt(res.data.servicePageUpdatedAt);
    }
    setActiveAttachmentDoc({
      id: res.data.documentId,
      title: res.data.title,
      originalFilename: res.data.originalFilename,
      storagePublicId: "",
      storageUrl: res.data.storageUrl,
      downloadUrl: res.data.downloadUrl,
      format: "pdf",
      mimeType: "application/pdf",
      bytes: res.data.bytes,
      status: "PUBLISHED",
      purpose: res.data.purpose,
    });
    setIsReplacingAttachment(false);
    setSelectedAttachmentFile(null);
    setAttachmentTitle("");
    toast.success("Document attached to service page.");
    router.refresh();
  };

  const handleRemoveAttachmentAssociation = async () => {
    setIsRemovingAttachment(true);
    setAttachmentUploadError(null);

    const res = await removeServiceAttachmentAction(servicePage.serviceKey);
    setIsRemovingAttachment(false);
    setShowRemoveAttachmentDialog(false);

    if (!res.success) {
      setAttachmentUploadError(res.error || "Failed to remove attachment association.");
      toast.error(res.error || "Failed to remove attachment association.");
      return;
    }

    if (res.data?.servicePageUpdatedAt) {
      setExpectedUpdatedAt(res.data.servicePageUpdatedAt);
    }
    setActiveAttachmentDoc(null);
    toast.success("Document attachment removed.");
    router.refresh();
  };

  const handleLinkExistingAttachment = async () => {
    if (!selectedExistingAttachmentId) return;

    setIsLinkingExistingAttachment(true);
    setAttachmentUploadError(null);

    const res = await linkExistingServiceAttachmentAction(
      servicePage.serviceKey,
      selectedExistingAttachmentId
    );
    setIsLinkingExistingAttachment(false);

    if (!res.success) {
      setAttachmentUploadError(res.error || "Failed to attach existing document.");
      return;
    }

    if (res.data?.servicePageUpdatedAt) {
      setExpectedUpdatedAt(res.data.servicePageUpdatedAt);
    }
    const found = attachmentDocuments.find((d) => d.id === selectedExistingAttachmentId);
    if (found) {
      setActiveAttachmentDoc({
        id: found.id,
        title: found.title,
        originalFilename: found.originalFilename,
        storagePublicId: "",
        storageUrl: found.storageUrl || "",
        downloadUrl: found.downloadUrl,
        format: "pdf",
        mimeType: "application/pdf",
        bytes: found.bytes || 0,
        status: found.status,
        purpose: found.purpose,
      });
    }
    toast.success("Document attached to service page.");
    setIsReplacingAttachment(false);
    router.refresh();
  };

  // ---------------------------------------------------------------------------
  // SECTION REORDERING & MANIPULATION (For Generic Services)
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

  // Helper to build draft payload
  const buildPayload = () => {
    return {
      title,
      description: description.trim() || null,
      officeId: isSystemScoped ? (officeId || null) : servicePage.officeId,
      charterDocumentId: isCitizensCharter ? (activeCharterDoc?.id || null) : undefined,
      attachmentDocumentId: isBusinessPermits ? (activeAttachmentDoc?.id || null) : undefined,
      featuredImageUrl: isBusinessPermits ? (featuredImage?.url || null) : undefined,
      featuredImageAlt: isBusinessPermits ? (featuredImage?.alt || null) : undefined,
      featuredImagePublicId: isBusinessPermits ? (featuredImage?.publicId || null) : undefined,
      featuredImageWidth: isBusinessPermits ? (featuredImage?.width || null) : undefined,
      featuredImageHeight: isBusinessPermits ? (featuredImage?.height || null) : undefined,
      featuredImageFormat: isBusinessPermits ? (featuredImage?.format || null) : undefined,
      featuredImageBytes: isBusinessPermits ? (featuredImage?.bytes || null) : undefined,
      body: isBusinessPermits ? body : undefined,
      sections: isBusinessPermits
        ? [{ title: title || "Business Permit Guidelines", content: body, sortOrder: 0 }]
        : isCitizensCharter
        ? []
        : sections,
      expectedUpdatedAt,
    };
  };

  // ---------------------------------------------------------------------------
  // ACTIONS: SAVE DRAFT, PUBLISH, UNPUBLISH
  // ---------------------------------------------------------------------------
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await saveServiceDraftAction(servicePage.serviceKey, buildPayload());

      if (!result.success) {
        setErrorMessage(result.error || "Failed to save draft changes.");
        toast.error(result.error || "Failed to save draft changes.");
      } else {
        setHasUnsavedChanges(false);
        toast.success("Service page draft saved.");
        if (result.data?.updatedAt) {
          setExpectedUpdatedAt(result.data.updatedAt);
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected network error occurred while saving.");
      toast.error("An unexpected network error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setShowPublishDialog(false);
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const result = await publishServiceAction(servicePage.serviceKey, buildPayload());

      if (!result.success) {
        setErrorMessage(result.error || "Failed to publish service page.");
        toast.error(result.error || "Failed to publish service page.");
      } else {
        setHasUnsavedChanges(false);
        setStatus("PUBLISHED");
        toast.success("Service page published.");
        if (result.data?.updatedAt) {
          setExpectedUpdatedAt(result.data.updatedAt);
        } else if (result.data?.publishedAt) {
          setExpectedUpdatedAt(result.data.publishedAt);
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred while publishing.");
      toast.error("An unexpected error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setShowUnpublishDialog(false);
    setIsUnpublishing(true);
    setErrorMessage(null);

    try {
      const result = await unpublishServiceAction(servicePage.serviceKey, expectedUpdatedAt);

      if (!result.success) {
        setErrorMessage(result.error || "Failed to unpublish service page.");
        toast.error(result.error || "Failed to unpublish service page.");
      } else {
        setStatus("DRAFT");
        toast.success("Service page reverted to draft.");
        if (result.data?.updatedAt) {
          setExpectedUpdatedAt(result.data.updatedAt);
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred while unpublishing.");
      toast.error("An unexpected error occurred while unpublishing.");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const previewUrl = `/admin/services/${servicePage.serviceKey}/preview`;

  return (
    <div className="space-y-6">
      {/* Top Notification Alerts */}
      {errorMessage && (
        errorMessage.includes("409") ||
        errorMessage.toLowerCase().includes("modified by another user") ||
        errorMessage.toLowerCase().includes("another session") ? (
          <ConcurrencyConflictBanner message="This service page was modified in another session. Please reload the latest version before saving your changes." />
        ) : (
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
        )
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Authoring Area (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Page Identity */}
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

          {/* ========================================================================= */}
          {/* BRANCH A: CITIZEN'S CHARTER DEDICATED DOCUMENT-CENTRIC AUTHORING          */}
          {/* ========================================================================= */}
          {isCitizensCharter && (
            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-gov-charcoal flex items-center gap-2">
                    <FileText className="h-4 w-4 text-burgundy-700" aria-hidden="true" />
                    <span>Official Citizen&apos;s Charter Handbook (PDF)</span>
                  </h2>
                  <p className="text-[11px] text-gov-muted mt-0.5">
                    The Citizen&apos;s Charter is published as an authoritative frontline handbook. Manage the official PDF below.
                  </p>
                </div>
                {activeCharterDoc && (
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Associated
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xs text-[11px] text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {activeCharterDoc && !isReplacing ? (
                /* Management Card when PDF is associated */
                <div className="bg-slate-50 border border-gray-200 rounded-xs p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-gov-charcoal">
                      {activeCharterDoc.title}
                    </h3>
                    <p className="text-[11px] text-gov-muted mt-0.5">
                      {activeCharterDoc.originalFilename} • PDF • {formatBytes(activeCharterDoc.bytes)}
                    </p>
                  </div>

                  {/* Actions: View, Download, Replace, Remove */}
                  <div className="pt-2 border-t border-gray-200 flex flex-wrap gap-2">
                    <a
                      href={activeCharterDoc.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-white border border-gray-300 text-gov-charcoal hover:text-burgundy-800 hover:border-burgundy-800 transition-colors shadow-2xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>View PDF</span>
                    </a>

                    {activeCharterDoc.downloadUrl && (
                      <a
                        href={activeCharterDoc.downloadUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-white border border-gray-300 text-gov-charcoal hover:text-burgundy-800 hover:border-burgundy-800 transition-colors shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Download PDF</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsReplacing(true);
                        setUploadError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-burgundy-50 border border-burgundy-200 text-burgundy-800 hover:bg-burgundy-100 transition-colors shadow-2xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Replace PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRemoveCharterDialog(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remove Association</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload / Link Uploader Form */
                <div className="space-y-4">
                  <div className="border border-dashed border-gray-300 rounded-xs p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gov-charcoal flex items-center gap-1.5">
                        <FileUp className="h-4 w-4 text-burgundy-700" />
                        <span>{isReplacing ? "Upload Replacement PDF" : "Upload New Citizen's Charter PDF"}</span>
                      </span>
                      {isReplacing && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsReplacing(false);
                            setSelectedFile(null);
                            setPdfTitle("");
                            setUploadError(null);
                          }}
                          className="text-[11px] font-semibold text-gov-muted hover:text-gov-charcoal flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gov-charcoal mb-1">
                        Select Handbook File <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedFile(file);
                          setUploadError(null);
                        }}
                        disabled={isUploadingPdf}
                        className="w-full text-xs text-gov-charcoal file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xs file:border-0 file:text-[11px] file:font-semibold file:bg-burgundy-50 file:text-burgundy-800 hover:file:bg-burgundy-100 cursor-pointer"
                      />
                      <span className="text-[10px] text-gov-muted mt-1 block">
                        PDF format only. Maximum size: 15 MB. Authentic %PDF- header magic bytes verified.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gov-charcoal mb-1">
                        Document Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        placeholder="e.g. San Felipe Citizen's Charter 2026 Edition"
                        disabled={isUploadingPdf}
                        className="w-full px-3 py-1.5 text-xs text-gov-charcoal bg-white border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-burgundy-700"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleDirectPdfUpload}
                      disabled={!selectedFile || isUploadingPdf}
                      className="w-full text-xs h-9 font-bold justify-center bg-burgundy-800 hover:bg-burgundy-900 text-white"
                    >
                      {isUploadingPdf ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" aria-hidden="true" />
                          <span>Uploading & Publishing PDF...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                          <span>{isReplacing ? "Upload & Replace Official PDF" : "Upload & Associate Official PDF"}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Select Existing Published Charter Document */}
                  {!isReplacing && charterDocuments.length > 0 && (
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      <label
                        htmlFor="charter-doc-select"
                        className="block text-[11px] font-bold text-gov-charcoal"
                      >
                        Or Select Existing Published Charter Document
                      </label>
                      <div className="flex gap-2">
                        <select
                          id="charter-doc-select"
                          value={charterDocumentId}
                          onChange={(e) => setCharterDocumentId(e.target.value)}
                          disabled={isLinkingExisting}
                          className="flex-1 text-xs p-2 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-burgundy-700"
                        >
                          <option value="">-- Choose Existing Document --</option>
                          {charterDocuments.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.title} ({doc.originalFilename})
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!charterDocumentId || isLinkingExisting}
                          onClick={() => handleLinkExistingDocument(charterDocumentId)}
                          className="text-xs h-9 font-semibold text-gov-charcoal border-gray-300 shrink-0"
                        >
                          {isLinkingExisting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span>Link Document</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BRANCH B: BUSINESS PERMITS NEWS-LIKE AUTHORING UX                         */}
          {/* ========================================================================= */}
          {isBusinessPermits && (
            <div className="space-y-6">
              {/* Card 2: Featured Image */}
              <FeaturedImageUploader
                value={featuredImage || {}}
                onChange={(val) => {
                  setFeaturedImage(val);
                  markDirty();
                }}
                onUploadAction={uploadServiceImageAction}
                disabled={isSaving || isPublishing || isUnpublishing}
                label="Business Permits Featured Image (Optional)"
                description="Optional cover image for business licensing guidelines (JPEG, PNG, WebP up to 10 MB)"
              />

              {/* Card 3: Single Rich-Text Body Editor */}
              <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-gov-charcoal">
                    Guidelines & Requirements Body <span className="text-rose-600">*</span>
                  </h2>
                  <p className="text-[11px] text-gov-muted mt-0.5">
                    Author comprehensive business permit guidelines, requirements, steps, and fee schedules in a single rich-text view.
                  </p>
                </div>

                <TiptapEditor
                  value={body}
                  onChange={(html) => {
                    setBody(html);
                    markDirty();
                  }}
                  placeholder="Write detailed guidelines, instructions, or requirements for business permit applications..."
                  className="bg-white min-h-[320px]"
                />
              </div>

              {/* Card 4: Managed Document Attachment (0..1) */}
              <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gov-charcoal flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-burgundy-700" aria-hidden="true" />
                      <span>Official Document Attachment (Optional)</span>
                    </h2>
                    <p className="text-[11px] text-gov-muted mt-0.5">
                      Attach an official downloadable form or public guide (PDF only, max 15 MB).
                    </p>
                  </div>
                  {activeAttachmentDoc && (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Attached
                    </span>
                  )}
                </div>

                {attachmentUploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xs text-[11px] text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                    <span>{attachmentUploadError}</span>
                  </div>
                )}

                {activeAttachmentDoc && !isReplacingAttachment ? (
                  /* Management Card when attachment exists */
                  <div className="bg-slate-50 border border-gray-200 rounded-xs p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-gov-charcoal">
                          {activeAttachmentDoc.title}
                        </h3>
                        <p className="text-[11px] text-gov-muted mt-0.5">
                          {activeAttachmentDoc.originalFilename} • PDF • {formatBytes(activeAttachmentDoc.bytes)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                        {activeAttachmentDoc.purpose === "OTHER_PUBLIC_DOCUMENT" ? "Other Document" : "Downloadable Form"}
                      </span>
                    </div>

                    {/* Actions: View, Download, Replace, Remove */}
                    <div className="pt-2 border-t border-gray-200 flex flex-wrap gap-2">
                      <a
                        href={activeAttachmentDoc.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-white border border-gray-300 text-gov-charcoal hover:text-burgundy-800 hover:border-burgundy-800 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>View PDF</span>
                      </a>

                      {activeAttachmentDoc.downloadUrl && (
                        <a
                          href={activeAttachmentDoc.downloadUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-white border border-gray-300 text-gov-charcoal hover:text-burgundy-800 hover:border-burgundy-800 transition-colors shadow-2xs"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Download PDF</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsReplacingAttachment(true);
                          setAttachmentUploadError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-burgundy-50 border border-burgundy-200 text-burgundy-800 hover:bg-burgundy-100 transition-colors shadow-2xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Replace Document</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRemoveAttachmentDialog(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Remove Attachment</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Uploader / Link Existing Form */
                  <div className="space-y-4">
                    <div className="border border-dashed border-gray-300 rounded-xs p-4 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gov-charcoal flex items-center gap-1.5">
                          <FileUp className="h-4 w-4 text-burgundy-700" />
                          <span>{isReplacingAttachment ? "Replace Attached Document" : "Upload New Attachment (PDF)"}</span>
                        </span>
                        {isReplacingAttachment && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsReplacingAttachment(false);
                              setSelectedAttachmentFile(null);
                              setAttachmentTitle("");
                              setAttachmentUploadError(null);
                            }}
                            className="text-[11px] font-semibold text-gov-muted hover:text-gov-charcoal flex items-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gov-charcoal mb-1">
                          Select Document (PDF only) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSelectedAttachmentFile(file);
                            setAttachmentUploadError(null);
                          }}
                          disabled={isUploadingAttachment}
                          className="w-full text-xs text-gov-charcoal file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xs file:border-0 file:text-[11px] file:font-semibold file:bg-burgundy-50 file:text-burgundy-800 hover:file:bg-burgundy-100 cursor-pointer"
                        />
                        <span className="text-[10px] text-gov-muted mt-1 block">
                          PDF format only. Maximum size: 15 MB. Authentic %PDF- header magic bytes verified.
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gov-charcoal mb-1">
                          Document Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={attachmentTitle}
                          onChange={(e) => setAttachmentTitle(e.target.value)}
                          placeholder="e.g. Unified Business Permit Application Form (Fillable)"
                          disabled={isUploadingAttachment}
                          className="w-full px-3 py-1.5 text-xs text-gov-charcoal bg-white border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-burgundy-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gov-charcoal mb-1">
                          Semantic Document Purpose <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={attachmentPurpose}
                          onChange={(e) =>
                            setAttachmentPurpose(
                              e.target.value as "DOWNLOADABLE_FORM" | "OTHER_PUBLIC_DOCUMENT"
                            )
                          }
                          disabled={isUploadingAttachment}
                          className="w-full px-3 py-1.5 text-xs text-gov-charcoal bg-white border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-burgundy-700 cursor-pointer"
                        >
                          <option value="DOWNLOADABLE_FORM">
                            Downloadable Form (Fillable application, permit template, official form)
                          </option>
                          <option value="OTHER_PUBLIC_DOCUMENT">
                            Other Public Document (Supporting reference, guide, checklist, ordinance)
                          </option>
                        </select>
                      </div>

                      <Button
                        type="button"
                        onClick={handleDirectAttachmentUpload}
                        disabled={!selectedAttachmentFile || isUploadingAttachment}
                        className="w-full text-xs h-9 font-bold justify-center bg-burgundy-800 hover:bg-burgundy-900 text-white"
                      >
                        {isUploadingAttachment ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" aria-hidden="true" />
                            <span>Uploading & Attaching Document...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                            <span>{isReplacingAttachment ? "Upload & Replace Attachment" : "Upload & Attach Document"}</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Select Existing Published Document */}
                    {!isReplacingAttachment && attachmentDocuments.length > 0 && (
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <label
                          htmlFor="existing-doc-select"
                          className="block text-[11px] font-bold text-gov-charcoal"
                        >
                          Or Select Existing Published Document
                        </label>
                        <div className="flex gap-2">
                          <select
                            id="existing-doc-select"
                            value={selectedExistingAttachmentId}
                            onChange={(e) => setSelectedExistingAttachmentId(e.target.value)}
                            disabled={isLinkingExistingAttachment}
                            className="flex-1 text-xs p-2 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-burgundy-700"
                          >
                            <option value="">-- Choose Existing Document --</option>
                            {attachmentDocuments.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.title} ({doc.originalFilename}) • {doc.purpose === "DOWNLOADABLE_FORM" ? "Form" : "Document"}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!selectedExistingAttachmentId || isLinkingExistingAttachment}
                            onClick={handleLinkExistingAttachment}
                            className="text-xs h-9 font-semibold text-gov-charcoal border-gray-300 shrink-0"
                          >
                            {isLinkingExistingAttachment ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <span>Attach Document</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BRANCH C: GENERIC ORDERED CONTENT SECTIONS (For other services)           */}
          {/* ========================================================================= */}
          {!isCitizensCharter && !isBusinessPermits && (
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
          )}
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
                  variant="outline"
                  onClick={() => setShowUnpublishDialog(true)}
                  disabled={isSaving || isPublishing || isUnpublishing}
                  className="w-full text-xs h-9 font-semibold justify-center text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  {isUnpublishing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" aria-hidden="true" />
                      <span>Unpublishing...</span>
                    </>
                  ) : (
                    <span>Unpublish to Draft</span>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Card: Municipal Office Assignment */}
          <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-muted border-b border-gray-100 pb-2">
              Department Assignment
            </h3>

            {isSystemScoped ? (
              <div>
                <label
                  htmlFor="office-select"
                  className="block text-[11px] font-bold text-gov-charcoal mb-1"
                >
                  Assigning Municipal Office
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

      {/* Confirmation Dialog: Remove Charter Document Association */}
      <ConfirmationDialog
        isOpen={showRemoveCharterDialog}
        title="Remove Citizen's Charter Document Association?"
        description="This will disconnect the PDF from the Citizen's Charter public page. The document file itself will NOT be deleted and will remain safely preserved in Document Management."
        confirmLabel="Remove Association"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isRemovingCharter}
        onConfirm={handleRemoveCharterAssociation}
        onCancel={() => setShowRemoveCharterDialog(false)}
      />

      {/* Confirmation Dialog: Remove Attachment Association */}
      <ConfirmationDialog
        isOpen={showRemoveAttachmentDialog}
        title="Remove Service Document Attachment?"
        description="This will disconnect the document from this service page. The document file itself will NOT be deleted and will remain safely preserved in Document Management."
        confirmLabel="Remove Attachment"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isRemovingAttachment}
        onConfirm={handleRemoveAttachmentAssociation}
        onCancel={() => setShowRemoveAttachmentDialog(false)}
      />
    </div>
  );
}
