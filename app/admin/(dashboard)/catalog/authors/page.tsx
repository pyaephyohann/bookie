import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listAuthors } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminFilterForm } from "@/components/admin/AdminFilterForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { AuthorRowActions } from "./AuthorRowActions";

export const metadata: Metadata = {
  title: "Authors — Bookie Admin",
};

const BASE_PATH = "/admin/catalog/authors";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAuthorsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const sort = typeof params.sort === "string" ? params.sort : "";
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const authors = await listAuthors({ q, sort, page });

  return (
    <div>
      <AdminPageHeader
        title="Authors"
        description="Manage the authors shown across the Bookie storefront."
        actions={
          <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            New author
          </Link>
        }
      />

      <AdminFeedback code={notice} />

      <AdminFilterForm
        action={BASE_PATH}
        search={{ name: "q", value: q, label: "Search", placeholder: "Name or slug…" }}
        selects={[
          {
            name: "sort",
            label: "Sort",
            value: sort,
            allLabel: "Name A–Z",
            options: [{ value: "books", label: "Most books" }],
          },
        ]}
      />

      {authors.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No authors match that search" : "No authors yet"}
          description={
            q
              ? "Try a different name, or clear the search."
              : "Authors are linked to books so they appear on the storefront."
          }
          action={
            q ? (
              <Link href={BASE_PATH} className={buttonVariants({ variant: "outline" })}>
                Clear search
              </Link>
            ) : (
              <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
                <Plus className="size-4" aria-hidden />
                New author
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-xs md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Authors in the catalog</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Author
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Slug
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Books
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-semibold text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {authors.items.map((author) => (
                  <tr key={author.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted">
                          {author.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={author.photoUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="text-body-sm font-semibold text-text-muted">
                              {author.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`${BASE_PATH}/${author.id}`}
                            className="block truncate text-body-sm font-medium text-text hover:underline"
                          >
                            {author.name}
                          </Link>
                          <span className="block max-w-md truncate text-caption text-text-muted">
                            {author.biography ?? "No biography"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-muted">/{author.slug}</td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">{author.bookCount}</td>
                    <td className="px-4 py-3">
                      <AuthorRowActions
                        id={author.id}
                        name={author.name}
                        bookCount={author.bookCount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {authors.items.map((author) => (
              <li key={author.id} className="rounded-card border border-border bg-surface p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted">
                    {author.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={author.photoUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-body-sm font-semibold text-text-muted">
                        {author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`${BASE_PATH}/${author.id}`}
                      className="block text-body-sm font-semibold text-text hover:underline"
                    >
                      {author.name}
                    </Link>
                    <p className="text-caption text-text-muted">
                      {author.bookCount} book{author.bookCount === 1 ? "" : "s"} · /{author.slug}
                    </p>
                  </div>
                </div>
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <AuthorRowActions
                    id={author.id}
                    name={author.name}
                    bookCount={author.bookCount}
                  />
                </div>
              </li>
            ))}
          </ul>

          <AdminPagination
            basePath={BASE_PATH}
            page={authors.page}
            pageCount={authors.pageCount}
            total={authors.total}
            itemLabel="authors"
            params={{ q, sort }}
          />
        </>
      )}
    </div>
  );
}
