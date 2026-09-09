import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/data";
import { CategoryDetailClient } from "./CategoryDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found — Bookie" };
  return {
    title: `${category.name} — Bookie`,
    description: `Browse ${category.bookCount} books in the ${category.name} category on Bookie.`,
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return <CategoryDetailClient category={category} />;
}