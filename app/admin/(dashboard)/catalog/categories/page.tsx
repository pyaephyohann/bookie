import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/admin/catalog-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminFilterForm } from "@/components/admin/AdminFilterForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { CategoryRowActions } from "./CategoryRowActions";

export const metadata: Metadata = {
  title: "Categories — Bookie Admin",
};

const BASE_PATH = "/admin/catalog/categories";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const categories = await listCategories({ q, page });

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Organise the catalog into browsable categories and sub-categories."
        actions={
          <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            New category
          </Link>
        }
      />

      <AdminFeedback code={notice} />

      <AdminFilterForm
        action={BASE_PATH}
        search={{ name: "q", value: q, label: "Search", placeholder: "Name or slug…" }}
      />

      {categories.items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={q ? "No categories match that search" : "No categories yet"}
          description={
            q
              ? "Try a different name, or clear the search."
              : "Categories power storefront browsing and the navbar mega-menu."
          }
          action={
            q ? (
              <Link href={BASE_PATH} className={buttonVariants({ variant: "outline" })}>
                Clear search
              </Link>
            ) : (
              <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
                <Plus className="size-4" aria-hidden />
                New category
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-xs md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Categories in the catalog</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Parent
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Books
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Sub-categories
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-semibold text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.items.map((category) => (
                  <tr key={category.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`${BASE_PATH}/${category.id}`}
                        className="text-body-sm font-medium text-text hover:underline"
                      >
                        {category.name}
                      </Link>
                      <span className="block text-caption text-text-muted">/{category.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {category.parentName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {category.bookCount}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {category.childCount}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryRowActions
                        id={category.id}
                        name={category.name}
                        bookCount={category.bookCount}
                        childCount={category.childCount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {categories.items.map((category) => (
              <li
                key={category.id}
                className="rounded-card border border-border bg-surface p-4 shadow-xs"
              >
                <Link
                  href={`${BASE_PATH}/${category.id}`}
                  className="block text-body-sm font-semibold text-text hover:underline"
                >
                  {category.name}
                </Link>
                <p className="text-caption text-text-muted">
                  {category.bookCount} book{category.bookCount === 1 ? "" : "s"} ·{" "}
                  {category.childCount} sub-categor
                  {category.childCount === 1 ? "y" : "ies"}
                  {category.parentName ? ` · under ${category.parentName}` : ""}
                </p>
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <CategoryRowActions
                    id={category.id}
                    name={category.name}
                    bookCount={category.bookCount}
                    childCount={category.childCount}
                  />
                </div>
              </li>
            ))}
          </ul>

          <AdminPagination
            basePath={BASE_PATH}
            page={categories.page}
            pageCount={categories.pageCount}
            total={categories.total}
            itemLabel="categories"
            params={{ q }}
          />
        </>
      )}
    </div>
  );
}
