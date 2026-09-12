import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPaymentDetail } from "@/lib/admin/payment-queries";
import { formatDate, formatMoney } from "@/lib/admin/catalog";
import { METHOD_LABELS, type PaymentMethod, ALLOWED_SLIP_TYPES } from "@/lib/payment";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentVerifyForm } from "../PaymentVerifyForm";
import { generateSignedUrl, isCloudinaryUrl } from "@/lib/cloudinary";

// ── Slip validation ────────────────────────────────────────────────────────

/**
 * Validate that a slip URL is displayable.
 * Supports:
 * - Legacy base64 data URLs (data:image/jpeg;base64,...)
 * - Cloudinary URLs (https://res.cloudinary.com/...)
 * - Other HTTPS image URLs
 * Returns false for unsafe formats (data:text/html, etc.).
 */
function isValidSlipUrl(url: string | null): boolean {
  if (!url) return false;

  // Cloudinary URLs are always valid (they're uploaded via server validation)
  if (url.includes("res.cloudinary.com")) return true;

  // HTTPS image URLs are valid
  if (url.startsWith("https://") && !url.startsWith("data:")) return true;

  // Legacy base64 data URLs - validate MIME type
  if (!url.startsWith("data:image/")) return false;
  const mimeMatch = url.match(/^data:([^;]+);/);
  if (!mimeMatch) return false;
  const mime = mimeMatch[1];
  return (ALLOWED_SLIP_TYPES as readonly string[]).includes(mime);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPaymentDetail(id);
  return {
    title: payment
      ? `Payment ${payment.id.slice(0, 8)}… — Bookie Admin`
      : "Payment — Bookie Admin",
  };
}

// ── Status badge styles ────────────────────────────────────────────────────

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-pending/15 text-pending",
  VERIFIED: "bg-success/15 text-success",
  REJECTED: "bg-error/15 text-error",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  PLACED: "bg-info/15 text-info",
  CONFIRMED: "bg-brand/15 text-text",
  PREPARING: "bg-pending/15 text-pending",
  SHIPPED: "bg-info/15 text-info",
  DELIVERED: "bg-success/15 text-success",
  REJECTED: "bg-error/15 text-error",
  CANCELLED: "bg-error/15 text-error",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const payment = await getPaymentDetail(id);
  if (!payment) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Payments
        </Link>
      </div>

      <AdminPageHeader
        title={`Payment ${payment.id.slice(0, 8)}…`}
        description={`Submitted ${formatDate(payment.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Payment information */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-body font-semibold text-text">Payment Information</h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${PAYMENT_STATUS_STYLES[payment.status] ?? "bg-surface-muted text-text-muted"}`}
              >
                {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
              </span>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-text-muted">Payment ID</dt>
                <dd className="text-body-sm text-text font-mono">{payment.id}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Method</dt>
                <dd className="text-body-sm text-text">
                  {METHOD_LABELS[payment.method as PaymentMethod] ?? payment.method}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Amount</dt>
                <dd className="text-body-sm font-semibold text-text">
                  {formatMoney(payment.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Submitted</dt>
                <dd className="text-body-sm text-text">{formatDate(payment.createdAt)}</dd>
              </div>
              {payment.transactionReference && (
                <div className="sm:col-span-2">
                  <dt className="text-caption text-text-muted">Transaction Reference</dt>
                  <dd className="text-body-sm text-text">{payment.transactionReference}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Verification/Rejection information */}
          {(payment.verifiedByName || payment.rejectionReason) && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-3 text-body font-semibold text-text">
                {payment.status === "VERIFIED" ? "Verification" : "Rejection"} Details
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {payment.verifiedByName && (
                  <div>
                    <dt className="text-caption text-text-muted">
                      {payment.status === "VERIFIED" ? "Verified by" : "Rejected by"}
                    </dt>
                    <dd className="text-body-sm text-text">{payment.verifiedByName}</dd>
                  </div>
                )}
                {payment.verifiedAt && (
                  <div>
                    <dt className="text-caption text-text-muted">
                      {payment.status === "VERIFIED" ? "Verified at" : "Rejected at"}
                    </dt>
                    <dd className="text-body-sm text-text">{formatDate(payment.verifiedAt)}</dd>
                  </div>
                )}
                {payment.rejectionReason && (
                  <div className="sm:col-span-2">
                    <dt className="text-caption text-text-muted">Rejection Reason</dt>
                    <dd className="text-body-sm text-text whitespace-pre-wrap">
                      {payment.rejectionReason}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Payment slip */}
          {(() => {
            // Generate a signed URL for Cloudinary assets (time-limited access)
            // Legacy base64 data URLs are passed through as-is
            const displayUrl = payment.slipUrl
              ? isCloudinaryUrl(payment.slipUrl)
                ? generateSignedUrl(payment.slipUrl, 3600) // 1 hour expiry
                : payment.slipUrl
              : null;
            const validSlip = displayUrl && isValidSlipUrl(displayUrl) ? displayUrl : null;
            return (
              <div className="rounded-lg border border-border bg-surface p-4">
                <h2 className="mb-3 text-body font-semibold text-text">Payment Slip</h2>
                {validSlip ? (
                  <div className="overflow-hidden rounded-control border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={validSlip}
                      alt="Payment slip"
                      className="max-h-[500px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-control border border-dashed border-border bg-surface-muted p-6">
                    <FileText className="size-5 text-text-muted" aria-hidden />
                    <p className="text-body-sm text-text-muted">
                      {payment.slipUrl ? "Invalid or unsupported slip format" : "No slip uploaded"}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          {/* Verify/Reject actions */}
          <PaymentVerifyForm
            paymentId={payment.id}
            currentStatus={payment.status}
          />

          {/* Order information */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-body font-semibold text-text">Order</h2>
              <Link
                href={`/admin/orders/${payment.orderId}`}
                className="inline-flex items-center gap-1 text-caption text-brand transition-colors hover:text-brand/80"
              >
                View order
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            </div>
            <dl className="space-y-2">
              <div>
                <dt className="text-caption text-text-muted">BookPass</dt>
                <dd className="text-body-sm font-medium text-text">{payment.order.bookPass}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Customer</dt>
                <dd className="text-body-sm text-text">{payment.order.customerName}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Phone</dt>
                <dd className="text-body-sm text-text">{payment.order.phone}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Email</dt>
                <dd className="text-body-sm text-text">{payment.order.email}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Order Total</dt>
                <dd className="text-body-sm font-semibold text-text">
                  {formatMoney(payment.order.total)}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Order Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ORDER_STATUS_STYLES[payment.order.status] ?? "bg-surface-muted text-text-muted"}`}
                  >
                    {ORDER_STATUS_LABELS[payment.order.status] ?? payment.order.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
