import { prisma } from "@/lib/prisma";
import type { Prisma, InventoryTransactionType } from "@/generated/prisma/client";
import { CATALOG_PAGE_SIZE } from "@/lib/admin/catalog";

/**
 * Admin inventory queries (A4). SERVER-ONLY — never import in a client component.
 *
 * Inventory is derived from Book.stockQuantity + InventoryTransaction history.
 * There is no separate Inventory model — stock lives on the Book row.
 */

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Inventory overview ─────────────────────────────────────────────────────

export interface InventoryOverview {
  totalBooks: number;
  totalUnits: number;
  lowStockBooks: number;
  outOfStockBooks: number;
}

export async function getInventoryOverview(): Promise<InventoryOverview> {
  const [totalAgg, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.book.aggregate({
      _count: true,
      _sum: { stockQuantity: true },
      where: { status: { not: "ARCHIVED" } },
    }),
    prisma.book.aggregate({
      _count: true,
      where: {
        status: { not: "ARCHIVED" },
        stockQuantity: { gt: 0, lte: 5 },
      },
    }),
    prisma.book.aggregate({
      _count: true,
      where: {
        status: { not: "ARCHIVED" },
        stockQuantity: 0,
      },
    }),
  ]);

  return {
    totalBooks: totalAgg._count,
    totalUnits: totalAgg._sum.stockQuantity ?? 0,
    lowStockBooks: lowStockCount._count,
    outOfStockBooks: outOfStockCount._count,
  };
}

// ── Inventory list ─────────────────────────────────────────────────────────

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export function getStockStatus(qty: number): StockStatus {
  if (qty <= 0) return "OUT_OF_STOCK";
  if (qty <= 5) return "LOW_STOCK";
  return "IN_STOCK";
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
};

export const INVENTORY_SORT_OPTIONS = [
  { value: "updated-desc", label: "Recently updated" },
  { value: "updated-asc", label: "Oldest updated" },
  { value: "stock-asc", label: "Stock low → high" },
  { value: "stock-desc", label: "Stock high → low" },
  { value: "title", label: "Title A–Z" },
] as const;

export const INVENTORY_STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
] as const;

export interface InventoryListFilters {
  q?: string;
  status?: string;
  sort?: string;
  page?: number;
}

export interface InventoryListRow {
  id: string;
  title: string;
  slug: string;
  isbn: string | null;
  coverImage: string | null;
  stockQuantity: number;
  status: string;
  authors: string[];
  lastTransactionAt: string | null;
  transactionCount: number;
}

function inventoryOrderBy(sort: string | undefined): Prisma.BookOrderByWithRelationInput {
  switch (sort) {
    case "updated-asc":
      return { updatedAt: "asc" };
    case "stock-asc":
      return { stockQuantity: "asc" };
    case "stock-desc":
      return { stockQuantity: "desc" };
    case "title":
      return { title: "asc" };
    default:
      return { updatedAt: "desc" };
  }
}

function inventoryWhere(filters: InventoryListFilters): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {
    status: { not: "ARCHIVED" },
  };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { isbn: { contains: filters.q, mode: "insensitive" } },
      { authors: { some: { author: { name: { contains: filters.q, mode: "insensitive" } } } } },
    ];
  }

  if (filters.status === "OUT_OF_STOCK") {
    where.stockQuantity = 0;
  } else if (filters.status === "LOW_STOCK") {
    where.stockQuantity = { gt: 0, lte: 5 };
  } else if (filters.status === "IN_STOCK") {
    where.stockQuantity = { gt: 5 };
  }

  return where;
}

const inventoryListSelect = {
  id: true,
  title: true,
  slug: true,
  isbn: true,
  coverImage: true,
  stockQuantity: true,
  status: true,
  updatedAt: true,
  authors: { select: { author: { select: { name: true } } }, orderBy: { sortOrder: "asc" as const } },
  inventoryTransactions: {
    select: { createdAt: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
  _count: { select: { inventoryTransactions: true } },
} satisfies Prisma.BookSelect;

type DbInventoryRow = Prisma.BookGetPayload<{ select: typeof inventoryListSelect }>;

function toInventoryListRow(book: DbInventoryRow): InventoryListRow {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    isbn: book.isbn,
    coverImage: book.coverImage,
    stockQuantity: book.stockQuantity,
    status: book.status,
    authors: book.authors.map((a) => a.author.name),
    lastTransactionAt: book.inventoryTransactions[0]?.createdAt.toISOString() ?? null,
    transactionCount: book._count.inventoryTransactions,
  };
}

export async function listInventory(filters: InventoryListFilters): Promise<Paginated<InventoryListRow>> {
  const page = clampPage(filters.page);
  const where = inventoryWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.book.findMany({
      where,
      select: inventoryListSelect,
      orderBy: inventoryOrderBy(filters.sort),
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.book.count({ where }),
  ]);

  return paginate(rows.map(toInventoryListRow), total, page);
}

// ── Book inventory detail ──────────────────────────────────────────────────

export interface BookInventoryDetail {
  id: string;
  title: string;
  slug: string;
  isbn: string | null;
  coverImage: string | null;
  stockQuantity: number;
  status: string;
  authors: string[];
  categories: string[];
}

export async function getBookInventoryDetail(bookId: string): Promise<BookInventoryDetail | null> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      slug: true,
      isbn: true,
      coverImage: true,
      stockQuantity: true,
      status: true,
      authors: { select: { author: { select: { name: true } } } },
      categories: { select: { category: { select: { name: true } } } },
    },
  });

  if (!book) return null;

  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    isbn: book.isbn,
    coverImage: book.coverImage,
    stockQuantity: book.stockQuantity,
    status: book.status,
    authors: book.authors.map((a) => a.author.name),
    categories: book.categories.map((c) => c.category.name),
  };
}

// ── Transaction history ────────────────────────────────────────────────────

export interface InventoryTransactionRow {
  id: string;
  bookId: string;
  bookTitle: string;
  type: InventoryTransactionType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string | null;
  createdAt: string;
}

export const TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  RESTOCK: "Restock",
  SALE: "Sale",
  ADJUSTMENT: "Adjustment",
  RETURN: "Return",
  DAMAGE: "Damage",
};

export async function listTransactions(
  bookId: string,
  page: number = 1,
): Promise<Paginated<InventoryTransactionRow>> {
  const p = clampPage(page);

  const [rows, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where: { bookId },
      select: {
        id: true,
        bookId: true,
        book: { select: { title: true } },
        type: true,
        quantity: true,
        stockBefore: true,
        stockAfter: true,
        note: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (p - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.inventoryTransaction.count({ where: { bookId } }),
  ]);

  return paginate(
    rows.map((t) => ({
      id: t.id,
      bookId: t.bookId,
      bookTitle: t.book.title,
      type: t.type,
      quantity: t.quantity,
      stockBefore: t.stockBefore,
      stockAfter: t.stockAfter,
      note: t.note,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    p,
  );
}

/** Global transaction history (all books). */
export async function listAllTransactions(
  page: number = 1,
): Promise<Paginated<InventoryTransactionRow>> {
  const p = clampPage(page);

  const [rows, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      select: {
        id: true,
        bookId: true,
        book: { select: { title: true } },
        type: true,
        quantity: true,
        stockBefore: true,
        stockAfter: true,
        note: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (p - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.inventoryTransaction.count(),
  ]);

  return paginate(
    rows.map((t) => ({
      id: t.id,
      bookId: t.bookId,
      bookTitle: t.book.title,
      type: t.type,
      quantity: t.quantity,
      stockBefore: t.stockBefore,
      stockAfter: t.stockAfter,
      note: t.note,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    p,
  );
}
