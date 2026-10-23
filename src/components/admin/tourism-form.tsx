"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Send,
  Eye,
  Archive,
  ArrowLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import {
  FeaturedImageUploader,
  type FeaturedImageData,
} from "@/components/admin/featured-image-uploader";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  createTourismAction,
  updateTourismAction,
  publishTourismAction,
  archiveTourismAction,
  deleteTourismAction,
  uploadTourismImageAction,
} from "@/app/(cms)/admin/tourism/actions";
import { ConcurrencyConflictBanner } from "@/components/admin/concurrency-conflict-banner";
import { toast } from "@/components/ui/toast";
import {
  TOURISM_CATEGORIES,
  TOURISM_CATEGORY_LABELS,
  TOURISM_CATEGORY_ROUTES,
  validateTourismForPublish,
  type TourismDraftInput,
} from "@/lib/validation/tourism";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";
import type { SessionUser } from "@/server/auth/session";
import type { TourismCategory } from "@prisma/client";

export interface TourismFormProps {
  user: SessionUser;
  initialCategory?: TourismCategory;
  initialData?: {
    id: string;
    slug: string;
    category: TourismCategory;
    title: string;
    summary: string;
    body: string;
    location?: string | null;
    mapUrl?: string | null;
    contactNumber?: string | null;
    email?: string | null;
    websiteUrl?: string | null;
    operatingHours?: string | null;
    status: string;
    featuredImagePublicId?: string | null;
    featuredImageUrl?: string | null;
    featuredImageAlt?: string | null;
    featuredImageWidth?: number | null;
    featuredImageHeight?: number | null;
    featuredImageFormat?: string | null;
    featuredImageBytes?: number | null;
    updatedAt: string;
  };
}

export function TourismForm({
  user,
  initialCategory = "ATTRACTIONS",
  initialData,
}: TourismFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  // Form State
  const canPublish = hasPermission(user, PERMISSIONS.TOURISM_PUBLISH);
  const canArchive = hasPermission(user, PERMISSIONS.TOURISM_ARCHIVE);
  const canDelete = hasPermission(user, PERMISSIONS.TOURISM_DELETE);

  const [category, setCategory] = React.useState<TourismCategory>(
    initialData?.category || initialCategory
  );
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [summary, setSummary] = React.useState(initialData?.summary || "");
  const [body, setBody] = React.useState(initialData?.body || "");

  // Optional visitor and establishment details
  const [location, setLocation] = React.useState(initialData?.location || "");
  const [mapUrl, setMapUrl] = React.useState(initialData?.mapUrl || "");
  const [contactNumber, setContactNumber] = React.useState(initialData?.contactNumber || "");
  const [email, setEmail] = React.useState(initialData?.email || "");
  const [websiteUrl, setWebsiteUrl] = React.useState(initialData?.websiteUrl || "");
  const [operatingHours, setOperatingHours] = React.useState(initialData?.operatingHours || "");

  const [imageData, setImageData] = React.useState<FeaturedImageData>({
    publicId: initialData?.featuredImagePublicId || null,
    url: initialData?.featuredImageUrl || null,
    alt: initialData?.featuredImageAlt || "",
    width: initialData?.featuredImageWidth || null,
    height: initialData?.featuredImageHeight || null,
    format: initialData?.featuredImageFormat || null,
    bytes: initialData?.featuredImageBytes || null,
  });

  // UI / Action state
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showPublishDialog, setShowPublishDialog] = React.useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [concurrencyConflict, setConcurrencyConflict] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const validateDraft = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters long.";
    }

    if (!summary.trim() || summary.trim().length < 10) {
      errors.summary = "Summary must be at least 10 characters long.";
    }

    if (!body || body.length < 10) {
      errors.body = "Rich content must be at least 10 characters long.";
    }

    if (mapUrl.trim() && !/^https?:\/\//i.test(mapUrl.trim())) {
      errors.mapUrl = "Map link must start with http:// or https://";
    }

    if (websiteUrl.trim() && !/^https?:\/\//i.test(websiteUrl.trim())) {
      errors.websiteUrl = "Website / Link must start with http:// or https://";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPayload = (): TourismDraftInput => ({
    category,
    title: title.trim(),
    summary: summary.trim(),
    body,
    location: location.trim() || null,
    mapUrl: mapUrl.trim() || null,
    contactNumber: contactNumber.trim() || null,
    email: email.trim() || null,
    websiteUrl: websiteUrl.trim() || null,
    operatingHours: operatingHours.trim() || null,
    featuredImagePublicId: imageData.publicId || null,
    featuredImageUrl: imageData.url || null,
    featuredImageAlt: imageData.alt?.trim() || null,
    featuredImageWidth: imageData.width || null,
    featuredImageHeight: imageData.height || null,
    featuredImageFormat: imageData.format || null,
    featuredImageBytes: imageData.bytes || null,
    expectedUpdatedAt: initialData?.updatedAt,
  });

  const handleSaveDraft = async () => {
    if (!validateDraft()) {
      toast.error("Please resolve validation errors before saving.");
      return;
    }

    setIsSaving(true);
    setConcurrencyConflict(false);

    try {
      const payload = getPayload();
      if (isEditing && initialData) {
        const res = await updateTourismAction(initialData.id, payload);
        if (!res.success) {
          if (res.error?.includes("modified by another user")) {
            setConcurrencyConflict(true);
          }
          toast.error(res.error || "Failed to update tourism entry.");
        } else {
          toast.success("Tourism entry updated successfully.");
          router.refresh();
        }
      } else {
        const res = await createTourismAction(payload);
        if (!res.success) {
          toast.error(res.error || "Failed to create tourism draft.");
        } else {
          toast.success("Tourism draft created successfully.");
          router.push(`/admin/tourism/${res.data?.id}/edit`);
        }
      }
    } catch {
      toast.error("An unexpected network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishConfirm = async () => {
    if (!initialData) return;

    // Check publish requirements
    const publishCheck = validateTourismForPublish({
      category,
      title,
      summary,
      body,
      featuredImagePublicId: imageData.publicId,
      featuredImageAlt: imageData.alt,
    });

    if (!publishCheck.valid) {
      toast.error(publishCheck.errors.join(" "));
      setShowPublishDialog(false);
      return;
    }

    setIsPublishing(true);
    setConcurrencyConflict(false);

    try {
      // First save current edits
      const saveRes = await updateTourismAction(initialData.id, getPayload());
      if (!saveRes.success) {
        if (saveRes.error?.includes("modified by another user")) {
          setConcurrencyConflict(true);
        }
        toast.error(saveRes.error || "Failed to save latest changes before publishing.");
        setShowPublishDialog(false);
        setIsPublishing(false);
        return;
      }

      // Then publish
      const res = await publishTourismAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        if (res.error?.includes("modified by another user")) {
          setConcurrencyConflict(true);
        }
        toast.error(res.error || "Failed to publish tourism entry.");
      } else {
        toast.success("Tourism entry is now published to the public portal.");
        setShowPublishDialog(false);
        router.refresh();
      }
    } catch {
      toast.error("Failed to publish tourism entry.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!initialData) return;
    setIsArchiving(true);
    setConcurrencyConflict(false);

    try {
      const res = await archiveTourismAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        if (res.error?.includes("modified by another user")) {
          setConcurrencyConflict(true);
        }
        toast.error(res.error || "Failed to archive tourism entry.");
      } else {
        toast.success("Tourism entry archived and unlisted from the public portal.");
        setShowArchiveDialog(false);
        router.refresh();
      }
    } catch {
      toast.error("Failed to archive tourism entry.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!initialData) return;
    setIsDeleting(true);

    try {
      const res = await deleteTourismAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        toast.error(res.error || "Failed to delete tourism entry.");
        setIsDeleting(false);
      } else {
        toast.success("Tourism entry permanently deleted.");
        router.push("/admin/tourism");
      }
    } catch {
      toast.error("Failed to delete tourism entry.");
      setIsDeleting(false);
    }
  };

  const publicUrl = initialData?.status === "PUBLISHED"
    ? `${TOURISM_CATEGORY_ROUTES[category]}/${initialData.slug}`
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tourism"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-charcoal transition-colors py-1 px-2 rounded-xs hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Tourism</span>
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-gov-charcoal">
            {isEditing ? "Edit Tourism Entry" : "New Tourism Entry"}
          </h1>
        </div>

        {/* Status Indicator & Preview Link */}
        <div className="flex items-center gap-3">
          {initialData?.status && (
            <StatusBadge status={initialData.status} />
          )}

          {publicUrl && (
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy-700 hover:text-burgundy-900 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Public Page</span>
            </Link>
          )}
        </div>
      </div>

      {/* Concurrency Banner */}
      {concurrencyConflict && (
        <ConcurrencyConflictBanner onReload={() => router.refresh()} />
      )}

      {/* Main Form Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Primary Content (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Category Selector */}
          <div className="space-y-1.5 bg-white p-4 border border-gray-200 rounded-xs shadow-2xs">
            <Label htmlFor="category" className="text-xs font-bold text-gov-charcoal">
              Tourism Category <span className="text-red-500">*</span>
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TourismCategory)}
              className="w-full text-xs font-medium border border-gray-300 rounded-xs px-3 py-2 bg-white text-gov-charcoal focus:outline-none focus:ring-1 focus:ring-burgundy-700"
            >
              {TOURISM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {TOURISM_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5 bg-white p-4 border border-gray-200 rounded-xs shadow-2xs">
            <Label htmlFor="title" className="text-xs font-bold text-gov-charcoal">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formErrors.title) {
                  setFormErrors((prev) => ({ ...prev, title: "" }));
                }
              }}
              placeholder="e.g. Liwliwa Beach, Century-Old Mango Trees, Pawikan Sanctuary"
              maxLength={200}
              className="text-sm font-semibold"
            />
            {formErrors.title && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {formErrors.title}
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              {title.length}/200 characters
            </p>
          </div>

          {/* Summary / Excerpt */}
          <div className="space-y-1.5 bg-white p-4 border border-gray-200 rounded-xs shadow-2xs">
            <Label htmlFor="summary" className="text-xs font-bold text-gov-charcoal">
              Summary / Short Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="summary"
              rows={3}
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (formErrors.summary) {
                  setFormErrors((prev) => ({ ...prev, summary: "" }));
                }
              }}
              placeholder="Brief 1-3 sentence summary that appears on listing cards and search previews..."
              maxLength={500}
              className="w-full text-xs font-normal border border-gray-300 rounded-xs p-2.5 text-gov-charcoal focus:outline-none focus:ring-1 focus:ring-burgundy-700 leading-relaxed"
            />
            {formErrors.summary && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {formErrors.summary}
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              {summary.length}/500 characters
            </p>
          </div>

          {/* Rich Body Content */}
          <div className="space-y-1.5 bg-white p-4 border border-gray-200 rounded-xs shadow-2xs">
            <Label className="text-xs font-bold text-gov-charcoal">
              Detailed Content & Guidelines <span className="text-red-500">*</span>
            </Label>
            <TiptapEditor
              value={body}
              onChange={(val) => {
                setBody(val);
                if (formErrors.body) {
                  setFormErrors((prev) => ({ ...prev, body: "" }));
                }
              }}
              placeholder="Detailed description, historical background, visitor guidelines, safety reminders..."
            />
            {formErrors.body && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {formErrors.body}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Optional Details (1 col) */}
        <div className="space-y-5">
          {/* Action Card */}
          <div className="bg-white p-4 border border-gray-200 rounded-xs shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-gray-100">
              Publishing Actions
            </h2>

            <div className="space-y-2">
              {/* Save Draft / Update Button */}
              <Button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || isPublishing || isArchiving || isDeleting}
                className="w-full justify-center bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isEditing ? "Save Changes" : "Save as Draft"}
              </Button>

              {/* Publish Button */}
              {isEditing && canPublish && (
                <Button
                  type="button"
                  onClick={() => setShowPublishDialog(true)}
                  disabled={isSaving || isPublishing || isArchiving || isDeleting}
                  className="w-full justify-center bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs font-semibold py-2"
                >
                  {isPublishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {initialData?.status === "PUBLISHED" ? "Republish" : "Publish to Portal"}
                </Button>
              )}

              {/* Archive Button */}
              {isEditing && canArchive && initialData?.status === "PUBLISHED" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={isSaving || isPublishing || isArchiving || isDeleting}
                  className="w-full justify-center text-xs font-medium text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  {isArchiving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Archive Entry
                </Button>
              )}

              {/* Permanent Delete Button */}
              {isEditing && canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSaving || isPublishing || isArchiving || isDeleting}
                  className="w-full justify-center text-xs font-medium text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete Entry
                </Button>
              )}
            </div>
          </div>

          {/* Featured Image Uploader */}
          <div className="bg-white p-4 border border-gray-200 rounded-xs shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-gray-100">
              Featured Photograph
            </h2>
            <FeaturedImageUploader
              value={imageData}
              onChange={setImageData}
              onUploadAction={uploadTourismImageAction}
              disabled={isSaving || isPublishing}
              label="Tourism Cover Image"
              description="Official photograph or visual highlight (JPEG, PNG, WebP up to 10 MB)"
            />
          </div>

          {/* Optional Visitor & Establishment Details */}
          <div className="bg-white p-4 border border-gray-200 rounded-xs shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-gray-100">
              Visitor Information (Optional)
            </h2>

            {/* Location / Address */}
            <div className="space-y-1">
              <Label htmlFor="location" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-burgundy-700" />
                Location / Address
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sitio Liwliwa, Brgy. Sto. Niño"
                className="text-xs"
              />
            </div>

            {/* Map URL */}
            <div className="space-y-1">
              <Label htmlFor="mapUrl" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Globe className="w-3 h-3 text-burgundy-700" />
                Map Link (Google Maps / OSM)
              </Label>
              <Input
                id="mapUrl"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="text-xs"
              />
              {formErrors.mapUrl && (
                <p className="text-[11px] text-red-600">{formErrors.mapUrl}</p>
              )}
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <Label htmlFor="contactNumber" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-burgundy-700" />
                Contact Number
              </Label>
              <Input
                id="contactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 0917-123-4567"
                className="text-xs"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-burgundy-700" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. info@sanfeliperesort.ph"
                className="text-xs"
              />
              {formErrors.email && (
                <p className="text-[11px] text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Website / Link */}
            <div className="space-y-1">
              <Label htmlFor="websiteUrl" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Globe className="w-3 h-3 text-burgundy-700" />
                Website / Link
              </Label>
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="text-xs"
              />
              {formErrors.websiteUrl && (
                <p className="text-[11px] text-red-600">{formErrors.websiteUrl}</p>
              )}
            </div>

            {/* Operating Hours */}
            <div className="space-y-1">
              <Label htmlFor="operatingHours" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-burgundy-700" />
                Operating Hours
              </Label>
              <Input
                id="operatingHours"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="e.g. Monday - Sunday: 8:00 AM - 5:00 PM"
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showPublishDialog}
        onCancel={() => setShowPublishDialog(false)}
        title="Publish Tourism Entry"
        description="Are you sure you want to publish this tourism entry? It will become publicly visible immediately on the official municipal portal."
        confirmLabel="Publish Entry"
        variant="default"
        isLoading={isPublishing}
        onConfirm={handlePublishConfirm}
      />

      <ConfirmationDialog
        isOpen={showArchiveDialog}
        onCancel={() => setShowArchiveDialog(false)}
        title="Archive Tourism Entry"
        description="Are you sure you want to archive this entry? It will be removed from public listings immediately, but historical data and photographs will remain preserved in the CMS."
        confirmLabel="Archive Entry"
        variant="warning"
        isLoading={isArchiving}
        onConfirm={handleArchiveConfirm}
      />

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete Tourism Entry"
        description="Are you sure you want to permanently delete this tourism entry? This action cannot be undone and any uploaded photograph will be permanently deleted from Cloudinary storage."
        confirmLabel="Permanently Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
