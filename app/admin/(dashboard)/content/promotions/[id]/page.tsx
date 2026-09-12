import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPromotionBookOptions, getPromotionForEdit } from "@/lib/admin/content-queries";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PromotionForm } from "../PromotionForm";
import { deletePromotionAction, savePromotionAction } from "../actions";

export const metadata: Metadata = { title: "Edit Promotion — Bookie Admin" };
interface PageProps { params: Promise<{ id: string }>; }

export default async function EditPromotionPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const [promotion, books] = await Promise.all([getPromotionForEdit(id), getPromotionBookOptions()]);
  if (!promotion) notFound();
  return <div><Link href="/admin/content/promotions" className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text"><ArrowLeft className="size-4" aria-hidden /> Back to promotions</Link><AdminPageHeader title={promotion.name} description="Edit the schedule, discount, activation, and linked published books." actions={<Link href="/" target="_blank" className="inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text">View storefront <ExternalLink className="size-3.5" aria-hidden /></Link>} /><PromotionForm action={savePromotionAction} promotionId={promotion.id} initial={promotion} books={books} /><div className="mt-10 border-t border-border pt-6"><h2 className="text-h4 text-text">Danger zone</h2><p className="mt-1 text-body-sm text-text-secondary">Deleting a promotion removes only its current merchandising links. Historical orders remain unchanged.</p><form action={deletePromotionAction} className="mt-3"><input type="hidden" name="id" value={promotion.id} /><AdminConfirmSubmit variant="danger" confirmLabel="Delete promotion" question={`Delete “${promotion.name}”?`}>Delete promotion</AdminConfirmSubmit></form></div></div>;
}
