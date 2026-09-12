# Bookie — Roadmap

The Bookie project is delivered in milestones across the User App and Admin App. This is the high-level roadmap, not a task tracker.

## User App

| # | Milestone | Focus |
|---|---|---|
| B1 | **User App Foundation** | ✅ Completed — Navbar, logo, fonts, theme, responsive layout, navigation structure, Categories menu foundation, Search shortcut foundation, reusable UI foundation, animation foundation, documentation |
| B2 | **Home & Discovery** | ✅ Completed — data-driven discovery Home (Prisma with mock fallback): hero slider, browse categories, trending, best sellers, new releases, promotions, featured authors, recommended, recently viewed; docs updated |
| B3 | **Books** | ✅ Completed — book detail, categories index/detail, authors index/detail, search, wishlist, recently-viewed recording, real routes replacing placeholders |
| B4 | **Cart** | ✅ Completed — localStorage cart store, `/cart` page, quantity controls, order summary, real Add to Cart integration across BookCard/BookDetail/NewReleases/FloatingCart/Navbar |
| B5 | **Checkout** | ✅ Completed — guest checkout with Zod validation, server-authoritative pricing, Prisma transaction (Order + OrderItems + OrderStatusHistory + InventoryTransaction), BookPass generation, empty cart protection, double-submit protection |
| B6 | **Payment** | ✅ Completed — KPay / AYA Pay payment method selection, payment instructions with QR area, payment slip upload (preview/replace/remove), server-side payment record creation, PENDING verification status, duplicate submission protection |
| B7 | **Order Complete** | ✅ Completed — polished order completion page with BookPass display/copy, payment status badge, order summary, shipping details, tracking link with copy, navigation, responsive/theme/accessibility |
| B8 | **Order Tracking** | ✅ Completed — `/track` BookPass lookup, status timeline from real OrderStatusHistory, terminal Rejected/Cancelled states, order + payment summary, copy BookPass / tracking link, footer + navbar + B7 links wired |
| B9 | **Online Reading** | ✅ Completed — real reader at `/books/[slug]/read` with BookContent HTML/text rendering (PDF embed / EPUB file fallback), font size + reading width controls, scroll progress, localStorage reading position, distraction-free chrome, unavailable states, B3 entry point wired |
| B10 | **Production Polish** | Performance, SEO, accessibility, deployment hardening |

## Admin App

| # | Milestone | Focus |
|---|---|---|
| A1 | **Admin Foundation** | 🔒 Locked — Admin auth (scrypt + HMAC session cookie), server-side `requireAdmin()` authorization, `/admin` shell (sidebar + navbar + profile menu), dashboard shell, settings shell, login page, loading/error/not-found states, SiteChrome admin route handling, bootstrap script, documentation |
| A2 | **Dashboard & Analytics** | 🔒 Locked — KPI overview, revenue analytics (30d/90d), orders by status, orders over time, sales by category, payment analytics (donut + method breakdown), inventory alerts, recent orders, SVG charts, server-side aggregation |
| A3 | **Catalog Management** | 🔒 Locked — Books, authors, categories CRUD with server-side search/filter/sort/pagination; publishers managed via the derived `Book.publisher` field; cover/photo uploads with client+server validation (bodySizeLimit fix + orphan-cleanup fix); safe archive vs. guarded delete; publication status management |
| A4 | **Inventory Management** | 🔒 Locked — Stock levels, adjustments, damage tracking, transaction history; atomic PostgreSQL stock mutations verified against concurrent access; A2 dashboard integration confirmed |
| A5 | **Order Management** | 🔒 Locked — Order list with search/filter/sort, order detail with customer/items/totals/payment, status management with validated transitions, admin status history |
| A6 | **Payment Management** | 🔒 Locked — Payment list with search/filter/sort, payment detail with slip display, verify/reject actions, transaction reference, admin audit |
| A7 | **Content Management** | ⏳ Reading content upload, featured books, promotions, banners |
| A8 | **Admin Polish** | ⏳ Performance, accessibility, deployment hardening |

Current milestone: see `docs/CURRENT_TASK.md`.