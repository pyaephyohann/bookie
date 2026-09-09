# Current Task

## B4 — Cart

### Objective

Build a complete client-side shopping cart experience with localStorage persistence, quantity controls, and a responsive cart page.

### Status

**COMPLETED**

### What was done

- Created `lib/cart.ts` — localStorage-backed cart store using `useSyncExternalStore` (SSR-safe, hydration-safe)
- Created `/cart` page with responsive layout: item list, quantity controls (±), remove, order summary, checkout CTA
- Replaced old `CartContext` with new `useCartStore` across all components (FloatingCart, Navbar, BookCard, BookDetailClient, NewReleases)
- Cart persists across page refresh and navigation
- Empty cart state with browse CTA
- Accessible quantity controls with dynamic labels

### Scope

- [x] Cart state (localStorage, `useSyncExternalStore`)
- [x] Cart page (`/cart`)
- [x] FloatingCart badge (real count)
- [x] Navbar cart badge (real count)
- [x] BookCard Add to Cart (real item data)
- [x] BookDetailClient Add to Cart (real item data)
- [x] NewReleases Add to Cart (real item data)
- [x] Empty cart state
- [x] Order summary (subtotal, total)

### Not in scope

- Checkout (B5)
- Payment (B6)
- Order creation (B7)
- Coupon/discount codes

## B5 — Checkout

Has not started. Will begin when B5 is approved.
