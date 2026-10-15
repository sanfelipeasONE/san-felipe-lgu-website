"use client";

import * as React from "react";
import { uploadNewsImageAction } from "@/app/(cms)/admin/news/actions";
import {
  FeaturedImageUploader,
  type FeaturedImageData,
} from "@/components/admin/featured-image-uploader";

export type { FeaturedImageData };

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
  return (
    <FeaturedImageUploader
      value={value}
      onChange={onChange}
      onUploadAction={uploadNewsImageAction}
      disabled={disabled}
      className={className}
      label="Article Cover Image"
      description="Optional featured image for public announcements (JPEG, PNG, WebP up to 10 MB)"
    />
  );
}
