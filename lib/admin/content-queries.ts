import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  BANNER_PAGE_SIZE,
  FEATURED_SECTION_VALUES,
  HERO_SLIDE_PAGE_SIZE,
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

// ── Hero Slides (A7.1) ─────────────────────────────────────────────────────

export interface HeroSlideListRow {
  id: string;
  eyebrow: string | null;
  title: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  startAt: string | null;
  endAt: string | null;
  bookTitle: string | null;
}

export interface HeroSlideListFilters {
  q?: string;
  status?: string;
  page?: number;
}

function heroSlideWhere(filters: HeroSlideListFilters, now: Date): Prisma.HeroSlideWhereInput {
  const where: Prisma.HeroSlideWhereInput = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { eyebrow: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  switch (filters.status) {
    case "live":
      where.isActive = true;
      where.OR = [
        { startAt: null },
        { startAt: { lte: now } },
      ];
      where.AND = [
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ];
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

export async function listHeroSlides(filters: HeroSlideListFilters): Promise<Paginated<HeroSlideListRow>> {
  const page = clampPage(filters.page);
  const where = heroSlideWhere(filters, new Date());

  const [rows, total] = await Promise.all([
    prisma.heroSlide.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * HERO_SLIDE_PAGE_SIZE,
      take: HERO_SLIDE_PAGE_SIZE,
      select: {
        id: true,
        eyebrow: true,
        title: true,
        imageUrl: true,
        isActive: true,
        sortOrder: true,
        startAt: true,
        endAt: true,
        book: { select: { title: true } },
      },
    }),
    prisma.heroSlide.count({ where }),
  ]);

  return paginate(
    rows.map((row) => ({
      id: row.id,
      eyebrow: row.eyebrow,
      title: row.title,
      imageUrl: row.imageUrl,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      startAt: row.startAt?.toISOString() ?? null,
      endAt: row.endAt?.toISOString() ?? null,
      bookTitle: row.book?.title ?? null,
    })),
    total,
    page,
    HERO_SLIDE_PAGE_SIZE,
  );
}

export interface HeroSlideEditData {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  bookId: string | null;
  tint: string;
  isActive: boolean;
  sortOrder: number;
  startAt: string;
  endAt: string;
}

export async function getHeroSlideForEdit(id: string): Promise<HeroSlideEditData | null> {
  const slide = await prisma.heroSlide.findUnique({
    where: { id },
    select: {
      id: true,
      eyebrow: true,
      title: true,
      subtitle: true,
      description: true,
      imageUrl: true,
      linkUrl: true,
      bookId: true,
      tint: true,
      isActive: true,
      sortOrder: true,
      startAt: true,
      endAt: true,
    },
  });
  if (!slide) return null;

  return {
    id: slide.id,
    eyebrow: slide.eyebrow ?? "",
    title: slide.title,
    subtitle: slide.subtitle ?? "",
    description: slide.description ?? "",
    imageUrl: slide.imageUrl,
    linkUrl: slide.linkUrl ?? "",
    bookId: slide.bookId,
    tint: slide.tint,
    isActive: slide.isActive,
    sortOrder: slide.sortOrder,
    startAt: slide.startAt ? slide.startAt.toISOString().slice(0, 16) : "",
    endAt: slide.endAt ? slide.endAt.toISOString().slice(0, 16) : "",
  };
}

export async function getHeroSlideBookOptions(): Promise<{ id: string; title: string; slug: string }[]> {
  return prisma.book.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
    take: 500,
  });
}

// ── Banners (A10.1) ──────────────────────────────────────────────────────

export interface BannerListRow {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  status: string;
  sortOrder: number;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

export interface BannerListFilters {
  q?: string;
  status?: string;
  page?: number;
}

function bannerWhere(filters: BannerListFilters): Prisma.BannerWhereInput {
  const where: Prisma.BannerWhereInput = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.status === "draft") where.status = "DRAFT";
  else if (filters.status === "published") where.status = "PUBLISHED";
  else if (filters.status === "archived") where.status = "ARCHIVED";
  return where;
}

export async function listBanners(filters: BannerListFilters): Promise<Paginated<BannerListRow>> {
  const page = clampPage(filters.page);
  const where = bannerWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * BANNER_PAGE_SIZE,
      take: BANNER_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        linkUrl: true,
        status: true,
        sortOrder: true,
        startAt: true,
        endAt: true,
        createdAt: true,
      },
    }),
    prisma.banner.count({ where }),
  ]);

  return paginate(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      linkUrl: row.linkUrl,
      status: row.status,
      sortOrder: row.sortOrder,
      startAt: row.startAt?.toISOString() ?? null,
      endAt: row.endAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    BANNER_PAGE_SIZE,
  );
}

export interface BannerEditData {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  status: string;
  sortOrder: number;
  startAt: string;
  endAt: string;
}

export async function getBannerForEdit(id: string): Promise<BannerEditData | null> {
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      linkUrl: true,
      status: true,
      sortOrder: true,
      startAt: true,
      endAt: true,
    },
  });
  if (!banner) return null;

  return {
    id: banner.id,
    title: banner.title,
    description: banner.description,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    status: banner.status,
    sortOrder: banner.sortOrder,
    startAt: banner.startAt ? banner.startAt.toISOString().slice(0, 16) : "",
    endAt: banner.endAt ? banner.endAt.toISOString().slice(0, 16) : "",
  };
}
