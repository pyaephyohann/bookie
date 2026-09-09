import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBookBySlug } from "@/lib/data";
import { BookDetailClient } from "./BookDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Book Not Found — Bookie" };
  return {
    title: `${book.title} — Bookie`,
    description: book.description ?? `${book.title} by ${book.authors[0]?.name ?? "Unknown"} on Bookie.`,
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  return <BookDetailClient book={book} />;
}