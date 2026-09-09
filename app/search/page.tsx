import type { Metadata } from "next";
import { searchBooks } from "@/lib/data";
import { SearchResultsClient } from "./SearchResultsClient";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  if (!q) return { title: "Search — Bookie" };
  return {
    title: `Search: ${q} — Bookie`,
    description: `Search results for "${q}" on Bookie.`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = await searchBooks(query);
  return <SearchResultsClient results={results} />;
}