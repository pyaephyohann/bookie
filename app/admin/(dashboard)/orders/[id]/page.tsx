import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getOrderDetail } from "@/lib/admin/order-queries";
import { formatDate, formatMoney } from "@/lib/admin/catalog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderStatusForm } from "../OrderStatusForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderDetail(id);
  return {
    title: order
      ? `Order ${order.bookPass} — Bookie Admin`
      : "Order — Bookie Admin",
  };
}

// ── Status badge styles ────────────────────────────────────────────────────

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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  KPAY: "KPay",
  AYAPAY: "AYA Pay",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await getOrderDetail(id);
  if (!order) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Orders
        </Link>
      </div>

      <AdminPageHeader
        title={`Order ${order.bookPass}`}
        description={`Placed ${formatDate(order.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Status + Timeline */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-body font-semibold text-text">Order Status</h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${ORDER_STATUS_STYLES[order.status] ?? "bg-surface-muted text-text-muted"}`}
              >
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            {/* Status history timeline */}
            <div className="space-y-3">
              {order.statusHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-brand" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-text">
                        {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                      </span>
                      {entry.changedByName && (
                        <span className="text-caption text-text-muted">
                          by {entry.changedByName}
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-text-muted">
                      {formatDate(entry.createdAt)}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-body-sm text-text-secondary">
                        {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {order.statusHistory.length === 0 && (
                <p className="text-body-sm text-text-muted">No status history</p>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-body font-semibold text-text">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-surface-muted">
                    <th className="px-4 py-2 text-left text-caption font-semibold text-text-secondary">
                      Book
                    </th>
                    <th className="px-4 py-2 text-right text-caption font-semibold text-text-secondary">
                      Price
                    </th>
                    <th className="px-4 py-2 text-right text-caption font-semibold text-text-secondary">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-caption font-semibold text-text-secondary">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-body-sm font-medium text-text">
                        {item.bookTitle}
                      </td>
                      <td className="px-4 py-3 text-right text-body-sm text-text-secondary">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-body-sm text-text">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-body-sm font-medium text-text">
                        {formatMoney(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-border px-4 py-3">
              <div className="space-y-1 text-right">
                <div className="flex justify-between text-body-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text">{formatMoney(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">Discount</span>
                    <span className="text-success">-{formatMoney(order.discount)}</span>
                  </div>
                )}
                {order.shippingFee > 0 && (
                  <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">Shipping</span>
                    <span className="text-text">{formatMoney(order.shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1 text-body font-semibold">
                  <span className="text-text">Total</span>
                  <span className="text-text">{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer information */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <User className="size-4 text-text-secondary" aria-hidden />
              <h2 className="text-body font-semibold text-text">Customer Information</h2>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-text-muted">Name</dt>
                <dd className="text-body-sm text-text">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Phone</dt>
                <dd className="text-body-sm text-text">{order.phone}</dd>
              </div>
              {order.alternatePhone && (
                <div>
                  <dt className="text-caption text-text-muted">Alternate Phone</dt>
                  <dd className="text-body-sm text-text">{order.alternatePhone}</dd>
                </div>
              )}
              <div>
                <dt className="text-caption text-text-muted">Email</dt>
                <dd className="text-body-sm text-text">{order.email}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-caption text-text-muted">Shipping Address</dt>
                <dd className="text-body-sm text-text whitespace-pre-wrap">
                  {order.shippingAddress}
                </dd>
              </div>
              {order.note && (
                <div className="sm:col-span-2">
                  <dt className="text-caption text-text-muted">Customer Note</dt>
                  <dd className="text-body-sm text-text whitespace-pre-wrap">
                    {order.note}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          {/* Status update form */}
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
          />

          {/* Payment information */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-text-secondary" aria-hidden />
              <h2 className="text-body font-semibold text-text">Payment</h2>
            </div>
            {order.payments.length > 0 ? (
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-control border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm font-medium text-text">
                        {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_STYLES[payment.status] ?? "bg-surface-muted text-text-muted"}`}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-body-sm text-text">
                      {formatMoney(payment.amount)}
                    </p>
                    <p className="text-caption text-text-muted">
                      Submitted {formatDate(payment.createdAt)}
                    </p>
                    {payment.transactionReference && (
                      <p className="text-caption text-text-muted">
                        Ref: {payment.transactionReference}
                      </p>
                    )}
                    {payment.slipUrl && (
                      <a
                        href={payment.slipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-caption text-brand transition-colors hover:text-brand/80"
                      >
                        <FileText className="size-3" aria-hidden />
                        View slip
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-text-muted">No payment submitted</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
