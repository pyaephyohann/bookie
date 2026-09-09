"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Eye, Loader2, Plus, Star } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { BookCover } from "@/components/books/BookCover";
import { discountPercent, formatPrice } from "@/lib/mock-data";
import { fadeUp } from "@/lib/motion";
import type { BookSummary } from "@/lib/data";

interface BookCardProps {
  book: BookSummary;
  /** Initial animation state (used by parent stagger containers). */
  animate?: "hidden" | "visible";
}

type AddState = "idle" | "loading" | "added";

export function BookCard({ book, animate = "visible" }: BookCardProps) {
  const reduce = useReducedMotion();
  const { addItem } = useCart();
  const [addState, setAddState] = useState<AddState>("idle");

  const discount = book.compareAtPrice
    ? discountPercent(book.price, book.compareAtPrice)
    : null;

  const handleAdd = () => {
    if (addState !== "idle") return;
    setAddState("loading");
    window.setTimeout(() => {
      addItem();
      setAddState("added");
      window.setTimeout(() => setAddState("idle"), 1400);
    }, 450);
  };

  return (
    <motion.article
      variants={fadeUp(reduce ?? false)}
      initial={animate === "hidden" ? "hidden" : false}
      animate={animate === "hidden" ? "visible" : undefined}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex h-full flex-col rounded-card border border-border bg-surface p-3 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-md focus-within:border-border-strong"
    >
      {/* Cover */}
      <div className="relative overflow-hidden rounded-md">
        <motion.div
          whileHover={reduce ? undefined : { scale: 1.04 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <BookCover
            title={book.title}
            author={book.author}
            gradient={book.gradient}
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
          />
        </motion.div>

        {book.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-brand-on shadow-xs">
            {book.badge}
          </span>
        )}
        {discount !== null && (
          <span className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[0.625rem] font-bold text-text-inverse">
            −{discount}%
          </span>
        )}

        {/* Quick actions — revealed on hover/focus */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex translate-y-1.5 gap-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <motion.button
            type="button"
            onClick={handleAdd}
            whileTap={{ scale: 0.95 }}
            disabled={addState !== "idle"}
            aria-label={`Add ${book.title} to cart`}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-control bg-brand text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-default"
          >
            {addState === "loading" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : addState === "added" ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            {addState === "added" ? "Added" : "Add to Cart"}
          </motion.button>
          <motion.a
            href={`/books/${book.slug}`}
            whileTap={{ scale: 0.95 }}
            aria-label={`View ${book.title}`}
            className="flex size-9 items-center justify-center rounded-control border border-border-strong bg-surface text-text shadow-sm transition-colors hover:bg-surface-muted"
          >
            <Eye className="size-4" aria-hidden />
          </motion.a>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-1 pt-3">
        <span className="text-caption font-medium uppercase tracking-wide text-text-muted">
          {book.category}
        </span>
        <h3 className="text-h4 leading-snug">
          <a href={`/books/${book.slug}`} className="transition-colors hover:text-text-secondary">
            {book.title}
          </a>
        </h3>
        <p className="text-body-sm text-text-muted">{book.author}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-h4 font-bold">{formatPrice(book.price)}</span>
            {book.compareAtPrice && (
              <span className="text-caption text-text-muted line-through">
                {formatPrice(book.compareAtPrice)}
              </span>
            )}
          </div>
          {book.rating !== null && (
            <span className="flex items-center gap-1 text-caption font-semibold text-text-secondary">
              <Star className="size-3.5 fill-brand stroke-ink/40" aria-hidden />
              {book.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
