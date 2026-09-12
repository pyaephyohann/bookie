import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBookInventoryDetail, listTransactions, getStockStatus, STOCK_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/admin/inventory-queries";
import { formatDate } from "@/lib/admin/catalog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { InventoryAdjustForm } from "../InventoryAdjustForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBookInventoryDetail(bookId);
  return {
    title: book ? `Inventory: ${book.title} — Bookie Admin` : "Inventory — Bookie Admin",
  };
}

export default async function BookInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const { bookId } = await params;
  const sp = await searchParams;
  const txPage = typeof sp.txPage === "string" ? Number(sp.txPage) || 1 : 1;

  const book = await getBookInventoryDetail(bookId);
  if (!book) notFound();

  const transactions = await listTransactions(bookId, txPage);
  const stockStatus = getStockStatus(book.stockQuantity);

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
        title={book.title}
        description={`Inventory management for this book`}
      />

      {/* Book info + current stock */}
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Book details */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start gap-4">
              {book.coverImage ? (
                <Image src={book.coverImage} alt="" width={80} height={80} className="size-20 shrink-0 rounded object-cover" unoptimized />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded bg-surface-muted text-text-muted">
                  <Package className="size-8" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-body font-semibold text-text">{book.title}</h2>
                {book.authors.length > 0 && (
                  <p className="text-body-sm text-text-secondary">{book.authors.join(", ")}</p>
                )}
                {book.isbn && (
                  <p className="mt-1 text-caption text-text-muted">ISBN: {book.isbn}</p>
                )}
                {book.categories.length > 0 && (
                  <p className="text-caption text-text-muted">
                    Categories: {book.categories.join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-caption uppercase text-text-muted">Current Stock</p>
                <p className={`mt-1 text-h2 font-bold ${
                  stockStatus === "OUT_OF_STOCK" ? "text-error" :
                  stockStatus === "LOW_STOCK" ? "text-pending" : "text-text"
                }`}>
                  {book.stockQuantity}
                </p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  stockStatus === "OUT_OF_STOCK" ? "bg-error/15 text-error" :
                  stockStatus === "LOW_STOCK" ? "bg-pending/15 text-pending" :
                  "bg-success/15 text-success"
                }`}>
                  {STOCK_STATUS_LABELS[stockStatus]}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-body font-semibold text-text">Transaction History</h3>
            </div>
            {transactions.items.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="mx-auto size-8 text-text-muted" aria-hidden />
                <p className="mt-2 text-body-sm text-text-secondary">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted">
                      <th className="px-4 py-2 text-left text-caption font-semibold text-text-secondary">Type</th>
                      <th className="px-4 py-2 text-right text-caption font-semibold text-text-secondary">Qty</th>
                      <th className="px-4 py-2 text-right text-caption font-semibold text-text-secondary">Before</th>
                      <th className="px-4 py-2 text-right text-caption font-semibold text-text-secondary">After</th>
                      <th className="px-4 py-2 text-left text-caption font-semibold text-text-secondary">Note</th>
                      <th className="px-4 py-2 text-left text-caption font-semibold text-text-secondary">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.items.map((tx) => (
                      <tr key={tx.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">
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
                        <td className="px-4 py-2 text-right text-body-sm font-medium text-text">
                          {tx.type === "DAMAGE" || tx.type === "SALE" ? "−" : "+"}{tx.quantity}
                        </td>
                        <td className="px-4 py-2 text-right text-body-sm text-text-secondary">
                          {tx.stockBefore}
                        </td>
                        <td className="px-4 py-2 text-right text-body-sm font-medium text-text">
                          {tx.stockAfter}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-2 text-body-sm text-text-secondary">
                          {tx.note ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-body-sm text-text-secondary">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-border px-4 py-3">
              <AdminPagination
                basePath={`/admin/inventory/${bookId}`}
                page={transactions.page}
                pageCount={transactions.pageCount}
                total={transactions.total}
                itemLabel="transactions"
                params={{ txPage: String(txPage) }}
              />
            </div>
          </div>
        </div>

        {/* Adjustment sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <InventoryAdjustForm bookId={book.id} currentStock={book.stockQuantity} />
        </div>
      </div>
    </div>
  );
}
