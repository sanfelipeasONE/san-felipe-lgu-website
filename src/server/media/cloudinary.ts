import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

// Configure Cloudinary with server-side environment variables.
// The API secret is strictly confined to server-side code execution.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadedImageResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Validates image buffer metadata and MIME type.
 */
export function validateImageFile(file: {
  filename?: string;
  size?: number;
  sizeBytes?: number;
  type?: string;
  mimeType?: string;
}): { valid: boolean; error?: string } {
  const fileType = file.type || file.mimeType || "";
  const fileSize = file.size ?? file.sizeBytes ?? 0;

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(fileType as AllowedImageMimeType)) {
    return {
      valid: false,
      error: `Unsupported image format (${fileType}). Only JPEG, PNG, and WebP are accepted.`,
    };
  }

  if (fileSize > MAX_IMAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB maximum limit (received ${(fileSize / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return { valid: true };
}

export { validateImageFile as validateNewsImageUpload };

/**
 * Generates server-authorized upload parameters and signature for Cloudinary.
 * CRITICAL: The API secret is strictly used server-side to sign the request parameters
 * and is never returned in the payload.
 */
export function generateCloudinaryUploadSignature(options?: {
  folder?: string;
  timestamp?: number;
}): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  const timestamp = options?.timestamp || Math.round(new Date().getTime() / 1000);
  const folder = options?.folder || `san-felipe-lgu/news/${new Date().getFullYear()}`;

  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET || "san_felipe_dev_secret"
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY || "san_felipe_dev_key",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "san_felipe_dev_cloud",
    folder,
  };
}



/**
 * Uploads an image buffer to Cloudinary under the official municipal asset hierarchy.
 * Asset path: san-felipe-lgu/news/<year>/...
 */
export async function uploadNewsFeaturedImage(
  buffer: Buffer,
  options?: {
    year?: string | number;
    filename?: string;
  }
): Promise<UploadedImageResult> {
  const year = options?.year || new Date().getFullYear();
  const folder = `san-felipe-lgu/news/${year}`;

  return new Promise<UploadedImageResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("[CLOUDINARY] Upload error:", error?.message || "Unknown error");
          return reject(new Error("Failed to upload image to Cloudinary storage."));
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an existing image asset from Cloudinary by its public ID.
 * Wrapped in best-effort safety so deletions do not throw unhandled exceptions.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
    return res.result === "ok";
  } catch (err) {
    console.error("[CLOUDINARY] Asset deletion warning for publicId:", publicId, err);
    return false;
  }
}

/**
 * Generates an optimized, responsive delivery URL with on-the-fly Cloudinary transformations.
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "limit" | "thumb";
  }
): string {
  return cloudinary.url(publicId, {
    secure: true,
    quality: "auto",
    fetch_format: "auto",
    width: options?.width,
    height: options?.height,
    crop: options?.crop || "fill",
  });
}
