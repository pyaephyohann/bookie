import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  basePath: string;
  page: number;
  pageCount: number;
  total: number;
  itemLabel: string;
  /** Current query params to preserve when changing page. */
  params?: Record<string, string | undefined>;
}

function hrefFor(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Server-rendered pagination — real links, no client JS, keyboard accessible.
 * Filters/search/sort are preserved because every link rebuilds the query.
 */
export function AdminPagination({
  basePath,
  page,
  pageCount,
  total,
  itemLabel,
  params = {},
}: AdminPaginationProps) {
  const linkClass =
    "inline-flex h-9 items-center gap-1 rounded-control border border-border px-3 text-body-sm text-text transition-colors hover:bg-surface-muted";
  const disabledClass =
    "inline-flex h-9 items-center gap-1 rounded-control border border-border px-3 text-body-sm text-text-disabled";

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-caption text-text-muted">
        {total === 0
          ? `No ${itemLabel}`
          : `Page ${page} of ${pageCount} · ${total} ${itemLabel}`}
      </p>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(basePath, params, page - 1)} className={linkClass} rel="prev">
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </span>
        )}

        {page < pageCount ? (
          <Link href={hrefFor(basePath, params, page + 1)} className={linkClass} rel="next">
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            Next
            <ChevronRight className="size-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
