"use client";

import { useActionState } from "react";
import { ArrowRight, Ban } from "lucide-react";
import { updateOrderStatus, ORDER_STATUS_LABELS } from "./actions";
import type { OrderStatus } from "@/generated/prisma/client";

// ── Valid transitions (mirrors server-side logic) ───────────────────────────

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "REJECTED", "CANCELLED"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  REJECTED: [],
  CANCELLED: [],
};

// ── Transition styling ──────────────────────────────────────────────────────

const TRANSITION_STYLES: Record<string, string> = {
  CONFIRMED: "border-success/30 bg-success/5 hover:bg-success/10 text-success",
  PREPARING: "border-pending/30 bg-pending/5 hover:bg-pending/10 text-pending",
  SHIPPED: "border-info/30 bg-info/5 hover:bg-info/10 text-info",
  DELIVERED: "border-success/30 bg-success/5 hover:bg-success/10 text-success",
  REJECTED: "border-error/30 bg-error/5 hover:bg-error/10 text-error",
  CANCELLED: "border-error/30 bg-error/5 hover:bg-error/10 text-error",
};

// ── Component ──────────────────────────────────────────────────────────────

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusForm({
  orderId,
  currentStatus,
}: OrderStatusFormProps) {
  const [state, dispatch] = useActionState(updateOrderStatus, {} as {
    error?: string;
    fieldErrors?: Record<string, string>;
    success?: string;
  });

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  const isTerminal = allowedTransitions.length === 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-body font-semibold text-text">Update Status</h3>

      {isTerminal ? (
        <div className="flex items-center gap-2 rounded-control border border-border bg-surface-muted p-3">
          <Ban className="size-4 text-text-muted" aria-hidden />
          <p className="text-body-sm text-text-secondary">
            This order is in a terminal state and cannot be changed.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allowedTransitions.map((targetStatus) => (
            <form key={targetStatus} action={dispatch} className="flex items-center gap-2">
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="status" value={targetStatus} />
              <button
                type="submit"
                className={`flex flex-1 items-center justify-between gap-2 rounded-control border p-2.5 text-left text-body-sm font-medium transition-colors ${TRANSITION_STYLES[targetStatus] ?? "border-border bg-surface hover:bg-surface-muted text-text"}`}
              >
                <span>
                  {ORDER_STATUS_LABELS[currentStatus]} → {ORDER_STATUS_LABELS[targetStatus]}
                </span>
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </button>
            </form>
          ))}
        </div>
      )}

      {state.error && (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg border border-error/30 bg-error-muted/40 p-3"
          role="alert"
        >
          <Ban className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
          <p className="text-body-sm text-error">{state.error}</p>
        </div>
      )}
    </div>
  );
}
