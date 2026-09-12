import { prisma } from "@/lib/prisma";
import {
  MOCK_AUTHORS,
  MOCK_BOOKS,
  MOCK_CATEGORIES,
  MOCK_HERO_SLIDES,
  type MockAuthor,
  type MockBook,
  type MockCategory,
  type MockHeroSlide,
} from "@/lib/mock-data";
import type { FeaturedSection, Prisma } from "@/generated/prisma/client";

/**
 * Bookie Home data layer (server-only).
 *
 * Strategy (documented in docs/ARCHITECTURE.md):
 * - Prefer real Prisma data: every discovery section has a genuine query path
 *   against the existing schema (FeaturedBook merchandising, publishedAt,
 *   active Promotions, Authors with book counts, Categories with counts).
 * - If the database has no PUBLISHED books (empty dev database, unreachable,
 *   or broken), fall back to the mock catalogue so the Home page is never
 *   unusable. The fallback is explicit and swappable.
 *
 * All data is serialised to plain JSON-safe shapes before leaving this module.
 */

/* ============================================================
   Shared (UI-facing) types — consumed by client components
   ============================================================ */

export interface BookSummary {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  rating: number | null;
  reviews: number | null;
  badge: "NEW" | "STAFF PICK" | null;
  coverImage: string | null;
  /** Placeholder cover art, used when coverImage is unavailable. */
  gradient: [string, string];
  publishedAt: string | null;
}

export interface CategorySummary {
  name: string;
  slug: string;
  count: number;
}

export interface AuthorSummary {
  slug: string;
  name: string;
  books: number;
  description: string;
  photoUrl: string | null;
  gradient: [string, string];
}

/** Typed static hero configuration — not CMS-driven in B2. */
export type HeroSlide = MockHeroSlide;

export interface HomePageData {
  source: "database" | "mock";
  heroSlides: HeroSlide[];
  heroFloating: BookSummary[];
  categories: CategorySummary[];
  trending: BookSummary[];
  bestSellers: BookSummary[];
  newReleases: BookSummary[];
  promotions: BookSummary[];
  authors: AuthorSummary[];
  recommended: BookSummary[];
  /** Full visible catalogue — used for recently-viewed lookups. */
  books: BookSummary[];
  readingBook: BookSummary;
}

/* ============================================================
   Adapters
   ============================================================ */

function toBookSummary(book: MockBook): BookSummary {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author,
    category: book.category,
    price: book.price,
    compareAtPrice: book.compareAtPrice ?? null,
    rating: book.rating,
    reviews: book.reviews,
    badge: book.badge ?? null,
    coverImage: null,
    gradient: book.cover,
    publishedAt: null,
  };
}

function toCategorySummary(category: MockCategory): CategorySummary {
  return {
    name: category.name,
    slug: slugify(category.name),
    count: category.count,
  };
}

function toAuthorSummary(author: MockAuthor): AuthorSummary {
  return {
    slug: author.slug,
    name: author.name,
    books: author.books,
    description: author.description,
    photoUrl: null,
    gradient: author.cover,
  };
}

const toHeroSlide = (slide: MockHeroSlide): HeroSlide => slide;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ---------- Database adapters ---------- */

const bookInclude = {
  categories: { include: { category: true }, take: 1 },
  authors: { include: { author: true }, take: 1 },
} satisfies Prisma.BookInclude;

type DbBook = Prisma.BookGetPayload<{ include: typeof bookInclude }>;

/** Deterministic placeholder palette for books/authors without images. */
const COVER_PALETTES: [string, string][] = [
  ["#1e293b", "#0f172a"],
  ["#4338ca", "#1e1b4b"],
  ["#7f1d1d", "#450a0a"],
  ["#0f766e", "#134e4a"],
  ["#a16207", "#713f12"],
  ["#be185d", "#831843"],
  ["#0369a1", "#0c4a6e"],
  ["#c2410c", "#7c2d12"],
  ["#059669", "#065f46"],
  ["#b45309", "#78350f"],
  ["#52525b", "#27272a"],
  ["#334155", "#1e293b"],
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const gradientFor = (seed: string): [string, string] =>
  COVER_PALETTES[hashString(seed) % COVER_PALETTES.length] ?? COVER_PALETTES[0];

function dbBookToSummary(book: DbBook): BookSummary {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.authors[0]?.author.name ?? "Unknown",
    category: book.categories[0]?.category.name ?? "Books",
    price: Number(book.price),
    compareAtPrice: book.compareAtPrice === null ? null : Number(book.compareAtPrice),
    rating: null,
    reviews: null,
    badge: null,
    coverImage: book.coverImage,
    gradient: gradientFor(book.id),
    publishedAt: book.publishedAt ? book.publishedAt.toISOString() : null,
  };
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Apply a Promotion to a book and return a "discounted" summary:
 * price becomes the promo price, compareAtPrice becomes the original.
 * Mirrors what the Promotions section expects (original vs promo price).
 */
function applyPromotion(
  book: BookSummary,
  promotion: { type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number },
): BookSummary {
  const original = book.compareAtPrice ?? book.price;
  const discounted =
    promotion.type === "PERCENTAGE"
      ? original * (1 - promotion.value / 100)
      : Math.max(original - promotion.value, 0);
  return { ...book, price: round2(discounted), compareAtPrice: original };
}

/* ============================================================
   Database path
   ============================================================ */

async function fetchFromDatabase(): Promise<HomePageData | null> {
  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    include: bookInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  if (books.length === 0) return null;

  const all = books.map(dbBookToSummary);

  const [categories, authors, featured, activePromotions] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: "asc" },
      take: 13,
    }),
    prisma.author.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.featuredBook.findMany({
      where: { book: { status: "PUBLISHED" } },
      include: { book: { include: bookInclude } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
      include: {
        books: {
          where: { book: { status: "PUBLISHED" } },
          include: { book: { include: bookInclude } },
          take: 8,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const featuredBySection = (section: FeaturedSection): BookSummary[] =>
    featured
      .filter((item) => item.section === section)
      .map((item) => dbBookToSummary(item.book));

  // Trending — merchandised via FeaturedBook; fallback to newest books.
  const merchandisedTrending = featuredBySection("TRENDING");
  const trending = merchandisedTrending.length ? merchandisedTrending : all.slice(0, 8);

  // Best Sellers — merchandised via FeaturedBook. No sales-derived ranking yet
  // (requires order data); the featured fallback is documented in ARCHITECTURE.md.
  const merchandisedBestSellers = featuredBySection("BEST_SELLER");
  const bestSellers = merchandisedBestSellers.length ? merchandisedBestSellers : all.slice(0, 5);

  // New Releases — newest publishedAt first (nulls last); fallback to newest rows.
  const datedBooks = await prisma.book.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    include: bookInclude,
    orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
    take: 8,
  });
  const newReleases = datedBooks.length ? datedBooks.map(dbBookToSummary) : all.slice(0, 8);

  // Promotions — active promotions applied to their linked books.
  const promotionBooks: BookSummary[] = [];
  const seen = new Set<string>();
  for (const promotion of activePromotions) {
    for (const link of promotion.books) {
      const book = dbBookToSummary(link.book);
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      promotionBooks.push(
        applyPromotion(book, { type: promotion.type, value: Number(promotion.value) }),
      );
    }
  }

  // Recommended — merchandised via FeaturedBook; else a deterministic pick of
  // books not already shown in the other shelves.
  const merchandisedRecommended = featuredBySection("RECOMMENDED");
  let recommended = merchandisedRecommended;
  if (recommended.length === 0) {
    const shown = new Set(
      [...trending, ...bestSellers, ...newReleases, ...promotionBooks].map((b) => b.id),
    );
    recommended = all.filter((b) => !shown.has(b.id)).slice(0, 6);
    if (recommended.length < 6) {
      for (const book of all) {
        if (recommended.length >= 6) break;
        if (!recommended.some((r) => r.id === book.id)) recommended.push(book);
      }
    }
  }

  return {
    source: "database",
    heroSlides: MOCK_HERO_SLIDES.map(toHeroSlide),
    heroFloating: all.slice(0, 3),
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      count: c._count.books,
    })),
    trending,
    bestSellers,
    newReleases,
    promotions: promotionBooks.slice(0, 8),
    authors: authors.map((a) => ({
      slug: a.slug,
      name: a.name,
      books: a._count.books,
      description: a.biography ?? "",
      photoUrl: a.photoUrl,
      gradient: gradientFor(a.id),
    })),
    recommended,
    books: all,
    readingBook: all[0],
  };
}

/* ============================================================
   Mock fallback path
   ============================================================ */

function buildMockHomeData(): HomePageData {
  const books = MOCK_BOOKS.map(toBookSummary);
  const trending = books.slice(0, 8);
  const bestSellers = MOCK_BOOKS.filter((b) => b.bestSellerRank)
    .sort((a, b) => (a.bestSellerRank ?? 0) - (b.bestSellerRank ?? 0))
    .map(toBookSummary);
  const newReleases = MOCK_BOOKS.filter((b) => b.isNew).map(toBookSummary);
  const promotions = books.filter((b) => b.compareAtPrice !== null);
  const recommendedSlugs = ["midnight-in-yangon", "letters-to-a-young-chef", "winter-tales", "ocean-of-stars", "petals-and-thorns", "the-paper-telescope"];
  const recommended = recommendedSlugs
    .map((slug) => books.find((b) => b.slug === slug))
    .filter((b): b is BookSummary => Boolean(b));

  return {
    source: "mock",
    heroSlides: MOCK_HERO_SLIDES.map(toHeroSlide),
    heroFloating: [books[1], books[6], books[8]].filter((b): b is BookSummary => Boolean(b)),
    categories: MOCK_CATEGORIES.map(toCategorySummary),
    trending,
    bestSellers,
    newReleases,
    promotions,
    authors: MOCK_AUTHORS.map(toAuthorSummary),
    recommended,
    books,
    readingBook: books[0],
  };
}

/* ============================================================
   Public entry point
   ============================================================ */

export async function getHomePageData(): Promise<HomePageData> {
  try {
    const fromDatabase = await fetchFromDatabase();
    if (fromDatabase) return fromDatabase;
  } catch (error) {
    console.warn(
      "[bookie] Database unavailable — falling back to the mock catalogue:",
      error instanceof Error ? error.message : error,
    );
  }
  return buildMockHomeData();
}

/* ============================================================
   B3 — Book detail, category, author, search
   ============================================================

   All functions follow the same pattern as getHomePageData:
   try the database first, fall back to mock data if empty/unreachable.

   Mock fallback is for local development when the database has no rows.
   No fake database records are created.
   ============================================================ */

export interface BookAuthor {
  name: string;
  slug: string;
  photoUrl: string | null;
}

export interface BookCategory {
  name: string;
  slug: string;
}

export interface BookDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isbn: string | null;
  publisher: string | null;
  publishedAt: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  coverImage: string | null;
  isReadableOnline: boolean;
  gradient: [string, string];
  authors: BookAuthor[];
  categories: BookCategory[];
}

export interface CategoryDetail {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  bookCount: number;
  books: BookSummary[];
}

export interface AuthorDetail {
  name: string;
  slug: string;
  biography: string | null;
  photoUrl: string | null;
  bookCount: number;
  books: BookSummary[];
  gradient: [string, string];
}

/* ---------- B3 Prisma includes ---------- */

const bookDetailInclude = {
  categories: { include: { category: true } },
  authors: { include: { author: true } },
} satisfies Prisma.BookInclude;

type DbBookDetail = Prisma.BookGetPayload<{ include: typeof bookDetailInclude }>;

/* ---------- B3 database adapters ---------- */

function dbBookDetailToDetail(book: DbBookDetail): BookDetail {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    description: book.description,
    isbn: book.isbn,
    publisher: book.publisher,
    publishedAt: book.publishedAt ? book.publishedAt.toISOString() : null,
    price: Number(book.price),
    compareAtPrice: book.compareAtPrice === null ? null : Number(book.compareAtPrice),
    stockQuantity: book.stockQuantity,
    coverImage: book.coverImage,
    isReadableOnline: book.isReadableOnline,
    gradient: gradientFor(book.id),
    authors: book.authors.map((ba) => ({
      name: ba.author.name,
      slug: ba.author.slug,
      photoUrl: ba.author.photoUrl,
    })),
    categories: book.categories.map((cb) => ({
      name: cb.category.name,
      slug: cb.category.slug,
    })),
  };
}

function dbCategoryToDetail(cat: {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  books: { book: DbBook }[];
  _count: { books: number };
}): CategoryDetail {
  return {
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    bookCount: cat._count.books,
    books: cat.books.map((cb) => dbBookToSummary(cb.book)),
  };
}

function dbAuthorToDetail(author: {
  id: string;
  name: string;
  slug: string;
  biography: string | null;
  photoUrl: string | null;
  books: { book: DbBook }[];
  _count: { books: number };
}): AuthorDetail {
  return {
    name: author.name,
    slug: author.slug,
    biography: author.biography,
    photoUrl: author.photoUrl,
    bookCount: author._count.books,
    books: author.books.map((ba) => dbBookToSummary(ba.book)),
    gradient: gradientFor(author.id),
  };
}

/* ---------- B3 server-side functions ---------- */

export async function getBookBySlug(slug: string): Promise<BookDetail | null> {
  try {
    const book = await prisma.book.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: bookDetailInclude,
    });
    if (book) return dbBookDetailToDetail(book as DbBookDetail);
  } catch (error) {
    console.warn("[bookie] getBookBySlug failed:", error instanceof Error ? error.message : error);
  }
  // Mock fallback
  const mock = MOCK_BOOKS.find((b) => b.slug === slug);
  if (!mock) return null;
  return {
    id: mock.id,
    slug: mock.slug,
    title: mock.title,
    description: `A compelling book by ${mock.author} in the ${mock.category} genre.`,
    isbn: null,
    publisher: null,
    publishedAt: null,
    price: mock.price,
    compareAtPrice: mock.compareAtPrice ?? null,
    stockQuantity: 10,
    coverImage: null,
    isReadableOnline: false,
    gradient: mock.cover,
    authors: [{ name: mock.author, slug: slugify(mock.author), photoUrl: null }],
    categories: [{ name: mock.category, slug: slugify(mock.category) }],
  };
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDetail | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        books: {
          include: { book: { include: bookInclude } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: { select: { books: true } },
      },
    });
    if (category) {
      return dbCategoryToDetail(category as Parameters<typeof dbCategoryToDetail>[0]);
    }
  } catch (error) {
    console.warn("[bookie] getCategoryBySlug failed:", error instanceof Error ? error.message : error);
  }
  // Mock fallback
  const mockCat = MOCK_CATEGORIES.find((c) => slugify(c.name) === slug);
  if (!mockCat) return null;
  const mockBooks = MOCK_BOOKS.filter((b) => b.category === mockCat.name).map(toBookSummary);
  return {
    name: mockCat.name,
    slug,
    description: null,
    imageUrl: null,
    bookCount: mockCat.count,
    books: mockBooks,
  };
}

export async function getAuthorBySlug(slug: string): Promise<AuthorDetail | null> {
  try {
    const author = await prisma.author.findUnique({
      where: { slug },
      include: {
        books: {
          include: { book: { include: bookInclude } },
          orderBy: { sortOrder: "asc" },
          take: 50,
        },
        _count: { select: { books: true } },
      },
    });
    if (author) {
      return dbAuthorToDetail(author as Parameters<typeof dbAuthorToDetail>[0]);
    }
  } catch (error) {
    console.warn("[bookie] getAuthorBySlug failed:", error instanceof Error ? error.message : error);
  }
  // Mock fallback
  const mockAuthor = MOCK_AUTHORS.find((a) => a.slug === slug);
  if (!mockAuthor) return null;
  const mockBooks = MOCK_BOOKS.filter((b) => b.author === mockAuthor.name).map(toBookSummary);
  return {
    name: mockAuthor.name,
    slug,
    biography: mockAuthor.description,
    photoUrl: null,
    bookCount: mockAuthor.books,
    books: mockBooks,
    gradient: mockAuthor.cover,
  };
}

export async function getAllCategories(): Promise<CategorySummary[]> {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: "asc" },
    });
    if (categories.length > 0) {
      return categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.books }));
    }
  } catch (error) {
    console.warn("[bookie] getAllCategories failed:", error instanceof Error ? error.message : error);
  }
  return MOCK_CATEGORIES.map(toCategorySummary);
}

export async function getAllAuthors(): Promise<AuthorSummary[]> {
  try {
    const authors = await prisma.author.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: "asc" },
    });
    if (authors.length > 0) {
      return authors.map((a) => ({
        slug: a.slug,
        name: a.name,
        books: a._count.books,
        description: a.biography ?? "",
        photoUrl: a.photoUrl,
        gradient: gradientFor(a.id),
      }));
    }
  } catch (error) {
    console.warn("[bookie] getAllAuthors failed:", error instanceof Error ? error.message : error);
  }
  return MOCK_AUTHORS.map(toAuthorSummary);
}

export interface SearchResults {
  books: BookSummary[];
  query: string;
}

export async function searchBooks(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim();
  if (!query) return { books: [], query: "" };
  try {
    const books = await prisma.book.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { isbn: query },
          { categories: { some: { category: { name: { contains: query, mode: "insensitive" } } } } },
          { authors: { some: { author: { name: { contains: query, mode: "insensitive" } } } } },
        ],
      },
      include: bookInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { books: books.map(dbBookToSummary), query };
  } catch (error) {
    console.warn("[bookie] searchBooks failed:", error instanceof Error ? error.message : error);
  }
  // Mock fallback
  const q = query.toLowerCase();
  const filtered = MOCK_BOOKS.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q),
  );
  return { books: filtered.map(toBookSummary), query };
}