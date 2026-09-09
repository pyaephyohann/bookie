"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { MOCK_CATEGORIES } from "@/lib/mock-data";

/**
 * Desktop hover mega-menu listing all book categories.
 * Rendered inside the Navbar; visibility is controlled by the parent.
 */

interface CategoryMegaMenuProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryMegaMenu({ open, onClose }: CategoryMegaMenuProps) {
  const reduce = useReducedMotion() ?? false;
  const columns = [
    MOCK_CATEGORIES.slice(0, 5),
    MOCK_CATEGORIES.slice(5, 10),
    MOCK_CATEGORIES.slice(10),
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute left-1/2 top-full z-40 w-[min(44rem,90vw)] -translate-x-1/2 pt-2"
        >
          <div className="overflow-hidden rounded-card border border-border bg-surface-elevated shadow-lg">
            <div className="grid grid-cols-3 gap-6 p-5 max-sm:grid-cols-1 max-sm:gap-2">
              {columns.map((column, ci) => (
                <div key={ci} className="flex flex-col gap-0.5">
                  {column.map((category, i) => (
                    <motion.a
                      key={category.name}
                      href={`/categories/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                      onClick={onClose}
                      initial={reduce ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reduce ? 0 : 0.03 * (ci * 5 + i), duration: 0.15 }}
                      className="group flex items-center justify-between rounded-control px-2.5 py-1.5 transition-colors hover:bg-surface-muted"
                    >
                      <span className="text-body-sm font-medium text-text">{category.name}</span>
                      <span className="flex items-center gap-1 text-caption text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
                        {category.count}
                        <ArrowUpRight className="size-3.5" aria-hidden />
                      </span>
                    </motion.a>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border-subtle bg-surface-muted/60 px-5 py-2.5">
              <span className="text-caption text-text-muted">
                {MOCK_CATEGORIES.reduce((sum, c) => sum + c.count, 0)} books across {MOCK_CATEGORIES.length} categories
              </span>
              <Link
                href="/categories"
                onClick={onClose}
                className="text-caption font-semibold text-text underline-offset-4 hover:underline"
              >
                Browse all →
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
