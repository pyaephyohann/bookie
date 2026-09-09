"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { BookSummary } from "@/lib/data";

/**
 * Recommended For You — a lightweight, deterministic pick from the catalogue
 * (NOT AI personalisation). The data layer chooses the books; swapping in a
 * real recommendation engine later only touches lib/data.ts.
 */
export function RecommendedBooks({ books }: { books: BookSummary[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="border-y border-border bg-surface py-16" aria-labelledby="recommended-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Just for you"
          title="Recommended for you"
          description="A hand-picked mix from our shelves — different from what's trending, just as worth your time."
          funNote="we have good instincts"
        >
          <span id="recommended-heading" className="sr-only">Recommended for you</span>
        </SectionHeading>

        {books.length === 0 ? (
          <EmptyState
            title="Fresh picks coming soon"
            description="Once we know what's on the shelves, we'll have recommendations for you."
            icon={Sparkles}
          />
        ) : (
          <motion.div
            variants={stagger(reduce, 0.07)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
          >
            {books.map((book) => (
              <motion.div key={book.id} variants={fadeUp(reduce)}>
                <BookCard book={book} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}