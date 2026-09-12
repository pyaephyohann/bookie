import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  FEATURED_SECTION_VALUES,
  PROMOTION_PAGE_SIZE,
  READING_PAGE_SIZE,
  type ManagedFeaturedSection,
} from "@/lib/admin/content";
import type { Paginated } from "@/lib/admin/catalog-queries";

function clampPage(value: number | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ── Reading content ─────────────────────────────────────────────────────────

export interface ReadingListFilters {
  q?: string;
  status?: string;
  content?: string;
  page?: number;
}

export interface ReadingListRow {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isReadableOnline: boolean;
  contentType: "PDF" | "EPUB" | "OTHER" | null;
  hasContent: boolean;
  updatedAt: string;
}

export async function listReadingBooks(filters: ReadingListFilters): Promise<Paginated<ReadingListRow>> {
  const page = clampPage(filters.page);
  const where: Prisma.BookWhereInput = {};

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
      { isbn: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.status === "DRAFT" || filters.status === "PUBLISHED" || filters.status === "ARCHIVED") {
    where.status = filters.status;
  }
  if (filters.content === "available") where.readingContent = { isNot: null };
  if (filters.content === "missing") where.readingContent = { is: null };
  if (filters.content === "enabled") where.isReadableOnline = true;
  if (filters.content === "disabled") where.isReadableOnline = false;

  const [rows, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * READING_PAGE_SIZE,
      take: READING_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isReadableOnline: true,
        updatedAt: true,
        readingContent: { select: { contentType: true, content: true, fileUrl: true } },
      },
    }),
    prisma.book.count({ where }),
  ]);

  return paginate(
    rows.map((book) => ({
      id: book.id,
      title: book.title,
      slug: book.slug,
      status: book.status,
      isReadableOnline: book.isReadableOnline,
      contentType: book.readingContent?.contentType ?? null,
      hasContent: Boolean(book.readingContent?.content || book.readingContent?.fileUrl),
      updatedAt: book.updatedAt.toISOString(),
    })),
    total,
    page,
    READING_PAGE_SIZE,
  );
}

export interface ReadingBookEditData {
  bookId: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isReadableOnline: boolean;
  contentId: string | null;
  contentType: "PDF" | "EPUB" | "OTHER" | null;
  fileUrl: string;
  content: string;
}

export async function getReadingBookForEdit(bookId: string): Promise<ReadingBookEditData | null> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      isReadableOnline: true,
      readingContent: { select: { id: true, contentType: true, fileUrl: true, content: true } },
    },
  });
  if (!book) return null;

  return {
    bookId: book.id,
    title: book.title,
    slug: book.slug,
    status: book.status,
    isReadableOnline: book.isReadableOnline,
    contentId: book.readingContent?.id ?? null,
    contentType: book.readingContent?.contentType ?? null,
    fileUrl: book.readingContent?.fileUrl ?? "",
    content: book.readingContent?.content ?? "",
  };
}

// ── Featured books ──────────────────────────────────────────────────────────

export interface FeaturedSectionData {
  section: ManagedFeaturedSection;
  items: {
    id: string;
    bookId: string;
    title: string;
    slug: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    coverImage: string | null;
    sortOrder: number;
  }[];
}

export async function getManagedFeaturedSections(): Promise<FeaturedSectionData[]> {
  const rows = await prisma.featuredBook.findMany({
    where: { section: { in: [...FEATURED_SECTION_VALUES] } },
    include: {
      book: { select: { id: true, title: true, slug: true, status: true, coverImage: true } },
    },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return FEATURED_SECTION_VALUES.map((section) => ({
    section,
    items: rows
      .filter((row) => row.section === section)
      .map((row) => ({
        id: row.id,
        bookId: row.book.id,
        title: row.book.title,
        slug: row.book.slug,
        status: row.book.status,
        coverImage: row.book.coverImage,
        sortOrder: row.sortOrder,
      })),
  }));
}

export async function getFeaturedBookOptions(): Promise<{ id: string; title: string; slug: string }[]> {
  return prisma.book.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
    take: 500,
  });
}

// ── Promotions ──────────────────────────────────────────────────────────────

export interface PromotionListFilters {
  q?: string;
  status?: string;
  sort?: string;
  page?: number;
}

export interface PromotionListRow {
  id: string;
  name: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  bookCount: number;
}

function promotionWhere(filters: PromotionListFilters, now: Date): Prisma.PromotionWhereInput {
  const where: Prisma.PromotionWhereInput = {};
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  switch (filters.status) {
    case "enabled":
      where.isActive = true;
      break;
    case "live":
      where.isActive = true;
      where.startAt = { lte: now };
      where.endAt = { gte: now };
      break;
    case "scheduled":
      where.isActive = true;
      where.startAt = { gt: now };
      break;
    case "expired":
      where.endAt = { lt: now };
      break;
    case "inactive":
      where.isActive = false;
      break;
  }
  return where;
}

function promotionOrderBy(sort: string | undefined): Prisma.PromotionOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "value-desc":
      return { value: "desc" };
    case "value-asc":
      return { value: "asc" };
    case "start-desc":
      return { startAt: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

export async function listPromotions(filters: PromotionListFilters): Promise<Paginated<PromotionListRow>> {
  const page = clampPage(filters.page);
  const where = promotionWhere(filters, new Date());

  const [rows, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      orderBy: promotionOrderBy(filters.sort),
      skip: (page - 1) * PROMOTION_PAGE_SIZE,
      take: PROMOTION_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        value: true,
        startAt: true,
        endAt: true,
        isActive: true,
        _count: { select: { books: true } },
      },
    }),
    prisma.promotion.count({ where }),
  ]);

  return paginate(
    rows.map((promotion) => ({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: Number(promotion.value),
      startAt: promotion.startAt.toISOString(),
      endAt: promotion.endAt.toISOString(),
      isActive: promotion.isActive,
      bookCount: promotion._count.books,
    })),
    total,
    page,
    PROMOTION_PAGE_SIZE,
  );
}

export interface PromotionEditData {
  id: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  bookIds: string[];
}

export async function getPromotionForEdit(id: string): Promise<PromotionEditData | null> {
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      value: true,
      startAt: true,
      endAt: true,
      isActive: true,
      books: { select: { bookId: true } },
    },
  });
  if (!promotion) return null;

  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description ?? "",
    type: promotion.type,
    value: String(Number(promotion.value)),
    startAt: promotion.startAt.toISOString().slice(0, 16),
    endAt: promotion.endAt.toISOString().slice(0, 16),
    isActive: promotion.isActive,
    bookIds: promotion.books.map((book) => book.bookId),
  };
}

export async function getPromotionBookOptions(): Promise<{ id: string; title: string; slug: string }[]> {
  return prisma.book.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
    take: 500,
  });
}
