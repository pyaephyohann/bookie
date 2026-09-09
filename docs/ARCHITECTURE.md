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

## Route structure (CURRENT — B5)

```
app/
  layout.tsx              Root layout: providers, navbar, footer, floating cart, theme init script
  page.tsx                Home — composes the landing sections
  globals.css             Design tokens + base/component layers (Tailwind v4 @theme)
  icon.png                Favicon
  books/[slug]/page.tsx   Book detail (dynamic, server-fetched)
  categories/page.tsx     Categories index (static)
  categories/[slug]/      Category detail (dynamic, server-fetched)
  authors/page.tsx        Authors index (static)
  authors/[slug]/         Author detail (dynamic, server-fetched)
  search/page.tsx         Search results (dynamic, server-fetched)
  cart/page.tsx           Shopping cart (static, client-side state)
  checkout/page.tsx       Guest checkout — customer form + order summary
  checkout/actions.ts     Server Action — order creation (Prisma transaction)
  checkout/CheckoutClient.tsx  Client-side checkout form
  design-system/page.tsx  Internal reference page for design-token QA
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

## File / upload handling (CURRENT)

None in the user app. `PLANNED:` payment slip upload (B6) via `slipUrl` in the `Payment` model.

## Theme architecture (CURRENT)

- Semantic CSS variables in `app/globals.css`: `:root` (light) and `.dark` overrides; Tailwind v4 `@theme inline` maps them to utilities (`bg-background`, `text-text`, `border-border`, `bg-brand`, …).
- Brand yellow `#FFF449` is constant across themes; text/surfaces/status palettes are redefined per theme (dark is designed, not inverted).
- `ThemeProvider` (client) exposes `theme` / `resolvedTheme` / `setTheme`; `ThemeToggle` cycles Light / Dark / System from a menu.

## Animation architecture (CURRENT)

- Framer Motion with a shared easing curve and variants from `lib/motion.ts`.
- Scroll-triggered reveals use `whileInView` + `viewportOnce`.
- Global `prefers-reduced-motion` handling: CSS guard in `globals.css` + `useReducedMotion()` gates in every animated component.
- Durations are kept short (150–500ms) per the design direction.

## Conventions

- Path alias `@/` for project-root imports.
- `"use client"` only where needed.
- Design tokens consumed through Tailwind utilities — raw hex values are not scattered in JSX.
- TypeScript strict; avoid `any`; keep server/client boundaries intentional.