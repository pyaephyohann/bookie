import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getBannerForEdit } from "@/lib/admin/content-queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BannerForm } from "../BannerForm";
import { saveBannerAction } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const banner = await getBannerForEdit(id);
  return {
    title: banner ? `Edit "${banner.title}" — Bookie Admin` : "Banner Not Found — Bookie Admin",
  };
}

export default async function EditBannerPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const banner = await getBannerForEdit(id);

  if (!banner) notFound();

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
        title={`Edit "${banner.title}"`}
        description="Update this banner."
      />
      <BannerForm
        action={saveBannerAction}
        initial={{
          ...banner,
          title: banner.title ?? "",
          description: banner.description ?? "",
          linkUrl: banner.linkUrl ?? "",
          status: banner.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        }}
        mode="edit"
      />
    </div>
  );
}
