"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  fd,
  promotionSchema,
  toFieldErrors,
  type ContentActionState,
} from "@/lib/admin/content";

function parsePromotionForm(formData: FormData) {
  const bookIds = [...new Set(formData.getAll("bookIds").map(String).map((id) => id.trim()).filter(Boolean))];
  const parsed = promotionSchema.safeParse({
    id: fd(formData, "id") || undefined,
    name: fd(formData, "name"),
    description: fd(formData, "description"),
    type: fd(formData, "type"),
    value: fd(formData, "value"),
    startAt: fd(formData, "startAt"),
    endAt: fd(formData, "endAt"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    bookIds,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      state: {
        error: "Please fix the highlighted fields.",
        fieldErrors: toFieldErrors(parsed.error),
      },
    };
  }
  return { ok: true as const, data: parsed.data };
}

async function validatePublishedBooks(bookIds: string[]): Promise<boolean> {
  if (bookIds.length === 0) return true;
  const count = await prisma.book.count({ where: { id: { in: bookIds }, status: "PUBLISHED" } });
  return count === bookIds.length;
}

function refreshPromotionViews() {
  revalidatePath("/");
  revalidatePath("/admin/content/promotions");
}

export async function savePromotionAction(
  _previous: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  await requireAdmin();
  const parsed = parsePromotionForm(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  if (!(await validatePublishedBooks(data.bookIds))) {
    return {
      error: "Choose only currently published books for a storefront promotion.",
      fieldErrors: { bookIds: "One or more selected books are unavailable" },
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const promotion = data.id
        ? await tx.promotion.update({
            where: { id: data.id },
            data: {
              name: data.name,
              description: data.description || null,
              type: data.type,
              value: data.value,
              startAt: data.startAt,
              endAt: data.endAt,
              isActive: data.isActive,
            },
          })
        : await tx.promotion.create({
            data: {
              name: data.name,
              description: data.description || null,
              type: data.type,
              value: data.value,
              startAt: data.startAt,
              endAt: data.endAt,
              isActive: data.isActive,
            },
          });

      await tx.bookPromotion.deleteMany({ where: { promotionId: promotion.id } });
      if (data.bookIds.length > 0) {
        await tx.bookPromotion.createMany({
          data: data.bookIds.map((bookId) => ({ bookId, promotionId: promotion.id })),
        });
      }
    });
  } catch (error) {
    console.error("[bookie] savePromotionAction failed:", error);
    return { error: "Could not save the promotion. Please try again." };
  }

  refreshPromotionViews();
  redirect(`/admin/content/promotions?notice=${data.id ? "updated" : "created"}`);
}

export async function deletePromotionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/content/promotions?notice=invalid");

  try {
    await prisma.promotion.delete({ where: { id } });
  } catch (error) {
    console.error("[bookie] deletePromotionAction failed:", error);
    redirect("/admin/content/promotions?notice=failed");
  }

  refreshPromotionViews();
  redirect("/admin/content/promotions?notice=deleted");
}

export async function togglePromotionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/content/promotions?notice=invalid");

  try {
    const promotion = await prisma.promotion.findUnique({ where: { id }, select: { isActive: true } });
    if (!promotion) redirect("/admin/content/promotions?notice=not-found");
    await prisma.promotion.update({ where: { id }, data: { isActive: !promotion.isActive } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] togglePromotionAction failed:", error);
    redirect("/admin/content/promotions?notice=failed");
  }

  refreshPromotionViews();
  redirect("/admin/content/promotions?notice=updated");
}
