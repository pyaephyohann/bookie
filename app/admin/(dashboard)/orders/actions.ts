"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fd, toFieldErrors } from "@/lib/admin/catalog";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * Order status mutations (A5).
 *
 * SECURITY: every action re-validates the admin session server-side and
 * re-validates the submitted payload with Zod. The UI is never trusted.
 *
 * TRANSITIONS: only valid OrderStatus transitions are allowed.
 * Terminal states (DELIVERED, REJECTED, CANCELLED) cannot be changed.
 */

// ── Valid transitions ───────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "REJECTED", "CANCELLED"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [], // terminal
  REJECTED: [], // terminal
  CANCELLED: [], // terminal
};

// ── Status labels ───────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// ── Action state ────────────────────────────────────────────────────────────

export interface OrderActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

// ── Validation schema ───────────────────────────────────────────────────────

const statusUpdateSchema = z.object({
  orderId: z.string().trim().min(1, "Order is required"),
  status: z.enum(
    ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "REJECTED", "CANCELLED"],
    { message: "Invalid status" },
  ),
  note: z
    .string()
    .trim()
    .max(500, "Note is too long")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

// ── Server Action ───────────────────────────────────────────────────────────

export async function updateOrderStatus(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const admin = await requireAdmin();

  const parsed = statusUpdateSchema.safeParse({
    orderId: fd(formData, "orderId"),
    status: fd(formData, "status"),
    note: fd(formData, "note"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { orderId, status: newStatus, note } = parsed.data;

  try {
    // Fetch current order status inside a transaction
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // Validate transition
      const allowed = VALID_TRANSITIONS[order.status];
      if (!allowed.includes(newStatus)) {
        throw new Error("INVALID_TRANSITION");
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          note: note ?? null,
          changedById: admin.id,
        },
      });
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin", "layout");

    redirect(`/admin/orders/${orderId}?notice=status-updated`);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "ORDER_NOT_FOUND":
          return { error: "That order no longer exists." };
        case "INVALID_TRANSITION":
          return {
            error: "That status change is not allowed from the current status.",
          };
      }
    }
    // Next.js redirects throw — let those through
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (typeof error === "object" && error !== null && "digest" in error) throw error;

    console.error("[bookie] updateOrderStatus failed:", error);
    return { error: "Could not update order status. Please try again." };
  }
}
