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

## Models (17, CURRENT)

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
- **Order ↔ OrderItem / Payment / OrderStatusHistory / OrderTrackingToken** — one-to-many, cascade on Order.
- **Category self-relation** — named `CategoryHierarchy`, optional `parentId`, no cascade (`SetNull` by default).
- **Unique:** `Book.slug`, `Book.isbn`, `Author.slug`, `Category.slug`, `Order.bookPass`, `OrderTrackingToken.token`, `BookContent.bookId`.
- **Money:** every currency field is `Decimal @db.Decimal(12, 2)` — never `Float`.
- **Long text:** `@db.Text` on descriptions, addresses, notes, content.
- **Indexes:** FK-side indexes on all join tables; `Book` indexed on status/title/createdAt/publishedAt; `Order` on phone/email/status/createdAt; `Promotion` on start/end + isActive; `Banner` on (status, sortOrder) + start/end; `FeaturedBook` on (section, sortOrder); history/ledger tables on (orderId/bookId, createdAt).

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