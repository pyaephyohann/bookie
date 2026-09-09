"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/mock-data";

export default function CartPage() {
  const reduce = useReducedMotion() ?? false;
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCartStore();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ShoppingBag className="mx-auto mb-4 size-16 text-text-muted opacity-40" aria-hidden />
          <h1 className="text-h2 font-bold text-text">Your cart is empty</h1>
          <p className="mt-2 text-body-lg text-text-secondary">
            Browse our books and find something you&apos;ll love.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
          >
            Browse Books
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
          <ArrowLeft className="size-4" aria-hidden />
          Continue Shopping
        </Link>
      </motion.div>

      <h1 className="text-h1 font-extrabold tracking-tight text-text">Shopping Cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <section aria-label="Cart items">
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.bookId}
                  layout
                  initial={reduce ? {} : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-4 py-5 first:pt-0 last:pb-0 sm:gap-6"
                >
                  {/* Cover */}
                  <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    {item.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverImage}
                        alt={`Cover of ${item.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-caption text-text-muted">
                        No cover
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/books/${item.slug}`}
                          className="text-body font-semibold text-text transition-colors hover:text-brand"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-body-sm text-text-muted">{item.author}</p>
                      </div>
                      <span className="text-body font-semibold text-text whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.title}`}
                          className="flex size-8 items-center justify-center rounded-control border border-border bg-surface text-text transition-colors hover:bg-surface-muted disabled:cursor-default disabled:opacity-40"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-body font-semibold text-text" aria-label={`Quantity: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.title}`}
                          className="flex size-8 items-center justify-center rounded-control border border-border bg-surface text-text transition-colors hover:bg-surface-muted"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.bookId)}
                        aria-label={`Remove ${item.title} from cart`}
                        className="inline-flex items-center gap-1 text-body-sm font-medium text-text-muted transition-colors hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Order Summary */}
        <section aria-label="Order summary" className="lg:sticky lg:top-28 lg:self-start">
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-card border border-border bg-surface p-6"
          >
            <h2 className="text-h3 font-bold text-text">Order Summary</h2>

            <dl className="mt-4 space-y-3 text-body-sm">
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Items ({totalItems})</dt>
                <dd className="font-semibold text-text">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="text-body font-bold text-text">Total</dt>
                <dd className="text-h3 font-bold text-text">{formatPrice(subtotal)}</dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
            >
              Continue to Checkout
            </Link>

            <button
              type="button"
              onClick={clearCart}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-control border border-border bg-surface py-2.5 text-body-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
            >
              Clear Cart
            </button>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
