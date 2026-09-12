import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Pencil, Plus, Power } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listPromotions } from "@/lib/admin/content-queries";
import { PROMOTION_TYPE_LABELS, promotionStatus, promotionStatusLabel } from "@/lib/admin/content";
import { formatDate, formatMoney } from "@/lib/admin/catalog";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deletePromotionAction, togglePromotionAction } from "./actions";

export const metadata: Metadata = { title: "Promotions — Bookie Admin" };
const BASE_PATH = "/admin/content/promotions";

interface PageProps { searchParams: Promise<Record<string, string | string[] | undefined>>; }
function pick(params: Record<string, string | string[] | undefined>, key: string): string { const value = params[key]; return typeof value === "string" ? value : ""; }

function statusSemantic(status: ReturnType<typeof promotionStatus>) {
  return status === "LIVE" ? "success" : status === "SCHEDULED" ? "info" : status === "EXPIRED" ? "warning" : "neutral";
}

export default async function PromotionsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const q = pick(params, "q");
  const status = pick(params, "status");
  const sort = pick(params, "sort");
  const page = Number(pick(params, "page")) || 1;
  const notice = pick(params, "notice");
  const promotions = await listPromotions({ q, status, sort, page });
  const filtersActive = Boolean(q || status || sort);

  return (
    <div>
      <AdminPageHeader title="Promotions" description="Manage display-time discounts for published books." actions={<Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}><Plus className="size-4" aria-hidden /> New promotion</Link>} />
      <AdminFeedback code={notice} />
      <form method="get" className="mb-6 grid grid-cols-1 gap-3 rounded-card border border-border bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2 lg:col-span-1"><span className="mb-1 block text-label text-text">Search</span><input name="q" defaultValue={q} placeholder="Name or description…" className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text placeholder:text-text-disabled focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink" /></label>
        <label><span className="mb-1 block text-label text-text">Status</span><select name="status" defaultValue={status} className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"><option value="">All statuses</option><option value="live">Live</option><option value="scheduled">Scheduled</option><option value="expired">Expired</option><option value="inactive">Inactive</option><option value="enabled">Enabled</option></select></label>
        <label><span className="mb-1 block text-label text-text">Sort</span><select name="sort" defaultValue={sort} className="h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-text focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink"><option value="">Newest</option><option value="oldest">Oldest</option><option value="start-desc">Latest start</option><option value="value-desc">Value high → low</option><option value="value-asc">Value low → high</option></select></label>
        <div className="flex items-end gap-2"><button type="submit" className={buttonVariants({ variant: "primary" })}>Filter</button>{filtersActive && <Link href={BASE_PATH} className={buttonVariants({ variant: "ghost" })}>Clear</Link>}</div>
      </form>

      {promotions.items.length === 0 ? <EmptyState icon={Megaphone} title={filtersActive ? "No promotions match" : "No promotions yet"} description={filtersActive ? "Try clearing the filters." : "Create a promotion to merchandise a discount on the storefront."} action={<Link href={filtersActive ? BASE_PATH : `${BASE_PATH}/new`} className={buttonVariants({ variant: "outline" })}>{filtersActive ? "Clear filters" : "Create promotion"}</Link>} /> : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-xs md:block"><table className="w-full text-left"><caption className="sr-only">Promotions</caption><thead><tr className="border-b border-border"><th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Promotion</th><th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Discount</th><th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Schedule</th><th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Books</th><th className="px-4 py-3 text-caption font-semibold text-text-muted" scope="col">Status</th><th className="px-4 py-3 text-right text-caption font-semibold text-text-muted" scope="col">Actions</th></tr></thead><tbody>{promotions.items.map((promotion) => { const state = promotionStatus(promotion); return <tr key={promotion.id} className="border-b border-border-subtle last:border-0"><td className="px-4 py-3"><Link href={`${BASE_PATH}/${promotion.id}`} className="font-medium text-text hover:underline">{promotion.name}</Link><p className="max-w-xs truncate text-caption text-text-muted">{promotion.description || "No description"}</p></td><td className="px-4 py-3 text-body-sm text-text">{promotion.type === "PERCENTAGE" ? `${promotion.value}%` : formatMoney(promotion.value)}<p className="text-caption text-text-muted">{PROMOTION_TYPE_LABELS[promotion.type]}</p></td><td className="px-4 py-3 text-caption text-text-secondary"><span>{formatDate(promotion.startAt)} → {formatDate(promotion.endAt)}</span></td><td className="px-4 py-3 text-body-sm text-text-secondary">{promotion.bookCount}</td><td className="px-4 py-3"><Badge semantic={statusSemantic(state)}>{promotionStatusLabel(state)}</Badge></td><td className="px-4 py-3"><div className="flex flex-wrap items-center justify-end gap-1.5"><Link href={`${BASE_PATH}/${promotion.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil className="size-3.5" aria-hidden /> Edit</Link><form action={togglePromotionAction}><input type="hidden" name="id" value={promotion.id} /><button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}><Power className="size-3.5" aria-hidden /> {promotion.isActive ? "Disable" : "Enable"}</button></form><form action={deletePromotionAction}><input type="hidden" name="id" value={promotion.id} /><AdminConfirmSubmit variant="ghost" size="sm" confirmLabel="Delete" question={`Delete “${promotion.name}”?`} ariaLabel={`Delete ${promotion.name}`}>Delete</AdminConfirmSubmit></form></div></td></tr>; })}</tbody></table></div>
          <ul className="space-y-3 md:hidden">{promotions.items.map((promotion) => { const state = promotionStatus(promotion); return <li key={promotion.id} className="rounded-card border border-border bg-surface p-4 shadow-xs"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`${BASE_PATH}/${promotion.id}`} className="font-semibold text-text hover:underline">{promotion.name}</Link><p className="mt-1 text-caption text-text-muted">{promotion.bookCount} linked book{promotion.bookCount === 1 ? "" : "s"}</p></div><Badge semantic={statusSemantic(state)}>{promotionStatusLabel(state)}</Badge></div><p className="mt-3 text-body-sm text-text">{promotion.type === "PERCENTAGE" ? `${promotion.value}% off` : `${formatMoney(promotion.value)} off`}</p><div className="mt-3 flex flex-wrap gap-1.5"><Link href={`${BASE_PATH}/${promotion.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil className="size-3.5" aria-hidden /> Edit</Link><form action={togglePromotionAction}><input type="hidden" name="id" value={promotion.id} /><button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}><Power className="size-3.5" aria-hidden /> {promotion.isActive ? "Disable" : "Enable"}</button></form></div></li>; })}</ul>
          <AdminPagination basePath={BASE_PATH} page={promotions.page} pageCount={promotions.pageCount} total={promotions.total} itemLabel="promotions" params={{ q, status, sort }} />
        </>
      )}
    </div>
  );
}
