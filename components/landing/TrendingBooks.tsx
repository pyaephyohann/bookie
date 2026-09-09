"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useRef } from "react";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { BookSummary } from "@/lib/data";

export function TrendingBooks({ books }: { books: BookSummary[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section id="trending" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="trending-heading">
      <SectionHeading
        eyebrow="Trending now"
        title="What everyone is reading"
        description="The books flying off our (virtual) shelves this week."
        funNote="hot off the press!"
        action={
          <div className="flex items-center gap-2">
            <ScrollButton label="Scroll trending books left" onClick={() => scrollBy(-1)}>
              <ChevronLeft className="size-4" aria-hidden />
            </ScrollButton>
            <ScrollButton label="Scroll trending books right" onClick={() => scrollBy(1)}>
              <ChevronRight className="size-4" aria-hidden />
            </ScrollButton>
          </div>
        }
      >
        <span id="trending-heading" className="sr-only">Trending now</span>
      </SectionHeading>

      {books.length === 0 ? (
        <EmptyState
          title="The shelves are warming up"
          description="Trending titles will appear here as books are added."
          icon={Flame}
        />
      ) : (
        <div
          ref={scroller}
          className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
          role="list"
          aria-label="Trending books"
        >
          {books.map((book) => (
            <div key={book.id} role="listitem" className="w-56 shrink-0 snap-start sm:w-60">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      )}

      <p className="text-fun mt-2 flex items-center gap-2 text-xl text-text-muted">
        <Flame className="size-4 text-brand" aria-hidden />
        updated every hour, like a real bookstore window
      </p>
    </section>
  );
}

function ScrollButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-border-strong hover:text-text"
    >
      {children}
    </button>
  );
}
