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
- **Footer links:** A8 cleaned up all placeholder `#/route` hash links in the Footer. All footer links now point to real routes (`/search`, `/categories`, `/authors`, `/track`). When adding new routes, update the corresponding footer entry.

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

## A3 learnings (catalog management)

- **Pure vs. server modules:** keep Zod schemas and constants in a pure module (`lib/admin/catalog.ts`) with no Prisma import so client forms can share them. Prisma queries live in `catalog-queries.ts` — importing the query module from a client component breaks the server/client boundary.
- **Filter/sort/paginate in the database:** never load the whole catalog and filter in React. Use `findMany` + `count` in one `Promise.all` with `skip`/`take`, and keep search/filter/sort/page in the URL so the state is shareable and works without JavaScript.
- **Plain GET forms beat client filter state:** a `<form method="get">` + server-rendered `<Link>` pagination removes hydration and state-sync bugs entirely. Reach for `useState` filters only if the URL approach genuinely can't express the interaction.
- **Publishers are not a table:** `Book.publisher` is a `String?`. "Publisher management" therefore means grouped aggregates plus `updateMany` rename/clear — do not invent a `Publisher` model. A rename that collides with an existing name would silently merge two publishers, so it must be rejected.
- **Delete vs. archive depends on the schema's cascade rules:** `OrderItem` and `InventoryTransaction` don't cascade, so a book with history can't be hard-deleted. Check the reference counts first and only offer archive. Guard every destructive action with a two-step confirm component.
- **Wrap multi-row edits in a transaction:** syncing book↔author and book↔category is a delete-then-create of join rows inside `prisma.$transaction`, so a partial failure can't leave a book with no authors or duplicated links.
- **Prevent cyclic hierarchies in two places:** filter the parent picker client-side *and* re-validate server-side. `Category.parentId` self-reference can otherwise create a cycle that breaks recursive storefront queries.
- **File uploads: validate bytes, not names:** MIME type and extension are attacker-controlled. Read the first bytes and check real magic numbers for JPEG/PNG/WEBP; never write a file whose signature doesn't match. Store the file and keep only a short URL in the database.
- **Local uploads are DEV-ONLY:** writing to `public/uploads/` works in development but not on read-only/serverless production filesystems. Isolate storage in `lib/admin/uploads.ts` so moving to Cloudinary/S3 is a one-file change, and gitignore the upload directory. Add `/* turbopackIgnore: true */` to dynamic `path.join(..., name)` calls so the bundler doesn't trace and bundle the whole project.
- **Allow-list https image hosts:** because admins can paste an https cover URL, `next.config.ts` needs a `remotePatterns` entry; otherwise `next/image` throws at render time.
- **Redirect inside try/catch:** Next.js `redirect()` signals by throwing. A broad `catch` around a mutation that redirects will swallow the redirect — rethrow errors that carry a `digest` (or match `NEXT_REDIRECT`) before treating anything as a real failure.
- **Feedback via status codes:** redirect with `?notice=<code>` and map codes to text in one component. This keeps raw Prisma errors out of the UI and out of the URL.
- **Server Actions have a 1 MB body limit by default:** an app-level image cap of 2 MB is unreachable unless the framework limit is raised — a 1–2 MB upload dies as a raw `413 Body exceeded 1 MB limit` that escapes a `try/catch` and lands on the admin error boundary. Set `experimental.serverActions.bodySizeLimit` (Next 16.x) above the app cap, and still keep the real limit enforced server-side plus a client-side pre-check in the image field. A client check alone is not enough (it can be bypassed), and a server check alone produces an ugly failure at the transport layer.
- **Parse storage URLs with a regex, not `split("/")`:** `"/uploads/authors/x.png".split("/")` yields `["", "uploads", "authors", "x.png"]`, so `const [, bucket, name] = …` silently assigns `bucket = "uploads"` and `name = "authors"`. That made every image replace/delete a no-op that leaked the old file forever. Use capture groups so the parts land where you expect, and always double-check by asserting the file is actually gone after a delete.
- **Never import the generated Prisma client from a plain Node script:** with the `prisma-client` generator the output is TypeScript under `generated/prisma`, and its extensionless internal imports cannot be resolved by Node (even with type stripping). Reuse the Prisma CLI (`prisma db execute`) for bootstrap/maintenance scripts instead of duplicating the data layer or reaching for the `pg` driver directly.
- **Create one readline interface per session:** calling `createInterface` again for each prompt discards whatever the previous interface already buffered, so the second prompt never sees its line (and piped input breaks entirely). Read all prompts from a single interface with a line queue, and fall back to a plain read when `stdin.isTTY` is false so scripts can drive the tool.

## A4 learnings (inventory management)

- **Stock lives on the Book row:** there is no separate Inventory model — `Book.stockQuantity` is the source of truth. Inventory management means reading/writing that field plus recording `InventoryTransaction` history. Do not invent an `Inventory` table when the schema already puts stock on the book.
- **Atomic stock mutations:** use atomic conditional `UPDATE … WHERE … RETURNING` inside `prisma.$transaction`. The arithmetic (`stockQuantity + delta`) and the sufficiency check (`stockQuantity >= -delta`) must happen inside PostgreSQL itself — not as a read-then-write in application code. Under PostgreSQL's default READ COMMITTED isolation, two concurrent transactions can both read the same stock value and both write their computed result, with the last write winning (classic lost update). A live test confirmed 49/50 trials lost an update with the read-then-write pattern. The atomic UPDATE forces PostgreSQL to serialize: the second transaction's UPDATE sees the row as locked and waits.
- **Transaction types match the enum:** use `RESTOCK`/`RETURN` for increases, `DAMAGE` for decreases, `ADJUSTMENT` for manual corrections. `SALE` is created by the order system, not by admin inventory actions.
- **Negative stock is rejected server-side:** the adjustment action checks `quantity > stockBefore` for decreases and throws before writing. The `setStock` action validates `quantity >= 0`. Never trust client-side validation alone.
- **No-op updates are safe:** `setStock` compares `stockBefore !== stockAfter` before creating a transaction, so setting stock to the same value does not create a useless history entry.
- **Overview queries filter out ARCHIVED books:** low-stock and out-of-stock counts only apply to non-archived books, consistent with the dashboard alerts in A2.
- **Reuse AdminPagination props:** the shared pagination component uses `basePath` and `params` (not `baseUrl` and `extraParams`). Check the component interface before calling it from new pages.

## A5 learnings (order management)

- **No Customer model:** guest checkout puts customer data directly on the `Order` record (name, phone, email, shipping address). Do not invent a `Customer` table when the schema already stores this on the order.
- **OrderItem snapshots are authoritative:** `bookTitle` and `unitPrice` on `OrderItem` are snapshots taken at order creation. Historical order displays must use these snapshot values, never re-read the current `Book` price/title.
- **Inventory is not restored on rejection/cancellation:** B5 decrements inventory at order creation (PLACED status). A5 must NOT automatically restore stock when an order is rejected or cancelled. Stock restoration is a manual A4 operation. Document this clearly.
- **Valid status transitions must be enforced server-side:** the client shows buttons for valid transitions, but the server action re-validates the current status and the requested transition. Never trust client-side disabled/hidden buttons for authorization.
- **Terminal states are immutable:** DELIVERED, REJECTED, and CANCELLED have no valid outgoing transitions. The server action rejects any attempt to change them.
- **Status history with admin reference:** every status change creates an `OrderStatusHistory` entry with `changedById` set to the authenticated admin's ID. This provides an audit trail of who changed what and when.
- **Payment display is read-only in A5:** A5 shows payment information (method, amount, status, slip link) but does not implement verify/reject actions. A6 owns payment management.
- **Decimal conversion:** Prisma returns `Decimal` objects for money fields. Convert with `Number()` before passing to client components. Use `formatMoney()` from `lib/admin/catalog.ts` for display.
- **Payment status filter with "No payment" option:** orders without any `Payment` record need a special filter case (`payments: { none: {} }`) rather than filtering on payment status field.

## A7 learnings (content & promotions)

- **Keep admin scope tied to storefront consumers:** manage only `FeaturedBook` sections that `lib/data.ts` actually reads (TRENDING, BEST_SELLER, STAFF_PICK, RECOMMENDED). New releases and promotions are computed and should not be managed through FeaturedBook. Do not build dead controls.
- **BookContent has one blob and no inline enum:** the admin form uses an `INLINE` presentation mode but persists the existing `OTHER` enum with `content` populated and `fileUrl` null. The B9 reader checks content first, so no schema change is needed. PDF/EPUB/OTHER file modes persist only a validated `fileUrl`.
- **Sanitize admin-authored HTML with a real sanitizer:** `sanitize-html` runs server-side before `BookContent.content` is stored, with a small formatting allow-list and safe URL schemes. The reader sanitizes again as defense in depth for legacy rows; never replace this with regex stripping or trust `dangerouslySetInnerHTML` alone.
- **Promotion pricing stays in the storefront data layer (A7.3 verified):** validate percentage values from 0–100 and non-negative fixed amounts, require `startAt < endAt`, and preserve `lib/data.ts` rounding, flooring, active-window, and first-promotion-wins behavior. Promotion edits do not touch historical Order/OrderItem snapshots. Checkout uses `book.price` directly from the database — no promotion logic in `app/checkout/actions.ts`.
- **Join-table edits are transactional (A7.3 verified):** promotion book links are replaced inside the same transaction as promotion fields (`deleteMany` + `createMany` in `$transaction`), while FeaturedBook assignments respect `@@unique([bookId, section])` and reorder by server-controlled `sortOrder`.
- **Staff Picks (A7.2) uses existing FeaturedBook infrastructure:** adding a new managed FeaturedSection requires only adding the enum value to `FEATURED_SECTION_VALUES` and labels in `lib/admin/content.ts`. The admin page, server actions, queries, and homepage data layer all iterate over `FEATURED_SECTION_VALUES` automatically. The homepage component follows the same pattern as other shelf components (SectionHeading, BookCard grid, EmptyState, Framer Motion). The fallback strategy mirrors existing sections — deterministic picks of published books not already shown in other shelves.
- **Hero Slides are database-driven (A7.1):** `HeroSlide` records are managed via `/admin/content/hero`. The homepage queries active/scheduled HeroSlide records from Prisma, ordered by `sortOrder asc, createdAt desc`. Falls back to `MOCK_HERO_SLIDES` when no displayable DB slides exist. Scheduling uses `isActive`, `startAt`, and `endAt` — a slide is displayable when `isActive = true` AND (`startAt` is null OR `startAt <= now`) AND (`endAt` is null OR `endAt >= now`). Image uploads use the existing centralized pipeline (`resolveImageField` → `saveImageUpload` → `uploadFile` → `optimizeFile` → Cloudinary `hero-slides/` folder). The `Banner` model remains unused by storefront code.

## A6 learnings (payment management)

- **Multiple payments per order:** an Order may have multiple Payment records (e.g., rejected then resubmitted). The payment list must list individual Payment records, not assume one order = one payment. Use `payment.order.bookPass` and `payment.order.customerName` via relation, not from the Payment model directly.
- **Atomic payment transitions:** use `prisma.$executeRaw` with `UPDATE … WHERE status = 'PENDING'` for verify/reject. This ensures only one concurrent action can transition a PENDING payment. If `updated === 0`, the payment either doesn't exist or is already VERIFIED/REJECTED.
- **Payment verification does NOT change Order.status:** this is an intentional design decision. Payment verification confirms the payment was received; order status management (CONFIRMED, PREPARING, etc.) remains in A5. Admin manually progresses orders after verifying payments.
- **Payment rejection does NOT restore inventory:** inventory was decremented at order creation (B5). Stock restoration is a manual A4 operation. Payment rejection only marks the payment as rejected.
- **Base64 slip display:** payment slips stored as base64 data URLs can be displayed with a plain `<img src={slipUrl}>`. No special handling needed for data URLs. Handle missing/invalid slip gracefully with an empty state.
- **Transaction reference is not unique:** multiple payments can have the same reference. No uniqueness constraint. The field is optional and admin-editable.
- **Payment form uses dual useActionState:** the `PaymentVerifyForm` uses three separate `useActionState` hooks for verify, reject, and reference update actions. Each has its own state and dispatch.
- **Slip URL validation:** when displaying `slipUrl`, only render if it exists and looks like a data URL (starts with `data:image/`). Do not blindly trust arbitrary URL values.