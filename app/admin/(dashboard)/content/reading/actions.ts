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
import { saveReadingFile, removeReadingFile } from "@/lib/admin/uploads";
import { isCloudinaryUrl } from "@/lib/cloudinary";

function rawFormText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseReadingForm(formData: FormData, readingFile: File | null) {
  // If a file was uploaded, use it as the file URL
  const fileUrl = fd(formData, "fileUrl");
  
  // If a file is being uploaded, we'll handle it separately
  // For now, validate the form fields
  const parsed = readingContentSchema.safeParse({
    bookId: fd(formData, "bookId"),
    mode: fd(formData, "mode"),
    content: rawFormText(formData, "content"),
    fileUrl: readingFile ? "placeholder" : fileUrl, // Temp placeholder if file uploaded
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
  
  // Check if a file was uploaded
  const readingFile = formData.get("readingFile") as File | null;
  const hasFileUpload = readingFile && readingFile.size > 0;
  
  const parsed = parseReadingForm(formData, hasFileUpload ? readingFile : null);
  if (!parsed.ok) return parsed.state;

  const { bookId, contentType, content, isReadableOnline } = parsed.data;
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true, slug: true } });
  if (!book) return { error: "That book no longer exists." };

  // Get existing content to clean up old file if replacing
  const existingContent = await prisma.bookContent.findUnique({
    where: { bookId },
    select: { fileUrl: true },
  });

  let finalFileUrl: string | null = parsed.data.fileUrl;

  // Handle file upload if present
  if (hasFileUpload) {
    const mode = parsed.data.mode as "PDF" | "EPUB" | "OTHER";
    const fileType = mode === "PDF" ? "pdf" : mode === "EPUB" ? "epub" : "pdf";
    
    const uploadResult = await saveReadingFile(readingFile, fileType);
    if (!uploadResult.ok) {
      return { error: `File upload failed: ${uploadResult.message}` };
    }
    finalFileUrl = uploadResult.url;
    
    // Delete old file if it was a Cloudinary upload
    if (existingContent?.fileUrl && isCloudinaryUrl(existingContent.fileUrl)) {
      await removeReadingFile(existingContent.fileUrl);
    }
  } else if (finalFileUrl && finalFileUrl !== existingContent?.fileUrl) {
    // If URL changed and old was Cloudinary, delete old
    if (existingContent?.fileUrl && isCloudinaryUrl(existingContent.fileUrl)) {
      await removeReadingFile(existingContent.fileUrl);
    }
  }

  try {
    await prisma.$transaction([
      prisma.bookContent.upsert({
        where: { bookId },
        create: { bookId, contentType, content, fileUrl: finalFileUrl },
        update: { contentType, content, fileUrl: finalFileUrl },
      }),
      prisma.book.update({ where: { id: bookId }, data: { isReadableOnline } }),
    ]);
  } catch (error) {
    console.error("[bookie] saveReadingContentAction failed:", error);
    // If DB failed but we uploaded a file, try to clean it up
    if (hasFileUpload && finalFileUrl && isCloudinaryUrl(finalFileUrl)) {
      await removeReadingFile(finalFileUrl);
    }
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

  // Get existing content to clean up Cloudinary file
  const existingContent = await prisma.bookContent.findUnique({
    where: { bookId },
    select: { fileUrl: true },
  });

  try {
    await prisma.$transaction([
      prisma.bookContent.deleteMany({ where: { bookId } }),
      prisma.book.update({ where: { id: bookId }, data: { isReadableOnline: false } }),
    ]);
    
    // Delete Cloudinary file after successful DB delete
    if (existingContent?.fileUrl && isCloudinaryUrl(existingContent.fileUrl)) {
      await removeReadingFile(existingContent.fileUrl);
    }
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
