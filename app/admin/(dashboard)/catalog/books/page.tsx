import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listBooks, getCatalogOptions, isBookStatus } from "@/lib/admin/catalog-queries";
import {
  BOOK_SORT_OPTIONS,
  BOOK_STATUS_LABELS,
  BOOK_STATUS_VALUES,
  formatDate,
  formatMoney,
} from "@/lib/admin/catalog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminFilterForm } from "@/components/admin/AdminFilterForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BookRowActions } from "./BookRowActions";

export const metadata: Metadata = {
  title: "Books — Bookie Admin",
};

const BASE_PATH = "/admin/catalog/books";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

const statusSemantic = {
  DRAFT: "pending",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
} as const;

export default async function AdminBooksPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const q = pick(params, "q");
  const status = pick(params, "status");
  const category = pick(params, "category");
  const author = pick(params, "author");
  const publisher = pick(params, "publisher");
  const sort = pick(params, "sort");
  const notice = pick(params, "notice");
  const page = Number(pick(params, "page")) || 1;

  const [books, options] = await Promise.all([
    listBooks({ q, status, category, author, publisher, sort, page }),
    getCatalogOptions(),
  ]);

  const filtersActive = Boolean(q || status || category || author || publisher);

  return (
    <div>
      <AdminPageHeader
        title="Books"
        description="Manage the Bookie catalog — create, edit, publish and archive books."
        actions={
          <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            New book
          </Link>
        }
      />

      <AdminFeedback code={notice} />

      <AdminFilterForm
        action={BASE_PATH}
        search={{
          name: "q",
          value: q,
          label: "Search",
          placeholder: "Title, ISBN, publisher or author…",
        }}
        selects={[
          {
            name: "status",
            label: "Status",
            value: isBookStatus(status) ? status : "",
            allLabel: "All statuses",
            options: BOOK_STATUS_VALUES.map((s) => ({ value: s, label: BOOK_STATUS_LABELS[s] })),
          },
          {
            name: "category",
            label: "Category",
            value: category,
            allLabel: "All categories",
            options: options.categories.map((c) => ({ value: c.slug, label: c.name })),
          },
          {
            name: "author",
            label: "Author",
            value: author,
            allLabel: "All authors",
            options: options.authors.map((a) => ({ value: a.slug, label: a.name })),
          },
          {
            name: "publisher",
            label: "Publisher",
            value: publisher,
            allLabel: "All publishers",
            options: options.publishers.map((p) => ({ value: p, label: p })),
          },
          {
            name: "sort",
            label: "Sort",
            value: sort,
            // Distinct from BOOK_SORT_OPTIONS' "Newest first" — the empty value
            // is the default ordering, so it must not repeat an option label.
            allLabel: "Default (newest)",
            options: BOOK_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
        ]}
      />

      {books.items.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={filtersActive ? "No books match those filters" : "No books yet"}
          description={
            filtersActive
              ? "Try clearing the search or filters to see more of the catalog."
              : "Add your first book to start building the Bookie catalog."
          }
          action={
            filtersActive ? (
              <Link href={BASE_PATH} className={buttonVariants({ variant: "outline" })}>
                Clear filters
              </Link>
            ) : (
              <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
                <Plus className="size-4" aria-hidden />
                New book
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-xs md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Books in the catalog</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Book
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Publisher
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-semibold text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {books.items.map((book) => (
                  <tr key={book.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-muted">
                          {book.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={book.coverImage}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <BookMarked className="size-4 text-text-muted" aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/admin/catalog/books/${book.id}`}
                            className="block truncate text-body-sm font-medium text-text hover:underline"
                          >
                            {book.title}
                          </Link>
                          <span className="block truncate text-caption text-text-muted">
                            {book.authors.length > 0 ? book.authors.join(", ") : "No author"}
                            {book.isbn ? ` · ${book.isbn}` : ""}
                          </span>
                          <span className="block text-[10px] text-text-disabled">
                            Updated {formatDate(book.updatedAt)}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {book.categories.length > 0 ? book.categories.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {book.publisher ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-body-sm font-medium text-text">
                      {formatMoney(book.price)}
                    </td>
                    <td className="px-4 py-3 text-body-sm">
                      <span
                        className={
                          book.stockQuantity === 0
                            ? "font-semibold text-error"
                            : book.stockQuantity <= 5
                              ? "font-semibold text-warning"
                              : "text-text-secondary"
                        }
                      >
                        {book.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge semantic={statusSemantic[book.status]}>
                        {BOOK_STATUS_LABELS[book.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <BookRowActions id={book.id} title={book.title} status={book.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {books.items.map((book) => (
              <li
                key={book.id}
                className="rounded-card border border-border bg-surface p-4 shadow-xs"
              >
                <div className="flex gap-3">
                  <span className="flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-muted">
                    {book.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverImage} alt="" className="size-full object-cover" />
                    ) : (
                      <BookMarked className="size-4 text-text-muted" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/catalog/books/${book.id}`}
                      className="block text-body-sm font-semibold text-text hover:underline"
                    >
                      {book.title}
                    </Link>
                    <p className="text-caption text-text-muted">
                      {book.authors.length > 0 ? book.authors.join(", ") : "No author"}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                      <Badge semantic={statusSemantic[book.status]}>
                        {BOOK_STATUS_LABELS[book.status]}
                      </Badge>
                      <span>{formatMoney(book.price)}</span>
                      <span>Stock {book.stockQuantity}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <BookRowActions id={book.id} title={book.title} status={book.status} />
                </div>
              </li>
            ))}
          </ul>

          <AdminPagination
            basePath={BASE_PATH}
            page={books.page}
            pageCount={books.pageCount}
            total={books.total}
            itemLabel="books"
            params={{ q, status, category, author, publisher, sort }}
          />
        </>
      )}
    </div>
  );
}
