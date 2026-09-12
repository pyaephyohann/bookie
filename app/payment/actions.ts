"use server";

import { prisma } from "@/lib/prisma";
import {
  isAllowedSlipType,
  isAllowedSlipSize,
  type PaymentMethod,
} from "@/lib/payment";
import { uploadFile, deleteAsset, isCloudinaryUrl } from "@/lib/cloudinary";

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
      // Upload must succeed before updating database
      let slipUrl: string;
      try {
        slipUrl = await uploadSlipToCloudinary(slipFile);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Payment slip upload failed.",
        };
      }

      // Delete old slip if it was a Cloudinary upload (after successful new upload)
      if (existing.slipUrl && isCloudinaryUrl(existing.slipUrl)) {
        await deleteAsset(existing.slipUrl);
      }

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

  // 6. Upload slip file to Cloudinary
  // Upload must succeed before creating payment record
  let slipUrl: string;
  try {
    slipUrl = await uploadSlipToCloudinary(slipFile);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment slip upload failed.",
    };
  }

  // 7. Create payment record (server-authoritative amount)
  const amount = Number(order.total);

  try {
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
  } catch (error) {
    // Database failed after successful upload — clean up Cloudinary asset
    console.error("[bookie] Payment record creation failed, cleaning up upload:", error);
    await deleteAsset(slipUrl);
    return {
      success: false,
      error: "Could not save payment record. Please try again.",
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Upload a payment slip file to Cloudinary.
 * Returns the Cloudinary URL on success, or throws on failure.
 * NO base64 fallback — new payment slips must use Cloudinary.
 */
async function uploadSlipToCloudinary(file: File): Promise<string> {
  const result = await uploadFile(file, "payment-slips", {
    // Payment slips are images, use image resource type
    resource_type: "image",
    // Keep the original format
    format: file.type.split("/")[1] || "jpg",
  });

  if (result.ok) {
    return result.url;
  }

  // NO FALLBACK — reject the submission with a clear error
  throw new Error(
    `Payment slip upload failed: ${result.message}. Please try again or contact support.`,
  );
}
