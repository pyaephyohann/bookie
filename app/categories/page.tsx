import type { Metadata } from "next";
import { getAllCategories } from "@/lib/data";
import { CategoriesListClient } from "./CategoriesListClient";

export const metadata: Metadata = {
  title: "Categories — Bookie",
  description: "Browse all book categories on Bookie — Fiction, Fantasy, Mystery, and more.",
};

export default async function CategoriesPage() {
  const categories = await getAllCategories();
  return <CategoriesListClient categories={categories} />;
}