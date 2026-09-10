import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReaderClient, type ReaderBookData } from "./ReaderClient";

interface ReaderPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const book = await prisma.book.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: { title: true },
    });
    if (!book) return { title: "Book Not Found — Bookie" };
    return {
      title: `Read ${book.title} — Bookie`,
      description: `Read ${book.title} online on Bookie.`,
    };
  } catch {
    return { title: "Read Online — Bookie" };
  }
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug } = await params;

  let book: ReaderBookData | null = null;
  let unavailableReason: "unavailable" | "no-content" | null = null;

  try {
    const record = await prisma.book.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        isReadableOnline: true,
        authors: {
          orderBy: { sortOrder: "asc" },
          select: { author: { select: { name: true } } },
        },
        readingContent: {
          select: {
            contentType: true,
            fileUrl: true,
            content: true,
          },
        },
      },
    });

    if (!record) {
      notFound();
    }

    if (!record.isReadableOnline) {
      unavailableReason = "unavailable";
    } else if (
      !record.readingContent ||
      (!record.readingContent.content && !record.readingContent.fileUrl)
    ) {
      unavailableReason = "no-content";
    } else {
      book = {
        slug: record.slug,
        title: record.title,
        authors: record.authors.map((a) => a.author.name),
        contentType: record.readingContent.contentType,
        fileUrl: record.readingContent.fileUrl,
        content: record.readingContent.content,
      };
    }
  } catch (error) {
    // Never leak database errors — show the friendly unavailable state.
    console.warn("[bookie] reader fetch failed:", error instanceof Error ? error.message : error);
    unavailableReason = "unavailable";
  }

  if (book) {
    return <ReaderClient book={book} />;
  }

  return <ReaderUnavailable slug={slug} reason={unavailableReason} />;
}

function ReaderUnavailable({
  slug,
  reason,
}: {
  slug: string;
  reason: "unavailable" | "no-content" | null;
}) {
  const title = "Reading not available";
  const description =
    reason === "no-content"
      ? "This book doesn\u2019t have readable content yet. Check back later."
      : "Online reading isn\u2019t available for this book. You can still browse it in the store.";
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-surface px-6 py-10">
        <p className="text-body font-semibold text-text">{title}</p>
        <p className="max-w-sm text-body-sm text-text-muted">{description}</p>
        <Link
          href={`/books/${slug}`}
          className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-control bg-brand px-5 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
        >
          Back to Book
        </Link>
      </div>
    </div>
  );
}