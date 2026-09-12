"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  fd,
  readingContentSchema,
  toFieldErrors,
  type ContentActionState,
} from "@/lib/admin/content";
import { sanitizeReaderContent } from "@/lib/reading-content";

function rawFormText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseReadingForm(formData: FormData) {
  const parsed = readingContentSchema.safeParse({
    bookId: fd(formData, "bookId"),
    mode: fd(formData, "mode"),
    content: rawFormText(formData, "content"),
    fileUrl: fd(formData, "fileUrl"),
    isReadableOnline: formData.get("isReadableOnline") === "on" || formData.get("isReadableOnline") === "true",
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

  const data = parsed.data;
  const content = data.mode === "INLINE" ? sanitizeReaderContent(data.content) : null;
  if (data.mode === "INLINE" && !content?.trim()) {
    return {
      ok: false as const,
      state: {
        error: "The content is empty after unsafe markup was removed.",
        fieldErrors: { content: "Add readable text or safe formatting." },
      },
    };
  }

  return {
    ok: true as const,
    data: {
      ...data,
      content,
      fileUrl: data.mode === "INLINE" ? null : data.fileUrl,
      // The existing enum has no INLINE member. The reader uses content first.
      contentType: data.mode === "INLINE" ? "OTHER" : data.mode,
    },
  };
}

export async function saveReadingContentAction(
  _previous: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  await requireAdmin();
  const parsed = parseReadingForm(formData);
  if (!parsed.ok) return parsed.state;

  const { bookId, contentType, content, fileUrl, isReadableOnline } = parsed.data;
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true, slug: true } });
  if (!book) return { error: "That book no longer exists." };

  try {
    await prisma.$transaction([
      prisma.bookContent.upsert({
        where: { bookId },
        create: { bookId, contentType, content, fileUrl },
        update: { contentType, content, fileUrl },
      }),
      prisma.book.update({ where: { id: bookId }, data: { isReadableOnline } }),
    ]);
  } catch (error) {
    console.error("[bookie] saveReadingContentAction failed:", error);
    return { error: "Could not save reading content. Please try again." };
  }

  revalidatePath("/admin/content/reading");
  revalidatePath(`/admin/content/reading/${bookId}`);
  revalidatePath(`/books/${book.slug}`);
  revalidatePath(`/books/${book.slug}/read`);
  revalidatePath("/");
  redirect(`/admin/content/reading/${bookId}?notice=updated`);
}

export async function deleteReadingContentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const bookId = fd(formData, "bookId");
  if (!bookId) redirect("/admin/content/reading?notice=invalid");

  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true, slug: true } });
  if (!book) redirect("/admin/content/reading?notice=not-found");

  try {
    await prisma.$transaction([
      prisma.bookContent.deleteMany({ where: { bookId } }),
      prisma.book.update({ where: { id: bookId }, data: { isReadableOnline: false } }),
    ]);
  } catch (error) {
    console.error("[bookie] deleteReadingContentAction failed:", error);
    redirect(`/admin/content/reading/${bookId}?notice=failed`);
  }

  revalidatePath("/admin/content/reading");
  revalidatePath(`/admin/content/reading/${bookId}`);
  revalidatePath(`/books/${book.slug}`);
  revalidatePath(`/books/${book.slug}/read`);
  revalidatePath("/");
  redirect("/admin/content/reading?notice=deleted");
}
