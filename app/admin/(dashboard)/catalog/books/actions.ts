"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  bookSchema,
  fd,
  slugify,
  toFieldErrors,
  SLUG_PATTERN,
  type CatalogActionState,
} from "@/lib/admin/catalog";
import {
  isAllowedImageUrl,
  removeUploadedImage,
  saveImageUpload,
} from "@/lib/admin/uploads";

/**
 * Book catalog mutations (A3).
 *
 * SECURITY: every action re-validates the admin session server-side and
 * re-validates the submitted payload with Zod. The UI is never trusted.
 */

// ── Helpers ─────────────────────────────────────────────────────────────────

type ParsedBook = ReturnType<typeof bookSchema.parse> & { slug: string };

type ParseResult =
  | { ok: true; data: ParsedBook }
  | { ok: false; state: CatalogActionState };

async function parseBookForm(formData: FormData): Promise<ParseResult> {
  const parsed = bookSchema.safeParse({
    title: fd(formData, "title"),
    slug: fd(formData, "slug") || undefined,
    description: fd(formData, "description") || undefined,
    isbn: fd(formData, "isbn") || undefined,
    publisher: fd(formData, "publisher") || undefined,
    publishedAt: fd(formData, "publishedAt") || undefined,
    price: fd(formData, "price"),
    compareAtPrice: fd(formData, "compareAtPrice") || undefined,
    stockQuantity: fd(formData, "stockQuantity") || undefined,
    status: fd(formData, "status"),
    coverAction: (fd(formData, "coverAction") || "keep") as "keep" | "replace" | "remove",
    isReadableOnline: fd(formData, "isReadableOnline") || undefined,
    metaTitle: fd(formData, "metaTitle") || undefined,
    metaDescription: fd(formData, "metaDescription") || undefined,
    authorIds: formData.getAll("authorIds").map(String).filter(Boolean),
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
  });

  if (!parsed.success) {
    return {
      ok: false,
      state: {
        error: "Please fix the highlighted fields.",
        fieldErrors: toFieldErrors(parsed.error),
      },
    };
  }

  const data = parsed.data;

  // Slug: auto-generate from the title when omitted, and normalise provided ones.
  const providedSlug = data.slug ? slugify(data.slug) : "";
  const autoSlug = slugify(data.title);
  const slug = providedSlug || autoSlug;

  if (!slug) {
    return {
      ok: false,
      state: { error: "Could not build a URL slug. Add a title or slug.", fieldErrors: { slug: "Required" } },
    };
  }
  if (data.slug && !SLUG_PATTERN.test(data.slug)) {
    return {
      ok: false,
      state: {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: "Use lowercase letters, numbers and single hyphens" },
      },
    };
  }

  return { ok: true, data: { ...data, slug } };
}

/** Resolve the cover value: keep / replace (validated upload) / remove. */
async function resolveCover(
  formData: FormData,
  coverAction: "keep" | "replace" | "remove",
  existing: string | null,
): Promise<{ ok: true; value: string | null } | { ok: false; message: string }> {
  if (coverAction === "remove") {
    await removeUploadedImage(existing);
    return { ok: true, value: null };
  }

  const file = formData.get("coverFile");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImageUpload(file, "covers");
    if (!saved.ok) return { ok: false, message: saved.message };
    await removeUploadedImage(existing);
    return { ok: true, value: saved.url };
  }

  // Manual URL: root-relative asset or an absolute https image link.
  const manual = fd(formData, "coverImage");
  if (manual && manual !== existing) {
    if (!isAllowedImageUrl(manual)) {
      return {
        ok: false,
        message: "Cover URL must be root-relative (/covers/x.jpg) or an https link.",
      };
    }
    await removeUploadedImage(existing);
    return { ok: true, value: manual };
  }

  return { ok: true, value: existing };
}

function refreshCatalogViews() {
  // Catalog edits change storefront pages (home, book detail, category/author).
  revalidatePath("/", "layout");
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createBookAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requireAdmin();

  const parsed = await parseBookForm(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  const cover = await resolveCover(formData, data.coverAction, null);
  if (!cover.ok) return { error: cover.message, fieldErrors: { coverFile: cover.message } };

  try {
    const clash = await prisma.book.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: "That slug is already taken" },
      };
    }

    await prisma.book.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description ?? null,
        isbn: data.isbn || null,
        publisher: data.publisher || null,
        publishedAt: data.publishedAt ?? null,
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        stockQuantity: data.stockQuantity ?? 0,
        status: data.status,
        coverImage: cover.value,
        isReadableOnline: data.isReadableOnline,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        authors: {
          create: data.authorIds.map((authorId, index) => ({ authorId, sortOrder: index })),
        },
        categories: {
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });
  } catch (error) {
    console.error("[bookie] createBookAction failed:", error);
    return { error: "Could not create the book. Please try again." };
  }

  refreshCatalogViews();
  redirect("/admin/catalog/books?notice=created");
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateBookAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requireAdmin();

  const id = fd(formData, "id");
  if (!id) return { error: "Missing book reference." };

  const parsed = await parseBookForm(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  try {
    const existing = await prisma.book.findUnique({
      where: { id },
      select: { id: true, coverImage: true },
    });
    if (!existing) return { error: "That book no longer exists." };

    const cover = await resolveCover(formData, data.coverAction, existing.coverImage);
    if (!cover.ok) return { error: cover.message, fieldErrors: { coverFile: cover.message } };

    const clash = await prisma.book.findFirst({
      where: { slug: data.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: "That slug is already taken" },
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description ?? null,
          isbn: data.isbn || null,
          publisher: data.publisher || null,
          publishedAt: data.publishedAt ?? null,
          price: data.price,
          compareAtPrice: data.compareAtPrice ?? null,
          stockQuantity: data.stockQuantity ?? 0,
          status: data.status,
          coverImage: cover.value,
          isReadableOnline: data.isReadableOnline,
          metaTitle: data.metaTitle ?? null,
          metaDescription: data.metaDescription ?? null,
        },
      });

      // Sync relationships — replace the join rows with the submitted selection.
      await tx.bookAuthor.deleteMany({ where: { bookId: id } });
      await tx.categoryBook.deleteMany({ where: { bookId: id } });

      if (data.authorIds.length > 0) {
        await tx.bookAuthor.createMany({
          data: data.authorIds.map((authorId, index) => ({
            bookId: id,
            authorId,
            sortOrder: index,
          })),
        });
      }
      if (data.categoryIds.length > 0) {
        await tx.categoryBook.createMany({
          data: data.categoryIds.map((categoryId) => ({ bookId: id, categoryId })),
        });
      }
    });
  } catch (error) {
    console.error("[bookie] updateBookAction failed:", error);
    return { error: "Could not save the book. Please try again." };
  }

  refreshCatalogViews();
  redirect(`/admin/catalog/books/${id}?notice=updated`);
}

// ── Archive / restore ───────────────────────────────────────────────────────

export async function archiveBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/catalog/books?notice=not-found");

  try {
    await prisma.book.update({ where: { id }, data: { status: "ARCHIVED" } });
  } catch {
    redirect("/admin/catalog/books?notice=not-found");
  }

  refreshCatalogViews();
  redirect("/admin/catalog/books?notice=archived");
}

export async function restoreBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/catalog/books?notice=not-found");

  try {
    await prisma.book.update({ where: { id }, data: { status: "DRAFT" } });
  } catch {
    redirect("/admin/catalog/books?notice=not-found");
  }

  refreshCatalogViews();
  redirect("/admin/catalog/books?notice=restored");
}

// ── Delete ──────────────────────────────────────────────────────────────────

/**
 * Hard delete is only safe when nothing references the book historically.
 * `OrderItem` and `InventoryTransaction` deliberately do NOT cascade, so a
 * book with order/inventory history must be archived instead.
 */
export async function deleteBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) redirect("/admin/catalog/books?notice=not-found");

  try {
    const book = await prisma.book.findUnique({
      where: { id },
      select: { _count: { select: { orderItems: true, inventoryTransactions: true } } },
    });
    if (!book) redirect("/admin/catalog/books?notice=not-found");

    if (book._count.orderItems > 0 || book._count.inventoryTransactions > 0) {
      redirect("/admin/catalog/books?notice=in-use");
    }

    await prisma.book.delete({ where: { id } });
  } catch (error) {
    // Next.js redirects throw — let those through instead of masking them.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    console.error("[bookie] deleteBookAction failed:", error);
    redirect("/admin/catalog/books?notice=failed");
  }

  refreshCatalogViews();
  redirect("/admin/catalog/books?notice=deleted");
}
