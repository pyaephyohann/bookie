import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getPromotionBookOptions } from "@/lib/admin/content-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PromotionForm } from "../PromotionForm";
import { savePromotionAction } from "../actions";

export const metadata: Metadata = { title: "New Promotion — Bookie Admin" };

export default async function NewPromotionPage() {
  await requireAdmin();
  const books = await getPromotionBookOptions();
  return <div><Link href="/admin/content/promotions" className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text"><ArrowLeft className="size-4" aria-hidden /> Back to promotions</Link><AdminPageHeader title="New promotion" description="Create a display-time discount for selected published books." /><PromotionForm action={savePromotionAction} initial={{ name: "", description: "", type: "PERCENTAGE", value: "10", startAt: "", endAt: "", isActive: true, bookIds: [] }} books={books} /></div>;
}
