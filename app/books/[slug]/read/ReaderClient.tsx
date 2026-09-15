"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ExternalLink,
  FileText,
  Minus,
  Plus,
  Shrink,
  Expand,
} from "lucide-react";
import dynamic from "next/dynamic";

const EpubReader = dynamic(
  () => import("@/components/reader/EpubReader").then((mod) => mod.EpubReader),
  { ssr: false },
);
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  getReaderSettingsServerSnapshot,
  getReaderSettingsSnapshot,
  loadReaderProgress,
  READER_FONT_MAX,
  READER_FONT_MIN,
  READER_FONT_STEP,
  READER_WIDTH_NARROW,
  READER_WIDTH_WIDE,
  saveReaderProgress,
  subscribeReaderSettings,
  updateReaderSettings,
} from "@/lib/reader-progress";

// ── Types (server-serialised, minimal exposure) ────────────────────────────

export interface ReaderBookData {
  slug: string;
  title: string;
  authors: string[];
  contentType: string;
  fileUrl: string | null;
  content: string | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ReaderClient({ book }: { book: ReaderBookData }) {
  const reduce = useReducedMotion() ?? false;

  // Reader settings live in a useSyncExternalStore (localStorage-backed),
  // following the project's external-store pattern — SSR-safe by default.
  const settings = useSyncExternalStore(
    subscribeReaderSettings,
    getReaderSettingsSnapshot,
    getReaderSettingsServerSnapshot,
  );

  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);
  const lastSave = useRef(0);

  // Detect whether the stored content is HTML or plain text.
  const contentIsHtml = useMemo(() => /<[a-z][\s\S]*>/i.test(book.content ?? ""), [book.content]);

  // ── Scroll progress + position restore/save ─────────────────────────────

  useEffect(() => {
    const savePosition = () => {
      const now = Date.now();
      if (now - lastSave.current < 500) return;
      lastSave.current = now;
      saveReaderProgress(book.slug, window.scrollY);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const top = window.scrollY;
        setProgress(max > 0 ? Math.min(100, Math.max(0, (top / max) * 100)) : 0);
        savePosition();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", savePosition);

    // Restore the last reading position (client-side only — hydration safe).
    const saved = loadReaderProgress(book.slug);
    if (saved !== null) {
      window.scrollTo(0, saved);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", savePosition);
      saveReaderProgress(book.slug, window.scrollY);
    };
  }, [book.slug]);

  // ── Controls ────────────────────────────────────────────────────────────

  const adjustFontSize = useCallback(
    (delta: number) => {
      updateReaderSettings({
        ...settings,
        fontSize: Math.min(
          READER_FONT_MAX,
          Math.max(READER_FONT_MIN, settings.fontSize + delta),
        ),
      });
    },
    [settings],
  );

  const toggleWidth = useCallback(() => {
    updateReaderSettings({
      ...settings,
      widthCh: settings.widthCh === READER_WIDTH_NARROW ? READER_WIDTH_WIDE : READER_WIDTH_NARROW,
    });
  }, [settings]);

  // Detect dark mode for EPUB theming
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const authorLabel = book.authors.length > 0 ? book.authors.join(", ") : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sticky reader header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        {/* Scroll progress bar */}
        <div
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-0.5 w-full bg-border-subtle"
        >
          <div
            className="h-full bg-brand transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:px-4">
          {/* Exit */}
          <Link
            href={`/books/${book.slug}`}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-control px-2 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
          >
            <ChevronLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Book</span>
          </Link>

          <span aria-hidden className="h-5 w-px shrink-0 bg-border" />

          {/* Title */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-semibold text-text" title={book.title}>
              {book.title}
            </p>
            {authorLabel && (
              <p className="truncate text-caption text-text-muted" title={authorLabel}>
                {authorLabel}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => adjustFontSize(-READER_FONT_STEP)}
              disabled={settings.fontSize <= READER_FONT_MIN}
              aria-label="Decrease font size"
              className="inline-flex size-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span
              aria-live="polite"
              className="w-9 text-center text-caption font-medium tabular-nums text-text-muted"
            >
              {settings.fontSize}px
            </span>
            <button
              type="button"
              onClick={() => adjustFontSize(READER_FONT_STEP)}
              disabled={settings.fontSize >= READER_FONT_MAX}
              aria-label="Increase font size"
              className="inline-flex size-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggleWidth}
              aria-label={
                settings.widthCh === READER_WIDTH_NARROW
                  ? "Widen reading column"
                  : "Narrow reading column"
              }
              className="ml-1 inline-flex size-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
            >
              {settings.widthCh === READER_WIDTH_NARROW ? (
                <Expand className="size-4" aria-hidden />
              ) : (
                <Shrink className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Reading content */}
      <main className="flex-1 py-10 sm:py-14">
        <motion.article
          initial={reduce ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="reader-prose mx-auto px-5 sm:px-6"
          style={{ maxWidth: `${settings.widthCh}ch`, fontSize: `${settings.fontSize}px` }}
        >
          {book.content ? (
            contentIsHtml ? (
              // Admin-authored BookContent (HTML) — rendered as-is inside the
              // scoped .reader-prose typography. No client-side rendering of
              // user input occurs here; content comes from the database.
              <div dangerouslySetInnerHTML={{ __html: book.content }} />
            ) : (
              <div className="whitespace-pre-line">{book.content}</div>
            )
          ) : book.fileUrl ? (
            <FileContent
              title={book.title}
              contentType={book.contentType}
              fileUrl={book.fileUrl}
              fontSize={settings.fontSize}
              isDark={isDark}
            />
          ) : null}
        </motion.article>
      </main>
    </div>
  );
}

// ── File-based content (PDF / EPUB) ────────────────────────────────────────

function FileContent({
  title,
  contentType,
  fileUrl,
  fontSize,
  isDark,
}: {
  title: string;
  contentType: string;
  fileUrl: string;
  fontSize: number;
  isDark: boolean;
}) {
  if (contentType === "PDF") {
    return (
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <iframe
          src={fileUrl}
          title={`${title} — PDF`}
          className="aspect-[3/4] w-full sm:aspect-[4/5]"
        />
        <p className="border-t border-border px-4 py-3 text-body-sm text-text-secondary">
          Having trouble viewing it?{" "}
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-text underline underline-offset-2"
          >
            Open the file in a new tab
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </p>
      </div>
    );
  }

  // EPUB — inline reader using epubjs (A9)
  if (contentType === "EPUB") {
    return (
      <EpubReader
        url={fileUrl}
        title={title}
        fontSize={fontSize}
        isDark={isDark}
      />
    );
  }

  // Other file formats can't be previewed natively in the browser.
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted">
        <FileText className="size-6 text-text-muted" aria-hidden />
      </span>
      <p className="text-body font-semibold text-text">
        {title} is provided as a {contentType} file
      </p>
      <p className="max-w-sm text-body-sm text-text-muted">
        This format can&apos;t be previewed in the browser. Download the file to
        read it in your favourite reader app.
      </p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-control bg-brand px-5 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
      >
        <BookOpen className="size-4" aria-hidden />
        Open {contentType} file
      </a>
    </div>
  );
}