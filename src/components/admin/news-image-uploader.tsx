"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadNewsImageAction } from "@/app/(cms)/admin/news/actions";
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

export interface NewsImageUploaderProps {
  value: FeaturedImageData;
  onChange: (data: FeaturedImageData) => void;
  disabled?: boolean;
  className?: string;
}

export function NewsImageUploader({
  value,
  onChange,
  disabled = false,
  className,
}: NewsImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if desired
    e.target.value = "";

    // Client-side quick validation (Server will authoritatively re-validate)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WebP image formats are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadNewsImageAction(formData);

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
      <Label className="text-xs font-bold text-gov-charcoal">
        Featured Article Image
      </Label>

      {hasImage && value.url ? (
        <div className="space-y-3">
          {/* Image Preview Card */}
          <div className="relative rounded-xs border border-gray-200 overflow-hidden bg-slate-900 aspect-16/9 w-full max-w-lg shadow-2xs">
            <Image
              src={value.url}
              alt={value.alt || "Featured article image preview"}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover object-center"
            />
            {/* Top Bar Actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || disabled}
                className="h-7 text-[11px] bg-white/90 backdrop-blur-2xs border-gray-300 text-gov-charcoal hover:bg-white"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading || disabled}
                className="h-7 text-[11px] bg-white/90 backdrop-blur-2xs border-gray-300 text-rose-700 hover:text-rose-800 hover:bg-rose-50"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Bottom Metadata Pill */}
            {value.format && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono backdrop-blur-2xs">
                {value.format.toUpperCase()} {value.width ? `• ${value.width}×${value.height}` : ""}
              </div>
            )}
          </div>

          {/* Alt Text Input (Strictly required before publishing!) */}
          <div className="max-w-lg space-y-1">
            <Label htmlFor="featured-image-alt" className="text-[11px] font-semibold text-gov-charcoal">
              Image Alt Text <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="featured-image-alt"
              value={value.alt || ""}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Describe what is visible in the photo for accessibility..."
              disabled={disabled}
              className="h-8 text-xs bg-white"
            />
            <p className="text-[10px] text-gov-muted">
              Required for public publication and screen-reader accessibility.
            </p>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
          className={cn(
            "max-w-lg border-2 border-dashed border-gray-300 rounded-xs p-6 text-center cursor-pointer hover:border-burgundy-700/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center",
            disabled && "opacity-50 cursor-not-allowed",
            isUploading && "pointer-events-none"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gov-muted shadow-2xs mb-2.5">
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-burgundy-700" />
            ) : (
              <Upload className="h-5 w-5 text-burgundy-700" />
            )}
          </div>

          <span className="text-xs font-bold text-gov-charcoal">
            {isUploading ? "Uploading to Cloudinary..." : "Click or drag to upload featured photo"}
          </span>

          <p className="text-[11px] text-gov-muted mt-1 leading-snug">
            Supported formats: JPEG, PNG, WebP (Max: 10 MB).
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="max-w-lg p-2.5 rounded-xs bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
