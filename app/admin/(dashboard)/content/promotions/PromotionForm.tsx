"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PROMOTION_TYPE_LABELS, PROMOTION_TYPE_VALUES, type ContentActionState, type PromotionTypeValue } from "@/lib/admin/content";

interface PromotionFormProps {
  action: (previous: ContentActionState, formData: FormData) => Promise<ContentActionState>;
  promotionId?: string;
  initial: {
    name: string;
    description: string;
    type: PromotionTypeValue;
    value: string;
    startAt: string;
    endAt: string;
    isActive: boolean;
    bookIds: string[];
  };
  books: { id: string; title: string; slug: string }[];
}

function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-label text-text">{label}</label>
      {children}
      {error ? <p id={`${htmlFor}-error`} className="mt-1 text-caption text-error">{error}</p> : hint ? <p className="mt-1 text-caption text-text-muted">{hint}</p> : null}
    </div>
  );
}

export function PromotionForm({ action, promotionId, initial, books }: PromotionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [type, setType] = useState<PromotionTypeValue>(initial.type);
  const [selected, setSelected] = useState<string[]>(initial.bookIds);
  const errors = state.fieldErrors ?? {};

  const toggleBook = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  return (
    <form action={formAction} className="space-y-6">
      {promotionId && <input type="hidden" name="id" value={promotionId} />}
      {state.error && <div role="alert" className="rounded-control border border-error/30 bg-error-muted px-3 py-2.5 text-body-sm text-error">{state.error}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Promotion details</h2>
            <div className="space-y-4">
              <Field label="Name *" htmlFor="name" error={errors.name}>
                <Input id="name" name="name" defaultValue={initial.name} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} placeholder="Weekend reading sale" />
              </Field>
              <Field label="Description" htmlFor="description" error={errors.description}>
                <Textarea id="description" name="description" rows={5} defaultValue={initial.description} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} placeholder="Optional storefront description for your team…" />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Discount type *" htmlFor="type" error={errors.type}>
                  <Select id="type" name="type" value={type} onChange={(event) => setType(event.target.value as PromotionTypeValue)} aria-invalid={Boolean(errors.type)}>
                    {PROMOTION_TYPE_VALUES.map((value) => <option key={value} value={value}>{PROMOTION_TYPE_LABELS[value]}</option>)}
                  </Select>
                </Field>
                <Field label={type === "PERCENTAGE" ? "Percentage *" : "Fixed amount *"} htmlFor="value" error={errors.value} hint={type === "PERCENTAGE" ? "Use 0–100. Storefront prices are rounded to 2 decimals." : "The storefront floors a discount at zero when it exceeds the book price."}>
                  <Input id="value" name="value" type="number" min="0" max={type === "PERCENTAGE" ? "100" : undefined} step="0.01" defaultValue={initial.value} required aria-invalid={Boolean(errors.value)} aria-describedby={errors.value ? "value-error" : undefined} />
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-1 text-text">Linked books</h2>
            <p className="mb-4 text-body-sm text-text-secondary">Only published books can appear in the storefront promotion shelf.</p>
            {books.length === 0 ? <p className="text-body-sm text-text-muted">No published books are available.</p> : (
              <div className="max-h-80 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                {books.map((book) => (
                  <label key={book.id} className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-2 text-body-sm text-text hover:bg-surface-muted">
                    <input type="checkbox" name="bookIds" value={book.id} checked={selected.includes(book.id)} onChange={() => toggleBook(book.id)} className="size-4 accent-[var(--color-ink)]" />
                    <span className="min-w-0 flex-1 truncate">{book.title}</span>
                    <span className="text-caption text-text-muted">/{book.slug}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.bookIds && <p className="mt-1 text-caption text-error">{errors.bookIds}</p>}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-h4 mb-4 text-text">Schedule</h2>
            <div className="space-y-4">
              <Field label="Starts *" htmlFor="startAt" error={errors.startAt}>
                <Input id="startAt" name="startAt" type="datetime-local" defaultValue={initial.startAt} required aria-invalid={Boolean(errors.startAt)} aria-describedby={errors.startAt ? "startAt-error" : undefined} />
              </Field>
              <Field label="Ends *" htmlFor="endAt" error={errors.endAt}>
                <Input id="endAt" name="endAt" type="datetime-local" defaultValue={initial.endAt} required aria-invalid={Boolean(errors.endAt)} aria-describedby={errors.endAt ? "endAt-error" : undefined} />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-body-sm text-text">
                <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="size-4 accent-[var(--color-ink)]" />
                Enabled for its scheduled date range
              </label>
              <p className="text-caption text-text-muted">A promotion is live only when enabled and the current time is between its start and end.</p>
            </div>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <Button type="submit" block isLoading={pending} disabled={pending}>
              <Save className="size-4" aria-hidden />
              Save promotion
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
