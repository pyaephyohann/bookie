"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  FEATURED_SECTION_VALUES,
  fd,
  type ManagedFeaturedSection,
} from "@/lib/admin/content";

function parseSection(value: string): ManagedFeaturedSection | null {
  return (FEATURED_SECTION_VALUES as readonly string[]).includes(value)
    ? (value as ManagedFeaturedSection)
    : null;
}

function refreshFeaturedViews() {
  revalidatePath("/");
  revalidatePath("/admin/content/featured");
}

export async function assignFeaturedBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const bookId = fd(formData, "bookId");
  const section = parseSection(fd(formData, "section"));
  if (!bookId || !section) redirect("/admin/content/featured?notice=invalid");

  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true, status: true } });
  if (!book || book.status !== "PUBLISHED") redirect("/admin/content/featured?notice=invalid");

  const existing = await prisma.featuredBook.findUnique({
    where: { bookId_section: { bookId, section } },
    select: { id: true },
  });
  if (existing) redirect("/admin/content/featured?notice=duplicate");

  try {
    const last = await prisma.featuredBook.findFirst({
      where: { section },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.featuredBook.create({
      data: { bookId, section, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  } catch (error) {
    console.error("[bookie] assignFeaturedBookAction failed:", error);
    redirect("/admin/content/featured?notice=failed");
  }

  refreshFeaturedViews();
  redirect("/admin/content/featured?notice=updated");
}

export async function removeFeaturedBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/content/featured?notice=invalid");

  const existing = await prisma.featuredBook.findUnique({
    where: { id },
    select: { section: true },
  });
  // Do not let the A7 action mutate unsupported NEW_RELEASE, PROMOTION, or
  // STAFF_PICK rows even if a caller submits an arbitrary FeaturedBook id.
  if (!existing || !parseSection(existing.section)) {
    redirect("/admin/content/featured?notice=invalid");
  }

  try {
    await prisma.featuredBook.delete({ where: { id } });
  } catch (error) {
    console.error("[bookie] removeFeaturedBookAction failed:", error);
    redirect("/admin/content/featured?notice=failed");
  }

  refreshFeaturedViews();
  redirect("/admin/content/featured?notice=deleted");
}

export async function reorderFeaturedBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  const direction = fd(formData, "direction");
  if (!id || (direction !== "up" && direction !== "down")) {
    redirect("/admin/content/featured?notice=invalid");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.featuredBook.findUnique({
        where: { id },
        select: { id: true, section: true },
      });
      if (!current || !parseSection(current.section)) throw new Error("FEATURED_NOT_FOUND");

      const rows = await tx.featuredBook.findMany({
        where: { section: current.section },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      const index = rows.findIndex((row) => row.id === id);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= rows.length) return;

      const reordered = [...rows];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      await Promise.all(
        reordered.map((row, sortOrder) =>
          tx.featuredBook.update({ where: { id: row.id }, data: { sortOrder } }),
        ),
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FEATURED_NOT_FOUND") {
      redirect("/admin/content/featured?notice=not-found");
    }
    console.error("[bookie] reorderFeaturedBookAction failed:", error);
    redirect("/admin/content/featured?notice=failed");
  }

  refreshFeaturedViews();
  redirect("/admin/content/featured?notice=updated");
}
