"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FeaturedImageData {
  publicId?: string | null;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  bytes?: number | null;
}

export interface FeaturedImageUploaderProps {
  value: FeaturedImageData;
  onChange: (data: FeaturedImageData) => void;
  onUploadAction: (formData: FormData) => Promise<{
    success: boolean;
    data?: {
      publicId: string;
      url: string;
      width: number;
      height: number;
      format: string;
      bytes: number;
    };
    error?: string;
  }>;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function FeaturedImageUploader({
  value,
  onChange,
  onUploadAction,
  disabled = false,
  className,
  label = "Featured Cover Image",
  description = "Optional cover image (JPEG, PNG, WebP up to 10 MB)",
}: FeaturedImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if desired
    e.target.value = "";

    // Client-side quick validation (Server authoritatively re-validates)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WebP image formats are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`
      );
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await onUploadAction(formData);

      if (!res.success || !res.data) {
        setUploadError(res.error || "Upload failed. Please try again.");
      } else {
        onChange({
          publicId: res.data.publicId,
          url: res.data.url,
          alt: value.alt || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          width: res.data.width,
          height: res.data.height,
          format: res.data.format,
          bytes: res.data.bytes,
        });
      }
    } catch {
      setUploadError("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({
      publicId: null,
      url: null,
      alt: "",
      width: null,
      height: null,
      format: null,
      bytes: null,
    });
    setUploadError(null);
  };

  const hasImage = Boolean(value.url);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-semibold text-slate-700">{label}</Label>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
        {hasImage && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Remove Image
          </Button>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {hasImage && value.url ? (
        <div className="space-y-3">
          <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
            <Image
              src={value.url}
              alt={value.alt || "Featured image preview"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>

          <div className="max-w-md space-y-1">
            <Label htmlFor="image-alt" className="text-[11px] font-medium text-slate-600">
              Image Alt / Description (Accessibility)
            </Label>
            <Input
              id="image-alt"
              type="text"
              value={value.alt || ""}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Describe the image content for screen readers..."
              disabled={disabled}
              className="text-xs h-8"
            />
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer max-w-md",
            disabled || isUploading
              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
              : "border-slate-300 hover:border-burgundy-600/50 hover:bg-slate-50/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-burgundy-700" />
              <p className="text-xs text-slate-600 font-medium">Uploading to official media storage...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="p-2.5 rounded-full bg-burgundy-50 text-burgundy-700 mb-1">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Click to upload cover image
              </p>
              <p className="text-[11px] text-slate-500">
                PNG, JPG, or WebP (max 10 MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
