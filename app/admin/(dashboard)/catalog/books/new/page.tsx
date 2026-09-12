import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCatalogOptions } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BookForm, type BookFormInitial } from "../BookForm";
import { createBookAction } from "../actions";

export const metadata: Metadata = {
  title: "New book — Bookie Admin",
};

const EMPTY_BOOK: BookFormInitial = {
  title: "",
  slug: "",
  description: "",
  isbn: "",
  publisher: "",
  publishedAt: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "0",
  status: "DRAFT",
  coverImage: "",
  isReadableOnline: false,
  metaTitle: "",
  metaDescription: "",
  authorIds: [],
  categoryIds: [],
};

export default async function NewBookPage() {
  await requireAdmin();
  const options = await getCatalogOptions();

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
        title="New book"
        description="Create a catalog entry. Books start as drafts until you publish them."
      />

      <BookForm
        mode="create"
        action={createBookAction}
        initial={EMPTY_BOOK}
        authors={options.authors}
        categories={options.categories}
        publishers={options.publishers}
      />
    </div>
  );
}
