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

// ── External store (useSyncExternalStore pattern) ──────────────────────────
// Snapshots must be reference-stable when the data has not changed.
// React compares by Object.is — a new object reference triggers a re-render,
// which re-calls getSnapshot, which creates another new object → infinite loop.
// Solution: cache the snapshot and only replace it when notify() fires.

let listeners: Array<() => void> = [];

// Client-side cached snapshot — replaced only when the cart changes.
let cachedClientSnapshot: CartState = { items: [] };

// Server-side snapshot — always empty, never changes.
const serverSnapshot: CartState = { items: [] };

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
  // Re-read localStorage and replace the cached snapshot only if contents differ.
  // On first call (or after notify), readCart() gives the latest data.
  const nextItems = readCart();
  const prev = cachedClientSnapshot.items;

  // Quick length check before deep comparison
  if (nextItems.length !== prev.length) {
    cachedClientSnapshot = { items: nextItems };
  } else {
    // Compare by value — same length + same order + same fields
    const changed = nextItems.some(
      (item, i) =>
        item.bookId !== prev[i].bookId ||
        item.quantity !== prev[i].quantity ||
        item.slug !== prev[i].slug ||
        item.title !== prev[i].title ||
        item.author !== prev[i].author ||
        item.price !== prev[i].price ||
        item.coverImage !== prev[i].coverImage,
    );
    if (changed) {
      cachedClientSnapshot = { items: nextItems };
    }
  }

  // Return the same reference if nothing changed
  return cachedClientSnapshot;
}

function getServerSnapshot(): CartState {
  // Always return the same constant — never creates a new reference.
  return serverSnapshot;
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
      // Invalidate cache so getSnapshot sees the new data
      cachedClientSnapshot = { items: next };
      notify();
    },
    []
  );

  const updateQuantity = useCallback((bookId: string, quantity: number) => {
    const clamped = Math.max(1, Math.min(quantity, MAX_QUANTITY));
    const current = readCart();
    const next = current.map((i) => (i.bookId === bookId ? { ...i, quantity: clamped } : i));
    writeCart(next);
    cachedClientSnapshot = { items: next };
    notify();
  }, []);

  const removeItem = useCallback((bookId: string) => {
    const current = readCart().filter((i) => i.bookId !== bookId);
    writeCart(current);
    cachedClientSnapshot = { items: current };
    notify();
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
    cachedClientSnapshot = { items: [] };
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

function notify(): void {
  // Force subscribers to re-read localStorage
  window.dispatchEvent(new Event("bookie:cart"));
}
