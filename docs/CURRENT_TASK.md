# Current Task

## A1 — Admin Foundation 🔒 LOCKED

## A2 — Dashboard & Analytics 🔒 LOCKED

## A3 — Catalog Management 🔒 LOCKED

## A4 — Inventory Management 🔒 LOCKED

## A5 — Order Management 🔒 LOCKED

## A6 — Payment Management 🔒 LOCKED

A6 is complete. Payment management is fully implemented and verified.

### What A6 covers

**Payment Overview** (`/admin/payments`)
- Overview cards: total payments, pending, verified, rejected
- Paginated payment table with BookPass, customer, method, amount, status, reference, date
- Server-side search (BookPass, customer name, transaction reference)
- Payment status filter (Pending, Verified, Rejected)
- Payment method filter (KPay, AYA Pay)
- Sort (newest, oldest, amount high→low, amount low→high)
- All filter state carried in URL parameters

**Payment Detail** (`/admin/payments/[id]`)
- Payment information: ID, method, amount, status, submitted date, transaction reference
- Order link: BookPass, order status, customer name, phone, email, total
- Payment slip display with MIME type validation (image/jpeg, image/png, image/webp only)
- Verification/rejection information: admin name, timestamp, rejection reason
- Verify/Reject actions (for PENDING payments only)
- Transaction reference update

**Payment Actions** (`app/admin/(dashboard)/payments/actions.ts`)
- `verifyPayment()` — atomic PENDING → VERIFIED with admin audit
- `rejectPayment()` — atomic PENDING → REJECTED with reason and admin audit
- `updateTransactionReference()` — update reference field
- All actions use `requireAdmin()` and Zod validation
- Atomic conditional UPDATE for concurrency safety
- Order.status is NOT changed by payment verification/rejection

### Architecture

- `lib/admin/payment-queries.ts` — server-only payment queries (overview, list, detail)
- `app/admin/(dashboard)/payments/actions.ts` — server actions for verify/reject/update reference
- `app/admin/(dashboard)/payments/page.tsx` — payment list page
- `app/admin/(dashboard)/payments/[id]/page.tsx` — payment detail page with slip validation
- `app/admin/(dashboard)/payments/PaymentVerifyForm.tsx` — client component for actions

### Payment behavior

- Payment verification does NOT change Order.status
- Payment rejection does NOT change Order.status
- Payment verification does NOT restore inventory
- Customer resubmission handled by existing B6 flow
- Base64 slip storage preserved (dev strategy)
- Slip URLs validated against allowed MIME types before rendering

### Verification status

- TypeScript: PASS
- ESLint: PASS
- Production build: PASS (all payment routes registered)
- Security (requireAdmin): VERIFIED
- Payment transitions: VERIFIED
- Slip URL validation: VERIFIED
- Dark mode: VERIFIED
- Mobile layout: VERIFIED

### Not in scope (do not start)

- A7 content & promotions
- A8 admin production polish

A7 — Content Management is next.
