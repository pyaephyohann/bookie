import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getReadingBookForEdit } from "@/lib/admin/content-queries";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BookStatusBadge } from "@/components/ui/badge";
import { ReadingContentForm } from "../ReadingContentForm";
import { deleteReadingContentAction, saveReadingContentAction } from "../actions";
import type { ReadingMode } from "@/lib/admin/content";

export const metadata: Metadata = { title: "Manage Reading Content — Bookie Admin" };

interface PageProps {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function ReadingContentEditPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { bookId } = await params;
  const query = await searchParams;
  const book = await getReadingBookForEdit(bookId);
  if (!book) notFound();

  const mode: ReadingMode = book.content
    ? "INLINE"
    : book.contentType === "PDF" || book.contentType === "EPUB"
      ? book.contentType
      : book.fileUrl
        ? "OTHER"
        : "INLINE";

  return (
    <div>
      <Link href="/admin/content/reading" className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden /> Back to reading content
      </Link>
      <AdminPageHeader
        title={book.title}
        description={`Manage the BookContent record for /books/${book.slug}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BookStatusBadge status={book.status} />
            {book.status === "PUBLISHED" && (
              <Link href={`/books/${book.slug}/read`} target="_blank" className="inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text">
                View reader <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        }
      />
      <AdminFeedback code={pick(query, "notice")} />

      <div className="mb-6 rounded-card border border-border bg-surface px-4 py-3 text-body-sm text-text-secondary shadow-xs">
        <p><strong className="font-semibold text-text">Representation:</strong> {book.contentId ? (book.content ? "Inline HTML/plain text" : `${book.contentType ?? "Other"} file`) : "No BookContent record yet"}.</p>
        <p className="mt-1 text-caption text-text-muted">Inline content is sanitized server-side before storage. Deleting content also disables Read Online for this book.</p>
      </div>

      <ReadingContentForm
        bookId={book.bookId}
        action={saveReadingContentAction}
        initial={{ mode, content: book.content, fileUrl: book.fileUrl, isReadableOnline: book.isReadableOnline }}
      />

      {book.contentId && (
        <div className="mt-10 border-t border-border pt-6">
          <h2 className="text-h4 text-text">Danger zone</h2>
          <p className="mt-1 text-body-sm text-text-secondary">Remove this book&apos;s BookContent record and disable online reading.</p>
          <form action={deleteReadingContentAction} className="mt-3">
            <input type="hidden" name="bookId" value={book.bookId} />
            <AdminConfirmSubmit variant="danger" confirmLabel="Delete content" question={`Delete reading content for “${book.title}”?`}>
              Delete reading content
            </AdminConfirmSubmit>
          </form>
        </div>
      )}
    </div>
  );
}
