import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getHeroSlideBookOptions } from "@/lib/admin/content-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HeroSlideForm } from "../HeroSlideForm";
import { saveHeroSlideAction } from "../actions";

export const metadata: Metadata = { title: "New Hero Slide — Bookie Admin" };

export default async function NewHeroSlidePage() {
  await requireAdmin();
  const books = await getHeroSlideBookOptions();

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
        title="New hero slide"
        description="Create a slide for the homepage hero carousel."
      />
      <HeroSlideForm
        action={saveHeroSlideAction}
        initial={{
          eyebrow: "",
          title: "",
          subtitle: "",
          description: "",
          linkUrl: "",
          bookId: undefined,
          tint: "#fef9c3",
          isActive: true,
          sortOrder: 0,
          startAt: "",
          endAt: "",
        }}
        books={books}
        mode="create"
      />
    </div>
  );
}
