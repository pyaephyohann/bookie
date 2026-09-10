# Current Task

## B8 — Order Tracking

### Objective

Build the customer-facing order tracking experience — customers enter their BookPass and see the current state of their order.

### Status

**COMPLETED**

### What was done

- Created `app/track/page.tsx` — Server component:
  - Reads `pass` from the query string and normalizes it (trim + uppercase)
  - Fetches the order from Prisma by BookPass (items, latest payment, status history)
  - Renders the lookup form when no BookPass is provided
  - Renders the friendly not-found state for invalid BookPasses (no raw DB errors ever leak)
- Created `app/track/TrackOrderClient.tsx` — Client component:
  - BookPass lookup form (accessible label, normalized submission, searching state)
  - Status timeline driven by the **actual** `OrderStatusHistory` records (never fabricated)
  - Terminal Rejected/Cancelled states — visually distinct, no future success steps shown
  - Order summary (items, quantities, subtotal/shipping/total — all from the DB)
  - Payment status (PENDING/VERIFIED/REJECTED) with method and amount
  - Copy BookPass + Copy Tracking Link with clipboard fallback and "Copied!" feedback
  - "Check Another Order" + Continue Shopping navigation
  - Responsive layout, light/dark/system themes, reduced-motion support, keyboard-accessible
- Updated `components/navigation/Footer.tsx`:
  - "Track Order" placeholder link changed from `#/track` to the real `/track` route (via `next/link`)

### Timeline behavior

- Successful lifecycle: `PLACED → CONFIRMED → PREPARING → SHIPPED → DELIVERED`
- A step is marked completed only when it exists in the real `OrderStatusHistory` or lies strictly before the authoritative current `Order.status`
- `REJECTED` / `CANCELLED` are terminal: they show the history steps that actually happened plus a distinct terminal banner — future success statuses are never shown as completed
- No customer-identifying data (phone, email, address) is exposed — only order items, totals, and statuses

### Scope

- [x] `/track` BookPass lookup UI
- [x] Server-side order lookup by BookPass (Prisma, never client data)
- [x] Status timeline from real status history
- [x] Terminal Rejected / Cancelled states
- [x] Order summary (authoritative totals)
- [x] Payment status display
- [x] Copy BookPass + Copy Tracking Link
- [x] Navbar / Footer / B7 links wired to the real route
- [x] Responsive, themed, accessible

### Not in scope

- Admin order/payment management
- Email / SMS notifications
- B9 Online Reading
- B10 production polish

## B9 — Online Reading

Has not started. Will begin when B9 is approved.

## Next milestone

**B9 — Online Reading**