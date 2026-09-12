"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ImageField } from "@/components/admin/ImageField";
import type { CatalogActionState, CategoryOption } from "@/lib/admin/catalog";

export interface CategoryFormInitial {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
}

export interface CategoryFormProps {
  mode: "create" | "edit";
  action: (prev: CatalogActionState, formData: FormData) => Promise<CatalogActionState>;
  categoryId?: string;
  initial: CategoryFormInitial;
  parentOptions: CategoryOption[];
}

export function CategoryForm({
  mode,
  action,
  categoryId,
  initial,
  parentOptions,
}: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [values, setValues] = useState(initial);

  const errors = state.fieldErrors ?? {};
  const set = <K extends keyof CategoryFormInitial>(key: K, value: CategoryFormInitial[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      {categoryId && <input type="hidden" name="id" value={categoryId} />}

      {state.error && (
        <div
          role="alert"
          className="rounded-control border border-error/30 bg-error-muted px-3 py-2.5 text-body-sm text-error"
        >
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-6 shadow-xs lg:col-span-2">
          <h2 className="text-h4 mb-4 text-text">Category details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-label mb-1 block text-text">
                Name *
              </label>
              <Input
                id="name"
                name="name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
                placeholder="Literary Fiction"
                required
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-caption text-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="text-label mb-1 block text-text">
                URL slug
              </label>
              <Input
                id="slug"
                name="slug"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
                aria-invalid={errors.slug ? true : undefined}
                placeholder="literary-fiction"
              />
              {errors.slug ? (
                <p className="mt-1 text-caption text-error">{errors.slug}</p>
              ) : (
                <p className="mt-1 text-caption text-text-muted">
                  Leave blank to generate from the name.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="text-label mb-1 block text-text">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Shown on the category page."
              />
              {errors.description && (
                <p className="mt-1 text-caption text-error">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Hierarchy</h2>
            <label htmlFor="parentId" className="text-label mb-1 block text-text">
              Parent category
            </label>
            <Select
              id="parentId"
              name="parentId"
              value={values.parentId}
              onChange={(e) => set("parentId", e.target.value)}
              aria-invalid={errors.parentId ? true : undefined}
              aria-describedby={errors.parentId ? "parentId-error" : undefined}
            >
              <option value="">Top level</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {`${"— ".repeat(option.depth)}${option.name}`}
                </option>
              ))}
            </Select>
            {errors.parentId && (
              <p id="parentId-error" className="mt-1 text-caption text-error">
                {errors.parentId}
              </p>
            )}
            <p className="mt-2 text-caption text-text-muted">
              Categories can be nested one or more levels deep.
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <ImageField
              label="Category image"
              initialUrl={initial.imageUrl}
              urlLabel="Or use an image URL"
              emptyLabel="No image"
            />
          </div>

          <Button type="submit" isLoading={isPending} disabled={isPending} className="h-11 w-full">
            <Save className="size-4" aria-hidden />
            {mode === "create" ? "Create category" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
