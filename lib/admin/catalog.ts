import { z } from "zod";

/**
 * Admin catalog primitives (A3).
 *
 * PURE module — no Prisma import, safe to use in client components.
 * The Prisma queries live in `lib/admin/catalog-queries.ts` (server-only).
 */

// ── Constants ───────────────────────────────────────────────────────────────

export const BOOK_STATUS_VALUES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type BookStatusValue = (typeof BOOK_STATUS_VALUES)[number];

export const BOOK_STATUS_LABELS: Record<BookStatusValue, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

/** Sort options for the admin book list (value → label). */
export const BOOK_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "price-asc", label: "Price low → high" },
  { value: "price-desc", label: "Price high → low" },
  { value: "stock-asc", label: "Stock low → high" },
] as const;

export const CATALOG_PAGE_SIZE = 12;

/** Flattened category option for the parent picker (depth drives indentation). */
export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

/** Cover images: dev storage strategy is a validated base64 data URL (see docs). */
export const COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const COVER_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export function isAllowedCoverType(type: string): boolean {
  return (COVER_MIME_TYPES as readonly string[]).includes(type);
}

export function isAllowedCoverSize(bytes: number): boolean {
  return bytes > 0 && bytes <= COVER_MAX_BYTES;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ── Form parse helpers (FormData gives strings) ─────────────────────────────

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} is too long`)
    .optional()
    .transform((v) => (v ? v : undefined));

const requiredMoney = z
  .string()
  .trim()
  .min(1, "Price is required")
  .refine((v) => !Number.isNaN(Number(v)), "Price must be a number")
  .refine((v) => Number(v) >= 0, "Price cannot be negative")
  .refine((v) => Number(v) <= 9_999_999, "Price is unreasonably high")
  .transform((v) => Math.round(Number(v) * 100) / 100);

const optionalMoney = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), "Compare-at price must be a number")
  .refine((v) => !v || Number(v) >= 0, "Compare-at price cannot be negative")
  .transform((v) => (v ? Math.round(Number(v) * 100) / 100 : undefined));

const optionalInt = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d+$/.test(v), "Must be a whole number")
  .transform((v) => (v ? Number(v) : undefined));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date")
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : undefined));

// ── Book ────────────────────────────────────────────────────────────────────

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300, "Title is too long"),
  slug: optionalText(120, "Slug"),
  description: optionalText(5000, "Description"),
  isbn: optionalText(32, "ISBN"),
  publisher: optionalText(200, "Publisher"),
  publishedAt: optionalDate,
  price: requiredMoney,
  compareAtPrice: optionalMoney,
  stockQuantity: optionalInt,
  status: z.enum(BOOK_STATUS_VALUES, { message: "Choose a valid status" }),
  coverImage: optionalText(500, "Cover URL"),
  coverAction: z.enum(["keep", "replace", "remove"]).optional().default("keep"),
  isReadableOnline: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  metaTitle: optionalText(200, "Meta title"),
  metaDescription: optionalText(500, "Meta description"),
  authorIds: z.array(z.string().trim().min(1)).max(10, "Too many authors"),
  categoryIds: z.array(z.string().trim().min(1)).max(10, "Too many categories"),
});

export type BookFormValues = z.infer<typeof bookSchema>;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ── Author ──────────────────────────────────────────────────────────────────

export const authorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  slug: optionalText(120, "Slug"),
  biography: optionalText(5000, "Biography"),
  photoUrl: optionalText(500, "Photo URL"),
});

export type AuthorFormValues = z.infer<typeof authorSchema>;

// ── Category ────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  slug: optionalText(120, "Slug"),
  description: optionalText(2000, "Description"),
  imageUrl: optionalText(500, "Image URL"),
  parentId: optionalText(64, "Parent"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// ── Publisher (derived from Book.publisher — no separate model) ─────────────

export const publisherRenameSchema = z.object({
  current: z.string().trim().min(1, "Publisher is required").max(200),
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
});

// ── Action state ────────────────────────────────────────────────────────────

export interface CatalogActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

/** Flatten a Zod error into `{ field: firstMessage }` for inline display. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

/** Read a FormData value as a trimmed string ("" when absent). */
export function fd(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
