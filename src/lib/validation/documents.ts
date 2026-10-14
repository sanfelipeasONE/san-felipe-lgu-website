import { z } from "zod";

export const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx"] as const;
export type AllowedDocumentExtension = (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream", // Fallback MIME frequently assigned to office documents
] as const;

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export const DOCUMENT_CATEGORIES = [
  "Business & Licensing",
  "Civil Registry",
  "Building & Engineering",
  "Taxation & Revenue",
  "Social Services",
  "General Administration",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/**
 * Extracts and sanitizes the file extension.
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase().trim();
}

/**
 * Sanitizes a user-supplied original filename for safe storage and display.
 * Strips path traversal characters and non-printable bytes.
 */
export function sanitizeFilename(filename: string): string {
  // Strip path traversal and path delimiters
  const base = filename.replace(/^.*[\\/]/, "");
  // Replace control characters, null bytes, and potentially dangerous shell characters
  const clean = base
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[<>:"/\\|?*#%]/g, "_")
    .trim();

  return clean.length > 0 ? clean : "document";
}

/**
 * Validates the internal byte signatures (magic bytes) and container structures
 * to prevent MIME/extension spoofing attacks.
 */
export function validateDocumentContent(
  buffer: Buffer | Uint8Array,
  extension: AllowedDocumentExtension
): { valid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "The uploaded file is empty." };
  }

  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // 1. Universal Executable & Script Magic Bytes Rejection
  // DOS / Windows PE executable: 'MZ' (0x4D, 0x5A)
  if (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) {
    return { valid: false, error: "Security violation: Executable binary (MZ header) detected." };
  }
  // Linux ELF executable: 0x7F, 'E', 'L', 'F'
  if (buf.length >= 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
    return { valid: false, error: "Security violation: Executable ELF binary detected." };
  }
  // Shell script shebang: '#!' (0x23, 0x21)
  if (buf.length >= 2 && buf[0] === 0x23 && buf[1] === 0x21) {
    return { valid: false, error: "Security violation: Shell script detected." };
  }

  // 2. Format-Specific Signature Validation
  switch (extension) {
    case "pdf": {
      // PDF specification requires %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D) within first 1024 bytes
      const headerSnippet = buf.subarray(0, 1024).toString("latin1");
      if (!headerSnippet.includes("%PDF-")) {
        return {
          valid: false,
          error: "Invalid PDF file: Missing authentic %PDF- header signature.",
        };
      }
      return { valid: true };
    }

    case "doc":
    case "xls": {
      // Legacy Microsoft Office OLE Compound File (CFBF) magic bytes:
      // 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1
      if (
        buf.length < 8 ||
        buf[0] !== 0xd0 ||
        buf[1] !== 0xcf ||
        buf[2] !== 0x11 ||
        buf[3] !== 0xe0 ||
        buf[4] !== 0xa1 ||
        buf[5] !== 0xb1 ||
        buf[6] !== 0x1a ||
        buf[7] !== 0xe1
      ) {
        return {
          valid: false,
          error: `Invalid legacy Office document: Missing authentic OLE Compound File signature for .${extension}.`,
        };
      }
      return { valid: true };
    }

    case "docx": {
      // Office OpenXML is a ZIP-based container starting with PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
      if (
        buf.length < 4 ||
        buf[0] !== 0x50 ||
        buf[1] !== 0x4b ||
        buf[2] !== 0x03 ||
        buf[3] !== 0x04
      ) {
        return {
          valid: false,
          error: "Invalid DOCX file: Missing authentic ZIP container header.",
        };
      }

      // Word OpenXML must contain '[Content_Types].xml' and 'word/' structure
      const bufferLatin = buf.toString("latin1");
      if (!bufferLatin.includes("[Content_Types].xml") || !bufferLatin.includes("word/")) {
        return {
          valid: false,
          error: "Invalid DOCX file: Container lacks required Word OpenXML directory structure.",
        };
      }
      return { valid: true };
    }

    case "xlsx": {
      // Office OpenXML is a ZIP-based container starting with PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
      if (
        buf.length < 4 ||
        buf[0] !== 0x50 ||
        buf[1] !== 0x4b ||
        buf[2] !== 0x03 ||
        buf[3] !== 0x04
      ) {
        return {
          valid: false,
          error: "Invalid XLSX file: Missing authentic ZIP container header.",
        };
      }

      // Excel OpenXML must contain '[Content_Types].xml' and 'xl/' structure
      const bufferLatin = buf.toString("latin1");
      if (!bufferLatin.includes("[Content_Types].xml") || !bufferLatin.includes("xl/")) {
        return {
          valid: false,
          error: "Invalid XLSX file: Container lacks required Excel OpenXML directory structure.",
        };
      }
      return { valid: true };
    }

    default:
      return { valid: false, error: `Unsupported file extension .${extension}` };
  }
}

/**
 * Validates uploaded document file constraints: extension, MIME, size, and content signatures.
 */
export function validateDocumentFile(file: {
  name?: string;
  filename?: string;
  size?: number;
  type?: string;
  mimeType?: string;
  buffer?: Buffer | Uint8Array;
}): { valid: boolean; error?: string; extension?: AllowedDocumentExtension } {
  const filename = file.name || file.filename || "";
  const size = file.size ?? (file.buffer ? file.buffer.length : 0);
  const mime = file.type || file.mimeType || "";

  if (!filename) {
    return { valid: false, error: "A document file must be selected." };
  }

  const ext = getFileExtension(filename);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as AllowedDocumentExtension)) {
    return {
      valid: false,
      error: `Unsupported file extension (.${ext}). Only PDF, DOC, DOCX, XLS, and XLSX files are accepted.`,
    };
  }

  // Check prohibited executable/dangerous extensions explicitly
  const dangerousExtensions = ["exe", "msi", "bat", "cmd", "sh", "js", "html", "svg", "zip", "tar", "gz"];
  if (dangerousExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Security violation: .${ext} files are strictly prohibited.`,
    };
  }

  if (size <= 0) {
    return { valid: false, error: "The uploaded file is empty." };
  }

  if (size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 15 MB limit (received ${(size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  // Validate MIME if provided and not generic octet-stream
  if (mime && mime !== "application/octet-stream") {
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(mime as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
      return {
        valid: false,
        error: `Invalid file MIME type (${mime}). Expected an official document format.`,
      };
    }
  }

  // Validate internal content bytes if buffer is provided
  if (file.buffer) {
    const contentResult = validateDocumentContent(file.buffer, ext as AllowedDocumentExtension);
    if (!contentResult.valid) {
      return { valid: false, error: contentResult.error };
    }
  }

  return { valid: true, extension: ext as AllowedDocumentExtension };
}

/**
 * Zod schema for document metadata creation and updates.
 */
export const documentInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Document title must be at least 3 characters.")
    .max(200, "Document title cannot exceed 200 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .nullable()
    .optional(),
  category: z
    .string()
    .trim()
    .max(100, "Category cannot exceed 100 characters.")
    .nullable()
    .optional(),
  officeId: z
    .string()
    .trim()
    .min(1, "An owning municipal office is required.")
    .optional(),
  expectedUpdatedAt: z.string().optional(),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;

/**
 * Helper to format byte counts into human-readable strings (e.g. 1.2 MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
