"use client";

import { History } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getRecentlyViewedIds, RECENTLY_VIEWED_EVENT } from "@/lib/recently-viewed";
import type { BookSummary } from "@/lib/data";

const EMPTY_IDS: string[] = [];

function subscribeRecentlyViewed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(RECENTLY_VIEWED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(RECENTLY_VIEWED_EVENT, onChange);
  };
}

// localStorage is an external store: read it with useSyncExternalStore so the
// ids arrive without setState-in-effect and without SSR/hydration mismatches
// (React uses getServerSnapshot during hydration, then re-renders with the
// real ids). getSnapshot must return a stable reference, so cache by value.
let cachedIds: string[] | null = null;

function getRecentlyViewedSnapshot(): string[] {
  const next = getRecentlyViewedIds();
  if (
    cachedIds === null ||
    cachedIds.length !== next.length ||
    cachedIds.some((id, i) => id !== next[i])
  ) {
    cachedIds = next;
  }
  return cachedIds;
}

function getServerSnapshot(): string[] {
  return EMPTY_IDS;
}

/**
 * Recently Viewed Home section.
 *
 * Reads book ids from localStorage (guests have no account) and resolves them
 * against the catalogue passed from the server. Unknown/removed ids are
 * dropped silently. Future book-detail pages (B3) record views via
 * lib/recently-viewed.ts, which notifies this store through a window event.
 */
export function RecentlyViewed({ books }: { books: BookSummary[] }) {
  const ids = useSyncExternalStore(
    subscribeRecentlyViewed,
    getRecentlyViewedSnapshot,
    getServerSnapshot,
  );

  const byId = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);

  const viewed = useMemo(
    () =>
      ids
        .map((id) => byId.get(id))
        .filter((book): book is BookSummary => Boolean(book))
        .slice(0, 8),
    [ids, byId],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="recently-viewed-heading">
      <SectionHeading
        eyebrow="Pick up where you left off"
        title="Recently viewed"
        description="Books you've browsed lately — stored on this device only."
        funNote="right back where you were"
      >
        <span id="recently-viewed-heading" className="sr-only">Recently viewed</span>
      </SectionHeading>

      {viewed.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Books you open will show up here automatically — no account needed."
          icon={History}
        />
      ) : (
        <div
          className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
          role="list"
          aria-label="Recently viewed books"
        >
          {viewed.map((book) => (
            <div key={book.id} role="listitem" className="w-56 shrink-0 snap-start sm:w-60">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}