"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useSyncExternalStore } from "react";
import { getWishlistIds, toggleWishlist, WISHLIST_EVENT } from "@/lib/wishlist";

function subscribeWishlist(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(WISHLIST_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(WISHLIST_EVENT, onChange);
  };
}

let cachedIds: string[] | null = null;
function getWishlistSnapshot(): string[] {
  const next = getWishlistIds();
  if (
    cachedIds === null ||
    cachedIds.length !== next.length ||
    cachedIds.some((id, i) => id !== next[i])
  ) {
    cachedIds = next;
  }
  return cachedIds;
}
function getServerSnapshot(): string[] {
  return [];
}

interface WishlistButtonProps {
  bookId: string;
  className?: string;
  /** Size variant — defaults to "sm" for cards, "lg" for detail pages. */
  size?: "sm" | "lg";
  showLabel?: boolean;
}

export function WishlistButton({
  bookId,
  className = "",
  size = "sm",
  showLabel = false,
}: WishlistButtonProps) {
  const ids = useSyncExternalStore(subscribeWishlist, getWishlistSnapshot, getServerSnapshot);
  const active = useMemo(() => ids.includes(bookId), [ids, bookId]);

  const handleClick = () => {
    toggleWishlist(bookId);
  };

  const iconSize = size === "lg" ? "size-5" : "size-4";
  const btnSize = size === "lg" ? "size-11" : "size-8";

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={`flex items-center justify-center rounded-full transition-colors ${btnSize} ${
        active
          ? "bg-error/10 text-error"
          : "bg-surface text-text-muted hover:bg-surface-muted hover:text-text"
      } ${className}`}
    >
      <Heart
        className={`${iconSize} ${active ? "fill-current" : ""}`}
        aria-hidden
      />
      {showLabel && (
        <span className="sr-only">{active ? "In wishlist" : "Add to wishlist"}</span>
      )}
    </motion.button>
  );
}