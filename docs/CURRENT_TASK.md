# Current Task — B3: Books

## Status

COMPLETED

B3 — Books is finished. All routes implemented and verified. B4 has NOT started.

## Implemented

- `/books/[slug]` — book detail with cover, title, author, price, description, metadata, wishlist toggle, add-to-cart, recently-viewed recording, online reading entry point
- `/categories` — categories index with editorial tile grid
- `/categories/[slug]` — category detail with book grid
- `/authors` — authors index with avatar/name/bio cards
- `/authors/[slug]` — author detail with book grid
- `/search?q=...` — real Prisma search by title, author, category, ISBN
- `lib/wishlist.ts` — client-side localStorage wishlist (SSR-safe, useSyncExternalStore)
- Recently-viewed recording on book detail page visits
- All internal `#/...` placeholder links replaced with real routes
- SearchCommand now navigates to `/search?q=...`
- Navbar categories/authors/cart links updated to real routes

## Not in scope (unchanged)

Cart state/business logic (B4), checkout/payment (B5/B6), BookPass generation (B7), order tracking (B8), online reader (B9), admin/POS/inventory (not in user-app roadmap)

## Verification

All checks pass:
- `npx tsc --noEmit` ✅
- `npm run lint -- --max-warnings=0` ✅
- `npm run build` ✅
- All routes respond 200 (404 for nonexistent books) ✅
- Mock data fallback works ✅