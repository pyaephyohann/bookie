"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookMarked } from "lucide-react";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { BookSummary } from "@/lib/data";

export function StaffPicks({ books }: { books: BookSummary[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="border-y border-border bg-surface py-16" aria-labelledby="staff-picks-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Curated picks"
          title="Staff picks"
          description="Hand-selected by our team — books we think you'll love."
          funNote="taste-tested, reader approved"
        >
          <span id="staff-picks-heading" className="sr-only">Staff picks</span>
        </SectionHeading>

        {books.length === 0 ? (
          <EmptyState
            title="Staff picks coming soon"
            description="Our team is putting together their favorites — check back soon."
            icon={BookMarked}
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
