# Current Task

## A1 — Admin Foundation 🔒 LOCKED

## A2 — Dashboard & Analytics 🔒 LOCKED

## A3 — Catalog Management 🔒 LOCKED

## A4 — Inventory Management 🔒 LOCKED

## A5 — Order Management 🔒 LOCKED

## A6 — Payment Management 🔒 LOCKED

## A7 — Content & Promotions 🔒 LOCKED

### A7.1 Hero Slides ✅ COMPLETE

Hero Slides are now database-driven and manageable from the Admin app.

**What was implemented:**
- `HeroSlide` Prisma model with scheduling (startAt/endAt), sort order, active/inactive state, optional book link
- Admin CRUD at `/admin/content/hero` — list, create, edit, delete, toggle, reorder
- Cloudinary image uploads via the existing centralized upload pipeline (`hero-slides/` folder)
- Homepage data layer queries active/scheduled HeroSlide records from Prisma with mock fallback
- HeroSlider renders real Cloudinary images when available, falls back to gradient placeholders
- 5-second auto-slide, animations, and responsive behavior preserved

**Next A7 task:** A7.2 Featured Sections

### A7.2 Staff Picks ✅ COMPLETE

Staff Picks is now a fully managed Featured Section.

**What was implemented:**
- Added `STAFF_PICK` to `FEATURED_SECTION_VALUES` and labels in `lib/admin/content.ts`
- Staff Picks automatically appears as a fourth column in `/admin/content/featured` (no page changes needed — iterates over `FEATURED_SECTION_VALUES`)
- Assign, remove, reorder, duplicate prevention, auth, revalidation — all handled by the existing FeaturedBook infrastructure
- `StaffPicks` homepage component created (`components/landing/StaffPicks.tsx`) — grid layout with Framer Motion, empty state, responsive
- Homepage data layer (`lib/data.ts`) queries `featuredBySection("STAFF_PICK")` with deterministic fallback when no Staff Picks are configured
- Staff Picks placed between Promotions and Popular Authors on the homepage
- No schema changes — `FeaturedSection.STAFF_PICK` was already present in the Prisma enum

**Next A7 task:** A7.3 Promotions

## A8 — Production Polish 🔒 LOCKED

A8 is complete. The Bookie platform has received a production-polish pass across the landing page, user app, and admin app.

### What A8 covers

**Navigation fixes:**
- Footer dead `#/` hash links replaced with real routes (`/search`, `/categories`, `/authors`, `/track`)
- Mobile menu category links changed from hash links to real Next.js `<Link>` routes
- Cmd+K search palette converted from mock inline results to a clean search launcher navigating to `/search?q=...`

**Dead code removal:**
- `app/design-system/page.tsx` deleted (dev-only artifact, now returns 404)
- `components/cart/CartContext.tsx` deleted (unused legacy component, no remaining imports)

**Accessibility fixes:**
- Checkout form labels now properly associated with inputs via `htmlFor`
- Admin focus styles standardized from `focus:border-brand focus:ring-1` to `focus-visible:border-ink focus-visible:outline-2` across orders, payments, and inventory pages
- SearchCommand ARIA: removed incorrect hardcoded `aria-expanded="true"` and `role="combobox"`

**UI fixes:**
- Checkout success state uses semantic `bg-success-muted` / `text-success` tokens instead of hardcoded green
- Admin settings placeholder language cleaned up (removed "future update" messaging)

**TypeScript fix:**
- `app/layout.tsx` updated from `LayoutProps<"/">` to `{ children: React.ReactNode }` to fix TypeScript compilation

### Verification status

- TypeScript: PASS
- ESLint (`--max-warnings=0`): PASS
- Production build: PASS
- Runtime regression (B1–B9): PASS
- Runtime regression (A1–A7): PASS
- Accessibility: PASS
- Responsive: PASS
- Theme: PASS
- Navigation verification: PASS (no remaining dead/hash links)
- Removed route verification: PASS (`/design-system` returns 404)
- Deleted component verification: PASS (no CartContext imports)

### Production prerequisites (not part of A8)

- Production PostgreSQL database
- Production environment variables and secrets
- Production-ready file storage (replacing Base64/dev uploads for cover images, payment slips, reading content)
- Admin credentials (created via `node scripts/create-admin.mjs`)

### Not in scope (do not start)

- B10 User App Production Polish (if planned)
- A9 or any new milestones

All milestones B1–B9 and A1–A8 are now LOCKED.
