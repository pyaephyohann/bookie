/**
 * Payment configuration for Bookie B6.
 *
 * Merchant account details are loaded from environment variables.
 * Development placeholders are used when env vars are missing.
 *
 * Required env vars (set in .env for development, platform env for production):
 *   BOOKIE_PAYMENT_MERCHANT_NAME — merchant/account holder name
 *   BOOKIE_PAYMENT_KPAY_PHONE    — KPay phone number
 *   BOOKIE_PAYMENT_AYA_PHONE     — AYA Pay phone number
 *
 * Optional:
 *   BOOKIE_PAYMENT_KPAY_QR_URL   — public URL of KPay QR image
 *   BOOKIE_PAYMENT_AYA_QR_URL    — public URL of AYA Pay QR image
 */

export type PaymentMethod = "KPAY" | "AYAPAY";

export const PAYMENT_METHODS: PaymentMethod[] = ["KPAY", "AYAPAY"];

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  KPAY: "KPay",
  AYAPAY: "AYA Pay",
};

export interface MerchantInfo {
  name: string;
  phone: string;
  qrUrl: string | null;
}

export function getMerchantInfo(method: PaymentMethod): MerchantInfo {
  const name =
    process.env.BOOKIE_PAYMENT_MERCHANT_NAME || "Bookie Development";

  switch (method) {
    case "KPAY":
      return {
        name,
        phone: process.env.BOOKIE_PAYMENT_KPAY_PHONE || "09-XXX-XXX-XXX",
        qrUrl: process.env.BOOKIE_PAYMENT_KPAY_QR_URL || null,
      };
    case "AYAPAY":
      return {
        name,
        phone: process.env.BOOKIE_PAYMENT_AYA_PHONE || "09-XXX-XXX-XXX",
        qrUrl: process.env.BOOKIE_PAYMENT_AYA_QR_URL || null,
      };
  }
}

/** Maximum file size for payment slip upload (5 MB). */
export const MAX_SLIP_SIZE = 5 * 1024 * 1024;

/** Allowed MIME types for payment slip images. */
export const ALLOWED_SLIP_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_SLIP_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/** Check if a file type is allowed. */
export function isAllowedSlipType(mimeType: string): boolean {
  return ALLOWED_SLIP_TYPES.includes(mimeType as (typeof ALLOWED_SLIP_TYPES)[number]);
}

/** Check if a file size is within limits. */
export function isAllowedSlipSize(size: number): boolean {
  return size > 0 && size <= MAX_SLIP_SIZE;
}
