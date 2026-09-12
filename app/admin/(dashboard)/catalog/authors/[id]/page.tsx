import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAuthorForEdit } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AuthorForm } from "../AuthorForm";
import { updateAuthorAction } from "../actions";

export const metadata: Metadata = {
  title: "Edit author — Bookie Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditAuthorPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;

  const author = await getAuthorForEdit(id);
  if (!author) notFound();

  return (
    <div>
      <Link
        href="/admin/catalog/authors"
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to authors
      </Link>

      <AdminPageHeader
        title={author.name}
        description={`${author.bookCount} linked book${author.bookCount === 1 ? "" : "s"} · slug /${author.slug}`}
        actions={
          <Link
            href={`/authors/${author.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
          >
            View in storefront
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        }
      />

      <AdminFeedback code={notice} />

      {author.bookCount > 0 && (
        <p className="mb-5 rounded-control border border-border bg-surface-muted px-3 py-2.5 text-caption text-text-muted">
          This author is linked to {author.bookCount} book
          {author.bookCount === 1 ? "" : "s"}. Unlink those books before deleting the author.
        </p>
      )}

      <AuthorForm
        mode="edit"
        action={updateAuthorAction}
        authorId={author.id}
        initial={{
          name: author.name,
          slug: author.slug,
          biography: author.biography,
          photoUrl: author.photoUrl,
        }}
      />
    </div>
  );
}
