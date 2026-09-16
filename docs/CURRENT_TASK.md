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

### A7.3 Promotions ✅ COMPLETE

Promotions is a fully verified, production-ready content-management feature.

**What was verified and confirmed:**
- Admin CRUD at `/admin/content/promotions` — list, create, edit, delete, toggle active/inactive
- List page with search (name/description), status filter (live/scheduled/expired/inactive/enabled), sort (newest/oldest/start-desc/value-desc/value-asc), pagination, desktop table + mobile cards
- Create/edit form with name, description, discount type (percentage/fixed amount), value, start/end date/time, active/inactive toggle, and book assignment (checkbox list)
- Zod validation: required name, value 0–9999999 with up to 2 decimals, percentage 0–100, startAt < endAt, published book requirement
- Transactional book link replacement (delete-then-create in `$transaction`)
- Toggle active/inactive with revalidation
- Delete with confirmation and cascade deletion of BookPromotion records
- Homepage integration: active promotions filtered by `isActive + startAt <= now <= endAt`, `applyPromotion()` for display pricing, first-promotion-wins deduplication
- Server-authoritative checkout pricing preserved — no promotion logic in `app/checkout/actions.ts`
- No schema changes required — existing `Promotion` and `BookPromotion` models sufficient
- No regressions to A7.1 Hero Slides or A7.2 Staff Picks

**Next A7 task:** A7.4 Reading Content

## A8 — Admin Settings & User Management 🔒 LOCKED

A8 adds admin sidebar navigation for Hero Slides and full user/account management for admin and staff users.

### A8.1 Hero Slides Navigation ✅ COMPLETE

Hero Slides link added to the admin sidebar under the Content section.

**What was implemented:**
- Added `Image` icon import and "Hero Slides" nav item to `AdminSidebar.tsx`
- Route: `/admin/content/hero`
- Placed first in the Content section (before Reading Content, Featured Books, Promotions)
- Correct active-state behavior using existing `isActive()` function
- Desktop and mobile navigation both work

### A8.2 User Management ✅ COMPLETE

Admin and staff accounts can be managed from the Settings area.

**What was implemented:**
- User list at `/admin/settings/users` — desktop table + mobile cards, search by name/email, role filter, pagination
- Create user at `/admin/settings/users/new` — name, email, role (ADMIN/STAFF), password with confirmation
- Edit user at `/admin/settings/users/[id]` — name, email, role; separate password reset section
- Activate/deactivate with confirmation dialog — self-deactivation blocked, last-active-admin lockout prevention
- Password reset — ADMIN-only, server-side, uses existing scrypt hashing
- Zod validation on all forms (name, email, password, role)
- Duplicate email prevention
- All mutations require `requireAdmin()` — STAFF cannot manage users
- Admin-only authorization enforced server-side, not just UI-hidden
- Settings page updated with "Manage admin & staff accounts" link for ADMIN role
- `AdminFeedback` extended with user-management notice codes

**Files created:**
- `lib/admin/users.ts` — validation schema (client-safe)
- `lib/admin/user-queries.ts` — server query functions
- `app/admin/(dashboard)/settings/users/page.tsx` — user list
- `app/admin/(dashboard)/settings/users/actions.ts` — server actions
- `app/admin/(dashboard)/settings/users/UserForm.tsx` — create/edit form
- `app/admin/(dashboard)/settings/users/UserRowActions.tsx` — row actions
- `app/admin/(dashboard)/settings/users/PasswordResetForm.tsx` — password reset form
- `app/admin/(dashboard)/settings/users/new/page.tsx` — create page
- `app/admin/(dashboard)/settings/users/[id]/page.tsx` — edit page

**Files modified:**
- `components/admin/AdminSidebar.tsx` — Hero Slides nav item
- `components/admin/AdminFeedback.tsx` — user management notice codes
- `app/admin/(dashboard)/settings/page.tsx` — user management link

**Verification:**
- TypeScript: PASS
- ESLint: PASS
- Production build: PASS
- No schema changes
- No regressions to A1–A7

## A9 — Production Polish 🔒 LOCKED

A9 is complete. The Bookie platform has received a production-polish pass across the landing page, user app, and admin app.

### What A9 covers

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
- ESLint: PASS
- Production build: PASS
- Runtime regression: PASS
- Accessibility: PASS
- Responsive: PASS
- Theme: PASS

All milestones B1–B9 and A1–A9 are now LOCKED.

## A10 — Banner Management

### A10.1 Admin CRUD ✅ COMPLETE

Banner management is now available in the Admin app.

**What was implemented:**
- Banner list at `/admin/content/banners` — desktop table + mobile cards, search by title/description, status filter (live/scheduled/expired/inactive/draft/archived), sort by sortOrder + createdAt, pagination
- Create banner at `/admin/content/banners/new` — title, description, image upload, link URL, status (DRAFT/PUBLISHED/ARCHIVED), sort order, scheduling (startAt/endAt)
- Edit banner at `/admin/content/banners/[id]` — all fields editable, image replacement via existing Cloudinary pipeline
- Delete with confirmation — Cloudinary image cleanup
- Publish/unpublish toggle — switches between PUBLISHED and DRAFT
- Reorder — up/down buttons with server-controlled sortOrder
- Scheduling — optional startAt/endAt with endAt >= startAt validation
- ADMIN-only authorization on all mutations via requireAdmin()
- Homepage revalidation after mutations
- Banners nav item added to AdminSidebar under Content section

**Files created:**
- `app/admin/(dashboard)/content/banners/page.tsx` — banner list
- `app/admin/(dashboard)/content/banners/actions.ts` — server actions
- `app/admin/(dashboard)/content/banners/BannerForm.tsx` — create/edit form
- `app/admin/(dashboard)/content/banners/new/page.tsx` — create page
- `app/admin/(dashboard)/content/banners/[id]/page.tsx` — edit page

**Files modified:**
- `lib/admin/content.ts` — banner schemas, status helpers, types
- `lib/admin/content-queries.ts` — banner query functions
- `lib/cloudinary.ts` — added "banners" to UploadFolder
- `components/admin/AdminSidebar.tsx` — Banners nav item

**Verification:**
- TypeScript: PASS
- ESLint: PASS
- Production build: PASS
- No schema changes
- No regressions to A1–A9

**Next A10 task:** A10.2 Storefront Integration
