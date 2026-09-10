# Current Task

## B6 — Payment

### Objective

Build the payment submission flow for an existing order — payment method selection (KPay / AYA Pay), payment instructions with QR area, payment slip upload with preview/replace/remove, and server-side payment record creation.

### Status

**COMPLETED**

### What was done

- Created `lib/payment.ts` — payment configuration helper (merchant info, method labels, file validation, allowed types/sizes)
- Created `app/payment/actions.ts` — Server Action for payment submission:
  - Validates payment method
  - Validates uploaded file (type: JPEG/PNG/WEBP, size: max 5MB)
  - Resolves existing order from database by BookPass
  - Verifies order is eligible for payment (not cancelled/rejected/delivered)
  - Checks existing payment state (prevents duplicate pending, updates existing pending)
  - Converts file to base64 data URL for storage
  - Creates Payment record with server-authoritative amount from Order.total
  - Returns safe result (never exposes internal errors)
- Created `app/payment/page.tsx` — Server component that fetches order by BookPass query param and renders PaymentClient
- Created `app/payment/PaymentClient.tsx` — Client component:
  - Payment method selection (KPay / AYA Pay) with visual cards
  - Payment instructions with merchant name, phone, QR image area
  - Payment slip upload with preview, replace, remove
  - Order summary (BookPass, items, total)
  - Submit button with loading state
  - Success state (awaiting verification, BookPass, tracking link)
  - Already-paid state handling
  - Error display with clear messages
- Modified `app/checkout/CheckoutClient.tsx` — Added "Pay Now" link in B5 success state
- Updated `.env.example` — Added payment configuration env vars

### Payment Model Used

The existing Prisma `Payment` model was used as-is — no schema changes required:
- `orderId` → relation to Order
- `method` → PaymentMethod enum (KPAY, AYAPAY)
- `amount` → Decimal(12,2), server-calculated from Order.total
- `status` → PaymentStatus enum, always PENDING after submission
- `slipUrl` → stores payment slip as base64 data URL (dev strategy)
- `createdAt` / `updatedAt` timestamps

### Security

- Server is the authoritative source for order existence, status, and amount
- Client-supplied prices/totals are never accepted
- Payment status is always PENDING after submission (never auto-verified)
- File uploads validated server-side (type, size)
- Duplicate payment protection (existing pending payment is updated, not duplicated)
- Internal errors are never exposed to the client

### Scope

- [x] Payment page `/payment?bookPass=XXX`
- [x] Payment method selection (KPay / AYA Pay)
- [x] Payment instructions with merchant info + QR area
- [x] Payment slip upload (select, preview, replace, remove)
- [x] Server-side payment validation and record creation
- [x] Success state (awaiting verification)
- [x] Already-paid state handling
- [x] Error handling
- [x] B5 → B6 navigation (Pay Now link on checkout success)
- [x] Responsive design (mobile/tablet/desktop)
- [x] Light/dark theme support
- [x] Accessibility (labels, keyboard, focus, aria)

### Not in scope

- B7 Order Complete redesign
- B8 Order Tracking
- B9 Online Reader
- Admin payment verification
- Email/SMS notifications
- Payment gateway/API integration
- Automatic payment verification
- Cloud-based file storage (currently uses base64 data URLs)

## B7 — Order Complete

Has not started. Will begin when B7 is approved.
