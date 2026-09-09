"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Percent, Tag } from "lucide-react";
import { BookCover } from "@/components/books/BookCover";
import { EmptyState } from "@/components/ui/EmptyState";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { discountPercent, formatPrice } from "@/lib/mock-data";
import type { BookSummary } from "@/lib/data";

export function Promotions({ books }: { books: BookSummary[] }) {
  const reduce = useReducedMotion() ?? false;
  const deals = books.filter((book) => book.compareAtPrice !== null);

  return (
    <section className="relative overflow-hidden border-y border-border bg-ink py-16 text-text-inverse dark:bg-surface" aria-labelledby="promotions-heading">
      {/* Animated decorative shapes */}
      <motion.span
        aria-hidden
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute -left-20 -top-24 size-72 rounded-full border-[3px] border-dashed border-brand/25"
      />
      <motion.span
        aria-hidden
        animate={reduce ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[12%] top-10 hidden size-24 rounded-2xl bg-brand/10 md:block"
      />
      <motion.span
        aria-hidden
        animate={reduce ? undefined : { y: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-[38%] hidden text-fun text-3xl text-brand/70 lg:block"
      >
        good books. better prices.
      </motion.span>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand">
            Promotions
          </p>
          <h2 id="promotions-heading" className="text-display-sm mt-2 font-extrabold">
            Good books. Better prices.
          </h2>
          <p className="text-body-lg mt-3 text-text-secondary dark:text-text-muted">
            Hand-picked deals from the shelves — real discounts on books our
            staff actually loved. While stocks last.
          </p>
        </div>

        {deals.length === 0 ? (
          <EmptyState
            title="No active promotions right now"
            description="When the next deal drops, it'll show up here first."
            icon={Percent}
            className="border-ink/10 bg-background dark:border-border dark:bg-surface-elevated"
          />
        ) : (
        <motion.div
          variants={stagger(reduce, 0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {deals.map((book) => {
            const discount = discountPercent(book.price, book.compareAtPrice!);
            return (
              <motion.a
                key={book.id}
                variants={fadeUp(reduce)}
                whileHover={reduce ? undefined : { y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                href={`#/books/${book.slug}`}
                className="group flex flex-col gap-4 rounded-card border border-ink/10 bg-background p-4 shadow-sm transition-shadow hover:shadow-lg dark:border-border dark:bg-surface-elevated"
              >
                <div className="relative">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    gradient={book.gradient}
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                  />
                  <span className="absolute -right-1.5 -top-1.5 flex size-11 rotate-6 items-center justify-center rounded-full bg-brand text-body-sm font-extrabold text-brand-on shadow-md transition-transform duration-200 group-hover:rotate-0">
                    −{discount}%
                  </span>
                </div>
                <div>
                  <p className="text-h4 font-bold text-text">{book.title}</p>
                  <p className="text-body-sm text-text-muted">{book.author}</p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-h4 font-extrabold text-ink dark:text-text">
                      {formatPrice(book.price)}
                    </span>
                    <span className="text-body-sm text-text-muted line-through">
                      {formatPrice(book.compareAtPrice!)}
                    </span>
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-caption font-semibold text-text-secondary transition-colors group-hover:text-text dark:text-text-muted">
                    <Tag className="size-3.5 text-brand" aria-hidden />
                    Save {formatPrice(book.compareAtPrice! - book.price)}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </p>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
        )}
      </div>
    </section>
  );
}
