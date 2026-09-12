import type { Metadata } from "next";
import Link from "next/link";
import { Search, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  getPaymentOverview,
  listPayments,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_SORT_OPTIONS,
} from "@/lib/admin/payment-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatDate, formatMoney } from "@/lib/admin/catalog";
import { METHOD_LABELS, type PaymentMethod } from "@/lib/payment";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payments — Bookie Admin",
};

// ── Status badge colors ────────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const method = typeof params.method === "string" ? params.method : "";
  const sort = typeof params.sort === "string" ? params.sort : "";
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const [overview, payments] = await Promise.all([
    getPaymentOverview(),
    listPayments({
      q: q || undefined,
      status: status || undefined,
      method: method || undefined,
      sort: sort || undefined,
      page,
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="Manage payment records and verification"
      />

      {/* Overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <CreditCard className="size-4" aria-hidden />
            Total
          </div>
          <p className="mt-1 text-h2 font-bold text-text">{overview.totalPayments}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <Clock className="size-4 text-pending" aria-hidden />
            Pending
          </div>
          <p className="mt-1 text-h2 font-bold text-pending">{overview.pending}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <CheckCircle className="size-4 text-success" aria-hidden />
            Verified
          </div>
          <p className="mt-1 text-h2 font-bold text-success">{overview.verified}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <XCircle className="size-4 text-error" aria-hidden />
            Rejected
          </div>
          <p className="mt-1 text-h2 font-bold text-error">{overview.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="mb-1 block text-caption text-text-secondary">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="BookPass, customer, reference…"
              className="w-full rounded-control border border-border bg-surface py-2 pl-9 pr-3 text-body-sm text-text placeholder:text-text-muted focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </div>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="status" className="mb-1 block text-caption text-text-secondary">
            Payment Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {PAYMENT_STATUS_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="method" className="mb-1 block text-caption text-text-secondary">
            Payment Method
          </label>
          <select
            id="method"
            name="method"
            defaultValue={method}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {PAYMENT_METHOD_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="sort" className="mb-1 block text-caption text-text-secondary">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {PAYMENT_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="primary" size="sm">
          Apply
        </Button>
      </form>

      {/* Table */}
      {payments.items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <CreditCard className="mx-auto size-10 text-text-muted" aria-hidden />
          <p className="mt-3 text-body font-medium text-text">No payments found</p>
          <p className="mt-1 text-body-sm text-text-secondary">
            {q || status || method
              ? "Try adjusting your search or filters."
              : "Payments will appear here when customers submit them."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  BookPass
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  Method
                </th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.items.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border last:border-0 hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${payment.orderId}`}
                      className="text-body-sm font-medium text-text transition-colors hover:text-brand"
                    >
                      {payment.bookPass}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-body-sm text-text">
                      {payment.customerName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-body-sm text-text-secondary">
                      {METHOD_LABELS[payment.method as PaymentMethod] ?? payment.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-body-sm font-semibold text-text">
                      {formatMoney(payment.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_STYLES[payment.status] ?? "bg-surface-muted text-text-muted"}`}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {payment.transactionReference ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/payments/${payment.id}`}
                      className="inline-flex items-center gap-1 rounded-control border border-border px-3 py-1.5 text-caption font-medium text-text transition-colors hover:bg-surface-muted"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6">
        <AdminPagination
          basePath="/admin/payments"
          page={payments.page}
          pageCount={payments.pageCount}
          total={payments.total}
          itemLabel="payments"
          params={{ q, status, method, sort }}
        />
      </div>
    </div>
  );
}
