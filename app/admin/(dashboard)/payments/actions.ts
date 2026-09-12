"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fd, toFieldErrors } from "@/lib/admin/catalog";

/**
 * Payment mutations (A6).
 *
 * SECURITY: every action re-validates the admin session server-side and
 * re-validates the submitted payload with Zod. The UI is never trusted.
 *
 * CONCURRENCY: verification/rejection uses atomic conditional UPDATE
 * so only one concurrent action can transition PENDING → VERIFIED or
 * PENDING → REJECTED.
 *
 * ORDER STATUS: payment verification/rejection does NOT change Order.status.
 * Order status management remains in A5.
 */

// ── Action state ────────────────────────────────────────────────────────────

export interface PaymentActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

// ── Verify payment ──────────────────────────────────────────────────────────

const verifySchema = z.object({
  paymentId: z.string().trim().min(1, "Payment is required"),
});

export async function verifyPayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const admin = await requireAdmin();

  const parsed = verifySchema.safeParse({
    paymentId: fd(formData, "paymentId"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { paymentId } = parsed.data;

  try {
    // Atomic conditional UPDATE: only transition PENDING → VERIFIED
    const updated = await prisma.$executeRaw`
      UPDATE "Payment"
      SET "status" = 'VERIFIED'::\"PaymentStatus\",
          "verifiedById" = ${admin.id},
          "verifiedAt" = now(),
          "updatedAt" = now()
      WHERE "id" = ${paymentId}
        AND "status" = 'PENDING'::\"PaymentStatus\"
    `;

    if (updated === 0) {
      // Check if payment exists at all
      const exists = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, status: true },
      });

      if (!exists) {
        return { error: "That payment no longer exists." };
      }

      return {
        error: "This payment has already been verified or rejected and cannot be changed.",
      };
    }

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/payments/${paymentId}`);
    revalidatePath("/admin", "layout");

    redirect(`/admin/payments/${paymentId}?notice=verified`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (typeof error === "object" && error !== null && "digest" in error) throw error;

    console.error("[bookie] verifyPayment failed:", error);
    return { error: "Could not verify payment. Please try again." };
  }
}

// ── Reject payment ──────────────────────────────────────────────────────────

const rejectSchema = z.object({
  paymentId: z.string().trim().min(1, "Payment is required"),
  reason: z
    .string()
    .trim()
    .max(500, "Reason is too long")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function rejectPayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const admin = await requireAdmin();

  const parsed = rejectSchema.safeParse({
    paymentId: fd(formData, "paymentId"),
    reason: fd(formData, "reason"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { paymentId, reason } = parsed.data;

  try {
    // Atomic conditional UPDATE: only transition PENDING → REJECTED
    const updated = await prisma.$executeRaw`
      UPDATE "Payment"
      SET "status" = 'REJECTED'::\"PaymentStatus\",
          "rejectionReason" = ${reason ?? null},
          "verifiedById" = ${admin.id},
          "verifiedAt" = now(),
          "updatedAt" = now()
      WHERE "id" = ${paymentId}
        AND "status" = 'PENDING'::\"PaymentStatus\"
    `;

    if (updated === 0) {
      const exists = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, status: true },
      });

      if (!exists) {
        return { error: "That payment no longer exists." };
      }

      return {
        error: "This payment has already been verified or rejected and cannot be changed.",
      };
    }

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/payments/${paymentId}`);
    revalidatePath("/admin", "layout");

    redirect(`/admin/payments/${paymentId}?notice=rejected`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (typeof error === "object" && error !== null && "digest" in error) throw error;

    console.error("[bookie] rejectPayment failed:", error);
    return { error: "Could not reject payment. Please try again." };
  }
}

// ── Update transaction reference ────────────────────────────────────────────

const updateRefSchema = z.object({
  paymentId: z.string().trim().min(1, "Payment is required"),
  transactionReference: z
    .string()
    .trim()
    .max(200, "Reference is too long")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function updateTransactionReference(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  await requireAdmin();

  const parsed = updateRefSchema.safeParse({
    paymentId: fd(formData, "paymentId"),
    transactionReference: fd(formData, "transactionReference"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { paymentId, transactionReference } = parsed.data;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true },
    });

    if (!payment) {
      return { error: "That payment no longer exists." };
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { transactionReference: transactionReference ?? null },
    });

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/payments/${paymentId}`);

    return { success: "Transaction reference updated." };
  } catch (error) {
    console.error("[bookie] updateTransactionReference failed:", error);
    return { error: "Could not update reference. Please try again." };
  }
}
