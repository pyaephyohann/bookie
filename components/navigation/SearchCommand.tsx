"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Global search command palette.
 * Opens with Cmd/Ctrl+K or the navbar search button; closes with Escape.
 * On Enter, navigates to the real /search page with the query.
 */

interface SearchCommandProps {
  open: boolean;
  onClose: () => void;
}

export function SearchCommand({ open, onClose }: SearchCommandProps) {
  return (
    <AnimatePresence>
      {open && <SearchDialog onClose={onClose} />}
    </AnimatePresence>
  );
}

/** Inner component so each open starts with a fresh query state. */
function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const router = useRouter();

  // Navigate to /search?q=... on Enter
  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      onClose();
    }
  }, [query, router, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <motion.div
        aria-hidden
        className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search books"
        initial={{ opacity: 0, y: reduceY(), scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduceY(), scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative w-full max-w-xl overflow-hidden rounded-card border border-border bg-surface-elevated shadow-lg"
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 shrink-0 text-text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search books, authors and categories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search books, authors, categories…"
            className="h-14 w-full bg-transparent text-body-lg outline-none placeholder:text-text-disabled"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-[0.625rem] font-semibold text-text-muted sm:block">
            ESC
          </kbd>
        </div>

        {/* Results area - just instructions, no mock results */}
        <div className="p-6 text-center">
          <Search className="mx-auto mb-3 size-10 text-text-muted opacity-40" aria-hidden />
          <p className="text-body font-semibold text-text">Search Bookie</p>
          <p className="mt-1 text-body-sm text-text-muted">
            Type a query and press Enter to search books, authors, and categories.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex items-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-body-sm text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            <PackageSearch className="size-4" aria-hidden />
            <span>
              Looking for an order?{" "}
              <span className="font-semibold text-text">Track it with your BookPass</span>
            </span>
            <kbd className="ml-2 rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-[0.625rem] font-semibold text-text-muted">
              ESC
            </kbd>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function reduceY(): number {
  if (typeof window === "undefined") return 8;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 8;
}
