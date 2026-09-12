import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { isAllowedCoverSize, isAllowedCoverType } from "@/lib/admin/catalog";

/**
 * Admin image uploads (A3). SERVER-ONLY.
 *
 * DEV STORAGE STRATEGY: files are written to `public/uploads/<bucket>/` and
 * the database stores a short root-relative URL (`/uploads/<bucket>/x.webp`).
 * That keeps `next/image` happy with zero configuration and keeps image bytes
 * out of PostgreSQL.
 *
 * This mirrors the documented B6 payment-slip strategy: fine for development,
 * but production should move to Cloudinary/S3 (see docs/DEVELOPMENT.md, A3).
 */

export type UploadBucket = "covers" | "authors" | "categories";

const BUCKET_DIR: Record<UploadBucket, string> = {
  covers: join(process.cwd(), "public", "uploads", "covers"),
  authors: join(process.cwd(), "public", "uploads", "authors"),
  categories: join(process.cwd(), "public", "uploads", "categories"),
};

/** Sniff the real image signature — never trust the client MIME/filename. */
function detectImageExtension(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

// Capture groups (not `split`) — a bare split put "uploads" in the bucket slot
// and "authors" in the filename slot, so cleanup silently no-op'd and every
// replaced/deleted image leaked its file. The name group also rejects "..".
const UPLOAD_URL_PATTERN = /^\/uploads\/([a-z]+)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/;

/** Best-effort cleanup of a previously uploaded file. Never throws. */
export async function removeUploadedImage(url: string | null): Promise<void> {
  if (!url) return;
  const match = UPLOAD_URL_PATTERN.exec(url);
  if (!match) return;
  const [, bucket, name] = match;
  if (name.includes("..")) return;
  const dir = BUCKET_DIR[bucket as UploadBucket];
  if (!dir) return;
  try {
    // `name` is already constrained by UPLOAD_URL_PATTERN and `dir` is static,
    // so tell the bundler not to trace this dynamic join across the project.
    await unlink(join(/* turbopackIgnore: true */ dir, name));
  } catch {
    // Already gone — a failed cleanup must never fail a save.
  }
}

export type UploadResult = { ok: true; url: string } | { ok: false; message: string };

/** Validate + persist an uploaded image, returning its public URL. */
export async function saveImageUpload(file: File, bucket: UploadBucket): Promise<UploadResult> {
  if (!isAllowedCoverType(file.type)) {
    return { ok: false, message: "Image must be a JPEG, PNG or WEBP file." };
  }
  if (!isAllowedCoverSize(file.size)) {
    return { ok: false, message: "Image must be 2 MB or smaller." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectImageExtension(bytes);
  if (!ext) {
    return { ok: false, message: "That file is not a valid JPEG, PNG or WEBP image." };
  }

  try {
    const dir = BUCKET_DIR[bucket];
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(join(/* turbopackIgnore: true */ dir, name), bytes);
    return { ok: true, url: `/uploads/${bucket}/${name}` };
  } catch (error) {
    console.error("[bookie] image upload failed:", error);
    return { ok: false, message: "Could not store the uploaded image. Please try again." };
  }
}

/** A manual image URL must be a local asset or an https link. */
export function isAllowedImageUrl(value: string): boolean {
  return value.startsWith("/") || /^https:\/\/\S+$/.test(value);
}

/**
 * Shared "keep / replace / remove" resolution used by the author and category
 * forms (the book form has the same logic inlined for its cover).
 */
export async function resolveImageField(
  formData: FormData,
  existing: string | null,
  bucket: UploadBucket,
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
    await removeUploadedImage(existing);
    return { ok: true, value: saved.url };
  }

  const manualValue = formData.get("imageUrl");
  const manual = typeof manualValue === "string" ? manualValue.trim() : "";
  if (manual && manual !== existing) {
    if (!isAllowedImageUrl(manual)) {
      return {
        ok: false,
        message: "Image URL must be root-relative (/uploads/x.jpg) or an https link.",
      };
    }
    await removeUploadedImage(existing);
    return { ok: true, value: manual };
  }

  return { ok: true, value: existing };
}
