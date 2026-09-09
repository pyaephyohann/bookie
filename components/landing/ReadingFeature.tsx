"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Bookmark, Cloud, Moon, Sun } from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { BookCover } from "@/components/books/BookCover";
import { MOCK_BOOKS } from "@/lib/mock-data";

const book = MOCK_BOOKS[0]; // The Silent Library

export function ReadingFeature() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="reading-heading">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Copy */}
        <motion.div variants={stagger(reduce)} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.p variants={fadeUp(reduce, 12)} className="text-caption font-bold uppercase tracking-[0.16em] text-text-muted">
            Bookie Reader
          </motion.p>
          <motion.h2 id="reading-heading" variants={fadeUp(reduce)} className="text-h1 mt-2 font-extrabold tracking-tight">
            Read anywhere.
          </motion.h2>
          <motion.p variants={fadeUp(reduce)} className="text-body-lg mt-4 max-w-md text-text-secondary">
            Open your next chapter whenever inspiration strikes. Your page, notes
            and highlights travel with you — from phone on the bus to laptop at
            midnight.
          </motion.p>

          <motion.ul variants={fadeUp(reduce)} className="mt-7 space-y-3.5">
            {[
              { icon: Cloud, text: "Synced across all your devices" },
              { icon: Moon, text: "Comfortable night-reading mode" },
              { icon: Bookmark, text: "Highlights that stay with your BookPass" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-body text-text-secondary">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border bg-surface">
                  <Icon className="size-4 text-text" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={fadeUp(reduce)} className="mt-8">
            <motion.a
              href="#/reader"
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-control bg-brand px-6 py-3 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
            >
              <BookOpen className="size-4" aria-hidden />
              Start Reading
            </motion.a>
            <span className="text-fun ml-4 text-xl text-text-muted" aria-hidden>
              shhh… the book is already open
            </span>
          </motion.div>
        </motion.div>

        {/* Visual: reader mock */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto max-w-md rounded-card border border-border bg-surface-elevated shadow-lg"
          >
            {/* Reader chrome */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-caption font-semibold text-text-muted">
                <BookOpen className="size-3.5" aria-hidden /> Bookie Reader
              </span>
              <span className="flex items-center gap-2 text-caption text-text-disabled">
                <Sun className="size-3.5" aria-hidden />
                <Moon className="size-3.5" aria-hidden />
              </span>
            </div>

            {/* Reader page */}
            <div className="space-y-2.5 px-6 py-6 text-body-sm leading-relaxed text-text-secondary">
              <p className="text-caption font-semibold uppercase tracking-wide text-text-disabled">
                Chapter One — The Quiet Hours
              </p>
              <p>
                The library held its breath after closing. Between shelf twelve and
                the window, morning arrived one              <span className="rounded bg-brand-muted px-0.5 text-ink dark:text-brand-on">highlighted whisper</span> at a time.
              </p>
              <p>
                Mara ran her fingers along the spines, each one humming a story
                only half-told, waiting for a reader patient enough to listen…
              </p>
              <div className="flex items-center justify-between pt-2 text-caption text-text-disabled">
                <span>Page 12 of 304</span>
                <span>Chapter 1 of 24</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface-muted">
                <motion.div
                  initial={{ width: "4%" }}
                  whileInView={{ width: "38%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
                  className="h-full rounded-full bg-brand"
                />
              </div>
            </div>
          </motion.div>

          {/* Book cover peeking behind the reader */}
          <motion.div
            aria-hidden
            initial={reduce ? false : { x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -left-6 bottom-10 hidden w-24 -rotate-6 sm:block lg:-left-12 lg:w-28"
          >
            <BookCover title={book.title} author={book.author} gradient={book.cover} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
