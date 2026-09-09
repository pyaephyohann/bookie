"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface CartContextValue {
  count: number;
  /** Increments the cart and pulses the floating cart button. */
  addItem: (quantity?: number) => void;
  /** Millisecond timestamp of the last add — used to trigger animations. */
  lastAddedAt: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  const addItem = useCallback((quantity = 1) => {
    setCount((c) => c + quantity);
    setLastAddedAt(Date.now());
  }, []);

  const value = useMemo(() => ({ count, addItem, lastAddedAt }), [count, addItem, lastAddedAt]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
