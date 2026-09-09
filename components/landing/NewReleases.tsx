"use client";

import { ChevronLeft, ChevronRight, Sparkles, Star } from "lucide-react";
import { useRef } from "react";
import { BookCover } from "@/components/books/BookCover";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCart } from "@/components/cart/CartContext";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { formatPrice } from "@/lib/mock-data";
import type { BookSummary } from "@/lib/data";

export function NewReleases({ books }: { books: BookSummary[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const newBooks = books;

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="new-releases-heading">
      <SectionHeading
        eyebrow="Fresh off the press"
        title="New releases"
        description="The newest arrivals on the Bookie shelves."
        funNote="be the first to read them"
        action={
          <div className="flex items-center gap-2">
            <ScrollButton label="Scroll new releases left" onClick={() => scrollBy(-1)}>
              <ChevronLeft className="size-4" aria-hidden />
            </ScrollButton>
            <ScrollButton label="Scroll new releases right" onClick={() => scrollBy(1)}>
              <ChevronRight className="size-4" aria-hidden />
            </ScrollButton>
          </div>
        }
      >
        <span id="new-releases-heading" className="sr-only">New releases</span>
      </SectionHeading>

      {newBooks.length === 0 ? (
        <EmptyState title="New arrivals are on their way" description="Fresh releases will land here as they're published." icon={Sparkles} />
      ) : (
        <motion.div
          variants={stagger(reduce)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          ref={scroller}
          className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
          role="list"
          aria-label="New release books"
        >
          {newBooks.map((book) => (
            <motion.div
              key={book.id}
              variants={fadeUp(reduce)}
              role="listitem"
              className="w-44 shrink-0 snap-start sm:w-52"
            >
              <NewReleaseCard book={book} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function NewReleaseCard({ book }: { book: BookSummary }) {
  const { addItem } = useCart();
  const reduce = useReducedMotion() ?? false;
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  const handleAdd = () => {
    if (state !== "idle") return;
    setState("loading");
    window.setTimeout(() => {
      addItem();
      setState("added");
      window.setTimeout(() => setState("idle"), 1400);
    }, 450);
  };

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-xs transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md"
    >
      <div className="relative">
        <BookCover
          title={book.title}
          author={book.author}
          gradient={book.gradient}
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          className="rounded-b-none"
        />
        <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-text-inverse">
          New
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="text-caption font-semibold uppercase tracking-wide text-text-muted">
          {book.category}
        </span>
        <h3 className="text-h4 leading-snug">
          <a href={`#/books/${book.slug}`} className="transition-colors hover:text-text-secondary">
            {book.title}
          </a>
        </h3>
        <p className="text-body-sm text-text-muted">{book.author}</p>
        <div className="mt-auto flex items-center justify-between pt-2.5">
          <span className="text-h4 font-bold">{formatPrice(book.price)}</span>
          <div className="flex items-center gap-2">
            {book.rating !== null && (
              <span className="flex items-center gap-1 text-caption font-semibold text-text-secondary">
                <Star className="size-3.5 fill-brand stroke-ink/40" aria-hidden />
                {book.rating.toFixed(1)}
              </span>
            )}
            <motion.button
              type="button"
              onClick={handleAdd}
              whileTap={{ scale: 0.9 }}
              disabled={state !== "idle"}
              aria-label={`Add ${book.title} to cart`}
              className="flex size-8 items-center justify-center rounded-control bg-brand text-brand-on transition-colors hover:bg-brand-hover disabled:cursor-default"
            >
              {state === "loading" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : state === "added" ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
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
