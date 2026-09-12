"use client";

import { useActionState } from "react";
import { CheckCircle, XCircle, Ban, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyPayment, rejectPayment, updateTransactionReference } from "./actions";
import type { PaymentStatus } from "@/generated/prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface PaymentActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

interface PaymentVerifyFormProps {
  paymentId: string;
  currentStatus: PaymentStatus;
}

export function PaymentVerifyForm({
  paymentId,
  currentStatus,
}: PaymentVerifyFormProps) {
  const [verifyState, verifyDispatch] = useActionState(verifyPayment, {} as PaymentActionState);
  const [rejectState, rejectDispatch] = useActionState(rejectPayment, {} as PaymentActionState);
  const [refState, refDispatch] = useActionState(updateTransactionReference, {} as PaymentActionState);

  const isPending = currentStatus === "PENDING";

  return (
    <div className="space-y-4">
      {/* Verify/Reject actions */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-body font-semibold text-text">Actions</h3>

        {isPending ? (
          <div className="space-y-2">
            {/* Verify button */}
            <form action={verifyDispatch} className="flex items-center gap-2">
              <input type="hidden" name="paymentId" value={paymentId} />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="flex-1"
              >
                <CheckCircle className="size-4" aria-hidden />
                Verify Payment
              </Button>
            </form>

            {/* Reject form */}
            <form action={rejectDispatch} className="space-y-2">
              <input type="hidden" name="paymentId" value={paymentId} />
              <div>
                <label htmlFor="rejection-reason" className="mb-1 block text-caption text-text-secondary">
                  Rejection reason (optional)
                </label>
                <textarea
                  id="rejection-reason"
                  name="reason"
                  rows={2}
                  maxLength={500}
                  placeholder="Why is this payment being rejected?"
                  className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text placeholder:text-text-muted focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                />
              </div>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                className="w-full"
              >
                <XCircle className="size-4" aria-hidden />
                Reject Payment
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-control border border-border bg-surface-muted p-3">
            <Ban className="size-4 text-text-muted" aria-hidden />
            <p className="text-body-sm text-text-secondary">
              This payment is {currentStatus.toLowerCase()} and cannot be changed.
            </p>
          </div>
        )}

        {/* Error/success feedback */}
        {(verifyState.error || rejectState.error) && (
          <div
            className="mt-3 flex items-start gap-2 rounded-lg border border-error/30 bg-error-muted/40 p-3"
            role="alert"
          >
            <Ban className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
            <p className="text-body-sm text-error">
              {verifyState.error || rejectState.error}
            </p>
          </div>
        )}
      </div>

      {/* Transaction reference */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-body font-semibold text-text">Transaction Reference</h3>
        <form action={refDispatch} className="space-y-2">
          <input type="hidden" name="paymentId" value={paymentId} />
          <div>
            <label htmlFor="transaction-reference" className="mb-1 block text-caption text-text-secondary">
              Reference number
            </label>
            <input
              id="transaction-reference"
              name="transactionReference"
              type="text"
              maxLength={200}
              placeholder="e.g. TXN-123456"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text placeholder:text-text-muted focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="w-full">
            <Save className="size-4" aria-hidden />
            Save Reference
          </Button>
        </form>

        {refState.success && (
          <div
            className="mt-3 flex items-start gap-2 rounded-lg border border-success/30 bg-success-muted/40 p-3"
            role="status"
          >
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <p className="text-body-sm text-success">{refState.success}</p>
          </div>
        )}

        {refState.error && (
          <div
            className="mt-3 flex items-start gap-2 rounded-lg border border-error/30 bg-error-muted/40 p-3"
            role="alert"
          >
            <Ban className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
            <p className="text-body-sm text-error">{refState.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
