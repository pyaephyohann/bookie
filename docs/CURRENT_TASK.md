# Current Task

## B5 — Checkout

### Objective

Build a guest checkout and order-creation flow — from cart to validated order with server-side price calculation and atomic transaction.

### Status

**COMPLETED**

### What was done

- Installed Zod for client + server validation
- Created `lib/checkout.ts` — Zod schema for customer information (name, phone, email, address, optional alternate phone + note)
- Created `app/checkout/actions.ts` — Server Action with Prisma transaction:
  - Validates customer input (server-side)
  - Validates cart items exist and are published
  - Validates inventory (stock check)
  - Fetches authoritative prices from database
  - Calculates totals server-side
  - Creates Order + OrderItems + OrderStatusHistory + InventoryTransactions in a single transaction
  - Generates unique BookPass (ORD-YYYY-XXXX format)
  - Returns bookPass on success
- Created `app/checkout/page.tsx` + `CheckoutClient.tsx`:
  - Responsive layout: customer form (mobile-first) + order summary sidebar
  - Empty cart protection
  - Inline validation errors
  - Server error display
  - Double-submit protection (disabled during submission)
  - Success state with BookPass + tracking link
  - Cart cleared only after successful order creation

### Security

- Client sends only `bookId` + `quantity`
- Server fetches authoritative prices from database
- Server validates all cart items against published books
- Server checks inventory availability
- Order totals calculated server-side
- Atomic Prisma transaction (order + items + history + inventory)

### Scope

- [x] Checkout page `/checkout`
- [x] Customer information form with Zod validation
- [x] Order summary (items, quantities, totals)
- [x] Server Action for order creation
- [x] Prisma transaction (Order + OrderItem + OrderStatusHistory + InventoryTransaction)
- [x] BookPass generation
- [x] Empty cart protection
- [x] Double-submit protection
- [x] Success state with BookPass display
- [x] Cart clearing after successful order

### Not in scope

- Payment (B6)
- Payment slip upload
- BookPass customer-facing tracking UI (B8)
- Order confirmation emails/SMS

## B6 — Payment

Has not started. Will begin when B6 is approved.
