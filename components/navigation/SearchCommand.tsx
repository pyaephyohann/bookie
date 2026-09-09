"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, PackageSearch, Search, SearchX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MiniBookCover } from "@/components/books/BookCover";
import { MOCK_BOOKS, MOCK_CATEGORIES } from "@/lib/mock-data";

/**
 * Global search command palette (mock results only — no backend search yet).
 * Opens with Cmd/Ctrl+K or the navbar search button; closes with Escape.
 * Results are mock/static and links are placeholders for future pages.
 */

interface SearchCommandProps {
  open: boolean;
  onClose: () => void;
}

export function SearchCommand({ open, onClose }: SearchCommandProps) {
  return (
    <AnimatePresence>
      {open && <SearchDialog onClose={onClose} />}
    </AnimatePresence>
  );
}

/** Inner component so each open starts with a fresh query state. */
function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const books = q
      ? MOCK_BOOKS.filter(
          (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
        )
      : MOCK_BOOKS.slice(0, 4);
    const categories = q
      ? MOCK_CATEGORIES.filter((c) => c.name.toLowerCase().includes(q))
      : MOCK_CATEGORIES.slice(0, 5);
    return { books, categories };
  }, [query]);

  // Navigate to /search?q=... on Enter
  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      onClose();
    }
  }, [query, router, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const empty = results.books.length === 0 && results.categories.length === 0;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <motion.div
        aria-hidden
        className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search books"
        initial={{ opacity: 0, y: reduceY(), scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduceY(), scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative w-full max-w-xl overflow-hidden rounded-card border border-border bg-surface-elevated shadow-lg"
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 shrink-0 text-text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="bookie-search-results"
            aria-label="Search books, authors and categories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search books, authors, categories…"
            className="h-14 w-full bg-transparent text-body-lg outline-none placeholder:text-text-disabled"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-[0.625rem] font-semibold text-text-muted sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div id="bookie-search-results" role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
          {empty ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <SearchX className="size-8 text-text-disabled" aria-hidden />
              <p className="text-body font-semibold">No matches for “{query}”</p>
              <p className="text-caption text-text-muted">
                Try a different title, author, or category.
              </p>
            </div>
          ) : (
            <>
              {results.books.length > 0 && (
                <ResultGroup label="Books">
                  {results.books.map((b) => (
                    <a
                      key={b.id}
                      role="option"
                      aria-selected="false"
                      href={`/books/${b.slug}`}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-control p-2 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                    >
                      <MiniBookCover title={b.title} gradient={b.cover} className="w-8" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-semibold">{b.title}</span>
                        <span className="block truncate text-caption text-text-muted">
                          {b.author} · {b.category}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-text-disabled transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  ))}
                </ResultGroup>
              )}

              {results.categories.length > 0 && (
                <ResultGroup label="Categories">
                  {results.categories.map((c) => (
                    <a
                      key={c.name}
                      role="option"
                      aria-selected="false"
                      href={`/categories/${slugify(c.name)}`}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-control p-2 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                    >
                      <span className="flex size-8 items-center justify-center rounded-md bg-brand-muted text-ink dark:text-brand-on">
                        <BookOpen className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-semibold">{c.name}</span>
                        <span className="block text-caption text-text-muted">{c.count} books</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-text-disabled transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  ))}
                </ResultGroup>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-1 flex w-full items-center gap-3 rounded-control border-t border-border-subtle p-3 text-body-sm text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                <PackageSearch className="size-4 shrink-0" aria-hidden />
                <span>
                  Looking for an order?{" "}
                  <span className="font-semibold text-text">Track it with your BookPass</span>
                </span>
                <kbd className="ml-auto rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-[0.625rem] font-semibold text-text-muted">
                  ESC
                </kbd>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-2 pb-1 pt-2 text-caption font-bold uppercase tracking-[0.14em] text-text-disabled">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function reduceY(): number {
  if (typeof window === "undefined") return 8;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 8;
}
