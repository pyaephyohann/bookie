import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package, AlertTriangle, XCircle, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  getInventoryOverview,
  listInventory,
  getStockStatus,
  STOCK_STATUS_LABELS,
  INVENTORY_SORT_OPTIONS,
  INVENTORY_STATUS_FILTERS,
  type StockStatus,
} from "@/lib/admin/inventory-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatDate } from "@/lib/admin/catalog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Inventory — Bookie Admin",
};

// ── Status badge colors ────────────────────────────────────────────────────

const STATUS_STYLES: Record<StockStatus, string> = {
  IN_STOCK: "bg-success/15 text-success",
  LOW_STOCK: "bg-pending/15 text-pending",
  OUT_OF_STOCK: "bg-error/15 text-error",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const sort = typeof params.sort === "string" ? params.sort : "";
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const [overview, inventory] = await Promise.all([
    getInventoryOverview(),
    listInventory({ q: q || undefined, status: status || undefined, sort: sort || undefined, page }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Manage stock levels and view transaction history"
        actions={
          <Link
            href="/admin/inventory/history"
            className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-body-sm font-medium text-text transition-colors hover:bg-surface-muted"
          >
            <Package className="size-4" aria-hidden />
            Transaction History
          </Link>
        }
      />

      {/* Overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <Package className="size-4" aria-hidden />
            Total Books
          </div>
          <p className="mt-1 text-h2 font-bold text-text">{overview.totalBooks}</p>
          <p className="text-caption text-text-muted">{overview.totalUnits.toLocaleString()} units</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <AlertTriangle className="size-4 text-pending" aria-hidden />
            Low Stock
          </div>
          <p className="mt-1 text-h2 font-bold text-pending">{overview.lowStockBooks}</p>
          <p className="text-caption text-text-muted">1–5 units</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <XCircle className="size-4 text-error" aria-hidden />
            Out of Stock
          </div>
          <p className="mt-1 text-h2 font-bold text-error">{overview.outOfStockBooks}</p>
          <p className="text-caption text-text-muted">0 units</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-caption text-text-secondary">
            <Package className="size-4 text-success" aria-hidden />
            In Stock
          </div>
          <p className="mt-1 text-h2 font-bold text-success">
            {overview.totalBooks - overview.lowStockBooks - overview.outOfStockBooks}
          </p>
          <p className="text-caption text-text-muted">6+ units</p>
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
              placeholder="Title, ISBN, or author…"
              className="w-full rounded-control border border-border bg-surface py-2 pl-9 pr-3 text-body-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="status" className="mb-1 block text-caption text-text-secondary">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {INVENTORY_STATUS_FILTERS.map((f) => (
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
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {INVENTORY_SORT_OPTIONS.map((o) => (
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
      {inventory.items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <Package className="mx-auto size-10 text-text-muted" aria-hidden />
          <p className="mt-3 text-body font-medium text-text">No inventory records found</p>
          <p className="mt-1 text-body-sm text-text-secondary">
            {q || status ? "Try adjusting your search or filters." : "Add books to see inventory data."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Book</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">ISBN</th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">Stock</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Transactions</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Last Activity</th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.items.map((item) => {
                const stockStatus = getStockStatus(item.stockQuantity);
                return (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded bg-surface-muted text-text-muted">
                            <Package className="size-5" aria-hidden />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-body-sm font-medium text-text">{item.title}</p>
                          {item.authors.length > 0 && (
                            <p className="truncate text-caption text-text-muted">
                              {item.authors.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {item.isbn ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-body-sm font-semibold ${stockStatus === "OUT_OF_STOCK" ? "text-error" : stockStatus === "LOW_STOCK" ? "text-pending" : "text-text"}`}>
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[stockStatus]}`}>
                        {STOCK_STATUS_LABELS[stockStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {item.transactionCount}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {item.lastTransactionAt ? formatDate(item.lastTransactionAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/inventory/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-control border border-border px-3 py-1.5 text-caption font-medium text-text transition-colors hover:bg-surface-muted"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6">
        <AdminPagination
          basePath="/admin/inventory"
          page={inventory.page}
          pageCount={inventory.pageCount}
          total={inventory.total}
          itemLabel="books"
          params={{ q, status, sort }}
        />
      </div>
    </div>
  );
}


