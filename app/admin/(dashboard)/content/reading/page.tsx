import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listReadingBooks } from "@/lib/admin/content-queries";
import { formatDate } from "@/lib/admin/catalog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, BookStatusBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reading Content — Bookie Admin" };

const BASE_PATH = "/admin/content/reading";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function contentLabel(contentType: string | null, hasContent: boolean): string {
  if (!hasContent) return "No content";
  if (!contentType || contentType === "OTHER") return "Inline / other";
  return contentType;
}

export default async function ReadingContentPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const q = pick(params, "q");
  const status = pick(params, "status");
  const content = pick(params, "content");
  const page = Number(pick(params, "page")) || 1;
  const notice = pick(params, "notice");

  const books = await listReadingBooks({ q, status, content, page });
  const filtersActive = Boolean(q || status || content);

  return (
    <div>
      <AdminPageHeader
        title="Reading Content"
        description="Manage the existing BookContent record and online-reading availability for each book."
        actions={
          <Link href="/admin/catalog/books/new" className={buttonVariants({ variant: "outline" })}>
            <Plus className="size-4" aria-hidden />
            New book
          </Link>
        }
      />
      <AdminFeedback code={notice} />

      <form
        method="get"
        className="mb-6 grid grid-cols-1 gap-3 rounded-card border border-border bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-label text-text">Search books</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Title, slug or ISBN…"
            className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text placeholder:text-text-disabled focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
          />
        </label>
        <label>
          <span className="mb-1 block text-label text-text">Book status</span>
          <select
            name="status"
            defaultValue={status}
            className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-label text-text">Reading content</span>
          <select
            name="content"
            defaultValue={content}
            className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            <option value="">All content states</option>
            <option value="available">Has content</option>
            <option value="missing">No content record</option>
            <option value="enabled">Reading enabled</option>
            <option value="disabled">Reading disabled</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={buttonVariants({ variant: "primary" })}>
            Filter
          </button>
          {filtersActive && (
            <Link href={BASE_PATH} className={buttonVariants({ variant: "ghost" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {books.items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filtersActive ? "No books match those filters" : "No books yet"}
          description={
            filtersActive
              ? "Try clearing the search or filters."
              : "Create a book in the catalog before adding reading content."
          }
          action={
            <Link href={filtersActive ? BASE_PATH : "/admin/catalog/books/new"} className={buttonVariants({ variant: "outline" })}>
              {filtersActive ? "Clear filters" : "Create a book"}
            </Link>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-xs md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Reading content by book</caption>
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Book</th>
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Book status</th>
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Content</th>
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Updated</th>
                  <th className="px-4 py-3 text-right text-caption font-semibold text-text-muted" scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {books.items.map((book) => (
                  <tr key={book.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`${BASE_PATH}/${book.id}`} className="font-medium text-text hover:underline">{book.title}</Link>
                      <p className="text-caption text-text-muted">/books/{book.slug}</p>
                    </td>
                    <td className="px-4 py-3"><BookStatusBadge status={book.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge semantic={book.hasContent ? "success" : "neutral"}>{contentLabel(book.contentType, book.hasContent)}</Badge>
                        <Badge semantic={book.isReadableOnline ? "info" : "neutral"}>{book.isReadableOnline ? "Enabled" : "Disabled"}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">{formatDate(book.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`${BASE_PATH}/${book.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        <Pencil className="size-3.5" aria-hidden />
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {books.items.map((book) => (
              <li key={book.id} className="rounded-card border border-border bg-surface p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`${BASE_PATH}/${book.id}`} className="font-semibold text-text hover:underline">{book.title}</Link>
                    <p className="mt-1 text-caption text-text-muted">Updated {formatDate(book.updatedAt)}</p>
                  </div>
                  <BookStatusBadge status={book.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge semantic={book.hasContent ? "success" : "neutral"}>{contentLabel(book.contentType, book.hasContent)}</Badge>
                  <Badge semantic={book.isReadableOnline ? "info" : "neutral"}>{book.isReadableOnline ? "Enabled" : "Disabled"}</Badge>
                </div>
                <Link href={`${BASE_PATH}/${book.id}`} className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-3`}>
                  <Pencil className="size-3.5" aria-hidden />
                  Manage reading content
                </Link>
              </li>
            ))}
          </ul>

          <AdminPagination
            basePath={BASE_PATH}
            page={books.page}
            pageCount={books.pageCount}
            total={books.total}
            itemLabel="books"
            params={{ q, status, content }}
          />
        </>
      )}
    </div>
  );
}
