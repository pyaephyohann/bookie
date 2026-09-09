import type { Metadata } from "next";
import { getAllAuthors } from "@/lib/data";
import { AuthorsListClient } from "./AuthorsListClient";

export const metadata: Metadata = {
  title: "Authors — Bookie",
  description: "Meet the authors behind your next favourite book on Bookie.",
};

export default async function AuthorsPage() {
  const authors = await getAllAuthors();
  return <AuthorsListClient authors={authors} />;
}