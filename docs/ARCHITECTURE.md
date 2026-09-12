# Bookie — Architecture

This document describes the architecture **as it actually exists**. Items that are planned but not implemented are explicitly labelled `PLANNED`.

## Stack (CURRENT)

- **Next.js 16.3.4** — App Router, static prerendering (`next build` prerenders all current routes)
- **React 19.2.8** — server components by default; client components marked `"use client"`
- **TypeScript 5** — strict; path alias `@/*` → project root
- **Tailwind CSS 4** — CSS-first config (`@theme` in `app/globals.css`), `@tailwindcss/postcss`; no `tailwind.config.js`
- **Framer Motion 13** — animation (client components)
- **Lucide React 1.43** — icons
- **class-variance-authority** — button variant foundation
- **Prisma 7.10** + **PostgreSQL** — data layer (`prisma-client` generator, `@prisma/adapter-pg` driver adapter)
- **@fontsource-variable/scoutie-sans** — primary UI font (self-hosted); **Caveat** via `next/font/google` (decorative)

## Route structure (CURRENT — A2)

```
app/
  layout.tsx              Root layout: providers, navbar, footer, floating cart, theme init script
  page.tsx                Home — composes the landing sections
  globals.css             Design tokens + base/component layers (Tailwind v4 @theme)
  icon.png                Favicon
  books/[slug]/page.tsx   Book detail (dynamic, server-fetched)
  books/[slug]/read/      Online reader (dynamic, server-fetched) — B9
  categories/page.tsx     Categories index (static)
  categories/[slug]/      Category detail (dynamic, server-fetched)
  authors/page.tsx        Authors index (static)
  authors/[slug]/         Author detail (dynamic, server-fetched)
  search/page.tsx         Search results (dynamic, server-fetched)
  cart/page.tsx           Shopping cart (static, client-side state)
  checkout/page.tsx       Guest checkout — customer form + order summary
  checkout/actions.ts     Server Action — order creation (Prisma transaction)
  checkout/CheckoutClient.tsx  Client-side checkout form
  payment/page.tsx         Payment — order summary + slip upload (B6)
  payment/actions.ts       Server Action — payment submission
  payment/PaymentClient.tsx  Client-side payment form
  order/complete/page.tsx    Order Complete — polished confirmation page (B7)
  order/complete/OrderCompleteClient.tsx  Client-side completion experience
  track/page.tsx             Order Tracking — BookPass lookup + status timeline (B8)
  track/TrackOrderClient.tsx Client-side tracking experience
  design-system/page.tsx  Internal reference page for design-token QA
  layout.tsx wraps children in `SiteChrome`, which hides Navbar/Footer/FloatingCart on reader and admin routes
  components/layout/SiteChrome.tsx  Client shell — chrome hidden on `/books/[slug]/read` and `/admin`
  admin/login/page.tsx      Admin login (public)
  admin/login/LoginForm.tsx Client-side login form
  admin/actions.ts          Server Actions — login, logout, getCurrentAdmin
  admin/(dashboard)/layout.tsx  Admin shell — auth-gated, sidebar + navbar
  admin/(dashboard)/page.tsx    Dashboard — real analytics (KPIs, revenue, orders, categories, payments, inventory)
  admin/(dashboard)/settings/   Settings shell
  admin/(dashboard)/loading.tsx Skeleton loading state
  admin/(dashboard)/error.tsx   Error boundary
  admin/(dashboard)/not-found.tsx  404 page
```

All pages are server components; interactive pieces are isolated in `"use client"` components. Dynamic routes (`[slug]`) are server-rendered on demand; index pages are statically prerendered.

## Components

```
components/
  ui/           Button, Input/Textarea/Select, Badge (+ status badges), SectionHeading, EmptyState — reusable primitives
  books/        BookCard, BookCover (real image or placeholder art), RecentlyViewed (localStorage shelf), WishlistButton
  cart/         CartContext (client state), FloatingCart
  navigation/   Navbar, CategoryMegaMenu (desktop), SearchCommand (⌘K palette), Footer
  theme/        ThemeContext (light/dark/system), ThemeToggle
  layout/       SiteChrome (hides store chrome on reader + admin routes)
  admin/        AdminShell, AdminSidebar, AdminNavbar, AdminProfileMenu, AdminPageHeader, AdminCard — A1
  landing/      Hero, HeroSlider, TrendingBooks, BestSellers, NewReleases, Promotions,
                CategoryShowcase, PopularAuthors, RecommendedBooks, ReadingFeature,
                BookPassFeature, FinalCTA

app/books/[slug]/BookDetailClient.tsx     Client-side book detail (wishlist, cart, recently-viewed)
app/categories/CategoriesListClient.tsx   Client-side categories grid
app/categories/[slug]/CategoryDetailClient.tsx  Client-side category book grid
app/authors/AuthorsListClient.tsx         Client-side authors list
app/authors/[slug]/AuthorDetailClient.tsx  Client-side author detail with book grid
app/search/SearchResultsClient.tsx        Client-side search results
```

## Server / client boundaries (CURRENT — B3)

- **Server components:** `app/layout.tsx`, `app/page.tsx` (Home), `app/books/[slug]/page.tsx`, `app/categories/page.tsx`, `app/categories/[slug]/page.tsx`, `app/authors/page.tsx`, `app/authors/[slug]/page.tsx`, `app/search/page.tsx`, `Footer`, `app/design-system/page.tsx`. Each server page fetches data from `lib/data.ts` via Prisma and passes it as props.
- **Client components:** anything with state/interactivity — `Navbar`, `CategoryMegaMenu`, `SearchCommand`, `ThemeToggle`, `Hero`, `HeroSlider`, all book-display sections, `BookCard`, `FloatingCart`, `CartContext`, `ThemeContext`, `WishlistButton`, and the `*Client.tsx` components for each B3 route.

The boundary is intentional: data crosses from server to client as serialisable props. Prisma is only imported in server components or `lib/data.ts`. Client components receive pre-fetched data and handle interactivity (wishlist toggle, cart add, recently-viewed recording, animations).

## Home data flow (CURRENT — B2)

- `app/page.tsx` is an async **server component** that calls `getHomePageData()` from `lib/data.ts` and passes plain, JSON-safe props down to the (client) section components.
- `lib/data.ts` is the single discovery data layer. It runs **Prisma queries** against the existing schema (books, categories, authors, FeaturedBook merchandising, active Promotions) and maps results to shared UI types (`BookSummary`, `CategorySummary`, `AuthorSummary`, `HeroSlide`).
- **Fallback strategy (documented, explicit):** if the database has no PUBLISHED books, is unreachable, or a query fails, the whole page falls back to the mock catalogue from `lib/mock-data.ts` via adapters in `lib/data.ts`. The Home page is therefore never broken by an empty dev database. No fake database records are created.
- Sections no longer import mock data directly — they receive `books` / `categories` / `authors` / `slides` props from the server. Remaining direct mock usage is confined to B1 foundations: the navbar Categories mega-menu, the ⌘K search palette (mock results), and the BookPass demo card.
- **Hero:** slides are a small **typed static configuration** (not CMS/database-driven in B2) — see `lib/mock-data.ts` `MOCK_HERO_SLIDES`, consumed via the `HeroSlide` type.
- The page is statically prerendered at build time (`○`); data is baked at build. `PLANNED:` ISR/revalidation and dynamic merchandising (B10).

## State management (CURRENT — B4)

- **Theme:** `ThemeContext` — `useSyncExternalStore` over `localStorage` + `matchMedia("(prefers-color-scheme: dark)")`, with a pre-paint inline init script in the layout to avoid theme flash. Storage key: `bookie-theme`.
- **Cart:** `lib/cart.ts` — `useSyncExternalStore` over `localStorage` (key `bookie:cart`). Stores an array of `CartItem` objects with `bookId`, `slug`, `title`, `author`, `coverImage`, `price`, `quantity`. Max 99 per item. Actions: `addItem`, `updateQuantity`, `removeItem`, `clearCart`. Derived: `totalItems`, `subtotal`. SSR-safe (returns empty during server render). Used by: `FloatingCart`, `Navbar` (badge count), `BookCard` (Add to Cart), `BookDetailClient` (Add to Cart), `NewReleases` (Add to Cart), `/cart` page. **Replaced** old `CartContext` (which had no persistence and no item data).
- **Recently viewed:** `lib/recently-viewed.ts` — client-side localStorage list of book ids (key `bookie:recently-viewed`, max 12, deduped, most-recent-first). Recorded on book detail page visit via `recordRecentlyViewed()`. Home section reads via `useSyncExternalStore`.
- **Wishlist:** `lib/wishlist.ts` — client-side localStorage set of book ids (key `bookie:wishlist`, max 100). Toggle via `toggleWishlist()`. `WishlistButton` component uses `useSyncExternalStore` for SSR-safe reads. Active on book cards and book detail pages.

## Checkout / Order creation (CURRENT — B5)

- **Validation:** `lib/checkout.ts` — Zod schema (`checkoutSchema`) validates customer name, phone, email, shipping address (required), alternate phone + note (optional). Client and server both validate.
- **Server Action:** `app/checkout/actions.ts` — `createOrder(formData, cartItems)` runs entirely server-side:
  1. Validates customer input (Zod)
  2. Validates cart items (non-empty, valid quantities, max 99)
  3. Fetches books from database (must exist + be PUBLISHED)
  4. Validates inventory (stock ≥ requested quantity)
  5. Fetches authoritative prices from database (never trusts client prices)
  6. Calculates totals server-side
  7. Creates Order + OrderItems + OrderStatusHistory + InventoryTransactions in a single Prisma `$transaction`
  8. Generates unique BookPass (`ORD-YYYY-XXXX` format)
- **Security model:** client sends only `bookId` + `quantity`. Server reconstructs the full order with database prices. No client-submitted prices, subtotals, or totals are accepted.
- **Cart boundary:** cart is only cleared after successful order creation. Failed orders leave the cart intact for retry.
- **`CheckoutClient.tsx`:** client component with the form UI, inline validation, server error display, double-submit protection, empty cart guard, and success state showing the BookPass.

## Payment (CURRENT — B6)

- **Route:** `/payment?bookPass=XXX` — query parameter carries the customer-safe BookPass identifier.
- **Server component:** `app/payment/page.tsx` — fetches the order by `bookPass`, includes items and payment state, passes serialised data to the client component.
- **Server Action:** `app/payment/actions.ts` — `submitPayment({ bookPass, method, slipFile })`:
  1. Validates payment method (KPAY/AYA_PAY)
  2. Validates uploaded file (MIME type + size)
  3. Resolves order from database by BookPass
  4. Verifies order is eligible for payment
  5. Checks for existing pending payment (updates instead of duplicating)
  6. Converts file to base64 data URL
  7. Creates Payment record with server-authoritative amount from `Order.total`
  8. Returns safe result
- **Client component:** `app/payment/PaymentClient.tsx` — payment method selection, instructions with merchant info + QR area, slip upload with preview/replace/remove, order summary, submit with loading/success states.
- **Config:** `lib/payment.ts` — merchant info loaded from env vars (`BOOKIE_PAYMENT_*`), dev placeholders when missing.
- **Security:** server-authoritative amount, order eligibility check, file validation, duplicate submission protection, payment always starts as PENDING (never auto-verified).

## Order Complete (CURRENT — B7)

- **Route:** `/order/complete?bookPass=XXX` — query parameter carries the customer-safe BookPass identifier.
- **Server component:** `app/order/complete/page.tsx` — fetches the order by `bookPass`, includes items, payment state, customer info, and shipping details. Passes serialised data to the client component.
- **Client component:** `app/order/complete/OrderCompleteClient.tsx` — polished completion experience:
  - Animated success indicator
  - BookPass display with copy-to-clipboard
  - Payment status badge (PENDING/VERIFIED/REJECTED) with method and amount
  - Order summary (items, quantities, totals)
  - Shipping details (name, phone, address)
  - Tracking link with copy + open link (points to planned B8 `/track` route)
  - Navigation: Continue Shopping + Track Order
- **B6 integration:** B6 `PaymentClient.tsx` redirects to `/order/complete` after successful payment submission and when an existing pending payment is detected.
- **Security:** order data fetched server-side from database by BookPass. No client-supplied data trusted for order/payment state.

## Order Tracking (CURRENT — B8)

- **Route:** `/track?pass=XXX` — query parameter carries the customer-safe BookPass identifier. The Navbar "Track Order" links, the Footer "Track Order" link, and B7's Track Order / tracking-link actions all point here.
- **Server component:** `app/track/page.tsx` — reads `pass` from the query string, normalizes it (trim + uppercase), and looks the order up by `Order.bookPass`. When no `pass` is present it renders the lookup form only; when the order is missing it renders a friendly not-found state (database errors are caught and never leaked).
- **Server Action:** none — the tracking page is a read-only server-rendered page. The client form navigates to `/track?pass=...`; no mutation layer exists.
- **Client component:** `app/track/TrackOrderClient.tsx` — lookup form, status timeline, order summary, payment status, and copy actions.
- **Timeline data:** `OrderStatusHistory` rows (ordered by `createdAt`) drive the timeline; the current status comes from `Order.status`. Lifecycle steps are completed only when present in history or strictly before the current status — never fabricated. `REJECTED` / `CANCELLED` render as distinct terminal states (history steps actually taken + a terminal banner; no future success steps).
- **Data exposure:** only order items, quantities, subtotal/shipping/total, statuses, and payment method/amount/status are passed to the client. Customer contact fields (phone, email, shipping address) are never selected.
- **Security:** server-authoritative lookup by BookPass; no client-submitted order data is trusted; no Prisma code crosses into client components.

## Online Reading (CURRENT — B9)

- **Route:** `/books/[slug]/read` — server component (`app/books/[slug]/read/page.tsx`).
- **Data flow:** the page fetches the published `Book` by slug and its one-to-one `BookContent` (only `contentType`, `fileUrl`, `content` — plus title/authors). No internal IDs, prices, stock, or order data reach the client. `notFound()` for missing/unpublished books; a friendly unavailable state (never raw DB errors) when `isReadableOnline` is false or no readable content exists.
- **Content formats:** the inline `content` field (HTML or plain text) is rendered inside the scoped `.reader-prose` typography layer (added in `app/globals.css`). `contentType = PDF` with a `fileUrl` renders in an embedded iframe with an "open in new tab" fallback; EPUB/OTHER files show a download-style card (browsers can't render EPUB inline without a library — no new dependency). Content is admin-authored database content rendered server-side; nothing user-submitted is rendered as HTML.
- **Reader client:** `app/books/[slug]/read/ReaderClient.tsx` — sticky header (back to book, title/author, font-size A−/A+, reading-width toggle) + a 2px scroll-progress bar (`role="progressbar"`). Font size and column width persist in localStorage via a `useSyncExternalStore` store (`lib/reader-progress.ts`, same pattern as theme/cart — stable cached snapshot, SSR-safe).
- **Reading position:** scroll position is saved to `localStorage` (key `bookie:reader-progress:{slug}`) on scroll (throttled) and on `pagehide`/unmount, and restored on mount inside `useEffect` — never during render, so no hydration mismatch. Malformed stored values are ignored.
- **Distraction-free chrome:** `components/layout/SiteChrome.tsx` (client) uses `usePathname` to hide the Navbar, Footer and FloatingCart on `/books/[slug]/read`; the reader provides its own back navigation. `app/layout.tsx` renders children inside `SiteChrome`.
- **B3 integration:** the book-detail "Read Online" entry point now links to `/books/[slug]/read` (was a `/reader` placeholder).

## Utilities (CURRENT — B3)

- `lib/data.ts` — server-only data layer: shared UI types + Prisma queries + mock fallback (see *Home data flow* + B3 query functions).
- `lib/recently-viewed.ts` — localStorage recently-viewed helpers (get, record, clear, window event).
- `lib/wishlist.ts` — localStorage wishlist helpers (get, toggle, check, window event).
- `lib/motion.ts` — `fadeUp` / `stagger` / `viewportOnce` variants, all reduced-motion aware.
- `lib/mock-data.ts` — mock catalogue (books, categories, authors, hero slides) + `formatPrice`, `discountPercent`, `BOOKIE_PASS_EXAMPLE` helpers. Used as the development fallback and by B1 foundations.
- `lib/prisma.ts` — PrismaClient singleton with the `PrismaPg` driver adapter (hot-reload safe).

## Prisma integration (CURRENT)

- `prisma/schema.prisma` — datasource `postgresql` (no `url` in schema; Prisma 7 pattern), `prisma-client` generator → `generated/prisma` (git-ignored).
- `prisma.config.ts` — CLI config: `schema`, `migrations.path`, `datasource.url = env("DATABASE_URL")`.
- `lib/prisma.ts` — runtime client: `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`.
- Env: `.env` (local, git-ignored) / `.env.example` (committed placeholder). Production: `DATABASE_URL` environment variable.
- **Home queries (CURRENT):** `lib/data.ts` reads `PUBLISHED` books (with first category/author), categories with book counts, authors with book counts, `FeaturedBook` rows per section (TRENDING / BEST_SELLER / RECOMMENDED), and active `Promotion` rows with their linked books. Promotions are applied as price adjustments (percentage/fixed) before display.
- **B3 queries (CURRENT):** `getBookBySlug(slug)` — full book detail with all authors and categories. `getCategoryBySlug(slug)` / `getAuthorBySlug(slug)` — detail with related books. `getAllCategories()` / `getAllAuthors()` — index lists. `searchBooks(query)` — full-text search by title, author, category name, ISBN. All follow the same try-Prisma-then-fallback-to-mock pattern. Prisma is only ever imported on the server — never in client components. `PLANNED:` migrations, seed strategy.

## File / upload handling (CURRENT — B6)

Payment slip uploads use base64 data URLs stored in the `Payment.slipUrl` field. This is a development-friendly strategy that avoids external dependencies. Production should migrate to Cloudinary, S3, or a similar storage provider.

- Client: FileReader → blob preview via `URL.createObjectURL()`
- Server: `File.arrayBuffer()` → `Buffer` → base64 data URL → stored in `slipUrl`
- Validation: MIME type check (JPEG/PNG/WEBP), size limit (5 MB) — both client and server

`PLANNED:` production file storage (Cloudinary or similar) for payment slips.

## Theme architecture (CURRENT)

- Semantic CSS variables in `app/globals.css`: `:root` (light) and `.dark` overrides; Tailwind v4 `@theme inline` maps them to utilities (`bg-background`, `text-text`, `border-border`, `bg-brand`, …).
- Brand yellow `#FFF449` is constant across themes; text/surfaces/status palettes are redefined per theme (dark is designed, not inverted).
- `ThemeProvider` (client) exposes `theme` / `resolvedTheme` / `setTheme`; `ThemeToggle` cycles Light / Dark / System from a menu.

## Animation architecture (CURRENT)

- Framer Motion with a shared easing curve and variants from `lib/motion.ts`.
- Scroll-triggered reveals use `whileInView` + `viewportOnce`.
- Global `prefers-reduced-motion` handling: CSS guard in `globals.css` + `useReducedMotion()` gates in every animated component.
- Durations are kept short (150–500ms) per the design direction.

## Admin Dashboard Analytics (CURRENT — A2)

- **Queries:** `lib/admin/dashboard-queries.ts` — server-side aggregation for all dashboard data. Runs in a single `Promise.all` on the dashboard page.
- **KPIs:** Total Revenue (30d verified payments), Total Orders, Pending Orders, Completed Orders, Books, Low Stock (≤ 5 units).
- **Revenue chart:** line chart with 30d/90d toggle. Only VERIFIED payments count as revenue.
- **Orders by status:** bar chart showing PLACED/CONFIRMED/PREPARING/SHIPPED/DELIVERED/REJECTED/CANCELLED distribution.
- **Orders over time:** line chart with placed/confirmed/delivered series over 30 days.
- **Category sales:** horizontal progress bar breakdown of revenue by category (top 8).
- **Payment analytics:** donut chart (verified/pending/rejected) + by-method (KPay/AYA Pay) breakdown.
- **Inventory alerts:** published books with stock ≤ 10, out-of-stock (red) and low-stock (warning) severity.
- **Recent orders:** table with bookPass, customer name, total, status badge, date.
- **Charts:** SVG-based (BarChart, LineChart, DonutChart) — no external charting library.
- **Empty states:** every section shows a friendly empty state when the database has no data.

## Admin App (CURRENT — A1)

- **Authentication:** `lib/auth.ts` — `node:crypto` scrypt password hashing, HMAC-SHA256 signed session cookie (`bookie_admin_session`), `requireAdmin()` server-side authorization helper. No auth library dependencies.
- **Session:** httpOnly cookie with signed JSON payload (`{ userId }`). 7-day expiry. `sameSite: lax` for CSRF protection.
- **Authorization:** `requireAdmin()` runs in server components/layouts. Reads session cookie, validates user exists and is active, checks role (ADMIN or STAFF), redirects to `/admin/login` if unauthorized. No client-side role checks.
- **Admin shell:** `AdminShell` composes `AdminSidebar` (persistent on desktop, drawer on mobile) + `AdminNavbar` (sticky top bar with sidebar trigger, branding, ThemeToggle, profile menu) + content area.
- **Navigation:** organized by section (Dashboard, Catalog, Inventory, Orders, Payments, Content, Analytics, Settings). Unimplemented routes show "Soon" badges.
- **SiteChrome:** hides Navbar/Footer/FloatingCart on `/admin` routes — same pattern as reader routes.
- **Login:** `/admin/login` — public route with `LoginForm` using `useActionState` for pending/error states.
- **Dashboard:** `/admin` — real analytics with KPIs, revenue/orders/categories/payments charts, inventory alerts, recent orders.
- **Settings:** `/admin/settings` — shell with Admin Account, Appearance, Security sections.
- **Bootstrap:** `scripts/create-admin.mjs` — interactive script to create or promote admin users. Run it with `node scripts/create-admin.mjs` from the repo root. It does not import the app's Prisma client (that client is generated as TypeScript and plain Node cannot load it); it writes one idempotent upsert through the project's own Prisma CLI (`prisma db execute`), so `DATABASE_URL` resolves from `.env` exactly like the app. Passwords are scrypt-hashed, masked on a TTY, and never printed.
- **Environment:** `BOOKIE_AUTH_SECRET` — HMAC signing key for session cookies.
- **Prisma schema:** unchanged — existing `User` model with `UserRole` enum (ADMIN/STAFF) is sufficient.
- **Navigation:** the Catalog and Inventory links resolve to real routes; Orders/Payments/Content/Analytics still show "Soon" badges.

## Admin Catalog (CURRENT — A3)

- **Route structure:** `/admin/catalog/{books,authors,categories,publishers}`, with `new` and `[id]` sub-routes for books, authors and categories. Publishers have a single list screen because there is no publishers table.
- **Module split:** `lib/admin/catalog.ts` is PURE (Zod schemas, constants, slug/money/date helpers) and safe to import from client components. `lib/admin/catalog-queries.ts` is server-only (Prisma). `lib/admin/uploads.ts` is server-only (filesystem). All mutations live in per-resource `actions.ts` files.
- **List queries:** `listBooks` / `listAuthors` / `listCategories` / `listPublishers` do filtering, sorting, counting and pagination **in the database** (`findMany` + `count` in one `Promise.all`, `skip`/`take`). Nothing downloads the catalog into the browser.
- **State lives in the URL:** search, filters, sort and page are plain query params. Lists use a plain GET `<form>` (`AdminFilterForm`) and server-rendered `<Link>` pagination (`AdminPagination`), so they work without JavaScript and stay shareable/bookmarkable.
- **Publishers are derived:** `Book.publisher` is a plain `String?` column, so the publisher screen is a `groupBy` aggregate over books. "Rename" is an `updateMany` across every book using the name (blocked if the target name already exists, to avoid an accidental merge); "Clear" nulls the column. `docs/DATABASE.md` documents "no separate Publisher model".
- **Mutations:** each server action calls `requireAdmin()` first, re-validates FormData with Zod, and returns a `CatalogActionState` (`{ error, fieldErrors?, success? }`) for `useActionState`. Book create/update writes the `BookAuthor`/`CategoryBook` join rows inside a `prisma.$transaction` (delete-then-create) so relationships are replaced atomically and never duplicated.
- **Delete vs. archive:** `OrderItem` and `InventoryTransaction` deliberately do not cascade, so a book with order/inventory history is **archived** (`status = ARCHIVED`) rather than deleted. Hard delete is allowed only when both counts are zero and is guarded by a two-step confirmation. Authors/categories with linked books (or child categories) cannot be deleted.
- **Category hierarchy safety:** the parent picker excludes the edited category and its entire subtree (`getCategoryOptions` walks the tree in memory), and the action re-checks the same rule server-side, so the tree can never become cyclic.
- **Feedback:** destructive/normal mutations redirect with a safe status code (`?notice=created`), which `AdminFeedback` maps to a human message. Raw database errors are never surfaced.
- **Uploads (DEV-ONLY):** validated images are written to `public/uploads/<bucket>/` and the database stores only a short root-relative URL, so images stay out of PostgreSQL and `next/image` needs no loader. Validation is MIME allow-list + 2 MB cap + real JPEG/PNG/WEBP byte-signature sniffing; client filenames are never trusted. Production should swap the storage layer for Cloudinary/S3.
- **Revalidation:** catalog mutations call `revalidatePath("/", "layout")` so storefront pages (home, book detail, category, author) reflect status/price/relationship edits.
- **Prisma schema:** unchanged — no migration, no new models or fields.

## Admin Inventory (CURRENT — A4)

- **Route structure:** `/admin/inventory` (list), `/admin/inventory/[bookId]` (book detail + adjustments), `/admin/inventory/history` (global transaction history).
- **Module split:** `lib/admin/inventory-queries.ts` is server-only (Prisma queries for overview, list, detail, transactions). Server actions live in `app/admin/(dashboard)/inventory/actions.ts`. The adjustment form is a client component in `InventoryAdjustForm.tsx`.
- **Inventory model:** there is no separate Inventory table — stock lives on `Book.stockQuantity` as an integer. `InventoryTransaction` records the history of all stock movements.
- **Overview:** `getInventoryOverview()` returns total books, total units, low-stock count (≤5), and out-of-stock count (0), filtering out ARCHIVED books.
- **List:** `listInventory()` provides server-side search (title, ISBN, author), status filter (IN_STOCK/LOW_STOCK/OUT_OF_STOCK), sort (updated, stock, title), and pagination. All state lives in URL params.
- **Stock adjustments:** mutations use `prisma.$transaction` for atomicity — read current stock, validate, write new stock + InventoryTransaction in one transaction. Types: RESTOCK, RETURN (increase), DAMAGE (decrease), ADJUSTMENT (manual delta).
- **Set stock:** direct override that sets `Book.stockQuantity` to an exact value, creating an ADJUSTMENT transaction if the value changed.
- **Concurrency safety:** stock mutations use atomic conditional `UPDATE … WHERE … RETURNING` statements, so the arithmetic and the insufficient-stock check run inside PostgreSQL. The row is locked for the duration of the transaction, serializing concurrent adjustments. The previous read-then-write pattern was proven unsafe (49/50 trials lost an update) and replaced with this atomic approach.
- **Transaction history:** `InventoryTransaction` stores bookId, type, quantity, stockBefore, stockAfter, note, and createdAt. Book-level and global history pages are paginated.
- **A2 integration:** the existing `getInventoryAlerts()` in `lib/admin/dashboard-queries.ts` queries the same `Book.stockQuantity` field, so dashboard alerts remain consistent with the inventory management screens.
- **Security:** every page and action calls `requireAdmin()` server-side. Validation uses Zod schemas. The client form is never trusted.
- **Feedback:** adjustments redirect with `?notice=adjusted` or `?notice=updated`. Insufficient stock and negative stock errors are returned as user-friendly messages.
- **Prisma schema:** unchanged — no migration, no new models or fields.

## Conventions

- Path alias `@/` for project-root imports.
- `"use client"` only where needed.
- Design tokens consumed through Tailwind utilities — raw hex values are not scattered in JSX.
- TypeScript strict; avoid `any`; keep server/client boundaries intentional.