# Bookie — Project Overview

## Product

**Bookie** is an online bookstore. Users can:

- browse books
- discover books (trending, best sellers, new releases, promotions, categories, authors)
- read supported books online
- add books to a cart
- order books **without creating an account**

Users do NOT need to sign up to order. Checkout collects customer information and produces a unique **BookPass** such as:

```
ORD-2026-001928
```

The BookPass is the customer's key to checking order status. Order/tracking updates are communicated through email and phone messaging.

## Core user journey

```
Home
→ Browse books
→ Book details
→ Add to cart
→ Cart
→ Checkout
→ Customer information
→ Payment
→ Payment slip upload
→ Order complete
→ BookPass
→ Track order
```

## Order status flow (planned)

```
Order Placed (PLACED)
→ Confirmed (CONFIRMED)
→ Preparing (PREPARING)
→ Shipped (SHIPPED)
→ Delivered (DELIVERED)
```

`REJECTED` is a possible terminal/error state after order placement or payment verification. `CANCELLED` is also modeled.

## Feature inventory

Legend: ✅ CURRENT (implemented in the repo) · 🧭 PLANNED (later milestones)

| Feature | Status | Notes |
|---|---|---|
| Home / landing page | ✅ | Hero + slider, trending, best sellers, new releases, promotions, categories, authors, read-online, BookPass, final CTA |
| Navbar | ✅ | Logo, Home, Authors, Categories menu, Search, Track Order, Cart, theme toggle, mobile menu |
| Categories menu | ✅ | Desktop hover mega-menu + mobile accordion (mock data) |
| Search UI + shortcut | ✅ | ⌘K / Ctrl+K command palette with mock results; no backend search |
| Theme (Light / Dark / System) | ✅ | localStorage + system preference, no-flash init |
| Cart state | ✅ | Client-side count + add-to-cart feedback; no persistence or checkout |
| Floating cart | ✅ | Bottom-left shortcut with item count |
| Category pages | 🧭 | B2 — Home & Discovery |
| Book details page | 🧭 | B3 — Books |
| Authors pages | 🧭 | B2/B3 |
| Search backend | 🧭 | B2/B3 |
| Wishlist | 🧭 | Planned |
| Recently viewed | 🧭 | Planned |
| Recommendations / Recommended | 🧭 | Planned (FeaturedSection enum already includes RECOMMENDED) |
| Hero slider (dynamic data) | 🧭 | Currently mock slides |
| Cart page | 🧭 | B4 — Cart |
| Checkout + customer information | 🧭 | B5 — Checkout |
| Payment (KPay / AYA Pay) | 🧭 | B6 — Payment |
| Payment slip upload | 🧭 | B6 |
| BookPass generation | 🧭 | B7 — Order Complete |
| Order tracking page | 🧭 | B8 — Order Tracking |
| Online reading (reader) | 🧭 | B9 — Online Reading |
| Admin / POS / inventory | 🧭 | Not in the user-app roadmap |