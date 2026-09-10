# Bookie — Design Source of Truth

This document is the canonical reference for Bookie's visual language. Design values live as tokens in `app/globals.css`; components consume them through Tailwind utilities — never raw values in JSX.

## Colors

| Token | Value | Usage |
|---|---|---|
| Primary (brand) | `#FFF449` | Primary buttons, CTAs, active states, highlights, badges |
| Background / light | `#FAFAFA` | Main light background (not pure white) |
| Black | `#000000` | Primary text / ink |

The brand yellow is primarily an accent. Do not use yellow text on white or yellow-on-yellow patterns that hurt contrast. Primary (yellow) buttons use **black text** — including in dark mode.

Semantic tokens (background, surface, surface-muted, surface-elevated, text, text-secondary, text-muted, text-disabled, border, border-strong, border-focus, success/pending/warning/error/info/neutral + muted/strong variants) are defined in `app/globals.css` for light (`:root`) and dark (`.dark`) themes.

## Typography

- **Main UI font:** Scoutie Sans (self-hosted via `@fontsource-variable/scoutie-sans`, variable 200–800). Used for headings, body, navigation, buttons, forms, cards, tables, admin, checkout, tracking — all UI.
- **Decorative font:** Caveat (via `next/font/google`, variable `--font-caveat`). Use selectively for playful/handwritten text — hero annotations, small labels, promotional notes. Consume via `font-fun` / `text-fun` tokens; never ad hoc.

### Hierarchy

`text-display` / `text-display-sm` (hero, 800), `text-h1`…`text-h4`, `text-body-lg` / `text-body` / `text-body-sm`, `text-caption`, `text-label`, `text-button`, `text-fun` (decorative). Fluid step-down on small screens for display sizes. Weights: 400 body, 500 nav/secondary, 600 buttons/labels, 700 headings, 800 display — real variable-font weights, never synthesized.

## Logo

- **Image:** `public/logo.png` (existing asset — do not replace).
- **Brand name:** exactly **Bookie** (capital B, lowercase `ookie`). Never `BOOKIE` or `bookie` in the navbar brand.
- **Typography:** the "Bookie" wordmark uses **Caveat** (`text-fun` token).
- The logo (image + wordmark) is one clickable element linking to `/`, with `cursor-pointer` and a subtle hover (opacity/scale) transition.

## Theme

- **Light / Dark / System**, persisted in `localStorage` (`bookie-theme`), with a pre-paint init script so there is no flash of the wrong theme.
- `System` follows `prefers-color-scheme` live.
- Dark mode is intentionally designed (deep neutral surfaces, adjusted status palettes, ink flips to light) — not a simple color inversion.
- Primary yellow buttons keep black text in every theme.

## Interaction

- All clickable/interactable elements clearly behave as clickable: `cursor-pointer` (centralized base rule for buttons/links/selects/checkables in `globals.css`; add explicitly to any non-standard clickable surface).
- Do NOT add `cursor-pointer` to purely decorative or non-interactive elements.
- Interactive elements have hover, active/press, focus-visible (2px black outline — never color-only), and disabled states.

## Animation

Framer Motion, where already available:

- smooth, subtle, purposeful — micro-interactions 150–300ms, reveals 300–600ms
- not excessive; no gratuitous bouncing
- scroll reveals via `whileInView` (once)
- `prefers-reduced-motion` respected globally (CSS guard) and per-component (`useReducedMotion`)

## Radius / border / shadow

- Radius: `rounded-control` (0.5rem) for controls/inputs, `rounded-card` (1rem) for cards, `full` for pills/avatars. Tailwind scale `sm/md/lg/xl` available.
- Borders: 1px solid; `border-subtle` / `border` / `border-strong` neutrals plus `border-focus` / error / success. No random gray values.
- Shadows: `shadow-xs / sm / md / lg` — subtle, editorial. Avoid heavy SaaS-style shadows.

## Responsive

The application must work well on desktop, tablet, and mobile — never desktop-only. Mobile gets intentional treatments (compact nav, stacked hero, scrollable shelves), not shrunk desktop UI.

## Status colors (semantic)

`success`, `pending`, `warning`, `error`, `info`, `neutral` — each with `-muted` (badge backgrounds, AA-checked) and `-strong` variants; badge classes `.status-*` in `globals.css`. Order statuses map: PLACED→info, CONFIRMED→success, REJECTED→error, PREPARING→pending, SHIPPED→info, DELIVERED→success, CANCELLED→neutral. Payment: PENDING→pending, VERIFIED→success, REJECTED→error. Map statuses in typed component code (e.g., `components/ui/badge.tsx` against the generated Prisma enums) rather than hard-coding colors in badges.

## Discovery components (B2)

Reusable patterns added for Home & Discovery. All follow the token system above — no raw values in JSX.

### Book covers

- `BookCover` renders a **real image** (next/image, `object-cover`, aspect 2:3) when a cover URL exists, otherwise deterministic **placeholder art** (gradient + geometry + title). `alt` defaults to "Cover of {title}".
- Book images sit in `aspect-2/3` containers; never break layout when missing.

### Book cards

- `BookCard` is the reusable card: cover, category, title (link), author, price, optional compare-at price with −% pill, optional rating, hover zoom + quick actions (Add to Cart / View).
- Fields that may be absent (rating, reviews, cover image) are hidden, not stubbed.
- Used in a fixed-width snap shelf (Trending, Recently Viewed) or a responsive grid (Recommended).

### Discovery sections

- `SectionHeading` pattern: eyebrow label + H2 + description + optional Caveat `funNote` + optional actions (scroll buttons / "view all").
- Horizontal shelves: `scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4` — mobile scrolls, desktop uses the same shelf. Grid sections switch `grid-cols-2` → `sm:grid-cols-3` → `lg:grid-cols-6`.
- **Empty states:** every shelf has a friendly `EmptyState` (dashed border card, icon, title, description, optional action) instead of a broken/blank area.

### Category & author cards

- Category tiles: editorial asymmetric grid (Fiction spans 2×2), count label, hover lift + arrow.
- Author cards: avatar (photo via next/image `fill`, otherwise gradient initials), name, book-count pill, description, hover lift.

### Hero

- Editorial split hero: headline + CTAs + floating covers; the showcase slider autoplays every **5s**, pauses on hover/focus, has prev/next + pagination indicators, and collapses to a stacked single-panel layout on mobile.
- Slide tint backgrounds are soft pastels that work in both themes; the yellow brand is used for badges/accents only.

### Recently viewed

- Horizontal shelf identical to Trending; reads from localStorage via `useSyncExternalStore`. Shows a calm empty state ("Nothing here yet") when empty — no flicker, no hydration mismatch.

## Catalogue pages (B3)

### Book detail page

- Server-fetched (`getBookBySlug`), rendered via `BookDetailClient` for interactivity.
- Two-column layout on desktop (cover + info); stacked on mobile.
- Breadcrumb: "Back to Home" with chevron.
- Book cover uses `BookCover` (image or placeholder).
- Title, author(s) as links to author page, categories as pill links to category page.
- Price with compare-at discount badge.
- Actions: Add to Cart (yellow button, loading/added states), Wishlist toggle (heart icon).
- Stock indicator (text only, no fake numbers).
- Online reading entry point when `isReadableOnline`.
- Description, metadata (publisher, published date, ISBN) in a details section.
- Recently viewed recorded on mount via `recordRecentlyViewed()`.
- Framer Motion entrance animation (fade up).

### Categories page

- Grid of category tiles (editorial asymmetric layout).
- Each tile shows name, book count, hover lift + arrow.
- Clickable → `/categories/[slug]`.
- Empty state when no categories.

### Category detail

- Header: back link, name, description, book count.
- Responsive grid of `BookCard` components.
- Empty state when no books.

### Authors page

- Grid of author cards: avatar (photo or gradient initials), name, bio, book count.
- Clickable → `/authors/[slug]`.
- Empty state when no authors.

### Author detail

- Header: back link, avatar, name, bio, book count.
- Responsive grid of `BookCard` components.
- Empty state when no books.

### Search results

- Search input with real-time query state.
- Form submit navigates to `/search?q=...`.
- Results displayed as responsive `BookCard` grid.
- Result count text.
- Empty state with "Browse Home" action.
- Server-fetched via `searchBooks()` (Prisma OR query).

### Wishlist

- `WishlistButton` component: heart icon, toggle active/inactive.
- Active state: filled heart, red tint background.
- Inactive state: outline heart, muted background.
- SSR-safe via `useSyncExternalStore` (same pattern as theme/recently-viewed).
- Storage key: `bookie:wishlist`, max 100 ids.
- Accessible: `aria-pressed`, `aria-label` changes with state.

### Navigation wiring

- All internal `#/...` placeholder links replaced with real routes.
- `BookCard` links to `/books/[slug]`.
- `SearchCommand` navigates to `/search?q=...` on Enter.
- Navbar: Authors → `/authors`, Categories mega-menu → `/categories/[slug]`.
- Hero slider, BestSellers, CategoryShowcase, PopularAuthors all use real links.
- FloatingCart → `/cart`.

## Payment (B6)

### Payment method selector

- Two-option card grid (KPay, AYA Pay) with `aria-pressed` state
- Active method: brand-yellow border + muted background, icon gets brand background
- Inactive method: neutral border, muted icon
- Keyboard accessible, clear visual state

### Payment instructions

- Merchant name and phone number from config (env vars with dev placeholders)
- QR image area when configured; dashed placeholder when not
- Responsive: stacked on mobile, side-by-side on desktop

### Payment slip upload

- Dashed border upload zone with icon and instructions
- File input (sr-only, label triggers it)
- Preview: aspect-ratio video container, file name, size
- Replace/Remove buttons in preview footer
- Client-side pre-validation (type, size) before server validation
- AnimatePresence for smooth transitions between states

### Payment states

- **Idle:** form visible, submit disabled until slip uploaded
- **Submitting:** button shows spinner, disabled
- **Success:** green checkmark, "Awaiting Verification", BookPass, tracking link
- **Already paid:** CreditCard icon, "Payment Already Submitted"
- **Error:** red alert banner with AlertCircle icon