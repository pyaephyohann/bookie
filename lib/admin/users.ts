import { z } from "zod";

/**
 * Admin user management validation (A8.2).
 *
 * PURE module — no Prisma import, safe to use in client components.
 * Server queries live in `lib/admin/user-queries.ts`.
 */

// ── Constants ───────────────────────────────────────────────────────────────

export const USER_ROLE_VALUES = ["ADMIN", "STAFF"] as const;
export type UserRoleValue = (typeof USER_ROLE_VALUES)[number];

export const USER_ROLE_LABELS: Record<UserRoleValue, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

// ── Form helpers ────────────────────────────────────────────────────────────

/** Read a FormData value as a trimmed string ("" when absent). */
export function fd(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Flatten a Zod error into { field: firstMessage } for inline display. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

// ── Create user ─────────────────────────────────────────────────────────────

export const createUserSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    role: z.enum(USER_ROLE_VALUES, { message: "Choose a valid role" }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateUserValues = z.infer<typeof createUserSchema>;

// ── Update user ─────────────────────────────────────────────────────────────

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  role: z.enum(USER_ROLE_VALUES, { message: "Choose a valid role" }),
});

export type UpdateUserValues = z.infer<typeof updateUserSchema>;

// ── Reset password ──────────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// ── Action state ────────────────────────────────────────────────────────────

export interface UserActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}
