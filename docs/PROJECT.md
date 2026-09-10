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
→ Payment (KPay / AYA Pay)
→ Payment slip upload
→ Awaiting verification
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
| Home page | ✅ | Hero + slider, categories, trending, best sellers, new releases, promotions, featured authors, recommended, recently viewed, read-online, BookPass, final CTA — all discovery sections data-backed (Prisma with mock fallback) |
| Hero + auto slider | ✅ | 5s autoplay, prev/next, indicators, pause; slides are a typed static config (not CMS-driven) |
| Browse Categories (Home) | ✅ | Clickable category cards w/ book counts (Prisma Category or mock) |
| Trending | ✅ | FeaturedBook section TRENDING; falls back to newest books; mock fallback when DB empty |
| Best Sellers | ✅ | FeaturedBook section BEST_SELLER; documented placeholder ranking until order data exists |
| New Releases | ✅ | Sorted by `publishedAt` (nulls last); mock fallback uses the mock's NEW flags |
| Promotion Items | ✅ | Active Promotions (PERCENTAGE/FIXED_AMOUNT) applied to linked books; mock fallback uses compareAtPrice deals |
| Featured Authors | ✅ | Prisma Authors with book counts + photo/gradient avatars; mock fallback |
| Recommended For You | ✅ | Lightweight deterministic pick (featured RECOMMENDED or curated fallback) — NOT AI/personalised |
| Recently Viewed | ✅ | Client-side localStorage (12 max, deduped, SSR-safe); populated by future B3 detail views |
| Navbar | ✅ | Logo, Home, Authors, Categories menu, Search, Track Order, Cart, theme toggle, mobile menu |
| Categories menu (navbar) | ✅ | Desktop hover mega-menu + mobile accordion (mock data for now) |
| Search UI + shortcut | ✅ | ⌘K / Ctrl+K command palette with mock results; no backend search |
| Theme (Light / Dark / System) | ✅ | localStorage + system preference, no-flash init |
| Cart state | ✅ | Client-side count + add-to-cart feedback; no persistence or checkout |
| Floating cart | ✅ | Bottom-left shortcut with item count |
| Category pages | ✅ | `/categories` index + `/categories/[slug]` detail with book grid |
| Book details page | ✅ | `/books/[slug]` — cover, title, author, price, description, wishlist, add-to-cart, recently-viewed recording, online reading entry point |
| Authors pages | ✅ | `/authors` index + `/authors/[slug]` detail with book grid |
| Search backend | ✅ | `/search?q=...` — real Prisma search by title, author, category, ISBN |
| Wishlist | ✅ | Client-side localStorage, SSR-safe, toggle from book cards and detail pages |
| Cart page | 🧭 | B4 — Cart |
| Checkout + customer information | ✅ | B5 — Checkout |
| Payment (KPay / AYA Pay) | ✅ | B6 — Payment |
| Payment slip upload | ✅ | B6 |
| BookPass generation | ✅ | B7 — Order Complete |
| Order tracking page | 🧭 | B8 — Order Tracking |
| Online reading (reader) | 🧭 | B9 — Online Reading |
| Admin / POS / inventory | 🧭 | Not in the user-app roadmap |

**Data strategy (B2):** the Home page prefers real Prisma data. Every discovery section has a genuine query path against the existing schema. When the database has no PUBLISHED books (empty dev DB, unreachable, or broken), the whole page falls back to the mock catalogue so the storefront is never unusable. This is an explicit, documented fallback — not fake database records.