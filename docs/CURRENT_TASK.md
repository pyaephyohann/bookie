# Current Task

## A1 — Admin Foundation 🔒 LOCKED

## A2 — Dashboard & Analytics 🔒 LOCKED

## A3 — Catalog Management 🔒 LOCKED

## A4 — Inventory Management 🔒 LOCKED

## A5 — Order Management 🔒 LOCKED

A5 is complete. Order management is fully implemented and verified.

### What A5 covers

**Order Overview** (`/admin/orders`)
- Overview cards: total orders, placed, confirmed, shipped, delivered, rejected/cancelled
- Paginated order table with BookPass, customer name, date, items, total, payment status, order status
- Server-side search (BookPass, customer name, phone, email)
- Order status filter (Placed, Confirmed, Preparing, Shipped, Delivered, Rejected, Cancelled)
- Payment status filter (Pending, Verified, Rejected, No payment)
- Sort (newest, oldest, total high→low, total low→high)
- All filter state carried in URL parameters

**Order Detail** (`/admin/orders/[id]`)
- Order information: BookPass, date, status badge
- Customer information: name, phone, alternate phone, email, shipping address, note
- Order items: book title (snapshot), unit price, quantity, subtotal
- Totals: subtotal, discount, shipping fee, total
- Payment information: method, amount, status, submitted date, transaction reference, slip link (read-only)
- Status timeline: OrderStatusHistory entries with admin user reference

**Status Management** (`app/admin/(dashboard)/orders/actions.ts`)
- Server-side status update action with `requireAdmin()`
- Valid transitions enforced:
  - PLACED → CONFIRMED, REJECTED, CANCELLED
  - CONFIRMED → PREPARING, REJECTED, CANCELLED
  - PREPARING → SHIPPED
  - SHIPPED → DELIVERED
  - DELIVERED, REJECTED, CANCELLED → terminal
- Creates OrderStatusHistory entry with `changedById` set to admin user
- Atomic Prisma transaction for status update + history creation

### Architecture

- `lib/admin/order-queries.ts` — server-only order queries (overview, list, detail, timeline)
- `app/admin/(dashboard)/orders/actions.ts` — server action for status updates
- `app/admin/(dashboard)/orders/page.tsx` — order list page
- `app/admin/(dashboard)/orders/[id]/page.tsx` — order detail page
- `app/admin/(dashboard)/orders/OrderStatusForm.tsx` — client component for status management

### Inventory behavior

A5 does NOT automatically restore inventory when orders are rejected or cancelled.
Inventory was decremented at order creation (B5).
Stock restoration remains a manual operation through A4.

### Verification status

- TypeScript: PASS
- ESLint: PASS
- Production build: PASS (all order routes registered)
- Security (requireAdmin): VERIFIED
- Status transitions: VERIFIED
- Dark mode: VERIFIED
- Mobile layout: VERIFIED

### Not in scope (do not start)

- A6 payment management
- A7 content & promotions
- A8 admin production polish

A6 — Payment Management is next.
