"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, Clock, Eye, Loader2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart";
import { BookCover } from "@/components/books/BookCover";
import { WishlistButton } from "@/components/books/WishlistButton";
import { formatPrice } from "@/lib/mock-data";
import { viewportOnce } from "@/lib/motion";
import { recordRecentlyViewed } from "@/lib/recently-viewed";
import type { BookDetail } from "@/lib/data";

type CartState = "idle" | "loading" | "added";

export function BookDetailClient({ book }: { book: BookDetail }) {
  const reduce = useReducedMotion() ?? false;
  const { addItem } = useCartStore();
  const [cartState, setCartState] = useState<CartState>("idle");

  // Record this book as recently viewed
  useEffect(() => {
    recordRecentlyViewed(book.id);
  }, [book.id]);

  const handleAddToCart = () => {
    if (cartState !== "idle") return;
    setCartState("loading");
    window.setTimeout(() => {
      addItem({
        bookId: book.id,
        slug: book.slug,
        title: book.title,
        author: book.authors[0]?.name ?? "Unknown",
        coverImage: book.coverImage,
        price: book.price,
      });
      setCartState("added");
      window.setTimeout(() => setCartState("idle"), 1400);
    }, 450);
  };

  const discount =
    book.compareAtPrice && book.compareAtPrice > book.price
      ? Math.round((1 - book.price / book.compareAtPrice) * 100)
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <motion.div
        initial={reduce ? {} : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to Home
        </Link>
      </motion.div>

      {/* Main layout */}
      <div className="grid gap-10 lg:grid-cols-[350px_1fr] lg:gap-14">
        {/* Cover */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full max-w-sm lg:mx-0"
        >
          <BookCover
            title={book.title}
            author={book.authors[0]?.name ?? "Unknown"}
            gradient={book.gradient}
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
          />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          {/* Categories */}
          {book.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-caption font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="mt-3 text-h1 font-extrabold tracking-tight text-text">
            {book.title}
          </h1>

          {/* Author(s) */}
          {book.authors.length > 0 && (
            <p className="mt-2 text-body-lg text-text-secondary">
              by{" "}
              {book.authors.map((author, i) => (
                <span key={author.slug}>
                  {i > 0 && ", "}
                  <Link
                    href={`/authors/${author.slug}`}
                    className="font-semibold text-text transition-colors hover:text-brand"
                  >
                    {author.name}
                  </Link>
                </span>
              ))}
            </p>
          )}

          {/* Price */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-h2 font-bold text-text">{formatPrice(book.price)}</span>
            {book.compareAtPrice && book.compareAtPrice > book.price && (
              <>
                <span className="text-body text-text-muted line-through">
                  {formatPrice(book.compareAtPrice)}
                </span>
                {discount !== null && (
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-caption font-bold text-brand-on">
                    −{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              onClick={handleAddToCart}
              whileTap={{ scale: 0.97 }}
              disabled={cartState !== "idle"}
              className="inline-flex h-12 items-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-default disabled:opacity-70"
            >
              {cartState === "loading" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : cartState === "added" ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <ShoppingCart className="size-4" aria-hidden />
              )}
              {cartState === "added" ? "Added" : "Add to Cart"}
            </motion.button>

            <WishlistButton bookId={book.id} size="lg" className="h-12 w-12" />
          </div>

          {/* Stock */}
          <div className="mt-4 flex items-center gap-2 text-body-sm text-text-muted">
            <Clock className="size-4" aria-hidden />
            {book.stockQuantity > 0 ? (
              <span>
                {book.stockQuantity > 20
                  ? "In stock"
                  : `Only ${book.stockQuantity} left — order soon`}
              </span>
            ) : (
              <span className="text-text-secondary">Currently unavailable</span>
            )}
          </div>

          {/* Online reading entry point */}
          {book.isReadableOnline && (
            <div className="mt-4">
              <Link
                href={`/books/${book.slug}/read`}
                className="inline-flex items-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-button text-text transition-colors hover:bg-surface-muted"
              >
                <Eye className="size-4" aria-hidden />
                Read Online
              </Link>
              <p className="text-caption mt-1.5 text-text-muted">
                Available for online reading
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Description */}
      {book.description && (
        <motion.section
          initial={reduce ? {} : { opacity: 0, y: 16 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.45 }}
          className="mt-14 max-w-3xl"
        >
          <h2 className="text-h2 mb-3">About this book</h2>
          <p className="text-body leading-relaxed text-text-secondary">
            {book.description}
          </p>
        </motion.section>
      )}

      {/* Metadata */}
      <motion.section
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mt-10 max-w-3xl"
      >
        <h2 className="text-h3 mb-3">Details</h2>
        <dl className="grid grid-cols-1 gap-2 text-body-sm sm:grid-cols-2">
          {book.publisher && (
            <>
              <dt className="text-text-muted">Publisher</dt>
              <dd className="text-text">{book.publisher}</dd>
            </>
          )}
          {book.publishedAt && (
            <>
              <dt className="text-text-muted">Published</dt>
              <dd className="text-text">{new Date(book.publishedAt).toLocaleDateString()}</dd>
            </>
          )}
          {book.isbn && (
            <>
              <dt className="text-text-muted">ISBN</dt>
              <dd className="font-mono text-text">{book.isbn}</dd>
            </>
          )}
          <dt className="text-text-muted">Categories</dt>
          <dd className="text-text">
            {book.categories.map((c) => c.name).join(", ") || "Uncategorised"}
          </dd>
        </dl>
      </motion.section>
    </div>
  );
}