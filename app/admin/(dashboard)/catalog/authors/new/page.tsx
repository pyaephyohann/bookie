import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AuthorForm } from "../AuthorForm";
import { createAuthorAction } from "../actions";

export const metadata: Metadata = {
  title: "New author — Bookie Admin",
};

export default async function NewAuthorPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin/catalog/authors"
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to authors
      </Link>

      <AdminPageHeader
        title="New author"
        description="Add an author, then link them to books from the book editor."
      />

      <AuthorForm
        mode="create"
        action={createAuthorAction}
        initial={{ name: "", slug: "", biography: "", photoUrl: "" }}
      />
    </div>
  );
}
