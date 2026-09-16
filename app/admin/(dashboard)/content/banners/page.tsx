import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Image, Pencil, Plus, Power } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listBanners } from "@/lib/admin/content-queries";
import { bannerStatus, bannerStatusLabel } from "@/lib/admin/content";
import { formatDate } from "@/lib/admin/catalog";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deleteBannerAction, reorderBannerAction, toggleBannerStatusAction } from "./actions";

export const metadata: Metadata = { title: "Banners — Bookie Admin" };

const BASE_PATH = "/admin/content/banners";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function statusSemantic(status: ReturnType<typeof bannerStatus>) {
  return status === "LIVE" ? "success" : status === "SCHEDULED" ? "info" : status === "EXPIRED" ? "warning" : "neutral";
}

export default async function BannersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const q = pick(params, "q");
  const status = pick(params, "status");
  const page = Number(pick(params, "page")) || 1;
  const notice = pick(params, "notice");

  const banners = await listBanners({ q, status, page });
  const filtersActive = Boolean(q || status);

  return (
    <div>
      <AdminPageHeader
        title="Banners"
        description="Manage homepage banners. Published banners appear in order on the storefront."
        actions={
          <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            New banner
          </Link>
        }
      />
      <AdminFeedback code={notice} />

      <form
        method="get"
        className="mb-6 grid grid-cols-1 gap-3 rounded-card border border-border bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-label text-text">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Title or description..."
            className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text placeholder:text-text-disabled focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
          />
        </label>
        <label>
          <span className="mb-1 block text-label text-text">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            <option value="">All statuses</option>
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={buttonVariants({ variant: "primary" })}>
            Filter
          </button>
          {filtersActive && (
            <Link href={BASE_PATH} className={buttonVariants({ variant: "ghost" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {banners.items.length === 0 ? (
        <EmptyState
          icon={Image}
          title={filtersActive ? "No banners match those filters" : "No banners yet"}
          description={
            filtersActive
              ? "Try clearing the search or filters."
              : "Create a banner to feature content on the homepage."
          }
          action={
            <Link
              href={filtersActive ? BASE_PATH : `${BASE_PATH}/new`}
              className={buttonVariants({ variant: "outline" })}
            >
              {filtersActive ? "Clear filters" : "Create banner"}
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-xs md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Banners</caption>
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Order</th>
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Banner</th>
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Status</th>
                  <th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Schedule</th>
                  <th className="px-4 py-3 text-right text-caption font-semibold text-text-muted" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.items.map((banner) => {
                  const state = bannerStatus(banner);
                  return (
                    <tr key={banner.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-body-sm font-semibold text-text-muted">{banner.sortOrder}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-12 shrink-0 overflow-hidden rounded-control border border-border bg-surface-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={banner.imageUrl} alt="" className="size-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`${BASE_PATH}/${banner.id}`} className="font-medium text-text hover:underline">
                              {banner.title}
                            </Link>
                            {banner.description && (
                              <p className="truncate text-caption text-text-muted max-w-xs">{banner.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge semantic={statusSemantic(state)}>{bannerStatusLabel(state)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-caption text-text-secondary">
                        {banner.startAt ? formatDate(banner.startAt) : "—"} → {banner.endAt ? formatDate(banner.endAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Link href={`${BASE_PATH}/${banner.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            <Pencil className="size-3.5" aria-hidden /> Edit
                          </Link>
                          <form action={toggleBannerStatusAction}>
                            <input type="hidden" name="id" value={banner.id} />
                            <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                              <Power className="size-3.5" aria-hidden /> {banner.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                          <form action={reorderBannerAction}>
                            <input type="hidden" name="id" value={banner.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                              <ArrowUp className="size-3.5" aria-hidden />
                            </button>
                          </form>
                          <form action={reorderBannerAction}>
                            <input type="hidden" name="id" value={banner.id} />
                            <input type="hidden" name="direction" value="down" />
                            <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                              <ArrowDown className="size-3.5" aria-hidden />
                            </button>
                          </form>
                          <form action={deleteBannerAction}>
                            <input type="hidden" name="id" value={banner.id} />
                            <AdminConfirmSubmit variant="ghost" size="sm" confirmLabel="Delete" question={`Delete "${banner.title}"?`} ariaLabel={`Delete ${banner.title}`}>
                              Delete
                            </AdminConfirmSubmit>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {banners.items.map((banner) => {
              const state = bannerStatus(banner);
              return (
                <li key={banner.id} className="rounded-card border border-border bg-surface p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="size-16 shrink-0 overflow-hidden rounded-control border border-border bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={banner.imageUrl} alt="" className="size-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`${BASE_PATH}/${banner.id}`} className="font-semibold text-text hover:underline">
                        {banner.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge semantic={statusSemantic(state)}>{bannerStatusLabel(state)}</Badge>
                        <span className="text-caption text-text-muted">Order: {banner.sortOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Link href={`${BASE_PATH}/${banner.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </Link>
                    <form action={toggleBannerStatusAction}>
                      <input type="hidden" name="id" value={banner.id} />
                      <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        <Power className="size-3.5" aria-hidden /> {banner.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>

          <AdminPagination
            basePath={BASE_PATH}
            page={banners.page}
            pageCount={banners.pageCount}
            total={banners.total}
            itemLabel="banners"
            params={{ q, status }}
          />
        </>
      )}
    </div>
  );
}
