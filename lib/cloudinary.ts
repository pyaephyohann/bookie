/**
 * Cloudinary server utility for Bookie.
 *
 * SERVER-ONLY — never import from client components.
 *
 * Required environment variables:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Optional:
 *   CLOUDINARY_UPLOAD_FOLDER (default: "bookie")
 */

import { v2 as cloudinary } from "cloudinary";

// ── Configuration ──────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || "bookie";

/**
 * Check if Cloudinary is configured.
 * Returns false if any required env var is missing.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Get Cloudinary instance.
 * Throws if not configured.
 */
function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
    );
  }

  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });

  return cloudinary;
}

// ── Upload Folders ─────────────────────────────────────────────────────────

export type UploadFolder = "covers" | "authors" | "categories" | "payment-slips" | "reading" | "hero-slides" | "banners";

const FOLDER_MAP: Record<UploadFolder, string> = {
  covers: "covers",
  authors: "authors",
  categories: "categories",
  "payment-slips": "payment-slips",
  reading: "reading",
  "hero-slides": "hero-slides",
  banners: "banners",
};

function getFolderPath(folder: UploadFolder): string {
  return `${UPLOAD_FOLDER}/${FOLDER_MAP[folder]}`;
}

// ── Upload Result ──────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  ok: true;
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

export interface CloudinaryUploadError {
  ok: false;
  message: string;
}

export type CloudinaryResult = CloudinaryUploadResult | CloudinaryUploadError;

// ── Upload Functions ───────────────────────────────────────────────────────

/**
 * Upload a buffer to Cloudinary.
 *
 * @param buffer - File content as Buffer
 * @param folder - Target folder (covers, authors, etc.)
 * @param filename - Original filename for public_id
 * @param mimeType - MIME type of the file
 * @param options - Additional Cloudinary upload options
 */
export async function uploadBuffer(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string,
  mimeType: string,
  options: Record<string, unknown> = {},
): Promise<CloudinaryResult> {
  try {
    const cld = getCloudinary();
    const folderPath = getFolderPath(folder);

    // Generate a unique public_id from filename
    const baseName = filename
      .replace(/\.[^.]+$/, "") // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, "-") // Sanitize
      .slice(0, 64); // Limit length

    const timestamp = Date.now();

    // Determine resource type from MIME
    const resourceType = getResourceType(mimeType);

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cld.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: `${baseName}-${timestamp}`,
          resource_type: resourceType,
          ...options,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          if (!result) {
            reject(new Error("No result from Cloudinary"));
            return;
          }
          resolve({
            ok: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(buffer);
    });

    return result;
  } catch (error) {
    console.error("[bookie] Cloudinary upload failed:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload a File object to Cloudinary.
 */
export async function uploadFile(
  file: File,
  folder: UploadFolder,
  options: Record<string, unknown> = {},
): Promise<CloudinaryResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadBuffer(buffer, folder, file.name, file.type, options);
}

// ── Delete Functions ───────────────────────────────────────────────────────

/**
 * Delete a Cloudinary asset by URL or public ID.
 * Best-effort: never throws.
 */
export async function deleteAsset(urlOrPublicId: string): Promise<void> {
  if (!urlOrPublicId) return;

  try {
    const cld = getCloudinary();

    // Extract public_id from URL if needed
    const publicId = extractPublicId(urlOrPublicId);
    if (!publicId) return;

    // Determine resource type from URL
    const resourceType = guessResourceTypeFromUrl(urlOrPublicId);

    await cld.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    // Best-effort cleanup — never fail the operation
    console.warn("[bookie] Cloudinary delete failed:", error);
  }
}

// ── URL Helpers ────────────────────────────────────────────────────────────

/**
 * Check if a URL is a Cloudinary URL.
 */
export function isCloudinaryUrl(url: string | null): boolean {
  if (!url) return false;
  return url.includes("res.cloudinary.com") || url.includes("cloudinary.com");
}

/**
 * Check if a URL is a local upload URL (legacy).
 */
export function isLocalUploadUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith("/uploads/");
}

/**
 * Check if a URL is a base64 data URL (legacy payment slips).
 */
export function isDataUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith("data:");
}

// ── Signed URL Generation ─────────────────────────────────────────────────

/**
 * Generate a time-limited signed URL for secure asset delivery.
 * Used for payment slips and other sensitive assets.
 * 
 * @param urlOrPublicId - Cloudinary URL or public_id
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or original URL if not a Cloudinary asset
 */
export function generateSignedUrl(
  urlOrPublicId: string,
  expiresIn: number = 3600,
): string {
  if (!urlOrPublicId) return urlOrPublicId;
  
  // Don't sign non-Cloudinary URLs (legacy base64 or local uploads)
  if (!isCloudinaryUrl(urlOrPublicId) && !urlOrPublicId.includes("/")) {
    return urlOrPublicId;
  }

  try {
    const cld = getCloudinary();
    
    // Extract public_id from URL
    const publicId = extractPublicId(urlOrPublicId);
    if (!publicId) return urlOrPublicId;
    
    // Determine resource type from URL
    const resourceType = guessResourceTypeFromUrl(urlOrPublicId);
    
    // Generate signed URL with expiration
    const signedUrl = cld.url(publicId, {
      resource_type: resourceType,
      type: "upload",
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
    
    return signedUrl;
  } catch (error) {
    console.warn("[bookie] Failed to generate signed URL:", error);
    // Return original URL as fallback
    return urlOrPublicId;
  }
}

// ── Internal Helpers ───────────────────────────────────────────────────────

function getResourceType(mimeType: string): "image" | "raw" | "video" | "auto" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "video";
  return "raw";
}

function extractPublicId(urlOrPublicId: string): string | null {
  // Already a public_id (no protocol)
  if (!urlOrPublicId.includes("http")) {
    return urlOrPublicId;
  }

  // Extract from URL: https://res.cloudinary.com/{cloud}/image/upload/{folder}/{id}.{ext}
  try {
    const url = new URL(urlOrPublicId);
    const pathParts = url.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // Everything after "upload" is the public_id (minus extension for images)
    const afterUpload = pathParts.slice(uploadIndex + 1);

    // Skip version number if present (e.g., "v1234567890")
    const start = afterUpload[0]?.match(/^v\d+$/) ? 1 : 0;
    const idParts = afterUpload.slice(start);

    // Remove extension for non-raw resources
    const lastPart = idParts[idParts.length - 1];
    if (lastPart && lastPart.includes(".")) {
      idParts.pop();
    }

    return idParts.join("/");
  } catch {
    return null;
  }
}

function guessResourceTypeFromUrl(url: string): "image" | "raw" | "video" {
  if (url.includes("/image/upload/")) return "image";
  if (url.includes("/raw/upload/")) return "raw";
  if (url.includes("/video/upload/")) return "video";
  // Default to image for backward compatibility
  return "image";
}
