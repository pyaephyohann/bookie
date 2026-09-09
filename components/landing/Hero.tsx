"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PackageSearch, Sparkles } from "lucide-react";
import { BookCover } from "@/components/books/BookCover";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { HeroSlider } from "./HeroSlider";
import type { BookSummary, HeroSlide } from "@/lib/data";

export function Hero({
  floatingBooks,
  slides,
}: {
  floatingBooks: BookSummary[];
  slides: HeroSlide[];
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-105 w-200 -translate-x-1/2 rounded-full bg-brand-muted/50 blur-3xl dark:bg-brand-muted/10"
      />

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <motion.div variants={stagger(reduce)} initial="hidden" animate="visible">
            <motion.p
              variants={fadeUp(reduce, 12)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-caption font-semibold text-text-secondary shadow-xs"
            >
              <Sparkles className="size-3.5 text-brand" aria-hidden />
              Independent online bookstore
            </motion.p>

            <motion.h1
              id="hero-heading"
              variants={fadeUp(reduce)}
              className="text-display mt-5"
            >
              Discover your next{" "}
              <span className="relative inline-block">
                favorite book
                <motion.svg
                  aria-hidden
                  viewBox="0 0 220 12"
                  className="absolute -bottom-1 left-0 w-full"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.7, ease: EASE_OUT }}
                >
                  <motion.path
                    d="M4 8 C 60 2, 160 2, 216 7"
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.7, duration: 0.7, ease: EASE_OUT }}
                  />
                </motion.svg>
              </span>
            </motion.h1>

            <motion.p variants={fadeUp(reduce)} className="text-body-lg mt-6 max-w-lg text-text-secondary">
              Browse the shelves, read online, and order in minutes — no account,
              no passwords. Just you, your books, and a{" "}
              <span className="font-semibold text-text">BookPass</span> to track it all.
            </motion.p>

            <motion.div variants={fadeUp(reduce)} className="mt-8 flex flex-wrap items-center gap-3">
              <motion.a
                href="#trending"
                whileHover={reduce ? undefined : { scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-control bg-brand px-6 py-3 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
              >
                Explore Books
                <ArrowRight className="size-4" aria-hidden />
              </motion.a>
              <motion.a
                href="#bookpass"
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-control border border-border-strong bg-surface px-6 py-3 text-button text-text transition-colors hover:bg-surface-muted"
              >
                <PackageSearch className="size-4" aria-hidden />
                Track Order
              </motion.a>
            </motion.div>

            <motion.p
              variants={fadeUp(reduce, 8)}
              className="text-fun mt-7 text-2xl text-text-muted"
              aria-hidden
            >
              your next favorite book is one page away
            </motion.p>
          </motion.div>

          {/* Visual: floating books + slider below */}
          <div className="relative">
            {floatingBooks[0] && (
              <div className="pointer-events-none absolute -top-10 right-2 z-10 hidden xl:block">
                <FloatingBook book={floatingBooks[0]} className="size-24 -rotate-12" delay={0.9} />
              </div>
            )}
            {floatingBooks[1] && (
              <div className="pointer-events-none absolute -left-8 bottom-24 z-10 hidden xl:block">
                <FloatingBook book={floatingBooks[1]} className="size-20 rotate-6" delay={1.2} />
              </div>
            )}
            {floatingBooks[2] && (
              <div className="pointer-events-none absolute -top-16 left-10 z-10 hidden lg:block">
                <FloatingBook book={floatingBooks[2]} className="size-16 rotate-3" delay={1.5} />
              </div>
            )}

            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, rotate: 1.5 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: EASE_OUT }}
            >
              <HeroSlider slides={slides} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingBook({
  book,
  className,
  delay,
}: {
  book: BookSummary;
  className: string;
  delay: number;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      aria-hidden
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.8 }}
      animate={reduce ? { opacity: 0.9 } : { opacity: 0.9, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: EASE_OUT }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut" }}
      >
        <BookCover title={book.title} author={book.author} gradient={book.gradient} src={book.coverImage} className={className} />
      </motion.div>
    </motion.div>
  );
}
