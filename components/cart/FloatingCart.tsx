"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart";

/**
 * Floating cart shortcut — fixed to the bottom-left of the viewport.
 * Shows the current total item count and links to /cart.
 */
export function FloatingCart() {
  const { totalItems } = useCartStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-5 left-5 z-40"
    >
      <Link
        href="/cart"
        aria-label={totalItems > 0 ? `Open cart, ${totalItems} item${totalItems === 1 ? "" : "s"}` : "Open cart"}
        className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated py-2 pl-3 pr-4 shadow-lg transition-colors hover:border-border-strong"
      >
        <span className="relative flex">
          <ShoppingCart className="size-5 text-text" aria-hidden />
          <AnimatePresence>
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="absolute -right-2.5 -top-2 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[0.625rem] font-bold leading-5 text-brand-on ring-2 ring-background"
              >
                {totalItems}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="text-body-sm font-semibold text-text">Cart</span>
      </Link>
    </motion.div>
  );
}
