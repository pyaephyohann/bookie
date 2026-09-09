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

## Route structure (CURRENT)

```
app/
  layout.tsx          Root layout: providers, navbar, footer, floating cart, theme init script
  page.tsx            Home — composes the landing sections
  globals.css         Design tokens + base/component layers (Tailwind v4 @theme)
  icon.png            Favicon
  design-system/
    page.tsx          Internal reference page for design-token QA
```

All pages are server components; interactive pieces are isolated in `"use client"` components.

### Route organization (PLANNED)

Routes for books, categories, authors, cart, checkout, payment, order tracking, reading, and admin do not exist yet. The navbar currently points at `#/...` anchors for these destinations — they are placeholders for the future routes, kept deliberately light.

## Components

```
components/
  ui/           Button, Input/Textarea/Select, Badge (+ status badges), SectionHeading, EmptyState — reusable primitives
  books/        BookCard, BookCover (real image or placeholder art), RecentlyViewed (localStorage shelf)
  cart/         CartContext (client state), FloatingCart
  navigation/   Navbar, CategoryMegaMenu (desktop), SearchCommand (⌘K palette), Footer
  theme/        ThemeContext (light/dark/system), ThemeToggle
  landing/      Hero, HeroSlider, TrendingBooks, BestSellers, NewReleases, Promotions,
                CategoryShowcase, PopularAuthors, RecommendedBooks, ReadingFeature,
                BookPassFeature, FinalCTA
```

## Server / client boundaries (CURRENT)

- **Server components:** `app/layout.tsx`, `app/page.tsx`, the landing section shells that don't need interactivity, `Footer`, `app/design-system/page.tsx`.
- **Client components:** anything with state/interactivity — `Navbar`, `CategoryMegaMenu`, `SearchCommand`, `ThemeToggle`, `Hero`, `HeroSlider`, all book-display sections, `BookCard`, `FloatingCart`, `CartContext`, `ThemeContext`.

The boundary is intentional: motion + event handlers force `"use client"` on the landing sections. B2 data crosses the boundary as serialisable props from the server page into client sections (no client-side fetching, no Prisma in client components).

## Home data flow (CURRENT — B2)

- `app/page.tsx` is an async **server component** that calls `getHomePageData()` from `lib/data.ts` and passes plain, JSON-safe props down to the (client) section components.
- `lib/data.ts` is the single discovery data layer. It runs **Prisma queries** against the existing schema (books, categories, authors, FeaturedBook merchandising, active Promotions) and maps results to shared UI types (`BookSummary`, `CategorySummary`, `AuthorSummary`, `HeroSlide`).
- **Fallback strategy (documented, explicit):** if the database has no PUBLISHED books, is unreachable, or a query fails, the whole page falls back to the mock catalogue from `lib/mock-data.ts` via adapters in `lib/data.ts`. The Home page is therefore never broken by an empty dev database. No fake database records are created.
- Sections no longer import mock data directly — they receive `books` / `categories` / `authors` / `slides` props from the server. Remaining direct mock usage is confined to B1 foundations: the navbar Categories mega-menu, the ⌘K search palette (mock results), and the BookPass demo card.
- **Hero:** slides are a small **typed static configuration** (not CMS/database-driven in B2) — see `lib/mock-data.ts` `MOCK_HERO_SLIDES`, consumed via the `HeroSlide` type.
- The page is statically prerendered at build time (`○`); data is baked at build. `PLANNED:` ISR/revalidation and dynamic merchandising (B10).

## State management (CURRENT)

- **Theme:** `ThemeContext` — `useSyncExternalStore` over `localStorage` + `matchMedia("(prefers-color-scheme: dark)")`, with a pre-paint inline init script in the layout to avoid theme flash. Storage key: `bookie-theme`.
- **Cart:** `CartContext` — client-side `count` + `addItem` + `lastAddedAt` (used to bounce the floating cart). No persistence (`PLANNED`: B4).
- **Recently viewed:** `lib/recently-viewed.ts` — client-side localStorage list of book ids (key `bookie:recently-viewed`, max 12, deduped, most-recent-first). The Home section (`components/books/RecentlyViewed.tsx`) reads it with `useSyncExternalStore` (same pattern as the theme store) so it is SSR-safe and reacts to same-tab writes via a window event. Recording views is `PLANNED`: B3 detail pages call `recordRecentlyViewed()`.

## Utilities (CURRENT)

- `lib/data.ts` — server-only Home discovery layer: shared UI types + Prisma queries + mock fallback (see *Home data flow*).
- `lib/recently-viewed.ts` — localStorage recently-viewed helpers.
- `lib/motion.ts` — `fadeUp` / `stagger` / `viewportOnce` variants, all reduced-motion aware.
- `lib/mock-data.ts` — mock catalogue (books, categories, authors, hero slides) + `formatPrice`, `discountPercent`, `BOOKIE_PASS_EXAMPLE` helpers. Used as the development fallback and by B1 foundations.
- `lib/prisma.ts` — PrismaClient singleton with the `PrismaPg` driver adapter (hot-reload safe).

## Prisma integration (CURRENT)

- `prisma/schema.prisma` — datasource `postgresql` (no `url` in schema; Prisma 7 pattern), `prisma-client` generator → `generated/prisma` (git-ignored).
- `prisma.config.ts` — CLI config: `schema`, `migrations.path`, `datasource.url = env("DATABASE_URL")`.
- `lib/prisma.ts` — runtime client: `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`.
- Env: `.env` (local, git-ignored) / `.env.example` (committed placeholder). Production: `DATABASE_URL` environment variable.
- **Home queries (CURRENT):** `lib/data.ts` reads `PUBLISHED` books (with first category/author), categories with book counts, authors with book counts, `FeaturedBook` rows per section (TRENDING / BEST_SELLER / RECOMMENDED), and active `Promotion` rows with their linked books. Promotions are applied as price adjustments (percentage/fixed) before display. Prisma is only ever imported on the server — never in client components. `PLANNED:` B3+ pages, migrations, seed strategy.

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