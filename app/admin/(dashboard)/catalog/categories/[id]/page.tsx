import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCategoryForEdit, getCategoryOptions } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { CategoryForm } from "../CategoryForm";
import { updateCategoryAction } from "../actions";

export const metadata: Metadata = {
  title: "Edit category — Bookie Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditCategoryPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;

  const [category, parentOptions] = await Promise.all([
    getCategoryForEdit(id),
    getCategoryOptions(id),
  ]);
  if (!category) notFound();

  return (
    <div>
      <Link
        href="/admin/catalog/categories"
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to categories
      </Link>

      <AdminPageHeader
        title={category.name}
        description={`${category.bookCount} book${category.bookCount === 1 ? "" : "s"} · ${category.childCount} sub-categor${category.childCount === 1 ? "y" : "ies"} · slug /${category.slug}`}
        actions={
          <Link
            href={`/categories/${category.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
          >
            View in storefront
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        }
      />

      <AdminFeedback code={notice} />

      {(category.bookCount > 0 || category.childCount > 0) && (
        <p className="mb-5 rounded-control border border-border bg-surface-muted px-3 py-2.5 text-caption text-text-muted">
          This category cannot be deleted while it still has
          {category.bookCount > 0 ? ` ${category.bookCount} book${category.bookCount === 1 ? "" : "s"}` : ""}
          {category.bookCount > 0 && category.childCount > 0 ? " and" : ""}
          {category.childCount > 0
            ? ` ${category.childCount} sub-categor${category.childCount === 1 ? "y" : "ies"}`
            : ""}
          .
        </p>
      )}

      <CategoryForm
        mode="edit"
        action={updateCategoryAction}
        categoryId={category.id}
        parentOptions={parentOptions}
        initial={{
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          parentId: category.parentId,
        }}
      />
    </div>
  );
}
