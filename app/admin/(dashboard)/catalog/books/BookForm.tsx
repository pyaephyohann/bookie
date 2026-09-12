"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  BOOK_STATUS_LABELS,
  BOOK_STATUS_VALUES,
  COVER_MIME_TYPES,
  COVER_MAX_BYTES,
  isAllowedCoverSize,
  isAllowedCoverType,
  type CatalogActionState,
} from "@/lib/admin/catalog";

// ── Types ───────────────────────────────────────────────────────────────────

export interface BookFormInitial {
  title: string;
  slug: string;
  description: string;
  isbn: string;
  publisher: string;
  publishedAt: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  status: string;
  coverImage: string;
  isReadableOnline: boolean;
  metaTitle: string;
  metaDescription: string;
  authorIds: string[];
  categoryIds: string[];
}

export interface BookFormProps {
  mode: "create" | "edit";
  action: (prev: CatalogActionState, formData: FormData) => Promise<CatalogActionState>;
  bookId?: string;
  initial: BookFormInitial;
  authors: { id: string; name: string }[];
  categories: { id: string; name: string; parentId: string | null }[];
  publishers: string[];
}

// ── Small field primitives ──────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-label mb-1 block text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 text-caption text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-caption text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function CheckboxGrid({
  legend,
  name,
  options,
  selected,
  onToggle,
  emptyLabel,
}: {
  legend: string;
  name: string;
  options: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <fieldset>
      <legend className="text-label mb-1 text-text">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-caption text-text-muted">{emptyLabel}</p>
      ) : (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-control border border-border p-2">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-body-sm text-text transition-colors hover:bg-surface-muted"
            >
              <input
                type="checkbox"
                name={name}
                value={option.id}
                checked={selected.includes(option.id)}
                onChange={() => onToggle(option.id)}
                className="size-4 accent-[var(--color-ink)]"
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

// ── Form ────────────────────────────────────────────────────────────────────

export function BookForm({
  mode,
  action,
  bookId,
  initial,
  authors,
  categories,
  publishers,
}: BookFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  const [values, setValues] = useState<BookFormInitial>(initial);
  const [authorIds, setAuthorIds] = useState<string[]>(initial.authorIds);
  const [categoryIds, setCategoryIds] = useState<string[]>(initial.categoryIds);

  const existingIsDataUrl = initial.coverImage.startsWith("data:");
  const [coverAction, setCoverAction] = useState<"keep" | "replace" | "remove">("keep");
  const [coverPreview, setCoverPreview] = useState<string | null>(
    existingIsDataUrl || initial.coverImage ? initial.coverImage : null,
  );
  const [coverFileName, setCoverFileName] = useState<string>("");
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverMaxMb = Math.round(COVER_MAX_BYTES / (1024 * 1024));

  const errors = state.fieldErrors ?? {};
  const set = <K extends keyof BookFormInitial>(key: K, value: BookFormInitial[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const onPickCover = (file: File | null) => {
    if (!file) return;

    // Client-side guard only — avoids a doomed request and gives an instant,
    // friendly message. The server re-validates MIME, size and file signature.
    const problem = !isAllowedCoverType(file.type)
      ? "Choose a JPEG, PNG or WEBP image."
      : !isAllowedCoverSize(file.size)
        ? `Image must be ${coverMaxMb} MB or smaller.`
        : null;

    if (problem) {
      setCoverError(problem);
      setCoverFileName("");
      // Drop the rejected file so it can never be submitted with the form.
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setCoverError(null);
    if (coverPreview && coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(file));
    setCoverFileName(file.name);
    setCoverAction("replace");
  };

  const onRemoveCover = () => {
    if (coverPreview && coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setCoverFileName("");
    setCoverError(null);
    setCoverAction("remove");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const invalid = (key: string) => (errors[key] ? true : undefined);
  const describedBy = (key: string) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form action={formAction} className="space-y-6">
      {bookId && <input type="hidden" name="id" value={bookId} />}
      <input type="hidden" name="coverAction" value={coverAction} />

      {state.error && (
        <div
          role="alert"
          className="rounded-control border border-error/30 bg-error-muted px-3 py-2.5 text-body-sm text-error"
        >
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── Main details ─────────────────────────────────────────────── */}
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Book details</h2>
            <div className="space-y-4">
              <Field label="Title *" htmlFor="title" error={errors.title}>
                <Input
                  id="title"
                  name="title"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  aria-invalid={invalid("title")}
                  aria-describedby={describedBy("title")}
                  placeholder="The Paper Telescope"
                  required
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="slug"
                error={errors.slug}
                hint="Leave blank to generate from the title. Used in storefront URLs."
              >
                <Input
                  id="slug"
                  name="slug"
                  value={values.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  aria-invalid={invalid("slug")}
                  aria-describedby={describedBy("slug")}
                  placeholder="the-paper-telescope"
                />
              </Field>

              <Field label="Description" htmlFor="description" error={errors.description}>
                <Textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  aria-invalid={invalid("description")}
                  aria-describedby={describedBy("description")}
                  placeholder="What is this book about?"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="ISBN" htmlFor="isbn" error={errors.isbn} hint="Optional, must be unique.">
                  <Input
                    id="isbn"
                    name="isbn"
                    value={values.isbn}
                    onChange={(e) => set("isbn", e.target.value)}
                    aria-invalid={invalid("isbn")}
                    aria-describedby={describedBy("isbn")}
                    placeholder="978-3-16-148410-0"
                  />
                </Field>

                <Field
                  label="Publisher"
                  htmlFor="publisher"
                  error={errors.publisher}
                  hint="Type a name — existing publishers are suggested."
                >
                  <Input
                    id="publisher"
                    name="publisher"
                    list="publisher-options"
                    value={values.publisher}
                    onChange={(e) => set("publisher", e.target.value)}
                    aria-invalid={invalid("publisher")}
                    aria-describedby={describedBy("publisher")}
                    placeholder="Bookie Press"
                  />
                  <datalist id="publisher-options">
                    {publishers.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Pricing &amp; inventory</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Price (USD) *" htmlFor="price" error={errors.price}>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.price}
                  onChange={(e) => set("price", e.target.value)}
                  aria-invalid={invalid("price")}
                  aria-describedby={describedBy("price")}
                  required
                />
              </Field>

              <Field
                label="Compare-at price"
                htmlFor="compareAtPrice"
                error={errors.compareAtPrice}
                hint="Shown struck through."
              >
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.compareAtPrice}
                  onChange={(e) => set("compareAtPrice", e.target.value)}
                  aria-invalid={invalid("compareAtPrice")}
                  aria-describedby={describedBy("compareAtPrice")}
                />
              </Field>

              <Field
                label="Stock quantity"
                htmlFor="stockQuantity"
                error={errors.stockQuantity}
                hint="Inventory management arrives in A4."
              >
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  step="1"
                  value={values.stockQuantity}
                  onChange={(e) => set("stockQuantity", e.target.value)}
                  aria-invalid={invalid("stockQuantity")}
                  aria-describedby={describedBy("stockQuantity")}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">SEO</h2>
            <div className="space-y-4">
              <Field label="Meta title" htmlFor="metaTitle" error={errors.metaTitle}>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={values.metaTitle}
                  onChange={(e) => set("metaTitle", e.target.value)}
                  aria-invalid={invalid("metaTitle")}
                  aria-describedby={describedBy("metaTitle")}
                />
              </Field>
              <Field label="Meta description" htmlFor="metaDescription" error={errors.metaDescription}>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  rows={3}
                  value={values.metaDescription}
                  onChange={(e) => set("metaDescription", e.target.value)}
                  aria-invalid={invalid("metaDescription")}
                  aria-describedby={describedBy("metaDescription")}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Publication</h2>
            <Field label="Status" htmlFor="status" error={errors.status}>
              <Select
                id="status"
                name="status"
                value={values.status}
                onChange={(e) => set("status", e.target.value)}
                aria-invalid={invalid("status")}
                aria-describedby={describedBy("status")}
              >
                {BOOK_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {BOOK_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>

            <p className="mt-2 text-caption text-text-muted">
              Only <strong className="font-semibold">Published</strong> books appear in the
              storefront.
            </p>

            <div className="mt-4">
              <Field label="Published date" htmlFor="publishedAt" error={errors.publishedAt}>
                <Input
                  id="publishedAt"
                  name="publishedAt"
                  type="date"
                  value={values.publishedAt}
                  onChange={(e) => set("publishedAt", e.target.value)}
                  aria-invalid={invalid("publishedAt")}
                  aria-describedby={describedBy("publishedAt")}
                />
              </Field>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-body-sm text-text">
              <input
                type="checkbox"
                name="isReadableOnline"
                checked={values.isReadableOnline}
                onChange={(e) => set("isReadableOnline", e.target.checked)}
                className="size-4 accent-[var(--color-ink)]"
              />
              Readable online
            </label>
          </div>

          {/* Cover */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Cover image</h2>

            <div className="mb-3 flex aspect-2/3 w-full max-w-40 items-center justify-center overflow-hidden rounded-control border border-dashed border-border bg-surface-muted">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-caption px-3 text-center text-text-muted">
                  No cover — placeholder art is used
                </span>
              )}
            </div>

            <label
              htmlFor="coverFile"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-3 py-2 text-body-sm text-text transition-colors hover:bg-surface-muted"
            >
              <ImagePlus className="size-4" aria-hidden />
              {coverPreview ? "Replace image" : "Upload image"}
            </label>
            <input
              ref={fileInputRef}
              id="coverFile"
              name="coverFile"
              type="file"
              accept={COVER_MIME_TYPES.join(",")}
              className="sr-only"
              onChange={(e) => onPickCover(e.target.files?.[0] ?? null)}
              aria-describedby={coverError ? "coverFile-client-error" : "coverFile-hint"}
              aria-invalid={coverError ? true : undefined}
            />
            <p id="coverFile-hint" className="mt-2 text-caption text-text-muted">
              JPEG, PNG or WEBP · max {coverMaxMb} MB.
              {coverFileName ? ` Selected: ${coverFileName}` : ""}
            </p>
            {coverError && (
              <p id="coverFile-client-error" role="alert" className="mt-1 text-caption text-error">
                {coverError}
              </p>
            )}
            {errors.coverFile && (
              <p className="mt-1 text-caption text-error">{errors.coverFile}</p>
            )}

            {coverPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={onRemoveCover}
              >
                <Trash2 className="size-4" aria-hidden />
                Remove cover
              </Button>
            )}

            {!coverPreview && !initial.coverImage.startsWith("data:") && (
              <div className="mt-4">
                <Field
                  label="Or use an image URL"
                  htmlFor="coverImage"
                  error={errors.coverImage}
                  hint="Root-relative (/covers/x.jpg) or https link."
                >
                  <Input
                    id="coverImage"
                    name="coverImage"
                    defaultValue={initial.coverImage}
                    placeholder="/covers/book.jpg"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Relationships */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Relationships</h2>
            <div className="space-y-5">
              <CheckboxGrid
                legend="Authors"
                name="authorIds"
                options={authors}
                selected={authorIds}
                onToggle={(id) => toggle(authorIds, setAuthorIds, id)}
                emptyLabel="No authors yet — create one from the Authors screen."
              />
              <CheckboxGrid
                legend="Categories"
                name="categoryIds"
                options={categories}
                selected={categoryIds}
                onToggle={(id) => toggle(categoryIds, setCategoryIds, id)}
                emptyLabel="No categories yet — create one from the Categories screen."
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" isLoading={isPending} disabled={isPending} className="h-11">
              <Save className="size-4" aria-hidden />
              {mode === "create" ? "Create book" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
