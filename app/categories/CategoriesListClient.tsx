"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CategorySummary } from "@/lib/data";

const TILE_STYLES: Record<string, string> = {
  Fiction: "md:col-span-2 md:row-span-2",
  Fantasy: "md:col-span-2",
  "Children's Books": "md:col-span-2",
};

export function CategoriesListClient({ categories }: { categories: CategorySummary[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display mb-2 font-extrabold tracking-tight">Categories</h1>
      <p className="text-body-lg text-text-secondary mb-10 max-w-xl">
        Explore our collection by genre — every shelf has something worth your time.
      </p>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Categories will appear once books are added to the catalogue."
          icon={LayoutGrid}
        />
      ) : (
        <motion.div
          variants={stagger(reduce, 0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid auto-rows-[9rem] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        >
          {categories.map((cat) => (
            <motion.div key={cat.slug} variants={fadeUp(reduce)}>
              <Link
                href={`/categories/${cat.slug}`}
                className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-card border border-border bg-surface p-5 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-md ${
                  TILE_STYLES[cat.name] ?? ""
                }`}
              >
                <span
                  aria-hidden
                  className="absolute -right-8 -top-8 size-28 rounded-full bg-brand-muted/70 transition-transform duration-300 group-hover:scale-125 dark:bg-brand/10"
                />
                <span className="text-fun absolute right-4 top-4 text-2xl text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {cat.count} books
                </span>
                <span
                  className={`relative font-extrabold tracking-tight text-text ${
                    cat.name === "Fiction" ? "text-h1" : "text-h3"
                  }`}
                >
                  {cat.name}
                </span>
                <span className="relative mt-0.5 flex items-center gap-1.5 text-body-sm text-text-muted">
                  {cat.count} Books
                  <ArrowUpRight
                    className="size-4 text-text-disabled transition-all group-hover:translate-x-0.5 group-hover:text-text"
                    aria-hidden
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}