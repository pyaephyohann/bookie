import { BookOpen } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: typeof BookOpen;
  compact?: boolean;
}

/**
 * Friendly empty/fallback state for discovery shelves —
 * used when a section has no data to show.
 */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = BookOpen,
  compact = false,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      className={`flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center ${
        compact ? "py-8" : ""
      } ${className}`}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="size-5 text-text-muted" aria-hidden />
      </span>
      <p className="text-body font-semibold text-text">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}