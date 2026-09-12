"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  categorySchema,
  fd,
  slugify,
  toFieldErrors,
  type CatalogActionState,
} from "@/lib/admin/catalog";
import { removeUploadedImage, resolveImageField } from "@/lib/admin/uploads";

/**
 * Category mutations (A3).
 *
 * Guards:
 * - deleting is blocked while books or sub-categories still point at it;
 * - a category can never become its own ancestor (checked by walking up).
 */

function refreshCategoryViews() {
  revalidatePath("/", "layout");
}

/** Walk up from `parentId`; returns true if it reaches `categoryId`. */
async function wouldCreateCycle(categoryId: string, parentId: string): Promise<boolean> {
  let current: string | null = parentId;
  const seen = new Set<string>();

  while (current) {
    if (current === categoryId) return true;
    if (seen.has(current)) return true;
    seen.add(current);

    const row: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: current },
      select: { parentId: true },
    });
    current = row?.parentId ?? null;
  }

  return false;
}

function parseCategory(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: fd(formData, "name"),
    slug: fd(formData, "slug") || undefined,
    description: fd(formData, "description") || undefined,
    parentId: fd(formData, "parentId") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      state: {
        error: "Please fix the highlighted fields.",
        fieldErrors: toFieldErrors(parsed.error),
      } satisfies CatalogActionState,
    };
  }

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);
  if (!slug) {
    return {
      ok: false as const,
      state: {
        error: "Could not build a URL slug. Add a name or slug.",
        fieldErrors: { slug: "Required" },
      } satisfies CatalogActionState,
    };
  }

  return { ok: true as const, data: { ...parsed.data, slug } };
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createCategoryAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requireAdmin();

  const parsed = parseCategory(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  try {
    const clash = await prisma.category.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (clash) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: "That slug is already taken" },
      };
    }

    const image = await resolveImageField(formData, null, "categories");
    if (!image.ok) return { error: image.message, fieldErrors: { imageFile: image.message } };

    await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        imageUrl: image.value,
        parentId: data.parentId ?? null,
      },
    });
  } catch (error) {
    console.error("[bookie] createCategoryAction failed:", error);
    return { error: "Could not create the category. Please try again." };
  }

  refreshCategoryViews();
  redirect("/admin/catalog/categories?notice=created");
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateCategoryAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requireAdmin();

  const id = fd(formData, "id");
  if (!id) return { error: "Missing category reference." };

  const parsed = parseCategory(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });
    if (!existing) return { error: "That category no longer exists." };

    if (data.parentId === id) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { parentId: "A category cannot be its own parent" },
      };
    }

    if (data.parentId && (await wouldCreateCycle(id, data.parentId))) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { parentId: "That would create a loop in the hierarchy" },
      };
    }

    const clash = await prisma.category.findFirst({
      where: { slug: data.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: "That slug is already taken" },
      };
    }

    const image = await resolveImageField(formData, existing.imageUrl, "categories");
    if (!image.ok) return { error: image.message, fieldErrors: { imageFile: image.message } };

    await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        imageUrl: image.value,
        parentId: data.parentId ?? null,
      },
    });
  } catch (error) {
    console.error("[bookie] updateCategoryAction failed:", error);
    return { error: "Could not save the category. Please try again." };
  }

  refreshCategoryViews();
  redirect(`/admin/catalog/categories/${id}?notice=updated`);
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/catalog/categories?notice=not-found");

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { imageUrl: true, _count: { select: { books: true, children: true } } },
    });
    if (!category) redirect("/admin/catalog/categories?notice=not-found");
    if (category._count.children > 0) redirect("/admin/catalog/categories?notice=has-children");
    if (category._count.books > 0) redirect("/admin/catalog/categories?notice=has-books");

    await prisma.category.delete({ where: { id } });
    await removeUploadedImage(category.imageUrl);
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] deleteCategoryAction failed:", error);
    redirect("/admin/catalog/categories?notice=failed");
  }

  refreshCategoryViews();
  redirect("/admin/catalog/categories?notice=deleted");
}
