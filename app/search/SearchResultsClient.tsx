"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { SearchResults } from "@/lib/data";

export function SearchResultsClient({ results }: { results: SearchResults }) {
  const reduce = useReducedMotion() ?? false;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? results.query);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [query, router],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display mb-2 font-extrabold tracking-tight">Search</h1>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mt-6 mb-10 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, categories…"
            aria-label="Search books, authors and categories"
            className="h-12 w-full rounded-control border border-border bg-surface pl-11 pr-4 text-body text-text placeholder:text-text-disabled transition-colors hover:border-border-strong focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
        </div>
      </form>

      {/* Results */}
      {results.query ? (
        <p className="text-body-sm text-text-muted mb-6">
          {results.books.length === 0
            ? `No results for "${results.query}"`
            : `${results.books.length} result${results.books.length === 1 ? "" : "s"} for "${results.query}"`}
        </p>
      ) : (
        <p className="text-body-sm text-text-muted mb-6">
          Type a search term above to find books, authors, and categories.
        </p>
      )}

      {results.books.length === 0 && results.query ? (
        <EmptyState
          title="No books found"
          description="Try a different search term — title, author, category, or ISBN."
          icon={SearchX}
          action={
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-control bg-brand px-5 py-2.5 text-button text-brand-on transition-colors hover:bg-brand-hover"
            >
              Browse Home
            </Link>
          }
        />
      ) : results.books.length > 0 ? (
        <motion.div
          variants={stagger(reduce, 0.04)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {results.books.map((book) => (
            <motion.div key={book.id} variants={fadeUp(reduce)}>
              <BookCard book={book} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}