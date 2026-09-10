"use server";

import { prisma } from "@/lib/prisma";
import {
  isAllowedSlipType,
  isAllowedSlipSize,
  type PaymentMethod,
} from "@/lib/payment";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SubmitPaymentInput {
  bookPass: string;
  method: PaymentMethod;
  slipFile: File | null;
}

export interface SubmitPaymentResult {
  success: true;
  paymentId: string;
}

export interface SubmitPaymentError {
  success: false;
  error: string;
}

// ── Server Action ──────────────────────────────────────────────────────────

/**
 * Submit payment proof for an existing order.
 *
 * SECURITY:
 * - Server is the authoritative source for order existence, status, and amount.
 * - Client-supplied prices/totals are NEVER accepted.
 * - Payment status is always PENDING after submission (never auto-verified).
 * - File uploads are validated server-side (type, size).
 */
export async function submitPayment(
  input: SubmitPaymentInput,
): Promise<SubmitPaymentResult | SubmitPaymentError> {
  const { bookPass, method, slipFile } = input;

  // 1. Validate payment method
  if (method !== "KPAY" && method !== "AYAPAY") {
    return { success: false, error: "Invalid payment method." };
  }

  // 2. Validate payment slip
  if (!slipFile) {
    return {
      success: false,
      error: "Please upload a payment slip (screenshot of your payment).",
    };
  }

  if (!isAllowedSlipType(slipFile.type)) {
    return {
      success: false,
      error:
        "Unsupported file type. Please upload a JPEG, PNG, or WEBP image.",
    };
  }

  if (!isAllowedSlipSize(slipFile.size)) {
    return {
      success: false,
      error: "File is too large. Maximum size is 5 MB.",
    };
  }

  // 3. Resolve existing order from database
  const order = await prisma.order.findUnique({
    where: { bookPass },
    include: {
      payments: {
        where: { status: { not: "REJECTED" } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return {
      success: false,
      error: "Order not found. Please check your BookPass.",
    };
  }

  // 4. Verify order is eligible for payment
  if (order.status === "CANCELLED" || order.status === "REJECTED") {
    return {
      success: false,
      error: "This order has been cancelled or rejected and cannot be paid.",
    };
  }

  if (order.status === "DELIVERED") {
    return {
      success: false,
      error: "This order has already been delivered.",
    };
  }

  // 5. Check existing payment state
  if (order.payments.length > 0) {
    const existing = order.payments[0];
    if (existing.status === "VERIFIED") {
      return {
        success: false,
        error: "This order has already been paid and verified.",
      };
    }
    if (existing.status === "PENDING") {
      // Update existing pending payment instead of creating a new one
      const slipUrl = await convertFileToDataUrl(slipFile);
      await prisma.payment.update({
        where: { id: existing.id },
        data: {
          method,
          slipUrl,
        },
      });
      return { success: true, paymentId: existing.id };
    }
  }

  // 6. Convert slip file to data URL for storage
  const slipUrl = await convertFileToDataUrl(slipFile);

  // 7. Create payment record (server-authoritative amount)
  const amount = Number(order.total);

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      method,
      amount,
      status: "PENDING",
      slipUrl,
    },
  });

  return { success: true, paymentId: payment.id };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a File to a base64 data URL string.
 * This is the dev storage strategy — production should use Cloudinary or similar.
 */
async function convertFileToDataUrl(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  return `data:${file.type};base64,${base64}`;
}
