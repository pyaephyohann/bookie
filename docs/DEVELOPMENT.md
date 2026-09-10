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

## B7 learnings (order complete)

- **Server-fetch, client-render:** the completion page (`/order/complete`) is a server component that fetches order + payment data from Prisma, then passes serialised props to a client component for interactivity (copy buttons, animations). Prisma never crosses into client components.
- **Do not import Prisma enums in client components:** `PaymentStatusBadge` imports from `@/generated/prisma/client`, which fails in the browser chunk (Turbopack cannot resolve `node:module`). Use inline status class mapping in client components instead.
- **Clipboard API with fallback:** use `navigator.clipboard.writeText()` with a try/catch. On failure, fall back to selecting the text element for manual copy. Show temporary "Copied!" feedback that resets after 2 seconds.
- **Tracking link:** the completion page shows a tracking URL pointing to the `/track?pass=XXX` route (B8).
- **B6 → B7 redirect:** B6 payment success and already-paid states redirect to `/order/complete` via `router.push()`. This keeps B7 as the single source of truth for the post-payment experience.

## B8 learnings (order tracking)

- **Read-only server page:** `/track` is a plain server-rendered page — no server action, no mutation. The client lookup form simply navigates to `/track?pass=...` (`router.push`), so the server always owns the query.
- **Normalize the BookPass server-side:** trim + uppercase before the Prisma `findUnique` on `Order.bookPass`. The client form applies the same normalization for consistent round-trips.
- **Timeline from real history, never fabricated:** derive completed steps from `OrderStatusHistory` + the authoritative `Order.status`. A step is completed when it is in history or strictly before the current status. Do not invent history entries on the client.
- **Terminal states are not steps:** `REJECTED`/`CANCELLED` get their own banner and only the history steps that actually happened are listed above them — never render future success steps as upcoming/completed for a dead order.
- **Hydration-safe URLs:** never build a display URL from `window` during render (server HTML would differ from client hydration). Display the canonical relative URL (`/track?pass=...`) and construct the absolute URL only inside the copy event handler where `window` exists. `lib/cart.ts`-style `useSyncExternalStore` snapshots follow the same rule for state.
- **UTC-fixed date formatting:** use `toLocaleString` with an explicit `timeZone: "UTC"` so server-render and client hydration produce identical strings.
- **Minimal data exposure on public pages:** the tracking page passes only items, totals, statuses, and payment method/amount/status to the client. Customer contact fields (phone, email, shipping address) are not selected at all.
- **Footer placeholder links:** B1-era `#/route` hash placeholders in the Footer are not real routes; when a milestone makes a route real, update the corresponding footer entry to a `next/link` `Link` (plain `<a>` to a real route trips `no-html-link-for-pages`).

## B9 learnings (online reading)

- **Reader state is localStorage, not the database:** reading position and font/width settings live client-side (guests have no account). Progress restore happens inside `useEffect` after mount — never during render — so SSR/hydration stay clean.
- **Settings via useSyncExternalStore:** font size / width follow the ThemeContext/cart store pattern (`lib/reader-progress.ts`) — stable cached client snapshot + constant server snapshot. Do not read `localStorage` inside a `useState` initializer (hydration mismatch); the external-store pattern avoids it.
- **Scoped reader typography:** reading-specific styles (line-height, paragraph spacing, headings, lists, blockquote, code) live in a `.reader-prose` component layer in `app/globals.css`; the global Bookie typography system is untouched. Font size is applied inline (px) so controls only change one container style.
- **HTML content boundary:** `BookContent.content` is admin-authored database content rendered via `dangerouslySetInnerHTML` inside `.reader-prose`. Nothing user-submitted is ever rendered as HTML; keep it that way.
- **No chapters in the schema:** `BookContent` is a single content blob — do not invent chapter/section navigation. The reader is a continuous scroll with scroll progress instead.
- **Chrome hiding:** hide Navbar/Footer/FloatingCart on reader routes with a `usePathname`-based client wrapper (`SiteChrome`) — same server/client output, so no hydration risk.
- **File-based content:** PDF renders in an iframe with a fallback link; EPUB/OTHER can't render natively in the browser — show a download-style card rather than adding a rendering dependency.

## A1 learnings (admin foundation)

- **No new auth dependencies:** `node:crypto` provides everything needed — `scrypt` for password hashing, `createHmac` for session signing, `randomBytes` for salts. No bcrypt/argon2 library needed.
- **HMAC-signed cookies for sessions:** the session is a signed JSON payload (`{ userId }`) stored in an httpOnly cookie. No session table, no JWT library, no Redis. The signature prevents tampering; the cookie prevents CSRF (sameSite=lax).
- **Server-side authorization only:** `requireAdmin()` runs in server components/layouts. It reads the session cookie, validates the user exists and is active, checks the role, and redirects to `/admin/login` if unauthorized. No client-side role checks.
- **Prisma schema already supports admin:** the existing `User` model with `UserRole` enum (ADMIN/STAFF), `passwordHash`, `email`, and `isActive` is sufficient. No schema changes needed.
- **Admin chrome is separate from store chrome:** `SiteChrome` hides the Navbar/Footer/FloatingCart on `/admin` routes. The admin shell (`AdminShell`) provides its own sidebar + navbar. This is the same pattern used for the reader (`/books/[slug]/read`).
- **Navigation "Soon" badges:** unimplemented admin routes show "Soon" badges rather than placeholder pages. This avoids misleading functionality while keeping the navigation structure visible for A2–A8.
- **`useActionState` for login forms:** Next.js App Router's `useActionState` (React 19) provides pending state and error handling for server actions without manual state management.
- **Admin route groups:** `(dashboard)` route group keeps admin pages under a shared layout without affecting the URL path. The login page sits outside this group so it doesn't require auth.

## A2 learnings (dashboard analytics)

- **No charting library needed:** SVG-based charts (BarChart, LineChart, DonutChart) are simple, dark-mode compatible, and avoid adding dependencies. Keep charts simple — they're admin tools, not data journalism.
- **Server-side aggregation:** all dashboard queries run on the server in a single `Promise.all`. No client-side data fetching, no loading spinners for data. The page renders with data immediately.
- **Revenue = verified payments:** only VERIFIED payments count as revenue. PENDING payments are shown separately in the payment analytics section. This matches the business reality — pending payments haven't been confirmed yet.
- **Decimal conversion:** Prisma returns `Decimal` objects for money fields. Convert with `Number(val)` or a helper function before passing to client components. Never pass Decimal objects to the client.
- **Parallel queries:** use `Promise.all` for independent queries (KPIs, revenue, orders, categories, payments, inventory). Do not chain dependent queries unnecessarily.
- **Empty states:** every chart/section must handle the case where the database has no data. Show a friendly empty state rather than a broken chart or blank area.
- **Date bucketing:** for time-series charts, pre-create all date buckets (including zeros) so the chart has a consistent x-axis even when some days have no data.
- **Category sales:** querying category sales requires traversing Category → CategoryBook → Book → OrderItem. This is a multi-hop query — keep it efficient by only selecting needed fields.
- **Inventory alerts:** filter by `status = PUBLISHED` and `stockQuantity ≤ 10` to show only relevant books. Sort by stock ascending so the most critical alerts appear first.