"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  bannerSchema,
  fd,
  toFieldErrors,
  type ContentActionState,
} from "@/lib/admin/content";
import { resolveImageField, removeUploadedImage } from "@/lib/admin/uploads";

function refreshBannerViews() {
  revalidatePath("/");
  revalidatePath("/admin/content/banners");
}

export async function saveBannerAction(
  _previous: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  await requireAdmin();

  const parsed = bannerSchema.safeParse({
    id: fd(formData, "id") || undefined,
    title: fd(formData, "title"),
    description: fd(formData, "description"),
    linkUrl: fd(formData, "linkUrl"),
    status: fd(formData, "status") || "DRAFT",
    sortOrder: fd(formData, "sortOrder") || "0",
    startAt: fd(formData, "startAt") || undefined,
    endAt: fd(formData, "endAt") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  // Handle image upload
  const existingBanner = data.id
    ? await prisma.banner.findUnique({ where: { id: data.id }, select: { imageUrl: true } })
    : null;

  const image = await resolveImageField(formData, existingBanner?.imageUrl ?? null, "banners");
  if (!image.ok) {
    return { error: image.message, fieldErrors: { imageUrl: image.message } };
  }

  if (!image.value) {
    return {
      error: "An image is required for banners.",
      fieldErrors: { imageUrl: "Image is required" },
    };
  }

  try {
    if (data.id) {
      await prisma.banner.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description || null,
          imageUrl: image.value,
          linkUrl: data.linkUrl || null,
          status: data.status,
          sortOrder: data.sortOrder,
          startAt: data.startAt || null,
          endAt: data.endAt || null,
        },
      });
    } else {
      await prisma.banner.create({
        data: {
          title: data.title,
          description: data.description || null,
          imageUrl: image.value,
          linkUrl: data.linkUrl || null,
          status: data.status,
          sortOrder: data.sortOrder,
          startAt: data.startAt || null,
          endAt: data.endAt || null,
        },
      });
    }
  } catch (error) {
    console.error("[bookie] saveBannerAction failed:", error);
    return { error: "Could not save the banner. Please try again." };
  }

  refreshBannerViews();
  redirect(`/admin/content/banners?notice=${data.id ? "updated" : "created"}`);
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/content/banners?notice=invalid");

  try {
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { imageUrl: true },
    });
    if (!banner) redirect("/admin/content/banners?notice=not-found");

    await prisma.banner.delete({ where: { id } });

    // Clean up Cloudinary image
    await removeUploadedImage(banner.imageUrl);
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] deleteBannerAction failed:", error);
    redirect("/admin/content/banners?notice=failed");
  }

  refreshBannerViews();
  redirect("/admin/content/banners?notice=deleted");
}

export async function toggleBannerStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/content/banners?notice=invalid");

  try {
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!banner) redirect("/admin/content/banners?notice=not-found");

    const newStatus = banner.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await prisma.banner.update({
      where: { id },
      data: { status: newStatus },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] toggleBannerStatusAction failed:", error);
    redirect("/admin/content/banners?notice=failed");
  }

  refreshBannerViews();
  redirect("/admin/content/banners?notice=updated");
}

export async function reorderBannerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  const direction = fd(formData, "direction");
  if (!id || (direction !== "up" && direction !== "down")) {
    redirect("/admin/content/banners?notice=invalid");
  }

  try {
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { sortOrder: true },
    });
    if (!banner) redirect("/admin/content/banners?notice=not-found");

    const delta = direction === "up" ? -1 : 1;
    const newSort = Math.max(0, banner.sortOrder + delta);

    await prisma.banner.update({
      where: { id },
      data: { sortOrder: newSort },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] reorderBannerAction failed:", error);
    redirect("/admin/content/banners?notice=failed");
  }

  refreshBannerViews();
  redirect("/admin/content/banners?notice=updated");
}
