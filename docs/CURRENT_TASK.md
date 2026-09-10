# Current Task

## B9 — Online Reading

### Objective

Turn the B3 "Read Online" entry point into a real, comfortable, distraction-free online reading experience for published books with `BookContent`.

### Status

**COMPLETED**

### What was done

- Created `app/books/[slug]/read/page.tsx` — Server component:
  - Fetches the published `Book` by slug plus its one-to-one `BookContent` (only `contentType`, `fileUrl`, `content`, title, authors)
  - `notFound()` for missing/unpublished books; friendly unavailable states (never raw DB errors) when reading is off or content is missing
  - `generateMetadata` for the reader title
- Created `app/books/[slug]/read/ReaderClient.tsx` — Client reader:
  - Sticky minimal header: back-to-book, truncated title + author, font-size A−/A+ (15–26px), reading-width toggle (68ch/88ch), scroll-progress bar (`role="progressbar"`)
  - Renders `BookContent.content` (HTML via scoped `.reader-prose` typography, or plain text), PDF `fileUrl` in an embedded iframe, EPUB/OTHER file fallback card
  - Reading position saved/restored to localStorage per slug (restore after mount only — hydration-safe); settings persisted via `useSyncExternalStore`
- Added `lib/reader-progress.ts` — SSR-safe localStorage helpers + settings store (stable cached snapshot, malformed-data tolerant)
- Added `.reader-prose` scoped reading typography layer to `app/globals.css` (global type system untouched)
- Added `components/layout/SiteChrome.tsx` — hides Navbar/Footer/FloatingCart on reader routes for a calm reading experience; wired into `app/layout.tsx`
- Updated `app/books/[slug]/BookDetailClient.tsx` — "Read Online" now links to the real reader (was a `/reader` placeholder)

### Scope

- [x] Reader route `/books/[slug]/read`
- [x] BookContent HTML/text rendering (scoped typography)
- [x] Font size + reading width controls (persisted)
- [x] Scroll progress + reading position (localStorage, SSR/hydration-safe)
- [x] PDF embed / EPUB file fallback
- [x] Distraction-free chrome on reader routes
- [x] B3 "Read Online" entry point wired to the real route
- [x] Missing/unpublished/no-content unavailable states
- [x] Responsive (360px → desktop), light/dark/system themes, accessibility (semantic HTML, aria-live, progressbar semantics, keyboard controls, focus states), reduced-motion aware
- [x] No schema changes, no new dependencies, no fake content records

### Not in scope

- Admin content management / uploads
- DRM, paid reading, subscriptions, auth changes
- Email/SMS, payment, order, tracking changes
- B10 production polish

## B10 — Production Polish

**B10 — Production Polish is next.** Has not started; will begin when B10 is approved.