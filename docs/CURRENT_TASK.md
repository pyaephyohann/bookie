# Current Task

## A1 — Admin Foundation 🔒 LOCKED

## A2 — Dashboard & Analytics 🔒 LOCKED

## A3 — Catalog Management 🔒 LOCKED

A3 was implemented on `main` and verified end-to-end through the real admin UI
against the live local PostgreSQL database (books, authors, categories,
publishers, security, storefront regression). All four fixes (bodySizeLimit,
sort dropdown, bootstrap script, upload-cleanup parse) were reviewed and approved.

**A4 — Inventory Management is next.**

### Final defect fixes (post-verification)

Three defects found during live verification were fixed, plus one discovered
while re-testing the fixes:

1. **Oversized uploads hit the framework body limit.** Server Actions default to
   a 1 MB body cap, below the 2 MB image limit, so a 1–2 MB upload produced a raw
   `413` that landed on the admin error boundary. `next.config.ts` now sets
   `experimental.serverActions.bodySizeLimit: "3mb"` (Next 16.x location), and
   both the book cover and `ImageField` pre-check type/size client-side. The
   server remains authoritative and still returns the friendly message.
2. **Duplicate “Newest first” in the Books Sort dropdown.** `AdminFilterForm`
   prepends the placeholder option, which collided with a real sort option; the
   Sort placeholder is now `Default (newest)`.
3. **`scripts/create-admin.mjs` could not run.** It imported the TypeScript
   generated client via the `@/` alias, which plain Node cannot resolve. It now
   performs one idempotent upsert through the project’s Prisma CLI, keeps the
   masked prompt, and also works when stdin is not a TTY.
4. **Replaced/deleted images leaked their files.** `removeUploadedImage` split
   the URL on `/` and read the wrong segments, so cleanup silently no-op’d. It
   now parses with capture groups (and rejects `..`).

### Objective

Give admins real catalog management for the existing `Book`, `Author`, `Category`
models, plus publisher handling for the `Book.publisher` string column. No schema
changes were made.

### What was done

**Books** (`/admin/catalog/books`)

- Paginated table with cover thumbnails, title, author(s), category, publisher,
  ISBN, price, stock, status badge, and updated date.
- Server-side search (title / ISBN / publisher / author), status/category/author
  filters, and six sort orders — all carried in the URL so state is shareable.
- Create and edit forms (`/new`, `/[id]`) with Zod validation, inline field
  errors, loading state, and double-submit protection.
- Relationship management: author and category multi-select written in a
  transaction (join rows are replaced, never duplicated).
- Publication status (`DRAFT` / `PUBLISHED` / `ARCHIVED`) plus `publishedAt`,
  `isReadableOnline`, SEO fields, and pricing.
- Safe removal: books referenced by `OrderItem` or `InventoryTransaction` can only
  be **archived**; books with no history can be hard-deleted behind a two-step
  confirmation.
- Edit screen shows the order/inventory reference counts that decide which
  removal action is allowed.

**Authors** (`/admin/catalog/authors`)

- Paginated list with search, book-count sort, photo thumbnails, and edit links.
- Create/edit forms with name, slug (auto-generated from the name), biography,
  and photo upload.
- Deletion is blocked while the author still has books linked.

**Categories** (`/admin/catalog/categories`)

- Paginated list with search, parent indicator, book/child counts, and images.
- Create/edit forms with name, slug, description, image, and a parent picker.
- The parent picker excludes the edited category and its whole subtree, so the
  hierarchy cannot become cyclic. Moving a category under its own descendant is
  rejected server-side too.
- Deletion is blocked while the category has books or sub-categories.

**Publishers** (`/admin/catalog/publishers`)

- Publishers are **not** a table — `Book.publisher` is a plain string. The list is
  a grouped aggregate over books.
- Rename applies to every book that uses the name (rejected if the target name
  already exists, which would silently merge two publishers).
- Clear removes the publisher from all books using it, behind confirmation.

**Shared pieces**

- `lib/admin/catalog.ts` — pure Zod schemas/constants (safe in client components).
- `lib/admin/catalog-queries.ts` — server-only paginated/filtered queries.
- `lib/admin/uploads.ts` — validated image storage (`/public/uploads/<bucket>`),
  real file-signature sniffing, best-effort cleanup of replaced files.
- `components/admin/` — `AdminPagination`, `AdminFilterForm`, `AdminConfirmSubmit`,
  `AdminFeedback`, `ImageField`; `BookStatusBadge` added to `components/ui/badge.tsx`.
- Sidebar Catalog links now point at real routes (the "Soon" badges are gone).

### Security

- Every catalog page calls `requireAdmin()`; every mutation calls `requireAdmin()`
  again server-side and re-validates with Zod. The UI is never trusted.
- Uploads are validated by MIME allow-list, size (2 MB), and actual JPEG/PNG/WEBP
  byte signatures. Client-supplied filenames/extensions are never used.
- Failure feedback travels as safe status codes (`?notice=…`), never raw DB errors.

### Storage / config

- Covers, author photos and category images are stored on disk under
  `/public/uploads/<bucket>/` and the DB keeps a short root-relative URL.
  This is **DEV-ONLY** — production should move to Cloudinary/S3.
- `next.config.ts` allows https remote image hosts because admins can paste an
  https cover URL.
- `public/uploads` is gitignored.

### DB / data decisions

- **No Prisma schema change** and no migration.
- No fake catalog/book records were created. The local database is unavailable in
  development, so list pages use their real queries and degrade to empty states
  when there is no data.

### Verification

- TypeScript: PASS
- ESLint (`--max-warnings=0`): PASS
- Production build: PASS (all catalog routes registered)
- Runtime: all `/admin/catalog/*` routes redirect to `/admin/login` when
  unauthenticated; storefront routes unaffected
- User App regression: `/`, `/cart`, `/categories`, `/books/[slug]`, reader, etc.
  unchanged

### Not in scope (do not start)

- A4 inventory management
- A5 order management
- A6 payment management
- A7 content & promotions
- A8 admin production polish

A3 must be reviewed before it is committed/locked.
