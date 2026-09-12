import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listAllTransactions, TRANSACTION_TYPE_LABELS } from "@/lib/admin/inventory-queries";
import { formatDate } from "@/lib/admin/catalog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";

export const metadata: Metadata = {
  title: "Transaction History — Bookie Admin",
};

export default async function TransactionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const transactions = await listAllTransactions(page);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Inventory
        </Link>
      </div>

      <AdminPageHeader
        title="Transaction History"
        description="All stock movements across all books"
      />

      {transactions.items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <Package className="mx-auto size-10 text-text-muted" aria-hidden />
          <p className="mt-3 text-body font-medium text-text">No transactions yet</p>
          <p className="mt-1 text-body-sm text-text-secondary">
            Stock adjustments will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Book</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Type</th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">Qty</th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">Before</th>
                <th className="px-4 py-3 text-right text-caption font-semibold text-text-secondary">After</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Note</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.items.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/inventory/${tx.bookId}`}
                      className="text-body-sm font-medium text-text transition-colors hover:text-brand"
                    >
                      {tx.bookTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      tx.type === "RESTOCK" || tx.type === "RETURN"
                        ? "bg-success/15 text-success"
                        : tx.type === "DAMAGE" || tx.type === "SALE"
                        ? "bg-error/15 text-error"
                        : "bg-info/15 text-info"
                    }`}>
                      {TRANSACTION_TYPE_LABELS[tx.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-medium text-text">
                    {tx.type === "DAMAGE" || tx.type === "SALE" ? "−" : "+"}{tx.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm text-text-secondary">
                    {tx.stockBefore}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm font-medium text-text">
                    {tx.stockAfter}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-body-sm text-text-secondary">
                    {tx.note ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <AdminPagination
          basePath="/admin/inventory/history"
          page={transactions.page}
          pageCount={transactions.pageCount}
          total={transactions.total}
          itemLabel="transactions"
        />
      </div>
    </div>
  );
}
