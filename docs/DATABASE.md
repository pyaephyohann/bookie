# Bookie — Database

## Stack (CURRENT)

- **PostgreSQL** — the only supported provider.
- **Prisma 7.10.0** (`prisma`, `@prisma/client`, `@prisma/adapter-pg` — all 7.10.0) — stable, Rust-free `prisma-client` runtime with the Query Compiler.
- Driver adapter: `PrismaPg` (wraps `pg`) at runtime (`lib/prisma.ts`); CLI connects via `prisma.config.ts`.

## Configuration (CURRENT)

- `prisma/schema.prisma` — `provider = "postgresql"` datasource with **no `url`** (Prisma 7 pattern: the URL lives in config, not the schema). Generator: `prisma-client` → `output = "../generated/prisma"`, `moduleFormat = "cjs"`.
- `prisma.config.ts` — `schema`, `migrations.path = "prisma/migrations"`, `datasource.url = env("DATABASE_URL")` (fails loudly if missing). `dotenv` loads `.env` for CLI commands.
- Env: `.env` (git-ignored) holds the real connection string; `.env.example` has the placeholder. Production sets `DATABASE_URL` in the platform env. No credentials in source.
- Generated client lives in `generated/prisma` (git-ignored); regenerated with `npx prisma generate`.
- Database state: local `bookie` database, `public` schema, in sync via `prisma db push` (verified with `prisma migrate diff` — no difference). No `prisma/migrations` directory yet; `prisma migrate dev --name init` is the migration path when needed.

## Models (18, CURRENT)

| Model | Purpose |
|---|---|
| `User` | Admin/staff accounts (role ADMIN/STAFF, email unique, password hash) |
| `Book` | Catalog item: title, slug (unique), description, ISBN, publisher, publishedAt, price/compareAtPrice (`Decimal(12,2)`), stockQuantity, status, coverImage, online-reading flag + SEO fields |
| `Author` | name, slug (unique), biography, photoUrl |
| `Category` | name, slug (unique), optional self-relation `parentId` (nested categories) |
| `CategoryBook` | M2M join: category ↔ book |
| `BookAuthor` | M2M join: book ↔ author, with `sortOrder` |
| `BookContent` | One-to-one with Book (`bookId @unique`): fileUrl + content for online reading |
| `Order` | Guest order: BookPass (unique, e.g. `ORD-2026-001928`), customer contact fields, shippingAddress, note, status, money snapshot fields (subtotal/discount/shippingFee/total) |
| `OrderItem` | Order line: bookId, **snapshot** bookTitle + unitPrice, quantity, subtotal |
| `OrderStatusHistory` | Order status timeline: status, note, optional changedBy (User) |
| `Payment` | method (KPAY/AYAPAY), amount, status, slipUrl, transactionReference, verifiedBy/At, rejectionReason |
| `InventoryTransaction` | book stock ledger: type, quantity, stockBefore/After, note |
| `Promotion` | name, type (PERCENTAGE/FIXED_AMOUNT), value, start/end, isActive |
| `BookPromotion` | M2M join: book ↔ promotion |
| `Banner` | Homepage banner: imageUrl, linkUrl, status, sortOrder, start/end |
| `FeaturedBook` | Homepage sections (TRENDING/BEST_SELLER/NEW_RELEASE/PROMOTION/STAFF_PICK/RECOMMENDED), unique per (bookId, section), sortOrder |
| `HeroSlide` | Homepage hero carousel slides (A7.1): eyebrow, title, subtitle, description, imageUrl, tint, linkUrl, optional bookId, isActive, sortOrder, startAt/endAt scheduling |
| `OrderTrackingToken` | Tracking link/token per order (token unique, optional expiry) |

## Enums (10, CURRENT)

`UserRole` (ADMIN, STAFF) · `BookStatus` (DRAFT, PUBLISHED, ARCHIVED) · `OrderStatus` (PLACED, CONFIRMED, REJECTED, PREPARING, SHIPPED, DELIVERED, CANCELLED) · `PaymentMethod` (KPAY, AYAPAY) · `PaymentStatus` (PENDING, VERIFIED, REJECTED) · `BannerStatus` (DRAFT, PUBLISHED, ARCHIVED) · `PromotionType` (PERCENTAGE, FIXED_AMOUNT) · `InventoryTransactionType` (RESTOCK, SALE, ADJUSTMENT, RETURN, DAMAGE) · `ContentType` (PDF, EPUB, OTHER) · `FeaturedSection` (TRENDING, BEST_SELLER, NEW_RELEASE, PROMOTION, STAFF_PICK, RECOMMENDED)

## Key relations & constraints (CURRENT)

- **User ↔ Payment** — optional `verifiedBy` (PaymentVerifiedBy), no cascade.
- **User ↔ OrderStatusHistory** — optional `changedBy` (OrderStatusChangedBy), no cascade.
- **Book ↔ Category** — M2M via `CategoryBook`, composite PK `[categoryId, bookId]`, cascade both sides, secondary index on `bookId`.
- **Book ↔ Author** — M2M via `BookAuthor`, composite PK `[bookId, authorId]`, cascade both sides, secondary index on `authorId`.
- **Book ↔ OrderItem** — intentionally **no cascade** (historical orders keep referencing the book); snapshot `bookTitle`/`unitPrice` keep order history intact.
- **Book ↔ BookContent** — one-to-one (`bookId @unique`), cascade.
- **Book ↔ Promotion** — M2M via `BookPromotion`, cascade both sides.
- **Book ↔ InventoryTransaction** — one-to-many, no cascade (ledger preserved).
- **Book ↔ FeaturedBook** — one-to-many, cascade; `@@unique([bookId, section])`.
- **Book ↔ HeroSlide** — one-to-many, `onDelete: SetNull` (deleting a book does NOT break hero slides); `bookId` is optional.
- **Order ↔ OrderItem / Payment / OrderStatusHistory / OrderTrackingToken** — one-to-many, cascade on Order.
- **Category self-relation** — named `CategoryHierarchy`, optional `parentId`, no cascade (`SetNull` by default).
- **Unique:** `Book.slug`, `Book.isbn`, `Author.slug`, `Category.slug`, `Order.bookPass`, `OrderTrackingToken.token`, `BookContent.bookId`.
- **Money:** every currency field is `Decimal @db.Decimal(12, 2)` — never `Float`.
- **Long text:** `@db.Text` on descriptions, addresses, notes, content.
- **Indexes:** FK-side indexes on all join tables; `Book` indexed on status/title/createdAt/publishedAt; `Order` on phone/email/status/createdAt; `Promotion` on start/end + isActive; `Banner` on (status, sortOrder) + start/end; `FeaturedBook` on (section, sortOrder); `HeroSlide` on (isActive, sortOrder) + (startAt, endAt); history/ledger tables on (orderId/bookId, createdAt).

## Notes

- There is **no** separate `Customer`, `Delivery`, `Publisher`, or `Notification` model — customer data lives on `Order` (guest checkout), delivery is the `shippingAddress` field, publisher is a `Book` field, and notifications are handled outside the DB (email/phone).
- `PLANNED:` the first migration (`prisma migrate dev --name init`) and any app-level Prisma queries (B2+). The schema is migration-ready.

## B2 usage (CURRENT — read-only, no schema change)

B2 added the first application queries, all **read-only** and server-side (`lib/data.ts`):

- `Book` filtered to `status = PUBLISHED`, with the first `Category` and `Author` joined; money fields converted from `Decimal` to JS numbers for display.
- `Category` / `Author` with `_count.books` for catalogue counts.
- `FeaturedBook` grouped by `FeaturedSection` (TRENDING / BEST_SELLER / RECOMMENDED) for merchandised shelves.
- `Promotion` filtered to `isActive` + active date range, linked books taken, and the promotion applied as a price adjustment (PERCENTAGE / FIXED_AMOUNT) before display.
- `New Releases` ordered by `publishedAt` (nulls last).

No writes, no new tables, no schema changes. `FeaturedBook` is the intended merchandising mechanism; shelves fall back to deterministic catalogue picks when nothing is merchandised. The database is currently empty in development, so the Home page uses the documented mock fallback until real data is seeded.

## B5 usage (CURRENT — writes, no schema change)

B5 introduced the first write operations, all via a single Prisma `$transaction` in `app/checkout/actions.ts`:

- **Order creation:** new `Order` record with customer info (name, phone, email, shipping address), status `PLACED`, server-calculated totals (`subtotal`, `discount=0`, `shippingFee=0`, `total`), and unique `bookPass`.
- **Order items:** `OrderItem` records with snapshot `bookTitle` + `unitPrice` (fetched from database, not trusted from client).
- **Status history:** initial `OrderStatusHistory` entry (`PLACED`).
- **Inventory:** `Book.stockQuantity` decremented per item; `InventoryTransaction` ledger entry created for each line.
- **Book lookup:** books fetched by ID + `status = PUBLISHED` to validate orderability and obtain authoritative prices.

No schema changes were required — the existing models fully support guest checkout, order snapshots, and inventory tracking.

## B6 usage (CURRENT — writes, no schema change)

B6 introduced payment submission, all server-side via `app/payment/actions.ts`:

- **Payment creation:** new `Payment` record linked to an existing Order:
  - `method`: KPAY or AYAPAY (from customer selection)
  - `amount`: server-calculated from `Order.total` (never client-submitted)
  - `status`: always `PENDING` after customer submission
  - `slipUrl`: payment slip stored as base64 data URL (dev strategy)
- **Duplicate protection:** if an order already has a PENDING payment, the existing record is updated (method + slipUrl) instead of creating a new one. VERIFIED payments prevent any further submission.
- **Order eligibility check:** order must exist, must not be CANCELLED/REJECTED/DELIVERED.
- **No schema changes** — the existing `Payment` model fully supports the B6 requirements.

## B8 usage (CURRENT — read-only, no schema change)

B8 added the customer-facing order tracking page (`/track?pass=XXX`), all **read-only** and server-side (`app/track/page.tsx`):

- **Order lookup:** `Order` fetched by unique `bookPass` (normalized trim + uppercase).
- **Status timeline:** `OrderStatusHistory` rows ordered by `createdAt` (asc) represent the actual server-side progression; the current status is `Order.status`. `REJECTED`/`CANCELLED` are terminal states, not lifecycle steps.
- **Order summary:** `OrderItem` snapshot fields (`bookTitle`, `unitPrice`, `quantity`, `subtotal`) plus `Order.subtotal` / `shippingFee` / `total` — authoritative money values, never client-calculated.
- **Payment display:** latest `Payment` (ordered by `createdAt` desc, take 1) — method, amount, status.

No writes, no new tables, no schema changes — the existing `Order`, `OrderItem`, `OrderStatusHistory`, and `Payment` models fully support tracking.

## B9 usage (CURRENT — read-only, no schema change)

B9 added the online reader (`/books/[slug]/read`), all **read-only** and server-side (`app/books/[slug]/read/page.tsx`):

- **Book lookup:** `Book` fetched by unique `slug` + `status = PUBLISHED`.
- **Online reading flag:** `Book.isReadableOnline` gates the reader entry point and route.
- **Content:** the one-to-one `BookContent` row (`bookId @unique`) supplies `contentType` (PDF/EPUB/OTHER), `fileUrl` (file-based content), and `content` (HTML/text). No chapter/section model exists — the reader is a single continuous reading experience by design.
- **Reader state:** reading position and font/width settings live in `localStorage` (client-side, keyed by slug) — deliberately NOT a database model, because Bookie guests read without an account.

No writes, no new tables, no schema changes — the existing `Book` + `BookContent` models fully support online reading.

## A7 usage (CURRENT — writes, no schema change)

A7 uses the existing content and merchandising models without migrations:

- **Reading content:** `BookContent.bookId` remains the one-to-one key. Inline HTML/plain text is stored in `content` with `fileUrl = null`; because `ContentType` has no inline member, the admin stores the valid `OTHER` enum value while the B9 reader gives non-empty `content` precedence. PDF/EPUB/OTHER entries store a validated root-relative or HTTP(S) `fileUrl` and leave `content` null. `Book.isReadableOnline` is the visibility toggle. Inline HTML is sanitized server-side with `sanitize-html` before storage and again at the reader boundary for legacy rows.
- **Featured books:** the storefront-consumed `TRENDING`, `BEST_SELLER`, `STAFF_PICK`, and `RECOMMENDED` `FeaturedBook` sections are administered. The existing `@@unique([bookId, section])` constraint prevents duplicate assignments and `sortOrder` controls shelf order. `NEW_RELEASE` is computed from `Book.publishedAt` and `PROMOTION` from active `Promotion` rows — neither is managed through FeaturedBook.
- **Promotions:** `Promotion` and `BookPromotion` are edited transactionally. Percentage values are limited to 0–100; fixed amounts are non-negative; `startAt < endAt`; and linked books must be published. `lib/data.ts` remains the pricing source of truth, so promotion changes affect only current storefront display data and never alter snapshotted `Order`/`OrderItem` prices.

No new models, fields, enum values, or migrations were introduced.

## A7.1 usage (CURRENT — writes, new model + migration)

A7.1 introduced the `HeroSlide` model and migration for database-driven homepage hero slides:

- **HeroSlide model:** `id`, `eyebrow`, `title`, `subtitle` (Text), `description` (Text), `imageUrl` (required), `tint` (default `#fef9c3`), `linkUrl`, `bookId` (optional FK to `Book`), `isActive` (default true), `sortOrder` (default 0), `startAt`/`endAt` (optional scheduling), `createdAt`, `updatedAt`.
- **Book relation:** `HeroSlide.bookId` → `Book.id` with `onDelete: SetNull`. Deleting a book sets the hero slide's `bookId` to null — the slide remains visible.
- **Indexes:** `[isActive, sortOrder]` for efficient homepage queries; `[startAt, endAt]` for scheduling.
- **Migration:** `prisma/migrations/20260914000000_add_hero_slide_model/migration.sql` — additive only (CREATE TABLE + indexes + FK). No existing data affected.

## A7.3 usage (CURRENT — verified, no schema change)

A7.3 verified the existing Promotions admin and homepage integration as production-ready:

- **Admin CRUD:** `/admin/content/promotions` — list (search, status filter, sort, pagination), create, edit, delete, toggle active/inactive. All mutations call `requireAdmin()` and use `promotionSchema` for Zod validation.
- **Book assignment:** `BookPromotion` join rows are replaced transactionally (delete-then-create in `$transaction`). Published-book validation is enforced server-side. Duplicate prevention uses `@@unique` on the composite key.
- **Homepage data flow:** `lib/data.ts` queries `Promotion` records where `isActive = true AND startAt <= now AND endAt >= now`, includes linked `BookPromotion → Book` records, and applies `applyPromotion()` for display pricing. First-promotion-wins deduplication prevents double-discounting.
- **Server-authoritative checkout:** `app/checkout/actions.ts` uses `book.price` from the database directly. No promotion logic exists in checkout. `Order.discount` is always 0.
- **Revalidation:** promotion mutations revalidate `/` and `/admin/content/promotions`.
- **Homepage query:** `lib/data.ts` queries active, non-expired HeroSlide records sorted by `sortOrder asc, createdAt desc`. Falls back to `MOCK_HERO_SLIDES` when no displayable DB slides exist.
- **Admin CRUD:** `/admin/content/hero` — list, create, edit, delete, toggle, reorder. Image uploads use the existing centralized pipeline (`resolveImageField` → `saveImageUpload` → `uploadFile` → `optimizeFile` → Cloudinary `hero-slides/` folder).