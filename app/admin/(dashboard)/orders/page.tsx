import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShoppingBag, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  getOrderOverview,
  listOrders,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  ORDER_SORT_OPTIONS,
} from "@/lib/admin/order-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatDate, formatMoney } from "@/lib/admin/catalog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Orders — Bookie Admin",
};

// ── Status badge colors ────────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────────────────────

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const paymentStatus = typeof params.paymentStatus === "string" ? params.paymentStatus : "";
  const sort = typeof params.sort === "string" ? params.sort : "";
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const [overview, orders] = await Promise.all([
    getOrderOverview(),
    listOrders({
      q: q || undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      sort: sort || undefined,
      page,
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Manage customer orders and status updates"
      />

      {/* Overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <ShoppingBag className="size-4" aria-hidden />
            Total
          </div>
          <p className="mt-1 text-h2 font-bold text-text">{overview.totalOrders}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <Clock className="size-4 text-info" aria-hidden />
            Placed
          </div>
          <p className="mt-1 text-h2 font-bold text-info">{overview.placed}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <CheckCircle className="size-4 text-text" aria-hidden />
            Confirmed
          </div>
          <p className="mt-1 text-h2 font-bold text-text">{overview.confirmed}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <Truck className="size-4 text-info" aria-hidden />
            Shipped
          </div>
          <p className="mt-1 text-h2 font-bold text-info">{overview.shipped}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <CheckCircle className="size-4 text-success" aria-hidden />
            Delivered
          </div>
          <p className="mt-1 text-h2 font-bold text-success">{overview.delivered}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <XCircle className="size-4 text-error" aria-hidden />
            Rejected / Cancelled
          </div>
          <p className="mt-1 text-h2 font-bold text-error">{overview.rejectedCancelled}</p>
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
              placeholder="BookPass, customer, phone, email…"
              className="w-full rounded-control border border-border bg-surface py-2 pl-9 pr-3 text-body-sm text-text placeholder:text-text-muted focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </div>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="status" className="mb-1 block text-caption text-text-secondary">
            Order Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {ORDER_STATUS_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="paymentStatus" className="mb-1 block text-caption text-text-secondary">
            Payment Status
          </label>
          <select
            id="paymentStatus"
            name="paymentStatus"
            defaultValue={paymentStatus}
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
          <label htmlFor="sort" className="mb-1 block text-caption text-text-secondary">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {ORDER_SORT_OPTIONS.map((o) => (
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
      {orders.items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <ShoppingBag className="mx-auto size-10 text-text-muted" aria-hidden />
          <p className="mt-3 text-body font-medium text-text">No orders found</p>
          <p className="mt-1 text-body-sm text-text-secondary">
            {q || status || paymentStatus
              ? "Try adjusting your search or filters."
              : "Orders will appear here when customers place them."}
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
                  Date
                </th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.items.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-3">
                    <span className="text-body-sm font-medium text-text">
                      {order.bookPass}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-medium text-text">
                        {order.customerName}
                      </p>
                      <p className="truncate text-caption text-text-muted">
                        {order.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm text-text-secondary">
                    {order.itemCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-body-sm font-semibold text-text">
                      {formatMoney(order.total)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.paymentStatus ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_STYLES[order.paymentStatus] ?? "bg-surface-muted text-text-muted"}`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    ) : (
                      <span className="text-caption text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ORDER_STATUS_STYLES[order.status] ?? "bg-surface-muted text-text-muted"}`}
                    >
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
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
          basePath="/admin/orders"
          page={orders.page}
          pageCount={orders.pageCount}
          total={orders.total}
          itemLabel="orders"
          params={{ q, status, paymentStatus, sort }}
        />
      </div>
    </div>
  );
}
