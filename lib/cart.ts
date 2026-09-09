import { useSyncExternalStore, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
  bookId: string;
  slug: string;
  title: string;
  author: string;
  coverImage: string | null;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "bookie:cart";
const MAX_QUANTITY = 99;

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i: unknown): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        "bookId" in i &&
        "slug" in i &&
        "title" in i &&
        "quantity" in i &&
        typeof (i as CartItem).bookId === "string" &&
        typeof (i as CartItem).quantity === "number" &&
        (i as CartItem).quantity > 0
    );
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function notify(): void {
  // Force subscribers to re-read localStorage
  window.dispatchEvent(new Event("bookie:cart"));
}

// ── External store (useSyncExternalStore pattern) ──────────────────────────

let listeners: Array<() => void> = [];

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  window.addEventListener("bookie:cart", listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    window.removeEventListener("bookie:cart", listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): CartState {
  return { items: readCart() };
}

function getServerSnapshot(): CartState {
  return { items: [] };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * React hook — returns { items } and action helpers.
 * Client-only; returns empty items during SSR / before hydration.
 */
export function useCartStore() {
  const { items } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      const current = readCart();
      const existing = current.find((i) => i.bookId === item.bookId);
      const next = existing
        ? current.map((i) =>
            i.bookId === item.bookId ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) } : i
          )
        : [...current, { ...item, quantity: 1 }];
      writeCart(next);
      notify();
    },
    []
  );

  const updateQuantity = useCallback((bookId: string, quantity: number) => {
    const clamped = Math.max(1, Math.min(quantity, MAX_QUANTITY));
    const current = readCart();
    const next = current.map((i) => (i.bookId === bookId ? { ...i, quantity: clamped } : i));
    writeCart(next);
    notify();
  }, []);

  const removeItem = useCallback((bookId: string) => {
    const current = readCart().filter((i) => i.bookId !== bookId);
    writeCart(current);
    notify();
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
    notify();
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotal,
  } as const;
}
