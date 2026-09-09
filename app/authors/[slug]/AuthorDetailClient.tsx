"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { AuthorDetail } from "@/lib/data";

export function AuthorDetailClient({ author }: { author: AuthorDetail }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/authors"
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:text-text mb-8"
      >
        <ChevronLeft className="size-4" aria-hidden />
        All Authors
      </Link>

      {/* Author header */}
      <div className="flex items-start gap-6">
        {author.photoUrl ? (
          <span className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border shadow-sm sm:size-24">
            <Image
              src={author.photoUrl}
              alt={`Portrait of ${author.name}`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </span>
        ) : (
          <span
            className="flex size-20 shrink-0 items-center justify-center rounded-full text-h1 font-extrabold text-white shadow-sm sm:size-24"
            style={{
              backgroundImage: `linear-gradient(140deg, ${author.gradient[0]}, ${author.gradient[1]})`,
            }}
            aria-hidden
          >
            {author.name
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </span>
        )}

        <div>
          <h1 className="text-h1 font-extrabold tracking-tight">{author.name}</h1>
          <p className="text-body-sm mt-1 text-text-muted">
            {author.bookCount} {author.bookCount === 1 ? "book" : "books"}
          </p>
          {author.biography && (
            <p className="text-body mt-3 max-w-2xl text-text-secondary">
              {author.biography}
            </p>
          )}
        </div>
      </div>

      {/* Books */}
      <div className="mt-12">
        <h2 className="text-h2 mb-6">Books by {author.name}</h2>
        {author.books.length === 0 ? (
          <EmptyState
            title="No books yet"
            description="Books by this author will appear here once they're added to the catalogue."
          />
        ) : (
          <motion.div
            variants={stagger(reduce, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {author.books.map((book) => (
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