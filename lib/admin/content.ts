import { z } from "zod";

/**
 * A7 admin content primitives. This module is intentionally Prisma-free so
 * forms can reuse its constants and types without importing server code.
 */

export const READING_MODE_VALUES = ["INLINE", "PDF", "EPUB", "OTHER"] as const;
export type ReadingMode = (typeof READING_MODE_VALUES)[number];

/**
 * The schema has no INLINE enum. INLINE is an admin UI mode only and is stored
 * with the valid `OTHER` enum value while `content` is populated. The reader
 * gives content precedence over fileUrl/contentType, preserving B9 behavior.
 */
export const READING_CONTENT_MAX_BYTES = 10 * 1024 * 1024;
export const READING_FILE_URL_MAX_LENGTH = 2_000;

export const FEATURED_SECTION_VALUES = [
  "TRENDING",
  "BEST_SELLER",
  "RECOMMENDED",
] as const;
export type ManagedFeaturedSection = (typeof FEATURED_SECTION_VALUES)[number];

export const FEATURED_SECTION_LABELS: Record<ManagedFeaturedSection, string> = {
  TRENDING: "Trending",
  BEST_SELLER: "Best sellers",
  RECOMMENDED: "Recommended",
};

export const PROMOTION_TYPE_VALUES = ["PERCENTAGE", "FIXED_AMOUNT"] as const;
export type PromotionTypeValue = (typeof PROMOTION_TYPE_VALUES)[number];

export const PROMOTION_TYPE_LABELS: Record<PromotionTypeValue, string> = {
  PERCENTAGE: "Percentage",
  FIXED_AMOUNT: "Fixed amount",
};

export const PROMOTION_PAGE_SIZE = 12;
export const READING_PAGE_SIZE = 12;

export interface ContentActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

export function fd(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function textBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

/** Only local public paths and HTTP(S) URLs can be used for reader files. */
export function isSafeReadingFileUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > READING_FILE_URL_MAX_LENGTH) return false;
  if (trimmed.startsWith("/")) return !trimmed.startsWith("//");

  try {
    const url = new URL(trimmed);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

const readingBaseSchema = z.object({
  bookId: z.string().trim().min(1, "Book is required").max(64, "Invalid book reference"),
  mode: z.enum(READING_MODE_VALUES, { message: "Choose a valid content format" }),
  content: z.string(),
  fileUrl: z.string().trim().max(READING_FILE_URL_MAX_LENGTH, "File URL is too long"),
  isReadableOnline: z.boolean(),
});

export const readingContentSchema = readingBaseSchema.superRefine((data, ctx) => {
  if (data.mode === "INLINE") {
    if (!data.content.trim()) {
      ctx.addIssue({ code: "custom", path: ["content"], message: "Inline content is required" });
    }
    if (data.fileUrl) {
      ctx.addIssue({ code: "custom", path: ["fileUrl"], message: "Inline content cannot include a file URL" });
    }
    if (textBytes(data.content) > READING_CONTENT_MAX_BYTES) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: `Inline content must be ${Math.floor(READING_CONTENT_MAX_BYTES / 1024 / 1024)} MB or smaller`,
      });
    }
  } else {
    if (!data.fileUrl) {
      ctx.addIssue({ code: "custom", path: ["fileUrl"], message: "A file URL is required" });
    } else if (!isSafeReadingFileUrl(data.fileUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["fileUrl"],
        message: "Use a root-relative path or an HTTP(S) URL",
      });
    }
    if (data.content.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "File-based content cannot include inline content",
      });
    }
  }
});

export type ReadingContentValues = z.infer<typeof readingContentSchema>;

const promotionValue = z
  .string()
  .trim()
  .min(1, "Value is required")
  .refine((value) => /^\d+(?:\.\d{1,2})?$/.test(value), "Enter a non-negative amount with up to 2 decimals")
  .transform((value) => Math.round(Number(value) * 100) / 100)
  .refine((value) => Number.isFinite(value) && value <= 9_999_999, "Value is too large");

const promotionDate = z
  .string()
  .trim()
  .refine((value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value), "Use a valid date and time")
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), "Use a valid date and time");

export const promotionSchema = z
  .object({
    id: z.string().trim().max(64).optional(),
    name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
    description: z.string().trim().max(5_000, "Description is too long"),
    type: z.enum(PROMOTION_TYPE_VALUES, { message: "Choose a valid promotion type" }),
    value: promotionValue,
    startAt: promotionDate,
    endAt: promotionDate,
    isActive: z.boolean(),
    bookIds: z.array(z.string().trim().min(1)).max(500, "Too many books selected"),
  })
  .superRefine((data, ctx) => {
    if (data.startAt >= data.endAt) {
      ctx.addIssue({ code: "custom", path: ["endAt"], message: "End date must be after start date" });
    }
    if (data.type === "PERCENTAGE" && data.value > 100) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Percentage must be between 0 and 100" });
    }
  });

export type PromotionFormValues = z.infer<typeof promotionSchema>;

export function formatDateTimeLocal(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export type PromotionListStatus = "enabled" | "live" | "scheduled" | "expired" | "inactive";

export function promotionStatus(
  promotion: { isActive: boolean; startAt: string | Date; endAt: string | Date },
  now = new Date(),
): "LIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE" {
  if (!promotion.isActive) return "INACTIVE";
  const start = new Date(promotion.startAt).getTime();
  const end = new Date(promotion.endAt).getTime();
  const current = now.getTime();
  if (start > current) return "SCHEDULED";
  if (end < current) return "EXPIRED";
  return "LIVE";
}

export function promotionStatusLabel(status: ReturnType<typeof promotionStatus>): string {
  return {
    LIVE: "Live",
    SCHEDULED: "Scheduled",
    EXPIRED: "Expired",
    INACTIVE: "Inactive",
  }[status];
}
