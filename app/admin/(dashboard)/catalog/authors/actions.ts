"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { authorSchema, fd, slugify, toFieldErrors, type CatalogActionState } from "@/lib/admin/catalog";
import { removeUploadedImage, resolveImageField } from "@/lib/admin/uploads";

/**
 * Author mutations (A3).
 *
 * Deletion is blocked while the author is still linked to books — silently
 * unlinking catalog data would be destructive and hard to notice.
 */

function refreshAuthorViews() {
  revalidatePath("/", "layout");
}

function parseAuthor(formData: FormData) {
  const parsed = authorSchema.safeParse({
    name: fd(formData, "name"),
    slug: fd(formData, "slug") || undefined,
    biography: fd(formData, "biography") || undefined,
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

export async function createAuthorAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requireAdmin();

  const parsed = parseAuthor(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  try {
    const clash = await prisma.author.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: "That slug is already taken" },
      };
    }

    const photo = await resolveImageField(formData, null, "authors");
    if (!photo.ok) return { error: photo.message, fieldErrors: { imageFile: photo.message } };

    await prisma.author.create({
      data: {
        name: data.name,
        slug: data.slug,
        biography: data.biography ?? null,
        photoUrl: photo.value,
      },
    });
  } catch (error) {
    console.error("[bookie] createAuthorAction failed:", error);
    return { error: "Could not create the author. Please try again." };
  }

  refreshAuthorViews();
  redirect("/admin/catalog/authors?notice=created");
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateAuthorAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requireAdmin();

  const id = fd(formData, "id");
  if (!id) return { error: "Missing author reference." };

  const parsed = parseAuthor(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  try {
    const existing = await prisma.author.findUnique({
      where: { id },
      select: { id: true, photoUrl: true },
    });
    if (!existing) return { error: "That author no longer exists." };

    const clash = await prisma.author.findFirst({
      where: { slug: data.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: "That slug is already taken" },
      };
    }

    const photo = await resolveImageField(formData, existing.photoUrl, "authors");
    if (!photo.ok) return { error: photo.message, fieldErrors: { imageFile: photo.message } };

    await prisma.author.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        biography: data.biography ?? null,
        photoUrl: photo.value,
      },
    });
  } catch (error) {
    console.error("[bookie] updateAuthorAction failed:", error);
    return { error: "Could not save the author. Please try again." };
  }

  refreshAuthorViews();
  redirect(`/admin/catalog/authors/${id}?notice=updated`);
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteAuthorAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/catalog/authors?notice=not-found");

  try {
    const author = await prisma.author.findUnique({
      where: { id },
      select: { photoUrl: true, _count: { select: { books: true } } },
    });
    if (!author) redirect("/admin/catalog/authors?notice=not-found");
    if (author._count.books > 0) redirect("/admin/catalog/authors?notice=has-books");

    await prisma.author.delete({ where: { id } });
    await removeUploadedImage(author.photoUrl);
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] deleteAuthorAction failed:", error);
    redirect("/admin/catalog/authors?notice=failed");
  }

  refreshAuthorViews();
  redirect("/admin/catalog/authors?notice=deleted");
}
