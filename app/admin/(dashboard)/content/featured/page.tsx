import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getFeaturedBookOptions, getManagedFeaturedSections } from "@/lib/admin/content-queries";
import { FEATURED_SECTION_LABELS } from "@/lib/admin/content";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assignFeaturedBookAction, removeFeaturedBookAction, reorderFeaturedBookAction } from "./actions";

export const metadata: Metadata = { title: "Featured Books — Bookie Admin" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function FeaturedBooksPage({ searchParams }: PageProps) {
  await requireAdmin();
  const query = await searchParams;
  const [sections, books] = await Promise.all([getManagedFeaturedSections(), getFeaturedBookOptions()]);

  return (
    <div>
      <AdminPageHeader title="Featured Books" description="Control the FeaturedBook sections currently consumed by the storefront." />
      <AdminFeedback code={pick(query, "notice")} />

      <div className="mb-6 rounded-card border border-border bg-surface p-4 text-body-sm text-text-secondary shadow-xs">
        <p className="font-semibold text-text">Managed storefront sections</p>
        <p className="mt-1">Trending, Best sellers, Staff picks, and Recommended use the existing FeaturedBook table and sortOrder. New releases and promotions are computed independently and are not managed here.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        {sections.map((section) => (
          <section key={section.section} className="rounded-card border border-border bg-surface shadow-xs">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-h4 text-text">{FEATURED_SECTION_LABELS[section.section]}</h2>
              <p className="mt-0.5 text-caption text-text-muted">{section.items.length} assigned book{section.items.length === 1 ? "" : "s"}</p>
            </div>
            <div className="p-5">
              <form action={assignFeaturedBookAction} className="space-y-2">
                <input type="hidden" name="section" value={section.section} />
                <label htmlFor={`${section.section}-book`} className="text-label text-text">Assign published book</label>
                <div className="flex gap-2">
                  <select id={`${section.section}-book`} name="bookId" className="h-10 min-w-0 flex-1 rounded-control border border-border bg-surface px-2 text-body-sm text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink" defaultValue="">
                    <option value="">Choose a book…</option>
                    {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                  </select>
                  <button type="submit" className={buttonVariants({ variant: "primary", size: "sm" })}>Assign</button>
                </div>
              </form>

              {section.items.length === 0 ? (
                <EmptyState icon={Star} title="No books assigned" description="Assign a published book to populate this storefront shelf." />
              ) : (
                <ol className="mt-5 space-y-2" aria-label={`${FEATURED_SECTION_LABELS[section.section]} books`}>
                  {section.items.map((item, index) => (
                    <li key={item.id} className="flex items-center gap-2 rounded-control border border-border-subtle p-2">
                      <span className="w-5 shrink-0 text-center text-caption font-semibold text-text-muted">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/catalog/books/${item.bookId}`} className="block truncate text-body-sm font-medium text-text hover:underline">{item.title}</Link>
                        <div className="mt-0.5 flex flex-wrap gap-1.5">
                          <Badge semantic={item.status === "PUBLISHED" ? "success" : "warning"}>{item.status}</Badge>
                          <span className="text-caption text-text-muted">sortOrder {item.sortOrder}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <form action={reorderFeaturedBookAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button type="submit" disabled={index === 0} aria-label={`Move ${item.title} up`} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-control border border-border text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="size-3.5" aria-hidden /></button>
                        </form>
                        <form action={reorderFeaturedBookAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button type="submit" disabled={index === section.items.length - 1} aria-label={`Move ${item.title} down`} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-control border border-border text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"><ArrowDown className="size-3.5" aria-hidden /></button>
                        </form>
                        <form action={removeFeaturedBookAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <AdminConfirmSubmit variant="ghost" size="sm" confirmLabel="Remove" question={`Remove “${item.title}”?`} ariaLabel={`Remove ${item.title}`}>
                            Remove
                          </AdminConfirmSubmit>
                        </form>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
