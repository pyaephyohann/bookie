import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuthorBySlug } from "@/lib/data";
import { AuthorDetailClient } from "./AuthorDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: "Author Not Found — Bookie" };
  return {
    title: `${author.name} — Bookie`,
    description:
      author.biography?.slice(0, 160) ??
      `${author.name} — ${author.bookCount} books on Bookie.`,
  };
}

export default async function AuthorDetailPage({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();
  return <AuthorDetailClient author={author} />;
}