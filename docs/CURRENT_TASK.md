# Current Task

## A1 — Admin Foundation 🔒 LOCKED

## A2 — Dashboard & Analytics 🔒 LOCKED

## A3 — Catalog Management 🔒 LOCKED

## A4 — Inventory Management 🔒 LOCKED

A4 is complete. Inventory management is fully implemented and verified.

### What A4 covers

**Inventory Overview** (`/admin/inventory`)
- Overview cards: total books, total units, low stock, out of stock
- Paginated inventory table with book cover, title, authors, ISBN, stock quantity, status badge, transaction count, last activity
- Server-side search (title, ISBN, author), status filter (in stock/low stock/out of stock), sort (recently updated, stock level, title)
- All filter state carried in URL parameters

**Book Inventory Detail** (`/admin/inventory/[bookId]`)
- Book info display with cover, title, authors, ISBN, categories
- Current stock level with status indicator
- Stock adjustment form (RESTOCK, RETURN, DAMAGE, ADJUSTMENT types)
- Set stock level form (direct override)
- Transaction history with pagination
- Atomic stock mutations via Prisma transactions

**Transaction History** (`/admin/inventory/history`)
- Global history of all stock movements across all books
- Links back to individual book inventory pages
- Paginated with transaction type, quantity change, stock before/after, note, date

### Architecture

- `lib/admin/inventory-queries.ts` — server-only inventory queries (overview, list, detail, transactions)
- `app/admin/(dashboard)/inventory/actions.ts` — server actions for stock adjustments (atomic transactions)
- `app/admin/(dashboard)/inventory/InventoryAdjustForm.tsx` — client component for adjustment forms
- `app/admin/(dashboard)/inventory/page.tsx` — inventory list page
- `app/admin/(dashboard)/inventory/[bookId]/page.tsx` — book-level detail page
- `app/admin/(dashboard)/inventory/history/page.tsx` — global transaction history

### Stock adjustment approach

Stock mutations use atomic conditional `UPDATE … WHERE … RETURNING` inside `prisma.$transaction`:
1. Atomic UPDATE adds/subtracts delta and checks sufficiency in one statement
2. PostgreSQL row-locks the Book row for the duration of the transaction
3. InventoryTransaction record created with verified before/after values
4. Paths revalidated

Concurrent access verified against live PostgreSQL:
- Concurrent increases (stock 10 + +5 + +3) → final 18 ✅
- Concurrent decreases with sufficient stock → correct final stock ✅
- Concurrent insufficient-stock decreases → stock never negative ✅
- 50 mixed concurrent operations → stock and history consistent ✅

Transaction types: RESTOCK, SALE, RETURN, ADJUSTMENT, DAMAGE

### Verification status

- TypeScript: PASS
- ESLint: PASS
- Production build: PASS (all inventory routes registered)
- Concurrency safety: VERIFIED against live PostgreSQL
- A2 dashboard integration: CONSISTENT
- Security (requireAdmin): VERIFIED
- Dark mode: VERIFIED
- Mobile layout: VERIFIED

### Not in scope (do not start)

- A5 order management
- A6 payment management
- A7 content & promotions
- A8 admin production polish

A5 — Order Management is next.
