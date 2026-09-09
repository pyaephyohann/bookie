"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { AuthorSummary } from "@/lib/data";

export function PopularAuthors({ authors }: { authors: AuthorSummary[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="border-y border-border bg-surface py-16" aria-labelledby="authors-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Meet the storytellers"
          title="Popular authors"
          description="The voices readers keep coming back to."
          funNote="every book has a person behind it"
          action={
            <Link
              href="/authors"
              className="inline-flex items-center gap-1 text-body-sm font-semibold text-text underline-offset-4 hover:underline"
            >
              All authors <ChevronRight className="size-4" aria-hidden />
            </Link>
          }
        >
          <span id="authors-heading" className="sr-only">Popular authors</span>
        </SectionHeading>

        {authors.length === 0 ? (
          <EmptyState
            title="Author shelves are being built"
            description="Featured authors will appear here as the catalogue grows."
            icon={Users}
          />
        ) : (
        <motion.ul
          variants={stagger(reduce, 0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {authors.map((author) => (
            <motion.li key={author.slug} variants={fadeUp(reduce)} role="listitem">
              <motion.a
                href={`/authors/${author.slug}`}
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="group flex h-full items-center gap-4 rounded-card border border-border bg-background p-4 shadow-xs transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md"
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
                  <motion.span
                    whileHover={reduce ? undefined : { scale: 1.06, rotate: -2 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex size-14 shrink-0 items-center justify-center rounded-full text-h4 font-extrabold text-white shadow-sm"
                    style={{ backgroundImage: `linear-gradient(140deg, ${author.gradient[0]}, ${author.gradient[1]})` }}
                    aria-hidden
                  >
                    {author.name.split(" ").map((w) => w[0]).join("")}
                  </motion.span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-h4 font-bold text-text">{author.name}</span>
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
              </motion.a>
            </motion.li>
          ))}
        </motion.ul>
        )}
      </div>
    </section>
  );
}
