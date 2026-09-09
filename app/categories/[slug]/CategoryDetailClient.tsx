"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { CategoryDetail } from "@/lib/data";

export function CategoryDetailClient({ category }: { category: CategoryDetail }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/categories"
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:text-text mb-8"
      >
        <ChevronLeft className="size-4" aria-hidden />
        All Categories
      </Link>

      {/* Header */}
      <h1 className="text-display font-extrabold tracking-tight">{category.name}</h1>
      {category.description && (
        <p className="text-body-lg mt-3 max-w-2xl text-text-secondary">
          {category.description}
        </p>
      )}
      <p className="text-body-sm mt-2 text-text-muted">
        {category.bookCount} {category.bookCount === 1 ? "book" : "books"}
      </p>

      {/* Books */}
      <div className="mt-10">
        {category.books.length === 0 ? (
          <EmptyState
            title="No books in this category yet"
            description="Books will appear here once they're added to the catalogue."
          />
        ) : (
          <motion.div
            variants={stagger(reduce, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {category.books.map((book) => (
              <motion.div key={book.id} variants={fadeUp(reduce)}>
                <BookCard book={book} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}