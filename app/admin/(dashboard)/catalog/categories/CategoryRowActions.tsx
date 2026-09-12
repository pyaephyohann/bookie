"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { buttonVariants } from "@/components/ui/button";
import { deleteCategoryAction } from "./actions";

interface CategoryRowActionsProps {
  id: string;
  name: string;
  bookCount: number;
  childCount: number;
}

export function CategoryRowActions({
  id,
  name,
  bookCount,
  childCount,
}: CategoryRowActionsProps) {
  const blocked = bookCount > 0 || childCount > 0;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link
        href={`/admin/catalog/categories/${id}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
        aria-label={`Edit ${name}`}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Link>

      {blocked ? (
        <span
          className="text-caption text-text-muted"
          title="Remove linked books and sub-categories before deleting"
        >
          In use
        </span>
      ) : (
        <form action={deleteCategoryAction}>
          <input type="hidden" name="id" value={id} />
          <AdminConfirmSubmit
            question={`Delete "${name}"?`}
            confirmLabel="Delete"
            variant="ghost"
            ariaLabel={`Delete ${name}`}
          >
            Delete
          </AdminConfirmSubmit>
        </form>
      )}
    </div>
  );
}
