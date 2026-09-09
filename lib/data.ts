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
      include: { book: { include: bookInclude } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
      include: { books: { include: { book: { include: bookInclude } }, take: 8 } },
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