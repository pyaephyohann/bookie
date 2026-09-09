"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/ui/EmptyState";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { AuthorSummary } from "@/lib/data";

export function AuthorsListClient({ authors }: { authors: AuthorSummary[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display mb-2 font-extrabold tracking-tight">Authors</h1>
      <p className="text-body-lg text-text-secondary mb-10 max-w-xl">
        Discover the voices behind the pages — every author has a story to tell.
      </p>

      {authors.length === 0 ? (
        <EmptyState
          title="No authors yet"
          description="Authors will appear once books are added to the catalogue."
          icon={Users}
        />
      ) : (
        <motion.ul
          variants={stagger(reduce, 0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {authors.map((author) => (
            <motion.li key={author.slug} variants={fadeUp(reduce)}>
              <Link
                href={`/authors/${author.slug}`}
                className="group flex h-full items-center gap-4 rounded-card border border-border bg-background p-4 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-md"
              >
                {author.photoUrl ? (
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border shadow-sm">
                    <Image
                      src={author.photoUrl}
                      alt={`Portrait of ${author.name}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span
                    className="flex size-14 shrink-0 items-center justify-center rounded-full text-h4 font-extrabold text-white shadow-sm"
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

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-h4 font-bold text-text">
                      {author.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-brand-muted px-2 py-0.5 text-[0.625rem] font-bold text-ink dark:bg-brand/15 dark:text-brand">
                      {author.books} books
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-body-sm text-text-muted">
                    {author.description}
                  </span>
                </span>

                <ChevronRight
                  className="size-4 shrink-0 text-text-disabled transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}