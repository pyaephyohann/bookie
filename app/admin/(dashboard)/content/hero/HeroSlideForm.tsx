"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ImageField } from "@/components/admin/ImageField";
import { buttonVariants } from "@/components/ui/button";
import type { HeroSlideFormValues, ContentActionState } from "@/lib/admin/content";

interface HeroSlideFormProps {
  action: (prev: ContentActionState, formData: FormData) => Promise<ContentActionState>;
  initial: HeroSlideFormValues & { id?: string; imageUrl?: string; startAt?: string; endAt?: string; bookId?: string | null };
  books: { id: string; title: string; slug: string }[];
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

export function HeroSlideForm({ action, initial, books, mode }: HeroSlideFormProps) {
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
            <h2 className="text-h4 mb-4 text-text">Slide content</h2>
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

              <Field label="Eyebrow" htmlFor="eyebrow" error={errors.eyebrow}>
                <input
                  id="eyebrow"
                  name="eyebrow"
                  defaultValue={initial.eyebrow}
                  placeholder="e.g. Featured, New Release, Best Seller"
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text placeholder:text-text-disabled focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
              </Field>

              <Field label="Subtitle" htmlFor="subtitle" error={errors.subtitle}>
                <input
                  id="subtitle"
                  name="subtitle"
                  defaultValue={initial.subtitle}
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
              label="Hero image *"
              initialUrl={initial.imageUrl ?? ""}
              hint="JPEG, PNG or WEBP · recommended 1200×600px · max 2 MB."
              aspectClassName="aspect-[2/1]"
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
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={initial.isActive}
                  className="size-4 rounded border-border accent-brand"
                />
                <label htmlFor="isActive" className="text-body-sm text-text">
                  Active (visible on homepage)
                </label>
              </div>

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

              <Field label="Tint color" htmlFor="tint" error={errors.tint}>
                <div className="flex items-center gap-2">
                  <input
                    id="tint"
                    name="tint"
                    type="color"
                    defaultValue={initial.tint || "#fef9c3"}
                    className="size-10 cursor-pointer rounded-control border border-border"
                  />
                  <input
                    type="text"
                    defaultValue={initial.tint || "#fef9c3"}
                    className="h-10 flex-1 rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                    onChange={(e) => {
                      const colorInput = document.getElementById("tint") as HTMLInputElement;
                      if (colorInput) colorInput.value = e.target.value;
                    }}
                  />
                </div>
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

              <Field label="Or link to a book" htmlFor="bookId" error={errors.bookId}>
                <select
                  id="bookId"
                  name="bookId"
                  defaultValue={initial.bookId ?? ""}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
                >
                  <option value="">No book linked</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
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
          {mode === "create" ? "Create slide" : "Save changes"}
        </button>
        <Link href="/admin/content/hero" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
