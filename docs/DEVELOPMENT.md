# Bookie — Development Rules

This is the coding-agent rulebook for working in the Bookie repository.

## Branch rule

Bookie uses **ONE** development branch: `main`.

- Work directly on `main`.
- Do **not** create feature branches.

## Before coding

Always:

1. Inspect the relevant existing code.
2. Read the relevant docs in `docs/`.
3. Understand the existing architecture (`docs/ARCHITECTURE.md`).
4. Reuse existing implementation where possible.
5. Make the smallest clean change necessary.

## Code quality

- Respect TypeScript strictness; avoid unnecessary `any`.
- Avoid duplicated logic and duplicated components.
- Avoid unnecessary dependencies — verify a library is already used before adding it.
- Keep components maintainable and single-purpose.
- Keep server/client boundaries intentional (`"use client"` only where interactivity requires it).
- Follow existing naming conventions and the `@/` path alias.
- Preserve existing functionality; do not replace a working implementation just because another approach is preferred.

## UI

- Responsive by default — desktop, tablet, mobile.
- Accessible interactive elements: correct semantic HTML, visible focus states, keyboard-friendly interactions.
- All clickable elements show `cursor-pointer` (centralized base rule; add explicitly to non-standard clickable surfaces). Do not make decorative elements appear clickable.
- No fake interactions. No dead buttons unless explicitly marked as future/planned functionality (per the roadmap).

## Database

- PostgreSQL only. Prisma 7 conventions: datasource URL in `prisma.config.ts` (never `url = env(...)` in the schema), driver adapters required, generated client in `generated/prisma`.
- Never run destructive database commands (`migrate reset`, `--force-reset`, drops) without explicit instruction.
- Do not redesign the schema for UI milestones; only change it when genuinely required.

## Verification

After meaningful changes, run the project's available checks using the actual scripts in `package.json`:

- lint: `npm run lint` (eslint; the project also uses `--max-warnings=0`)
- typecheck: `npx tsc --noEmit`
- tests: none configured yet — do not claim a test run that did not happen
- build: `npm run build`

Do **not** claim a check passed unless it actually passed.

## Documentation

- Keep `docs/` current: update `docs/CURRENT_TASK.md` only when the current task changes; reflect architecture/design/database facts in the respective docs.
- There is no `MILESTONES.md` — the roadmap lives in `docs/ROADMAP.md`.

## B2 learnings (data & external stores)

- **Server data → client props:** fetch in server components, pass plain JSON-safe props down to `"use client"` sections. Never import Prisma or `lib/data.ts` from client components; never fetch discovery data client-side.
- **Mock fallback is the dev strategy:** `lib/data.ts` prefers Prisma but falls back to the mock catalogue when the DB has no PUBLISHED books or fails. Do not invent fake database records to make a feature look implemented.
- **External stores use `useSyncExternalStore`:** localStorage-backed state (theme, recently viewed) is read with `useSyncExternalStore` (client snapshot + server snapshot for hydration). The lint rule `react-hooks/set-state-in-effect` forbids `setState()` directly in an effect body — do not fight it, use the external-store pattern.
- **Stable snapshots:** `getSnapshot` must return a stable reference; cache the parsed array by value (compare length + order) to avoid infinite re-render loops.
- **Sections own rendering, not selection:** the data layer decides which books each section shows (trending/best-sellers/promotions/recommended). Swapping ranking or recommendation logic later touches only `lib/data.ts`.
- **Absent data is hidden, not stubbed:** optional fields (rating, reviews, cover image) are `null` and rendered conditionally; shelves always have an `EmptyState`.

## B3 learnings (routes, search, wishlist)

- **Internal links use `<Link>`:** Next.js lint requires `<Link>` from `next/link` for internal routes. Do not use `<a href="/path">` for routes that exist in the `app/` directory. Exception: `motion.a` elements for animated links (Framer Motion needs the actual `<a>` element).
- **Dynamic routes:** `app/[slug]/page.tsx` is server-rendered on demand (`ƒ`). Use `generateMetadata` for SEO. Use `notFound()` for missing resources.
- **Search via URL:** `/search?q=...` is server-rendered with the `q` param. The search input is controlled state; form submit navigates via `router.push()`. Do not use `window.location.href` for internal navigation.
- **Wishlist pattern:** `lib/wishlist.ts` follows the same `useSyncExternalStore` + localStorage pattern as `lib/recently-viewed.ts` and `ThemeContext`. Client-side toggle; SSR-safe reads via server snapshot returning empty state.
- **Recently-viewed recording:** call `recordRecentlyViewed(book.id)` in a `useEffect` on book detail pages. The recording is client-side only; no server involvement.
- **Mock fallback:** every `get*BySlug` function tries Prisma first, falls back to mock data. This keeps the dev experience smooth without fake database records.

## B5 learnings (checkout, order creation)

- **Server-authoritative pricing:** the client sends only `bookId` + `quantity` to the server action. Prices, subtotals, and totals are always computed server-side from the database. Never accept client-submitted prices as authoritative.
- **Atomic transactions:** order creation uses `prisma.$transaction` to ensure Order + OrderItems + OrderStatusHistory + InventoryTransactions are created together or not at all. Do not create partial orders.
- **Cart clearing:** the cart is only cleared after the server confirms successful order creation. Failed orders leave the cart intact for retry.
- **BookPass generation:** unique order reference (`ORD-YYYY-XXXX`) is generated server-side with collision checking. The client never generates order identifiers.
- **Zod for validation:** `lib/checkout.ts` defines the Zod schema shared between client and server. Client validates immediately; server re-validates to prevent tampering.

## B6 learnings (payment submission)

- **Server-authoritative amount:** the payment amount is always read from the database Order, never from client-submitted data. The client sends only `bookPass`, `method`, and `slipFile`.
- **Payment status is PENDING after submission:** uploading a slip means "customer claims payment was made", not "payment verified". Never mark payment as VERIFIED or CONFIRMED during customer submission.
- **Duplicate submission protection:** if an order already has a PENDING payment, B6 updates the existing payment record instead of creating a new one. VERIFIED payments are rejected outright.
- **File validation is server-side:** never trust client-side validation alone. The server checks MIME type and file size independently. Use JPEG/PNG/WEBP only; reject executables and oversized files.
- **Base64 data URL storage is dev-only:** storing payment slips as data URLs in the database works for development but should be replaced by Cloudinary or similar in production. Document the migration path.
- **Payment config via env vars:** merchant details (name, phone, QR URLs) are loaded from environment variables. Development uses safe placeholders. Never hard-code production credentials.