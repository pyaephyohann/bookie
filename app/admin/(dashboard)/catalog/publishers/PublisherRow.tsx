"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { clearPublisherAction, renamePublisherAction } from "./actions";

interface PublisherRowProps {
  name: string;
  bookCount: number;
  publishedCount: number;
}

export function PublisherRow({ name, bookCount, publishedCount }: PublisherRowProps) {
  const [state, formAction, isPending] = useActionState(renamePublisherAction, {});
  const fieldId = useId();

  return (
    <li className="rounded-card border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/catalog/books?publisher=${encodeURIComponent(name)}`}
            className="text-body-sm font-semibold text-text hover:underline"
          >
            {name}
          </Link>
          <p className="text-caption text-text-muted">
            {bookCount} book{bookCount === 1 ? "" : "s"} · {publishedCount} published
          </p>
        </div>

        <form action={clearPublisherAction} className="shrink-0">
          <input type="hidden" name="name" value={name} />
          <AdminConfirmSubmit
            question={`Clear "${name}" from ${bookCount} book${bookCount === 1 ? "" : "s"}?`}
            confirmLabel="Clear"
            variant="ghost"
            ariaLabel={`Clear publisher ${name}`}
          >
            Clear
          </AdminConfirmSubmit>
        </form>
      </div>

      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="current" value={name} />
        <div className="min-w-48 flex-1">
          <label htmlFor={`${fieldId}-name`} className="text-label mb-1 block text-text">
            Rename
          </label>
          <Input
            id={`${fieldId}-name`}
            name="name"
            defaultValue={name}
            aria-invalid={state.fieldErrors?.name ? true : undefined}
            aria-describedby={state.fieldErrors?.name ? `${fieldId}-error` : undefined}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" isLoading={isPending} disabled={isPending}>
          <Check className="size-3.5" aria-hidden />
          Save
        </Button>
      </form>

      {state.error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-2 text-caption text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-2 inline-flex items-center gap-1 text-caption text-success">
          <Info className="size-3.5" aria-hidden />
          {state.success}
        </p>
      )}
    </li>
  );
}
