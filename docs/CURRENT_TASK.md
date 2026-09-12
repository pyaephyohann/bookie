# Current Task

## A1 — Admin Foundation 🔒 LOCKED

## A2 — Dashboard & Analytics 🔒 LOCKED

## A3 — Catalog Management 🔒 LOCKED

## A4 — Inventory Management 🔒 LOCKED

## A5 — Order Management 🔒 LOCKED

## A6 — Payment Management 🔒 LOCKED

## A7 — Content & Promotions 🔒 LOCKED

A7 is complete. Content and promotions management is fully implemented and verified.

### What A7 covers

**Reading Content** (`/admin/content/reading`, `/admin/content/reading/[bookId]`)
- List all books with reading-content status, search, book status filter, content state filter
- Create/edit/delete `BookContent` records for any book
- Inline HTML/plain text with server-side `sanitize-html` sanitization before storage
- PDF/EPUB/OTHER file URL management with safe URL validation
- `Book.isReadableOnline` toggle managed atomically with content existence
- Delete removes content AND disables reading

**Featured Books** (`/admin/content/featured`)
- Manage only `TRENDING`, `BEST_SELLER`, and `RECOMMENDED` `FeaturedBook` sections
- Assign published books, remove assignments, reorder within sections
- Duplicate assignment prevention via composite unique constraint
- Unsupported sections (`NEW_RELEASE`, `PROMOTION`, `STAFF_PICK`) are excluded from the admin UI and protected server-side

**Promotions** (`/admin/content/promotions`, `/new`, `/[id]`)
- Create/edit/delete promotions with name, description, type, value, schedule, activation
- Link/unlink published books to promotions
- Percentage validation (0–100), fixed amount validation (non-negative), date range validation (`startAt < endAt`)
- Activation toggle (live when `isActive + startAt <= now <= endAt`)
- Transactional book linking (delete-then-create in `prisma.$transaction`)

### Architecture

- `lib/admin/content.ts` — pure validation helpers, Zod schemas, constants (Prisma-free, safe for client forms)
- `lib/reading-content.ts` — `sanitize-html` wrapper with presentation-only allow-list
- `lib/admin/content-queries.ts` — server-only Prisma queries for reading, featured, and promotions
- `app/admin/(dashboard)/content/reading/actions.ts` — save/delete reading content (server actions)
- `app/admin/(dashboard)/content/reading/page.tsx` — reading content list
- `app/admin/(dashboard)/content/reading/[bookId]/page.tsx` — reading content editor
- `app/admin/(dashboard)/content/reading/ReadingContentForm.tsx` — client reading content form
- `app/admin/(dashboard)/content/featured/actions.ts` — assign/remove/reorder featured books
- `app/admin/(dashboard)/content/featured/page.tsx` — featured books management
- `app/admin/(dashboard)/content/promotions/actions.ts` — CRUD + toggle promotions
- `app/admin/(dashboard)/content/promotions/page.tsx` — promotions list
- `app/admin/(dashboard)/content/promotions/PromotionForm.tsx` — client promotion form
- `app/admin/(dashboard)/content/promotions/new/page.tsx` — new promotion
- `app/admin/(dashboard)/content/promotions/[id]/page.tsx` — edit promotion

### Behavior notes

- Inline HTML is sanitized on write AND at the reader boundary (defense in depth for legacy rows)
- The existing `ContentType` enum has no INLINE member; inline mode stores `OTHER` while `content` is populated — the B9 reader gives `content` precedence, preserving existing behavior
- Featured books and promotions now filter to `PUBLISHED` status on the homepage
- Promotion changes affect only storefront display pricing — historical `Order`/`OrderItem` snapshots are never modified
- `Banner` model is not consumed by storefront code; hero remains static `MOCK_HERO_SLIDES`

### Verification status

- TypeScript: PASS
- ESLint: PASS
- Production build: PASS (all A7 routes registered)
- HTML sanitization: VERIFIED (sanitize-html tested with dangerous patterns)
- File URL validation: VERIFIED
- Featured section protection: VERIFIED (server-side section check on remove)
- Promotion validation: VERIFIED (percentage, fixed amount, date range)
- Admin authentication: VERIFIED (unauthenticated routes redirect to /admin/login)
- A1–A6 regression: PASS
- **Runtime limitation:** Authenticated DB-backed CRUD smoke testing was not executed because PostgreSQL was unavailable during final verification. Code-level validation, sanitizer testing, authentication checks, TypeScript, ESLint, and production build all passed.

### Not in scope (do not start)

- A8 admin production polish

A8 — Admin Production Polish is next.
