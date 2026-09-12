import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listPublishers } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminFilterForm } from "@/components/admin/AdminFilterForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { PublisherRow } from "./PublisherRow";

export const metadata: Metadata = {
  title: "Publishers — Bookie Admin",
};

const BASE_PATH = "/admin/catalog/publishers";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminPublishersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const publishers = await listPublishers({ q, page });

  return (
    <div>
      <AdminPageHeader
        title="Publishers"
        description="Publishers come from the publisher field on each book — no separate records to maintain."
      />

      <AdminFeedback code={notice} />

      <p className="mb-5 rounded-control border border-border bg-surface-muted px-3 py-2.5 text-caption text-text-muted">
        Renaming a publisher updates every book that uses it. To add a new publisher, type it into
        the publisher field when creating or editing a book.
      </p>

      <AdminFilterForm
        action={BASE_PATH}
        search={{ name: "q", value: q, label: "Search", placeholder: "Publisher name…" }}
      />

      {publishers.items.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={q ? "No publishers match that search" : "No publishers yet"}
          description={
            q
              ? "Try a different publisher name."
              : "Add a publisher by filling the publisher field on any book."
          }
          action={
            q ? (
              <Link href={BASE_PATH} className={buttonVariants({ variant: "outline" })}>
                Clear search
              </Link>
            ) : (
              <Link
                href="/admin/catalog/books/new"
                className={buttonVariants({ variant: "primary" })}
              >
                Add a book
              </Link>
            )
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {publishers.items.map((publisher) => (
              <PublisherRow
                key={publisher.name}
                name={publisher.name}
                bookCount={publisher.bookCount}
                publishedCount={publisher.publishedCount}
              />
            ))}
          </ul>

          <AdminPagination
            basePath={BASE_PATH}
            page={publishers.page}
            pageCount={publishers.pageCount}
            total={publishers.total}
            itemLabel="publishers"
            params={{ q }}
          />
        </>
      )}
    </div>
  );
}
