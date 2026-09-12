import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Package, ShoppingCart } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getBookForEdit, getCatalogOptions } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { BookStatusBadge } from "@/components/ui/badge";
import { BookForm, type BookFormInitial } from "../BookForm";
import { updateBookAction } from "../actions";

export const metadata: Metadata = {
  title: "Edit book — Bookie Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditBookPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;

  const [book, options] = await Promise.all([getBookForEdit(id), getCatalogOptions()]);
  if (!book) notFound();

  const initial: BookFormInitial = {
    title: book.title,
    slug: book.slug,
    description: book.description,
    isbn: book.isbn,
    publisher: book.publisher,
    publishedAt: book.publishedAt,
    price: book.price,
    compareAtPrice: book.compareAtPrice,
    stockQuantity: book.stockQuantity,
    status: book.status,
    coverImage: book.coverImage,
    isReadableOnline: book.isReadableOnline,
    metaTitle: book.metaTitle,
    metaDescription: book.metaDescription,
    authorIds: book.authorIds,
    categoryIds: book.categoryIds,
  };

  return (
    <div>
      <Link
        href="/admin/catalog/books"
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to books
      </Link>

      <AdminPageHeader
        title={book.title}
        description={`Slug: /books/${book.slug}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BookStatusBadge status={book.status} />
            {book.status === "PUBLISHED" && (
              <Link
                href={`/books/${book.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
              >
                View in storefront
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        }
      />

      <AdminFeedback code={notice} />

      <div className="mb-6 flex flex-wrap gap-4 rounded-card border border-border bg-surface px-4 py-3 text-caption text-text-muted shadow-xs">
        <span className="inline-flex items-center gap-1.5">
          <ShoppingCart className="size-3.5" aria-hidden />
          {book.orderItemCount} order {book.orderItemCount === 1 ? "line" : "lines"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Package className="size-3.5" aria-hidden />
          {book.inventoryCount} inventory movements
        </span>
        {book.orderItemCount > 0 || book.inventoryCount > 0 ? (
          <span>Order/inventory history exists — this book can be archived but not deleted.</span>
        ) : (
          <span>No order history — this book can be safely deleted.</span>
        )}
      </div>

      <BookForm
        mode="edit"
        action={updateBookAction}
        bookId={book.id}
        initial={initial}
        authors={options.authors}
        categories={options.categories}
        publishers={options.publishers}
      />
    </div>
  );
}
