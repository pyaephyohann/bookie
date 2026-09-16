import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BannerForm } from "../BannerForm";
import { saveBannerAction } from "../actions";

export const metadata: Metadata = { title: "New Banner — Bookie Admin" };

export default async function NewBannerPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin/content/banners"
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to banners
      </Link>
      <AdminPageHeader
        title="New banner"
        description="Create a banner for the homepage."
      />
      <BannerForm
        action={saveBannerAction}
        initial={{
          title: "",
          description: "",
          linkUrl: "",
          status: "DRAFT",
          sortOrder: 0,
          startAt: "",
          endAt: "",
        }}
        mode="create"
      />
    </div>
  );
}
