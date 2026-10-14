import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { sanitizeFilename, type AllowedDocumentExtension } from "@/lib/validation/documents";

// Configure Cloudinary with server-side environment variables.
// The API secret is strictly confined to server-side code execution.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadedDocumentResult {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
}

/**
 * Uploads a raw document buffer to Cloudinary under the official municipal document hierarchy.
 * Folder structure: san-felipe-lgu/documents/<year>
 * Uses resource_type: "raw" for PDF, DOC, DOCX, XLS, XLSX.
 */
export async function uploadDocumentFile(
  buffer: Buffer,
  options: {
    filename: string;
    format: AllowedDocumentExtension;
    year?: string | number;
  }
): Promise<UploadedDocumentResult> {
  const year = options.year || new Date().getFullYear();
  const folder = `san-felipe-lgu/documents/${year}`;
  const cleanBase = sanitizeFilename(options.filename).replace(/\.[^/.]+$/, "");
  // Include unique timestamp/random suffix and extension in public_id for raw assets
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const publicId = `${folder}/${cleanBase}-${uniqueId}.${options.format}`;

  return new Promise<UploadedDocumentResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "raw",
        invalidate: true,
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("[CLOUDINARY-DOCUMENTS] Upload error:", error?.message || "Unknown error");
          return reject(new Error("Failed to upload document file to cloud storage."));
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          format: options.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Safely deletes a raw document asset from Cloudinary by its public ID.
 * Wrapped in best-effort safety so deletions do not crash the caller.
 */
export async function deleteCloudinaryDocument(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true,
    });
    return res.result === "ok";
  } catch (err) {
    console.error("[CLOUDINARY-DOCUMENTS] Asset deletion warning for publicId:", publicId, err);
    return false;
  }
}

/**
 * Generates an official download URL for a raw document asset.
 * Uses Cloudinary's fl_attachment flag with the sanitized base filename (without extension).
 * Cloudinary automatically appends the asset extension and serves:
 * Content-Disposition: attachment; filename="<base>.<ext>"
 */
export function getDocumentDownloadUrl(publicId: string, originalFilename?: string): string {
  if (!publicId) return "";

  let attachmentFlag = "attachment";
  if (originalFilename) {
    const cleanBase = sanitizeFilename(originalFilename)
      .replace(/\.[^/.]+$/, "")
      .replace(/[^\w-]/g, "_")
      .trim();
    if (cleanBase) {
      attachmentFlag = `attachment:${cleanBase}`;
    }
  }

  return cloudinary.url(publicId, {
    resource_type: "raw",
    secure: true,
    flags: attachmentFlag,
  });
}
