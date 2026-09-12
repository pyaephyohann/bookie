import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCategoryOptions } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "../CategoryForm";
import { createCategoryAction } from "../actions";

export const metadata: Metadata = {
  title: "New category — Bookie Admin",
};

export default async function NewCategoryPage() {
  await requireAdmin();
  const parentOptions = await getCategoryOptions();

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
        title="New category"
        description="Categories group books for browsing, filters and the navbar menu."
      />

      <CategoryForm
        mode="create"
        action={createCategoryAction}
        parentOptions={parentOptions}
        initial={{ name: "", slug: "", description: "", imageUrl: "", parentId: "" }}
      />
    </div>
  );
}
