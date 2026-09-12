"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ImageField } from "@/components/admin/ImageField";
import type { CatalogActionState } from "@/lib/admin/catalog";

export interface AuthorFormInitial {
  name: string;
  slug: string;
  biography: string;
  photoUrl: string;
}

export interface AuthorFormProps {
  mode: "create" | "edit";
  action: (prev: CatalogActionState, formData: FormData) => Promise<CatalogActionState>;
  authorId?: string;
  initial: AuthorFormInitial;
}

export function AuthorForm({ mode, action, authorId, initial }: AuthorFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [values, setValues] = useState(initial);

  const errors = state.fieldErrors ?? {};
  const set = <K extends keyof AuthorFormInitial>(key: K, value: AuthorFormInitial[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      {authorId && <input type="hidden" name="id" value={authorId} />}

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
          <h2 className="text-h4 mb-4 text-text">Author details</h2>
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
                placeholder="Amara Okafor"
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
                aria-describedby={errors.slug ? "slug-error" : "slug-hint"}
                placeholder="amara-okafor"
              />
              {errors.slug ? (
                <p id="slug-error" className="mt-1 text-caption text-error">
                  {errors.slug}
                </p>
              ) : (
                <p id="slug-hint" className="mt-1 text-caption text-text-muted">
                  Leave blank to generate from the name.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="biography" className="text-label mb-1 block text-text">
                Biography
              </label>
              <Textarea
                id="biography"
                name="biography"
                rows={7}
                value={values.biography}
                onChange={(e) => set("biography", e.target.value)}
                aria-invalid={errors.biography ? true : undefined}
                placeholder="A short introduction for the storefront author page."
              />
              {errors.biography && (
                <p className="mt-1 text-caption text-error">{errors.biography}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <ImageField
              label="Photo"
              initialUrl={initial.photoUrl}
              urlLabel="Or use a photo URL"
              emptyLabel="No photo"
            />
          </div>

          <Button type="submit" isLoading={isPending} disabled={isPending} className="h-11 w-full">
            <Save className="size-4" aria-hidden />
            {mode === "create" ? "Create author" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
