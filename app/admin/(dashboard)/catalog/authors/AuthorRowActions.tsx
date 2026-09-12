"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { buttonVariants } from "@/components/ui/button";
import { deleteAuthorAction } from "./actions";

interface AuthorRowActionsProps {
  id: string;
  name: string;
  bookCount: number;
}

export function AuthorRowActions({ id, name, bookCount }: AuthorRowActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link
        href={`/admin/catalog/authors/${id}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
        aria-label={`Edit ${name}`}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Link>

      {bookCount === 0 ? (
        <form action={deleteAuthorAction}>
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
      ) : (
        <span className="text-caption text-text-muted" title="Unlink books before deleting">
          {bookCount} book{bookCount === 1 ? "" : "s"} linked
        </span>
      )}
    </div>
  );
}
