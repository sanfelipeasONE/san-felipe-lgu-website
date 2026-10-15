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
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import {
  NewsImageUploader,
  type FeaturedImageData,
} from "@/components/admin/news-image-uploader";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  createNewsAction,
  updateNewsAction,
  publishNewsAction,
  archiveNewsAction,
  deleteNewsAction,
} from "@/app/(cms)/admin/news/actions";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";
import {
  NEWS_TYPES,
  NEWS_CATEGORIES,
  type NewsType,
  type NewsDraftInput,
} from "@/lib/validation/news";
import type { SessionUser } from "@/server/auth/session";

export interface OfficeOption {
  id: string;
  name: string;
  shortName: string | null;
}

export interface NewsFormProps {
  user: SessionUser;
  offices?: OfficeOption[]; // Available for selection by system administrators
  initialData?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    type: string;
    category: string;
    status: string;
    officeId: string;
    office?: { name: string; shortName: string | null } | null;
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

export function NewsForm({ user, offices = [], initialData }: NewsFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  // Form State
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.excerpt || "");
  const [body, setBody] = React.useState(initialData?.body || "");
  const [type, setType] = React.useState<NewsType>(
    (initialData?.type as NewsType) || "news"
  );
  const [category, setCategory] = React.useState(
    initialData?.category || NEWS_CATEGORIES[0]
  );
  const [selectedOfficeId, setSelectedOfficeId] = React.useState(
    initialData?.officeId || user.officeId || (offices[0]?.id || "")
  );

  const [imageData, setImageData] = React.useState<FeaturedImageData>({
    publicId: initialData?.featuredImagePublicId || null,
    url: initialData?.featuredImageUrl || null,
    alt: initialData?.featuredImageAlt || "",
    width: initialData?.featuredImageWidth || null,
    height: initialData?.featuredImageHeight || null,
    format: initialData?.featuredImageFormat || null,
    bytes: initialData?.featuredImageBytes || null,
  });

  // Action status states
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = React.useState(false);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Permissions & Capabilities
  const canPublish = user.permissions.includes("posts.publish");
  const canArchive = user.permissions.includes("posts.archive");
  const canDelete =
    user.permissions.includes("posts.delete") &&
    (user.isSystemScope || user.officeId === (initialData?.officeId || user.officeId));

  const buildPayload = (): NewsDraftInput => {
    return {
      title,
      excerpt,
      body,
      type,
      category,
      officeId: user.isSystemScope ? selectedOfficeId : undefined,
      featuredImagePublicId: imageData.publicId,
      featuredImageUrl: imageData.url,
      featuredImageAlt: imageData.alt,
      featuredImageWidth: imageData.width,
      featuredImageHeight: imageData.height,
      featuredImageFormat: imageData.format,
      featuredImageBytes: imageData.bytes,
      expectedUpdatedAt: initialData?.updatedAt,
    };
  };

  const handleSaveDraft = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const payload = buildPayload();

      if (isEditing && initialData?.id) {
        const res = await updateNewsAction(initialData.id, payload);
        if (!res.success) {
          setErrorMessage(res.error || "Failed to update draft.");
        } else {
          setSuccessMessage("Changes saved successfully.");
          router.refresh();
        }
      } else {
        const res = await createNewsAction(payload);
        if (!res.success || !res.data) {
          setErrorMessage(res.error || "Failed to create draft.");
        } else {
          setSuccessMessage("Draft created successfully. Redirecting to editor...");
          router.push(`/admin/news/${res.data.id}/edit`);
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPublishing(true);

    try {
      const payload = buildPayload();

      // First save changes
      let articleId = initialData?.id;
      if (isEditing && articleId) {
        const updateRes = await updateNewsAction(articleId, payload);
        if (!updateRes.success) {
          setErrorMessage(updateRes.error || "Failed to save latest changes before publishing.");
          setIsPublishing(false);
          return;
        }
      } else {
        const createRes = await createNewsAction(payload);
        if (!createRes.success || !createRes.data) {
          setErrorMessage(createRes.error || "Failed to create article for publishing.");
          setIsPublishing(false);
          return;
        }
        articleId = createRes.data.id;
      }

      // Transition to PUBLISHED
      const pubRes = await publishNewsAction(articleId);
      if (!pubRes.success) {
        setErrorMessage(pubRes.error || "Failed to publish article.");
      } else {
        setSuccessMessage("Article published successfully!");
        router.push("/admin/news");
      }
    } catch {
      setErrorMessage("An unexpected error occurred during publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    if (!initialData?.id) return;
    setIsArchiving(true);
    setErrorMessage(null);

    try {
      const res = await archiveNewsAction(initialData.id);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to archive article.");
      } else {
        setShowArchiveDialog(false);
        router.push("/admin/news");
      }
    } catch {
      setErrorMessage("An unexpected error occurred during archiving.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await deleteNewsAction(initialData.id, initialData.updatedAt);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete article.");
        setIsDeleting(false);
      } else {
        router.push("/admin/news");
      }
    } catch {
      setErrorMessage("An unexpected error occurred during article deletion.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/news"
            className="p-1.5 rounded-xs border border-gray-300 text-gov-muted hover:text-gov-charcoal hover:bg-slate-100 transition-colors"
            title="Back to News List"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-gov-charcoal">
              {isEditing ? "Edit Publication" : "Create New Article"}
            </h2>
            <span className="text-xs text-gov-muted">
              {isEditing ? `Slug: ${initialData?.slug}` : "Draft article for municipal publishing"}
            </span>
          </div>
          {initialData?.status && (
            <StatusBadge status={initialData.status} size="sm" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Authenticated Draft Preview */}
          {isEditing && initialData?.id && (
            <Link
              href={`/admin/news/${initialData.id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center transition-colors rounded-xs border border-gray-300 text-gov-charcoal hover:text-burgundy-700 hover:border-burgundy-700 bg-white text-xs font-semibold h-8 px-3 tracking-wide cursor-pointer shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              <span>Preview Draft</span>
            </Link>
          )}

          {/* Save Draft */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing || isArchiving}
            className="text-xs font-semibold border-gray-300"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5 text-gov-muted" />
            )}
            <span>Save Draft</span>
          </Button>

          {/* Publish Directly (Authorized Staff & Admins) */}
          {canPublish && initialData?.status !== "ARCHIVED" && (
            <Button
              type="button"
              size="sm"
              onClick={handlePublish}
              disabled={isSaving || isPublishing || isArchiving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs"
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span>{initialData?.status === "PUBLISHED" ? "Update Published" : "Publish"}</span>
            </Button>
          )}

          {/* Archive Action */}
          {isEditing && canArchive && initialData?.status === "PUBLISHED" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowArchiveDialog(true)}
              disabled={isSaving || isPublishing || isArchiving || isDeleting}
              className="text-xs font-semibold border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <Archive className="h-3.5 w-3.5 mr-1.5" />
              <span>Archive</span>
            </Button>
          )}

          {/* Permanent Delete Action */}
          {isEditing && canDelete && (
            <DestructiveConfirmDialog
              title="Permanently delete this article?"
              description="This action cannot be undone."
              warningText="Any featured photography hosted in cloud storage will also be permanently deleted. This article will be completely removed from the database."
              confirmLabel="Permanently Delete Article"
              isPending={isDeleting}
              onConfirm={handleDelete}
              triggerLabel="Delete"
            />
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xs bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editorial Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Article Title */}
          <div className="space-y-1.5">
            <Label htmlFor="news-title" className="text-xs font-bold text-gov-charcoal">
              Article Title <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="news-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advisory on the Conduct of Road Clearing Operations Along National Highway"
              className="text-sm font-semibold h-10 bg-white"
            />
          </div>

          {/* Excerpt Lead */}
          <div className="space-y-1.5">
            <Label htmlFor="news-excerpt" className="text-xs font-bold text-gov-charcoal">
              Summary / Excerpt Lead <span className="text-rose-600">*</span>
            </Label>
            <textarea
              id="news-excerpt"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Concise 1–2 sentence lead paragraph shown on news cards and preview..."
              className="w-full text-xs sm:text-sm p-3 bg-white border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-burgundy-700 leading-relaxed"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gov-charcoal">
              Full Article Body <span className="text-rose-600">*</span>
            </Label>
            <TiptapEditor value={body} onChange={setBody} />
          </div>
        </div>

        {/* Right Column: Metadata & Media (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publishing Office Context Card */}
          <div className="p-4 rounded-xs border border-gray-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gov-charcoal">
              <Building2 className="h-4 w-4 text-burgundy-700" />
              <span>Publishing Office</span>
            </div>

            {user.isSystemScope ? (
              <div className="space-y-1">
                <Label htmlFor="office-select" className="text-[11px] text-gov-muted">
                  Select Publishing Department
                </Label>
                <select
                  id="office-select"
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-semibold cursor-pointer"
                >
                  {offices.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} {off.shortName ? `(${off.shortName})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gov-muted mt-1">
                  System administrators can assign publishing authority to any department.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xs bg-slate-50 border border-gray-200">
                <span className="block text-xs font-bold text-gov-charcoal">
                  {user.office?.name || "Assigned Office"}
                </span>
                <span className="block text-[11px] text-gov-muted mt-0.5">
                  Automatically assigned from your authenticated credentials.
                </span>
              </div>
            )}
          </div>

          {/* Classification & Category */}
          <div className="p-4 rounded-xs border border-gray-200 bg-white space-y-4">
            <div className="space-y-1">
              <Label htmlFor="news-type" className="text-xs font-bold text-gov-charcoal">
                Publication Type
              </Label>
              <select
                id="news-type"
                value={type}
                onChange={(e) => setType(e.target.value as NewsType)}
                className="w-full text-xs p-2 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-semibold cursor-pointer uppercase"
              >
                {NEWS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "notice" ? "Public Notice" : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="news-category" className="text-xs font-bold text-gov-charcoal">
                Thematic Category
              </Label>
              <select
                id="news-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-gray-300 rounded-xs text-gov-charcoal font-semibold cursor-pointer"
              >
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Image Management */}
          <div className="p-4 rounded-xs border border-gray-200 bg-white">
            <NewsImageUploader value={imageData} onChange={setImageData} />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Archiving */}
      <ConfirmationDialog
        isOpen={showArchiveDialog}
        title="Archive News Article?"
        description="Archiving will immediately remove this article from public search and listings while securely preserving the historical record and assets in the municipal database."
        confirmLabel="Archive Article"
        variant="warning"
        isLoading={isArchiving}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveDialog(false)}
      />
    </div>
  );
}
