/**
 * Bookie mock catalogue data.
 * Centralised so it can later be swapped for API/Prisma queries
 * without touching UI components.
 */

export interface MockBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  badge?: "NEW" | "STAFF PICK";
  bestSellerRank?: number;
  isNew?: boolean;
  /** Two cover gradient stops used by BookCover (placeholder art). */
  cover: [string, string];
}

export const MOCK_BOOKS: MockBook[] = [
  {
    id: "b1",
    slug: "the-silent-library",
    title: "The Silent Library",
    author: "Amara Okafor",
    price: 18.0,
    rating: 4.8,
    reviews: 214,
    category: "Fiction",
    badge: "STAFF PICK",
    bestSellerRank: 4,
    cover: ["#1e293b", "#0f172a"],
  },
  {
    id: "b2",
    slug: "ocean-of-stars",
    title: "Ocean of Stars",
    author: "Ravi Chandran",
    price: 22.5,
    compareAtPrice: 28.0,
    rating: 4.9,
    reviews: 342,
    category: "Fantasy",
    isNew: true,
    cover: ["#4338ca", "#1e1b4b"],
  },
  {
    id: "b3",
    slug: "midnight-in-yangon",
    title: "Midnight in Yangon",
    author: "Thiri Aung",
    price: 16.0,
    rating: 4.7,
    reviews: 128,
    category: "Mystery",
    cover: ["#7f1d1d", "#450a0a"],
  },
  {
    id: "b4",
    slug: "the-cartographers-daughter",
    title: "The Cartographer's Daughter",
    author: "Elena Vasquez",
    price: 19.5,
    rating: 4.6,
    reviews: 187,
    category: "Fiction",
    bestSellerRank: 2,
    cover: ["#0f766e", "#134e4a"],
  },
  {
    id: "b5",
    slug: "atomic-focus",
    title: "Atomic Focus",
    author: "Marcus Chen",
    price: 24.0,
    rating: 4.5,
    reviews: 508,
    category: "Self Help",
    bestSellerRank: 1,
    cover: ["#a16207", "#713f12"],
  },
  {
    id: "b6",
    slug: "petals-and-thorns",
    title: "Petals & Thorns",
    author: "Sofia Laurent",
    price: 14.5,
    compareAtPrice: 18.0,
    rating: 4.4,
    reviews: 96,
    category: "Romance",
    isNew: true,
    cover: ["#be185d", "#831843"],
  },
  {
    id: "b7",
    slug: "the-quantum-garden",
    title: "The Quantum Garden",
    author: "Yuki Tanaka",
    price: 21.0,
    rating: 4.8,
    reviews: 263,
    category: "Science Fiction",
    bestSellerRank: 5,
    cover: ["#0369a1", "#0c4a6e"],
  },
  {
    id: "b8",
    slug: "letters-to-a-young-chef",
    title: "Letters to a Young Chef",
    author: "Daniel Kim",
    price: 17.0,
    rating: 4.6,
    reviews: 74,
    category: "Biography",
    cover: ["#c2410c", "#7c2d12"],
  },
  {
    id: "b9",
    slug: "the-paper-telescope",
    title: "The Paper Telescope",
    author: "Ingrid Halvorsen",
    price: 12.0,
    rating: 4.9,
    reviews: 155,
    category: "Children's Books",
    badge: "NEW",
    isNew: true,
    cover: ["#059669", "#065f46"],
  },
  {
    id: "b10",
    slug: "empire-of-spice",
    title: "Empire of Spice",
    author: "Arjun Mehta",
    price: 26.0,
    compareAtPrice: 32.0,
    rating: 4.7,
    reviews: 199,
    category: "History",
    bestSellerRank: 3,
    cover: ["#b45309", "#78350f"],
  },
  {
    id: "b11",
    slug: "the-last-bookshop",
    title: "The Last Bookshop",
    author: "Nora Whitley",
    price: 15.5,
    rating: 4.5,
    reviews: 61,
    category: "Fiction",
    isNew: true,
    cover: ["#52525b", "#27272a"],
  },
  {
    id: "b12",
    slug: "winter-tales",
    title: "Winter Tales",
    author: "Various Authors",
    price: 9.99,
    compareAtPrice: 16.0,
    rating: 4.3,
    reviews: 88,
    category: "Fiction",
    cover: ["#334155", "#1e293b"],
  },
];

export interface MockCategory {
  name: string;
  count: number;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  { name: "Fiction", count: 128 },
  { name: "Romance", count: 86 },
  { name: "Mystery", count: 54 },
  { name: "Fantasy", count: 72 },
  { name: "Science Fiction", count: 47 },
  { name: "Biography", count: 33 },
  { name: "Self Help", count: 41 },
  { name: "Business", count: 29 },
  { name: "History", count: 38 },
  { name: "Philosophy", count: 24 },
  { name: "Children's Books", count: 57 },
  { name: "Comics", count: 31 },
  { name: "Education", count: 44 },
];

export interface MockAuthor {
  slug: string;
  name: string;
  books: number;
  description: string;
  cover: [string, string];
}

export const MOCK_AUTHORS: MockAuthor[] = [
  {
    slug: "amara-okafor",
    name: "Amara Okafor",
    books: 12,
    description: "Quiet, devastating literary fiction about family and memory.",
    cover: ["#f59e0b", "#b45309"],
  },
  {
    slug: "ravi-chandran",
    name: "Ravi Chandran",
    books: 8,
    description: "Epic fantasy builder of oceans, stars and impossible maps.",
    cover: ["#6366f1", "#3730a3"],
  },
  {
    slug: "thiri-aung",
    name: "Thiri Aung",
    books: 5,
    description: "Atmospheric noir set in the monsoon streets of Yangon.",
    cover: ["#ef4444", "#991b1b"],
  },
  {
    slug: "yuki-tanaka",
    name: "Yuki Tanaka",
    books: 9,
    description: "Speculative fiction where science dreams in gardens.",
    cover: ["#0ea5e9", "#0369a1"],
  },
  {
    slug: "sofia-laurent",
    name: "Sofia Laurent",
    books: 15,
    description: "Romance with thorns — love stories that earn their ending.",
    cover: ["#ec4899", "#9d174d"],
  },
  {
    slug: "marcus-chen",
    name: "Marcus Chen",
    books: 6,
    description: "Clear-eyed guides to attention, work and deep living.",
    cover: ["#84cc16", "#3f6212"],
  },
];

export interface MockHeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  author: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  bookSlug: string;
  cover: [string, string];
  /** Soft panel tint behind the slide (works in both themes). */
  tint: string;
}

export const MOCK_HERO_SLIDES: MockHeroSlide[] = [
  {
    id: "s1",
    eyebrow: "Featured",
    title: "The Silent Library",
    author: "Amara Okafor",
    description: "A librarian who can hear the stories whispers a secret that could rewrite her family's past.",
    price: 18.0,
    bookSlug: "the-silent-library",
    cover: ["#1e293b", "#0f172a"],
    tint: "#fef9c3",
  },
  {
    id: "s2",
    eyebrow: "New Release",
    title: "Ocean of Stars",
    author: "Ravi Chandran",
    description: "The eagerly awaited second chapter of the Tidewright saga — navigation, magic and mutiny.",
    price: 22.5,
    compareAtPrice: 28.0,
    bookSlug: "ocean-of-stars",
    cover: ["#4338ca", "#1e1b4b"],
    tint: "#dbeafe",
  },
  {
    id: "s3",
    eyebrow: "Best Seller",
    title: "Atomic Focus",
    author: "Marcus Chen",
    description: "Small habits for impossible attention — the book 50,000 readers keep on their desk.",
    price: 24.0,
    bookSlug: "atomic-focus",
    cover: ["#a16207", "#713f12"],
    tint: "#fffbcc",
  },
  {
    id: "s4",
    eyebrow: "Special Offer",
    title: "Winter Tales",
    author: "Various Authors",
    description: "Twelve stories for long nights — this season's collection at 38% off, while stocks last.",
    price: 9.99,
    compareAtPrice: 16.0,
    bookSlug: "winter-tales",
    cover: ["#334155", "#1e293b"],
    tint: "#e0e7ff",
  },
];

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function discountPercent(price: number, compareAtPrice: number): number {
  return Math.round((1 - price / compareAtPrice) * 100);
}

export const BOOKIE_PASS_EXAMPLE = "ORD-2026-001928";
