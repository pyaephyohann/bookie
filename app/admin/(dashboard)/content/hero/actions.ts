"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  heroSlideSchema,
  fd,
  toFieldErrors,
  type ContentActionState,
} from "@/lib/admin/content";
import { resolveImageField, removeUploadedImage } from "@/lib/admin/uploads";

function refreshHeroViews() {
  revalidatePath("/");
  revalidatePath("/admin/content/hero");
}

export async function saveHeroSlideAction(
  _previous: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  await requireAdmin();

  const parsed = heroSlideSchema.safeParse({
    id: fd(formData, "id") || undefined,
    eyebrow: fd(formData, "eyebrow"),
    title: fd(formData, "title"),
    subtitle: fd(formData, "subtitle"),
    description: fd(formData, "description"),
    linkUrl: fd(formData, "linkUrl"),
    bookId: fd(formData, "bookId") || undefined,
    tint: fd(formData, "tint") || "#fef9c3",
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
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

  // Validate bookId if provided
  if (data.bookId) {
    const book = await prisma.book.findUnique({
      where: { id: data.bookId },
      select: { id: true },
    });
    if (!book) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { bookId: "Book not found" },
      };
    }
  }

  // Handle image upload
  const existingSlide = data.id
    ? await prisma.heroSlide.findUnique({ where: { id: data.id }, select: { imageUrl: true } })
    : null;

  const image = await resolveImageField(formData, existingSlide?.imageUrl ?? null, "hero-slides");
  if (!image.ok) {
    return { error: image.message, fieldErrors: { imageUrl: image.message } };
  }

  if (!image.value) {
    return {
      error: "An image is required for hero slides.",
      fieldErrors: { imageUrl: "Image is required" },
    };
  }

  try {
    if (data.id) {
      await prisma.heroSlide.update({
        where: { id: data.id },
        data: {
          eyebrow: data.eyebrow || null,
          title: data.title,
          subtitle: data.subtitle || null,
          description: data.description || null,
          imageUrl: image.value,
          linkUrl: data.linkUrl || null,
          bookId: data.bookId || null,
          tint: data.tint,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          startAt: data.startAt || null,
          endAt: data.endAt || null,
        },
      });
    } else {
      await prisma.heroSlide.create({
        data: {
          eyebrow: data.eyebrow || null,
          title: data.title,
          subtitle: data.subtitle || null,
          description: data.description || null,
          imageUrl: image.value,
          linkUrl: data.linkUrl || null,
          bookId: data.bookId || null,
          tint: data.tint,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          startAt: data.startAt || null,
          endAt: data.endAt || null,
        },
      });
    }
  } catch (error) {
    console.error("[bookie] saveHeroSlideAction failed:", error);
    return { error: "Could not save the hero slide. Please try again." };
  }

  refreshHeroViews();
  redirect(`/admin/content/hero?notice=${data.id ? "updated" : "created"}`);
}

export async function deleteHeroSlideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/content/hero?notice=invalid");

  try {
    const slide = await prisma.heroSlide.findUnique({
      where: { id },
      select: { imageUrl: true },
    });
    if (!slide) redirect("/admin/content/hero?notice=not-found");

    await prisma.heroSlide.delete({ where: { id } });

    // Clean up Cloudinary image
    await removeUploadedImage(slide.imageUrl);
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] deleteHeroSlideAction failed:", error);
    redirect("/admin/content/hero?notice=failed");
  }

  refreshHeroViews();
  redirect("/admin/content/hero?notice=deleted");
}

export async function toggleHeroSlideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/content/hero?notice=invalid");

  try {
    const slide = await prisma.heroSlide.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!slide) redirect("/admin/content/hero?notice=not-found");

    await prisma.heroSlide.update({
      where: { id },
      data: { isActive: !slide.isActive },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] toggleHeroSlideAction failed:", error);
    redirect("/admin/content/hero?notice=failed");
  }

  refreshHeroViews();
  redirect("/admin/content/hero?notice=updated");
}

export async function reorderHeroSlideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  const direction = fd(formData, "direction");
  if (!id || (direction !== "up" && direction !== "down")) {
    redirect("/admin/content/hero?notice=invalid");
  }

  try {
    const slide = await prisma.heroSlide.findUnique({
      where: { id },
      select: { sortOrder: true },
    });
    if (!slide) redirect("/admin/content/hero?notice=not-found");

    const delta = direction === "up" ? -1 : 1;
    const newSort = Math.max(0, slide.sortOrder + delta);

    await prisma.heroSlide.update({
      where: { id },
      data: { sortOrder: newSort },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] reorderHeroSlideAction failed:", error);
    redirect("/admin/content/hero?notice=failed");
  }

  refreshHeroViews();
  redirect("/admin/content/hero?notice=updated");
}
