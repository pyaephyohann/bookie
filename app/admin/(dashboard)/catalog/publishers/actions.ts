"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fd, publisherRenameSchema, toFieldErrors, type CatalogActionState } from "@/lib/admin/catalog";

/**
 * Publisher mutations (A3).
 *
 * There is no `Publisher` model — `Book.publisher` is a plain string column, so
 * "publisher management" means safely renaming or clearing that string across
 * the books that use it. Nothing else in the schema is touched.
 */

function refreshCatalogViews() {
  revalidatePath("/", "layout");
}

export async function renamePublisherAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requireAdmin();

  const parsed = publisherRenameSchema.safeParse({
    current: fd(formData, "current"),
    name: fd(formData, "name"),
  });

  if (!parsed.success) {
    return {
      error: "Please enter a valid publisher name.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { current, name } = parsed.data;
  if (current === name) return { success: "No changes to save." };

  try {
    const existing = await prisma.book.count({ where: { publisher: name } });
    if (existing > 0) {
      return {
        error: `"${name}" already exists. Renaming would merge the two publishers.`,
        fieldErrors: { name: "Publisher name already in use" },
      };
    }

    const result = await prisma.book.updateMany({
      where: { publisher: current },
      data: { publisher: name },
    });

    if (result.count === 0) {
      return { error: "That publisher no longer exists." };
    }
  } catch (error) {
    console.error("[bookie] renamePublisherAction failed:", error);
    return { error: "Could not rename the publisher. Please try again." };
  }

  refreshCatalogViews();
  redirect("/admin/catalog/publishers?notice=renamed");
}

export async function clearPublisherAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = fd(formData, "name");
  if (!name) redirect("/admin/catalog/publishers?notice=not-found");

  try {
    await prisma.book.updateMany({ where: { publisher: name }, data: { publisher: null } });
  } catch (error) {
    console.error("[bookie] clearPublisherAction failed:", error);
    redirect("/admin/catalog/publishers?notice=failed");
  }

  refreshCatalogViews();
  redirect("/admin/catalog/publishers?notice=cleared");
}
