"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, PackageSearch, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { CategoryMegaMenu } from "./CategoryMegaMenu";
import { SearchCommand } from "./SearchCommand";

const NAV_LINKS = [
  { label: "Home", href: "/", internal: true },
  { label: "Authors", href: "#/authors", internal: false },
];

export function Navbar() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const { count } = useCart();
  const reduce = useReducedMotion() ?? false;

  // Cmd/Ctrl+K opens search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mega menu with Escape
  useEffect(() => {
    if (!categoriesOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoriesOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [categoriesOpen]);

  const openCategories = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setCategoriesOpen(true);
  };
  const scheduleCloseCategories = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setCategoriesOpen(false), 160);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-button focus:text-brand-on"
      >
        Skip to content
      </a>

      <header
        className={`sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md transition-[box-shadow,border-color] duration-200 ${
          scrolled ? "border-border shadow-xs" : "border-transparent"
        }`}
      >
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Bookie — home"
            className="mr-4 flex shrink-0 items-center gap-2 rounded-control transition-opacity duration-200 hover:opacity-80"
          >
            <Image
              src="/logo.png"
              alt="Bookie"
              width={32}
              height={32}
              priority
              className="size-8 object-contain"
            />
            <span className="text-fun text-[1.75rem] leading-none text-text">Bookie</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) =>
              link.internal ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-control px-3 py-2 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-control px-3 py-2 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
                >
                  {link.label}
                </a>
              ),
            )}

            {/* Categories with mega menu */}
            <div
              className="relative"
              onMouseEnter={openCategories}
              onMouseLeave={scheduleCloseCategories}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={categoriesOpen}
                onClick={() => setCategoriesOpen((o) => !o)}
                className={`flex items-center gap-1 rounded-control px-3 py-2 text-body-sm font-medium transition-colors hover:bg-surface-muted ${
                  categoriesOpen ? "bg-surface-muted text-text" : "text-text-secondary hover:text-text"
                }`}
              >
                Categories
                <motion.span animate={{ rotate: categoriesOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                  <ChevronDown className="size-4" aria-hidden />
                </motion.span>
              </button>
              <CategoryMegaMenu open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
            </div>
          </div>

          <div className="flex-1" />

          {/* Desktop actions */}
          <div className="hidden items-center gap-1 md:flex">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setSearchOpen(true)}
              aria-label="Search (Command+K)"
              className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-body-sm text-text-muted shadow-xs transition-colors hover:border-border-strong hover:text-text"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden lg:inline">Search…</span>
              <kbd className="hidden rounded-md border border-border bg-surface-muted px-1.5 text-[0.625rem] font-semibold lg:inline">
                ⌘K
              </kbd>
            </motion.button>

            <a
              href="#/track"
              className="flex items-center gap-1.5 rounded-control px-3 py-2 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
            >
              <PackageSearch className="size-4" aria-hidden />
              Track Order
            </a>

            <a
              href="#/cart"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              className="relative flex size-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
            >
              <ShoppingCart className="size-[18px]" aria-hidden />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.5625rem] font-bold leading-4 text-brand-on ring-2 ring-background"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </a>

            <ThemeToggle />
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex size-9 items-center justify-center rounded-control text-text-secondary hover:bg-surface-muted"
            >
              <Search className="size-5" aria-hidden />
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex size-9 items-center justify-center rounded-control text-text hover:bg-surface-muted"
            >
              {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden border-t border-border bg-background md:hidden"
            >
              <MobileMenu onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <div className="space-y-1 px-4 py-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="block rounded-control px-3 py-2.5 text-body font-medium text-text hover:bg-surface-muted"
      >
        Home
      </Link>

      <button
        type="button"
        aria-expanded={categoriesOpen}
        onClick={() => setCategoriesOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-control px-3 py-2.5 text-body font-medium text-text hover:bg-surface-muted"
      >
        Categories
        <motion.span animate={{ rotate: categoriesOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="size-4" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {categoriesOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1 pb-1 pl-3">
              {MOCK_CATEGORIES.map((c) => (
                <a
                  key={c.name}
                  href={`#/categories/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  onClick={onNavigate}
                  className="rounded-control px-3 py-2 text-body-sm text-text-secondary hover:bg-surface-muted hover:text-text"
                >
                  {c.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href="#/authors"
        onClick={onNavigate}
        className="block rounded-control px-3 py-2.5 text-body font-medium text-text hover:bg-surface-muted"
      >
        Authors
      </a>
      <a
        href="#/track"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-control px-3 py-2.5 text-body font-medium text-text hover:bg-surface-muted"
      >
        <PackageSearch className="size-4" aria-hidden />
        Track Order
        <span className="text-fun ml-auto text-lg text-text-muted">no account needed</span>
      </a>

      <a
        href="#/cart"
        onClick={onNavigate}
        className="mt-2 flex items-center justify-center gap-2 rounded-control bg-brand px-3 py-3 text-button text-brand-on"
      >
        <ShoppingCart className="size-4" aria-hidden />
        View Cart
      </a>
    </div>
  );
}
