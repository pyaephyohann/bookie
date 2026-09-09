"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Trophy } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { formatPrice } from "@/lib/mock-data";
import type { BookSummary } from "@/lib/data";

export function BestSellers({ books }: { books: BookSummary[] }) {
  const reduce = useReducedMotion() ?? false;
  const ranked = books;

  return (
    <section className="border-y border-border bg-surface py-16" aria-labelledby="bestsellers-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Best sellers"
          title="The books everyone owns"
          description="The titles readers keep coming back to — updated as orders roll in."
          action={
            <a
              href="#/best-sellers"
              className="inline-flex items-center gap-1 text-body-sm font-semibold text-text underline-offset-4 hover:underline"
            >
              View all best sellers <ChevronRight className="size-4" aria-hidden />
            </a>
          }
        >
          <span id="bestsellers-heading" className="sr-only">Best sellers</span>
        </SectionHeading>

        {ranked.length === 0 ? (
          <EmptyState
            title="Best sellers coming soon"
            description="Once orders start rolling in, the top titles will rank here."
            icon={Trophy}
          />
        ) : (
        <motion.ol
          variants={stagger(reduce, 0.09)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 md:grid-cols-2"
        >
          {ranked.map((book, i) => (
            <motion.li key={book.id} variants={fadeUp(reduce)}>
              <a
                href={`#/books/${book.slug}`}
                className={`group flex items-center gap-5 rounded-card border border-border bg-background p-4 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-md sm:gap-6 sm:p-5 ${
                  i < 3 ? "md:flex-row md:items-center" : ""
                }`}
              >
                <span
                  aria-hidden
                  className={`shrink-0 font-extrabold leading-none tracking-tighter text-ink/10 transition-colors duration-200 group-hover:text-brand ${
                    i < 3 ? "text-7xl sm:text-8xl" : "text-5xl"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-caption font-semibold uppercase tracking-wide text-text-muted">
                    {book.category}
                  </span>
                  <span className={`mt-0.5 block font-bold text-text ${i < 3 ? "text-h3" : "text-h4"}`}>
                    {book.title}
                  </span>
                  <span className="mt-0.5 block text-body-sm text-text-muted">{book.author}</span>
                  {book.rating !== null && (
                    <span className="mt-2 block text-caption text-text-muted">
                      ★ {book.rating.toFixed(1)}
                      {book.reviews !== null ? ` · ${book.reviews} reviews` : ""}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-h4 font-bold">{formatPrice(book.price)}</span>
              </a>
            </motion.li>
          ))}
        </motion.ol>
        )}
      </div>
    </section>
  );
}
