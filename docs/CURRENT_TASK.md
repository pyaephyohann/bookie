# Current Task — B2: Home & Discovery

## Status

**COMPLETED**

B2 — Home & Discovery is finished and locked. The Home page is now a real, data-driven discovery experience (Prisma-backed with a documented mock fallback for the empty development database).

**B3 — Books has NOT started.** It is the next task; do not begin it until instructed.

(Update this file only when the current task changes.)

## Objective

Turn the B1 landing/foundation into a real bookstore discovery Home page: hero, browse categories, trending, best sellers, new releases, promotions, featured authors, recommended, and recently viewed — all following the existing Bookie design system and animation architecture.

## Scope (completed)

- Server-side Home data layer (`lib/data.ts`) with shared UI types and Prisma queries
- Mock-catalogue fallback when the database is empty/unavailable (explicit, documented)
- Hero + 5s auto-slider (typed static config)
- Browse Categories section (clickable cards with counts)
- Trending / Best Sellers / New Releases / Promotion Items / Featured Authors / Recommended sections
- Recently Viewed (localStorage, `useSyncExternalStore`, SSR-safe)
- Reusable `BookCard` / `BookCover` (real covers + placeholder fallback), `EmptyState`
- Section order per the B2 spec; responsive shelves/grids; light/dark/system verified
- Documentation updated (PROJECT, ARCHITECTURE, DESIGN, DATABASE, DEVELOPMENT, ROADMAP)

## Not in scope (unchanged)

Checkout, payment, BookPass generation, order creation, order tracking, online reading, admin/POS, inventory UI, wishlist, cart page, advanced search backend, auth/accounts, AI recommendations, B10 polish. Also: no book-detail / category / author pages (B3), no schema changes.

## Known remaining issues (B2)

- The development database is empty, so the Home page currently renders the **mock fallback**; the Prisma query path is implemented and build-verified but awaits real seeded data to be observed end-to-end.
- Recently Viewed displays stored ids only — nothing records views yet (B3 detail pages will call `recordRecentlyViewed`).
- Hero slides remain a typed static config (not CMS-driven).
- Home is statically prerendered at build time; ISR/revalidation is B10 polish.

## Definition of done

- lint, typecheck, and production build pass.
- All discovery sections render on the Home page in the B2 order.
- Empty/fallback states are clean; no hydration errors; no console errors.
- Docs reflect the actual B2 implementation.