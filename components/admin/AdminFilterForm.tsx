import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/input";

export interface FilterOption {
  value: string;
  label: string;
}

interface AdminFilterFormProps {
  action: string;
  /** Current values, used to keep the controls populated. */
  search?: { name: string; value: string; placeholder: string; label: string };
  selects?: {
    name: string;
    label: string;
    value: string;
    options: FilterOption[];
    allLabel: string;
  }[];
  /** Hidden params carried through the GET submit (e.g. sort). */
  hidden?: Record<string, string | undefined>;
  submitLabel?: string;
  children?: ReactNode;
}

/**
 * Plain GET form — works without JavaScript, preserves filters through the
 * URL, and is fully keyboard/screen-reader accessible. No client state.
 */
export function AdminFilterForm({
  action,
  search,
  selects = [],
  hidden = {},
  submitLabel = "Apply",
  children,
}: AdminFilterFormProps) {
  return (
    <form
      method="get"
      action={action}
      className="mb-5 flex flex-wrap items-end gap-3"
      role="search"
    >
      {Object.entries(hidden).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}

      {search && (
        <div className="min-w-52 flex-1">
          <label htmlFor={search.name} className="text-label mb-1 block text-text">
            {search.label}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <Input
              id={search.name}
              name={search.name}
              defaultValue={search.value}
              placeholder={search.placeholder}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {selects.map((select) => (
        <div key={select.name} className="min-w-40">
          <label htmlFor={select.name} className="text-label mb-1 block text-text">
            {select.label}
          </label>
          <Select id={select.name} name={select.name} defaultValue={select.value}>
            <option value="">{select.allLabel}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}

      <button
        type="submit"
        className="inline-flex h-10 items-center gap-2 rounded-control border border-transparent bg-brand px-4 text-button text-brand-on shadow-xs transition-colors hover:bg-brand-hover"
      >
        {submitLabel}
      </button>

      {children}
    </form>
  );
}
