import { z } from "zod";

// ── Zod schema for the checkout customer information ────────────────────────

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\+?[\d\s\-()]{7,20}$/, "Please enter a valid phone number"),
  alternatePhone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-()]{7,20}$/.test(val),
      "Please enter a valid phone number",
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  shippingAddress: z
    .string()
    .trim()
    .min(1, "Shipping address is required")
    .max(500, "Address is too long"),
  note: z.string().trim().max(500, "Note is too long").optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
