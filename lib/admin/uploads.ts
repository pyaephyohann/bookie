/**
 * Admin image uploads (A3). SERVER-ONLY.
 *
 * CLOUDINARY STORAGE: files are uploaded to Cloudinary and the database
 * stores a Cloudinary URL. This replaces the previous local filesystem
 * strategy that wrote to public/uploads/.
 *
 * Legacy behavior:
 * - Local URLs (/uploads/...) are still recognized for existing data
 * - Cloudinary URLs (https://res.cloudinary.com/...) are the new standard
 */

import {
  uploadFile,
  deleteAsset,
  isCloudinaryUrl,
  type UploadFolder,
  type CloudinaryResult,
} from "@/lib/cloudinary";
import { isAllowedCoverSize, isAllowedCoverType } from "@/lib/admin/catalog";

export type { UploadFolder };

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate and persist an uploaded image to Cloudinary.
 * Returns the Cloudinary URL on success.
 */
export async function saveImageUpload(
  file: File,
  bucket: UploadFolder,
): Promise<CloudinaryResult> {
  // Client-side MIME validation (server re-validates via magic bytes)
  if (!isAllowedCoverType(file.type)) {
    return { ok: false, message: "Image must be a JPEG, PNG or WEBP file." };
  }

  if (!isAllowedCoverSize(file.size)) {
    return { ok: false, message: "Image must be 2 MB or smaller." };
  }

  // Upload to Cloudinary
  const result = await uploadFile(file, bucket, {
    // Optional: add transformation for image optimization
    // transformation: [{ width: 800, height: 800, crop: "limit" }],
  });

  return result;
}

/**
 * Delete a previously uploaded image.
 * Handles both Cloudinary URLs and legacy local URLs.
 * Best-effort: never throws.
 */
export async function removeUploadedImage(url: string | null): Promise<void> {
  if (!url) return;

  if (isCloudinaryUrl(url)) {
    await deleteAsset(url);
  }
  // Legacy local URLs: no action needed (files in public/uploads/ remain)
  // They will be cleaned up manually or via a future migration script
}

// ── URL Helpers ────────────────────────────────────────────────────────────

/**
 * A manual image URL must be a local asset, a Cloudinary URL, or an https link.
 */
export function isAllowedImageUrl(value: string): boolean {
  return (
    value.startsWith("/") ||
    isCloudinaryUrl(value) ||
    /^https:\/\/\S+$/.test(value)
  );
}

/**
 * Resolve an image field value from form data.
 * Supports keep/replace/remove actions with Cloudinary uploads.
 */
export async function resolveImageField(
  formData: FormData,
  existing: string | null,
  bucket: UploadFolder,
): Promise<{ ok: true; value: string | null } | { ok: false; message: string }> {
  const actionValue = formData.get("imageAction");
  const action = typeof actionValue === "string" ? actionValue : "keep";

  if (action === "remove") {
    await removeUploadedImage(existing);
    return { ok: true, value: null };
  }

  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImageUpload(file, bucket);
    if (!saved.ok) return { ok: false, message: saved.message };

    // Delete old image after successful upload
    await removeUploadedImage(existing);

    return { ok: true, value: saved.url };
  }

  const manualValue = formData.get("imageUrl");
  const manual = typeof manualValue === "string" ? manualValue.trim() : "";
  if (manual && manual !== existing) {
    if (!isAllowedImageUrl(manual)) {
      return {
        ok: false,
        message:
          "Image URL must be a root-relative path, Cloudinary URL, or https link.",
      };
    }

    // Delete old image if it was a Cloudinary upload
    if (isCloudinaryUrl(existing) && manual !== existing) {
      await removeUploadedImage(existing);
    }

    return { ok: true, value: manual };
  }

  return { ok: true, value: existing };
}

// ── Reading File Upload ────────────────────────────────────────────────────

export type ReadingFileType = "pdf" | "epub";

const READING_FILE_MAX_SIZE = 50 * 1024 * 1024; // 50 MB for reading files

const ALLOWED_READING_MIME_TYPES: Record<ReadingFileType, string[]> = {
  pdf: ["application/pdf"],
  epub: ["application/epub+zip", "application/octet-stream"],
};

/**
 * Validate PDF file signature.
 * PDF files must start with %PDF (magic bytes: 0x25 0x50 0x44 0x46).
 */
function isValidPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // %PDF magic bytes
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

/**
 * Validate EPUB file signature.
 * EPUB is a ZIP file that must contain a 'mimetype' file with content 'application/epub+zip'.
 * For efficiency, we check for ZIP signature and then read the mimetype file.
 */
async function isValidEpubSignature(file: File): Promise<boolean> {
  // Read first 100KB for validation (EPUB structure is at the beginning)
  const maxRead = Math.min(file.size, 100 * 1024);
  const buffer = await file.slice(0, maxRead).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check for ZIP signature (PK\x03\x04)
  if (bytes.length < 4) return false;
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    return false;
  }

  // Look for 'mimetype' file in the ZIP
  // The mimetype file should be the first entry and contain 'application/epub+zip'
  const content = new TextDecoder().decode(bytes);
  return content.includes("mimetypeapplication/epub+zip");
}

/**
 * Validate and upload a reading file (PDF or EPUB) to Cloudinary.
 * Includes file signature validation to ensure actual file type.
 */
export async function saveReadingFile(
  file: File,
  type: ReadingFileType,
): Promise<CloudinaryResult> {
  // Validate file size
  if (file.size > READING_FILE_MAX_SIZE) {
    return {
      ok: false,
      message: `File must be ${Math.floor(READING_FILE_MAX_SIZE / 1024 / 1024)} MB or smaller.`,
    };
  }

  // Validate MIME type
  const allowedTypes = ALLOWED_READING_MIME_TYPES[type];
  if (!allowedTypes.includes(file.type)) {
    return {
      ok: false,
      message: `Invalid file type. Expected ${type.toUpperCase()} file.`,
    };
  }

  // Validate extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== type) {
    return {
      ok: false,
      message: `File extension must be .${type}.`,
    };
  }

  // Validate file signature (magic bytes)
  const headerBytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  
  if (type === "pdf" && !isValidPdfSignature(headerBytes)) {
    return {
      ok: false,
      message: "File does not appear to be a valid PDF. Expected a PDF document.",
    };
  }
  
  if (type === "epub" && !(await isValidEpubSignature(file))) {
    return {
      ok: false,
      message: "File does not appear to be a valid EPUB. Expected an EPUB document.",
    };
  }

  // Upload to Cloudinary as raw file (no image optimization)
  const result = await uploadFile(file, "reading", {
    resource_type: "raw",
    // Preserve the file extension in the URL
    format: type,
  });

  return result;
}

/**
 * Remove a reading file from Cloudinary.
 */
export async function removeReadingFile(url: string | null): Promise<void> {
  if (!url) return;
  if (isCloudinaryUrl(url)) {
    await deleteAsset(url);
  }
}
