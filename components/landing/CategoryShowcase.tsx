"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { CategorySummary } from "@/lib/data";

/** Editorial magazine-style tiles: intentional asymmetry via span rules. */
const TILE_STYLES: Record<string, string> = {
  Fiction: "md:col-span-2 md:row-span-2",
  Fantasy: "md:col-span-2",
  Mystery: "",
  Romance: "",
  "Children's Books": "md:col-span-2",
};

export function CategoryShowcase({ categories }: { categories: CategorySummary[] }) {
  const reduce = useReducedMotion() ?? false;
  const featured = categories.slice(0, 6);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="categories-heading">
      <SectionHeading
        eyebrow="Browse the shelves"
        title="Explore by category"
        description="From quiet literary fiction to loud space operas — find your corner of the library."
        funNote="where will you wander today?"
        action={
          <a
            href="#/categories"
            className="text-body-sm font-semibold text-text underline-offset-4 hover:underline"
          >
            All {categories.length} categories →
          </a>
        }
      >
        <span id="categories-heading" className="sr-only">Explore by category</span>
      </SectionHeading>

      {featured.length === 0 ? (
        <EmptyState
          title="Categories are taking shape"
          description="Once the catalogue is organised, you'll be able to browse it here."
          icon={LayoutGrid}
        />
      ) : (
      <motion.div
        variants={stagger(reduce, 0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="grid auto-rows-[9.5rem] grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
      >
        {featured.map((category) => (
          <motion.a
            key={category.name}
            variants={fadeUp(reduce)}
            whileHover={reduce ? undefined : { y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            href={`#/categories/${category.slug}`}
            className={`group relative flex flex-col justify-end overflow-hidden rounded-card border border-border bg-surface p-5 shadow-xs transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md ${TILE_STYLES[category.name] ?? ""}`}
          >
            {/* Decorative arc */}
            <span
              aria-hidden
              className="absolute -right-8 -top-8 size-28 rounded-full bg-brand-muted/70 transition-transform duration-300 group-hover:scale-125 dark:bg-brand/10"
            />
            <span
              aria-hidden
              className="text-fun absolute right-4 top-4 text-2xl text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              {category.count} books
            </span>

            <span className={`relative font-extrabold tracking-tight text-text ${category.name === "Fiction" ? "text-h1" : "text-h3"}`}>
              {category.name}
            </span>
            <span className="relative mt-0.5 flex items-center gap-1.5 text-body-sm text-text-muted">
              {category.count} Books
              <ArrowUpRight className="size-4 text-text-disabled transition-all group-hover:translate-x-0.5 group-hover:text-text" aria-hidden />
            </span>
          </motion.a>
        ))}
      </motion.div>
      )}
    </section>
  );
}
