import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getHeroSlideForEdit, getHeroSlideBookOptions } from "@/lib/admin/content-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HeroSlideForm } from "../HeroSlideForm";
import { saveHeroSlideAction } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const slide = await getHeroSlideForEdit(id);
  return {
    title: slide ? `Edit "${slide.title}" — Bookie Admin` : "Hero Slide Not Found — Bookie Admin",
  };
}

export default async function EditHeroSlidePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const [slide, books] = await Promise.all([getHeroSlideForEdit(id), getHeroSlideBookOptions()]);

  if (!slide) notFound();

  return (
    <div>
      <Link
        href="/admin/content/hero"
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to hero slides
      </Link>
      <AdminPageHeader
        title={`Edit "${slide.title}"`}
        description="Update this hero slide."
      />
      <HeroSlideForm
        action={saveHeroSlideAction}
        initial={slide}
        books={books}
        mode="edit"
      />
    </div>
  );
}
