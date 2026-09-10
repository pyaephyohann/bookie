# Bookie — User App Roadmap

The Bookie user-facing application is delivered in exactly 10 milestones. This is the high-level roadmap, not a task tracker.

| # | Milestone | Focus |
|---|---|---|
| B1 | **User App Foundation** | ✅ Completed — Navbar, logo, fonts, theme, responsive layout, navigation structure, Categories menu foundation, Search shortcut foundation, reusable UI foundation, animation foundation, documentation |
| B2 | **Home & Discovery** | ✅ Completed — data-driven discovery Home (Prisma with mock fallback): hero slider, browse categories, trending, best sellers, new releases, promotions, featured authors, recommended, recently viewed; docs updated |
| B3 | **Books** | ✅ Completed — book detail, categories index/detail, authors index/detail, search, wishlist, recently-viewed recording, real routes replacing placeholders |
| B4 | **Cart** | ✅ Completed — localStorage cart store, `/cart` page, quantity controls, order summary, real Add to Cart integration across BookCard/BookDetail/NewReleases/FloatingCart/Navbar |
| B5 | **Checkout** | ✅ Completed — guest checkout with Zod validation, server-authoritative pricing, Prisma transaction (Order + OrderItems + OrderStatusHistory + InventoryTransaction), BookPass generation, empty cart protection, double-submit protection |
| B6 | **Payment** | ✅ Completed — KPay / AYA Pay payment method selection, payment instructions with QR area, payment slip upload (preview/replace/remove), server-side payment record creation, PENDING verification status, duplicate submission protection |
| B7 | **Order Complete** | ✅ Completed — polished order completion page with BookPass display/copy, payment status badge, order summary, shipping details, tracking link with copy, navigation, responsive/theme/accessibility |
| B8 | **Order Tracking** | Track orders by BookPass, status timeline |
| B9 | **Online Reading** | In-app book reader for readable books |
| B10 | **Production Polish** | Performance, SEO, accessibility, deployment hardening |

Out of scope for the user app: admin dashboard, POS, and inventory management (separate concerns backed by the same database schema).

Current milestone: see `docs/CURRENT_TASK.md`.