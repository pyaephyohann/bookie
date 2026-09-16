"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ImageField } from "@/components/admin/ImageField";
import { buttonVariants } from "@/components/ui/button";
import type { BannerFormValues, ContentActionState } from "@/lib/admin/content";

interface BannerFormProps {
  action: (prev: ContentActionState, formData: FormData) => Promise<ContentActionState>;
  initial: BannerFormValues & { id?: string; imageUrl?: string; startAt?: string; endAt?: string };
  mode: "create" | "edit";
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-label mb-1 block text-text">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function BannerForm({ action, initial, mode }: BannerFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {state.error && (
        <div role="alert" className="rounded-control border border-error/30 bg-error-muted px-3 py-2.5 text-body-sm text-error">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main details */}
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Banner content</h2>
            <div className="space-y-4">
              <Field label="Title *" htmlFor="title" error={errors.title}>
                <input
                  id="title"
                  name="title"
                  defaultValue={initial.title}
                  required
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text placeholder:text-text-disabled focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
              </Field>

              <Field label="Description" htmlFor="description" error={errors.description}>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={initial.description}
                  rows={3}
                  className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-text-disabled focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Image</h2>
            <ImageField
              label="Banner image *"
              initialUrl={initial.imageUrl ?? ""}
              hint="JPEG, PNG or WEBP · recommended 1200×400px · max 2 MB."
              aspectClassName="aspect-[3/1]"
              emptyLabel="No image"
            />
            {errors.imageUrl && (
              <p role="alert" className="mt-2 text-caption text-error">{errors.imageUrl}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Settings</h2>
            <div className="space-y-4">
              <Field label="Status" htmlFor="status" error={errors.status}>
                <select
                  id="status"
                  name="status"
                  defaultValue={initial.status || "DRAFT"}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>

              <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder}>
                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={9999}
                  defaultValue={initial.sortOrder ?? 0}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Link</h2>
            <div className="space-y-4">
              <Field label="Link URL" htmlFor="linkUrl" error={errors.linkUrl}>
                <input
                  id="linkUrl"
                  name="linkUrl"
                  defaultValue={initial.linkUrl}
                  placeholder="/books/some-slug or https://..."
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text placeholder:text-text-disabled focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Schedule</h2>
            <div className="space-y-4">
              <Field label="Start date" htmlFor="startAt" error={errors.startAt}>
                <input
                  id="startAt"
                  name="startAt"
                  type="datetime-local"
                  defaultValue={initial.startAt}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
              </Field>

              <Field label="End date" htmlFor="endAt" error={errors.endAt}>
                <input
                  id="endAt"
                  name="endAt"
                  type="datetime-local"
                  defaultValue={initial.endAt}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button type="submit" disabled={isPending} className={buttonVariants({ variant: "primary" })}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {mode === "create" ? "Create banner" : "Save changes"}
        </button>
        <Link href="/admin/content/banners" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
