import { prisma } from "@/lib/prisma";
import type { Prisma, BookStatus } from "@/generated/prisma/client";
import { CATALOG_PAGE_SIZE, BOOK_STATUS_VALUES, type CategoryOption } from "@/lib/admin/catalog";

/**
 * Admin catalog queries (A3). SERVER-ONLY — never import in a client component.
 *
 * All list queries are paginated + filtered in the database. Nothing loads the
 * whole catalog into the browser.
 */

// ── Shared ──────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
}

function paginate<T>(items: T[], total: number, page: number): Paginated<T> {
  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)),
  };
}

function clampPage(page: number | undefined): number {
  const n = Number(page);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function isBookStatus(value: string | undefined): value is BookStatus {
  return !!value && (BOOK_STATUS_VALUES as readonly string[]).includes(value);
}

// ── Books ───────────────────────────────────────────────────────────────────

export interface BookListFilters {
  q?: string;
  status?: string;
  category?: string;
  author?: string;
  publisher?: string;
  sort?: string;
  page?: number;
}

export interface BookListRow {
  id: string;
  title: string;
  slug: string;
  isbn: string | null;
  publisher: string | null;
  price: number;
  stockQuantity: number;
  status: BookStatus;
  coverImage: string | null;
  authors: string[];
  categories: string[];
  updatedAt: string;
}

function bookOrderBy(sort: string | undefined): Prisma.BookOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "title":
      return { title: "asc" };
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "stock-asc":
      return { stockQuantity: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

function bookWhere(filters: BookListFilters): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {};

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { isbn: { contains: filters.q, mode: "insensitive" } },
      { publisher: { contains: filters.q, mode: "insensitive" } },
      { authors: { some: { author: { name: { contains: filters.q, mode: "insensitive" } } } } },
    ];
  }
  if (isBookStatus(filters.status)) where.status = filters.status;
  if (filters.category) where.categories = { some: { category: { slug: filters.category } } };
  if (filters.author) where.authors = { some: { author: { slug: filters.author } } };
  if (filters.publisher) where.publisher = filters.publisher;

  return where;
}

const bookListSelect = {
  id: true,
  title: true,
  slug: true,
  isbn: true,
  publisher: true,
  price: true,
  stockQuantity: true,
  status: true,
  coverImage: true,
  updatedAt: true,
  authors: { select: { author: { select: { name: true } } }, orderBy: { sortOrder: "asc" } },
  categories: { select: { category: { select: { name: true } } } },
} satisfies Prisma.BookSelect;

type DbBookListRow = Prisma.BookGetPayload<{ select: typeof bookListSelect }>;

function toBookListRow(book: DbBookListRow): BookListRow {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    isbn: book.isbn,
    publisher: book.publisher,
    price: Number(book.price),
    stockQuantity: book.stockQuantity,
    status: book.status,
    coverImage: book.coverImage,
    authors: book.authors.map((a) => a.author.name),
    categories: book.categories.map((c) => c.category.name),
    updatedAt: book.updatedAt.toISOString(),
  };
}

export async function listBooks(filters: BookListFilters): Promise<Paginated<BookListRow>> {
  const page = clampPage(filters.page);
  const where = bookWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.book.findMany({
      where,
      select: bookListSelect,
      orderBy: bookOrderBy(filters.sort),
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.book.count({ where }),
  ]);

  return paginate(rows.map(toBookListRow), total, page);
}

export interface BookEditData {
  id: string;
  title: string;
  slug: string;
  description: string;
  isbn: string;
  publisher: string;
  publishedAt: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  status: BookStatus;
  coverImage: string;
  isReadableOnline: boolean;
  metaTitle: string;
  metaDescription: string;
  authorIds: string[];
  categoryIds: string[];
  orderItemCount: number;
  inventoryCount: number;
}

export async function getBookForEdit(id: string): Promise<BookEditData | null> {
  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      isbn: true,
      publisher: true,
      publishedAt: true,
      price: true,
      compareAtPrice: true,
      stockQuantity: true,
      status: true,
      coverImage: true,
      isReadableOnline: true,
      metaTitle: true,
      metaDescription: true,
      authors: { select: { authorId: true } },
      categories: { select: { categoryId: true } },
      _count: { select: { orderItems: true, inventoryTransactions: true } },
    },
  });

  if (!book) return null;

  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    description: book.description ?? "",
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    publishedAt: book.publishedAt ? book.publishedAt.toISOString().slice(0, 10) : "",
    price: String(Number(book.price)),
    compareAtPrice: book.compareAtPrice === null ? "" : String(Number(book.compareAtPrice)),
    stockQuantity: String(book.stockQuantity),
    status: book.status,
    coverImage: book.coverImage ?? "",
    isReadableOnline: book.isReadableOnline,
    metaTitle: book.metaTitle ?? "",
    metaDescription: book.metaDescription ?? "",
    authorIds: book.authors.map((a) => a.authorId),
    categoryIds: book.categories.map((c) => c.categoryId),
    orderItemCount: book._count.orderItems,
    inventoryCount: book._count.inventoryTransactions,
  };
}

// ── Authors ─────────────────────────────────────────────────────────────────

export interface AuthorListRow {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  biography: string | null;
  bookCount: number;
  updatedAt: string;
}

export async function listAuthors(filters: {
  q?: string;
  sort?: string;
  page?: number;
}): Promise<Paginated<AuthorListRow>> {
  const page = clampPage(filters.page);

  const where: Prisma.AuthorWhereInput = filters.q
    ? {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { slug: { contains: filters.q, mode: "insensitive" } },
        ],
      }
    : {};

  const orderBy: Prisma.AuthorOrderByWithRelationInput =
    filters.sort === "books" ? { books: { _count: "desc" } } : { name: "asc" };

  const [rows, total] = await Promise.all([
    prisma.author.findMany({
      where,
      orderBy,
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        photoUrl: true,
        biography: true,
        updatedAt: true,
        _count: { select: { books: true } },
      },
    }),
    prisma.author.count({ where }),
  ]);

  return paginate(
    rows.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      photoUrl: a.photoUrl,
      biography: a.biography,
      bookCount: a._count.books,
      updatedAt: a.updatedAt.toISOString(),
    })),
    total,
    page,
  );
}

export interface AuthorEditData {
  id: string;
  name: string;
  slug: string;
  biography: string;
  photoUrl: string;
  bookCount: number;
}

export async function getAuthorForEdit(id: string): Promise<AuthorEditData | null> {
  const author = await prisma.author.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      biography: true,
      photoUrl: true,
      _count: { select: { books: true } },
    },
  });
  if (!author) return null;

  return {
    id: author.id,
    name: author.name,
    slug: author.slug,
    biography: author.biography ?? "",
    photoUrl: author.photoUrl ?? "",
    bookCount: author._count.books,
  };
}

// ── Categories ──────────────────────────────────────────────────────────────

export interface CategoryListRow {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  imageUrl: string | null;
  bookCount: number;
  childCount: number;
}

export async function listCategories(filters: {
  q?: string;
  sort?: string;
  page?: number;
}): Promise<Paginated<CategoryListRow>> {
  const page = clampPage(filters.page);

  const where: Prisma.CategoryWhereInput = filters.q
    ? {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { slug: { contains: filters.q, mode: "insensitive" } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        parent: { select: { name: true } },
        _count: { select: { books: true, children: true } },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return paginate(
    rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentName: c.parent?.name ?? null,
      imageUrl: c.imageUrl,
      bookCount: c._count.books,
      childCount: c._count.children,
    })),
    total,
    page,
  );
}

export interface CategoryEditData {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  bookCount: number;
  childCount: number;
}

export async function getCategoryForEdit(id: string): Promise<CategoryEditData | null> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      parentId: true,
      _count: { select: { books: true, children: true } },
    },
  });
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    parentId: category.parentId ?? "",
    bookCount: category._count.books,
    childCount: category._count.children,
  };
}

/**
 * Parent options for the category form. Excludes the edited category and its
 * whole subtree so the hierarchy can never become cyclic from the UI.
 */
export async function getCategoryOptions(excludeId?: string): Promise<CategoryOption[]> {
  const rows = await prisma.category.findMany({
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });

  let excluded = new Set<string>();
  if (excludeId) {
    excluded = new Set([excludeId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const row of rows) {
        if (row.parentId && excluded.has(row.parentId) && !excluded.has(row.id)) {
          excluded.add(row.id);
          grew = true;
        }
      }
    }
  }

  const byId = new Map(rows.map((r) => [r.id, r] as const));
  const depthOf = (id: string): number => {
    let depth = 0;
    let current = byId.get(id)?.parentId ?? null;
    const seen = new Set<string>([id]);
    while (current && !seen.has(current) && depth < 10) {
      seen.add(current);
      depth += 1;
      current = byId.get(current)?.parentId ?? null;
    }
    return depth;
  };

  return rows
    .filter((r) => !excluded.has(r.id))
    .map((r) => ({ id: r.id, name: r.name, depth: depthOf(r.id) }));
}

/** Lightweight option lists for the book/category forms. */
export async function getCatalogOptions(): Promise<{
  authors: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string; parentId: string | null }[];
  publishers: string[];
}> {
  const [authors, categories, publisherRows] = await Promise.all([
    prisma.author.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.book.groupBy({
      by: ["publisher"],
      where: { publisher: { not: null } },
      orderBy: { publisher: "asc" },
    }),
  ]);

  return {
    authors,
    categories,
    publishers: publisherRows
      .map((r) => r.publisher)
      .filter((p): p is string => typeof p === "string" && p.length > 0),
  };
}

// ── Publishers (derived from Book.publisher) ────────────────────────────────

export interface PublisherListRow {
  name: string;
  bookCount: number;
  publishedCount: number;
}

/**
 * Publishers are NOT a table — `Book.publisher` is a plain string column, so
 * the admin list is derived with a grouped aggregate query.
 */
export async function listPublishers(filters: {
  q?: string;
  page?: number;
}): Promise<Paginated<PublisherListRow>> {
  const page = clampPage(filters.page);

  const grouped = await prisma.book.groupBy({
    by: ["publisher"],
    where: {
      publisher: {
        not: null,
        ...(filters.q ? { contains: filters.q, mode: "insensitive" as const } : {}),
      },
    },
    _count: { _all: true },
    orderBy: { publisher: "asc" },
  });

  const total = grouped.length;
  const start = (page - 1) * CATALOG_PAGE_SIZE;
  const slice = grouped.slice(start, start + CATALOG_PAGE_SIZE);

  // Published counts for just the visible page.
  const names = slice.map((r) => r.publisher).filter((p): p is string => !!p);
  const published = names.length
    ? await prisma.book.groupBy({
        by: ["publisher"],
        where: { publisher: { in: names }, status: "PUBLISHED" },
        _count: { _all: true },
      })
    : [];
  const publishedMap = new Map(
    published.map((r) => [r.publisher ?? "", r._count._all] as const),
  );

  return paginate(
    slice
      .filter((r): r is typeof r & { publisher: string } => !!r.publisher)
      .map((r) => ({
        name: r.publisher,
        bookCount: r._count._all,
        publishedCount: publishedMap.get(r.publisher) ?? 0,
      })),
    total,
    page,
  );
}

