"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

/**
 * Floating cart shortcut — fixed to the bottom-left of the viewport.
 * Bounces briefly whenever an item is added anywhere on the page.
 */
export function FloatingCart() {
  const reduce = useReducedMotion() ?? false;
  const { count, lastAddedAt } = useCart();

  return (
    <motion.a
      href="/cart"
      aria-label={count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-border bg-surface-elevated py-2 pl-3 pr-4 shadow-lg transition-colors hover:border-border-strong"
    >
      {/* Re-mounts on every add to replay the bounce */}
      <motion.span
        key={lastAddedAt}
        initial={reduce || lastAddedAt === 0 ? false : { scale: 1 }}
        animate={reduce || lastAddedAt === 0 ? {} : { scale: [1, 1.35, 1], rotate: [0, -12, 0] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative flex"
      >
        <ShoppingCart className="size-5 text-text" aria-hidden />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -right-2.5 -top-2 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[0.625rem] font-bold leading-5 text-brand-on ring-2 ring-background"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      <span className="text-body-sm font-semibold text-text">Cart</span>
    </motion.a>
  );
}
