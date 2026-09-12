"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { buttonVariants } from "@/components/ui/button";
import { archiveBookAction, deleteBookAction, restoreBookAction } from "./actions";

interface BookRowActionsProps {
  id: string;
  title: string;
  status: string;
}

function shortTitle(title: string): string {
  return title.length > 38 ? `${title.slice(0, 37)}…` : title;
}

export function BookRowActions({ id, title, status }: BookRowActionsProps) {
  const label = shortTitle(title);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link
        href={`/admin/catalog/books/${id}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
        aria-label={`Edit ${title}`}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Link>

      {status === "ARCHIVED" ? (
        <form action={restoreBookAction}>
          <input type="hidden" name="id" value={id} />
          <AdminConfirmSubmit
            question={`Restore "${label}" to draft?`}
            confirmLabel="Restore"
            ariaLabel={`Restore ${title}`}
          >
            Restore
          </AdminConfirmSubmit>
        </form>
      ) : (
        <form action={archiveBookAction}>
          <input type="hidden" name="id" value={id} />
          <AdminConfirmSubmit
            question={`Archive "${label}"?`}
            confirmLabel="Archive"
            ariaLabel={`Archive ${title}`}
          >
            Archive
          </AdminConfirmSubmit>
        </form>
      )}

      <form action={deleteBookAction}>
        <input type="hidden" name="id" value={id} />
        <AdminConfirmSubmit
          question={`Delete "${label}" permanently?`}
          confirmLabel="Delete"
          variant="ghost"
          ariaLabel={`Delete ${title}`}
        >
          Delete
        </AdminConfirmSubmit>
      </form>
    </div>
  );
}
