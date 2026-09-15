"use client";

import {
  BookOpen,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Inline EPUB reader component (A9).
 *
 * Uses epubjs to parse and render an EPUB file directly in the browser.
 * Pre-fetches the EPUB as an ArrayBuffer to avoid URL-relative fetch
 * issues with Cloudinary raw file URLs.
 *
 * Uses paginated flow for reliable section-by-section rendering with
 * keyboard/touch navigation.
 */

interface EpubReaderProps {
  /** Validated Cloudinary URL for the EPUB file. */
  url: string;
  /** Book title for the accessible label. */
  title: string;
  /** Current font size from reader settings (px). */
  fontSize?: number;
  /** Whether the current theme is dark. */
  isDark?: boolean;
}

type ReaderState = "loading" | "ready" | "error";

export function EpubReader({
  url,
  title,
  fontSize = 19,
  isDark = false,
}: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<unknown | null>(null);
  const renditionRef = useRef<unknown | null>(null);
  const [state, setState] = useState<ReaderState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);

  const updateNavState = useCallback(() => {
    const rendition = renditionRef.current as {
      location: { start: { displayed: { page: number; total: number } } };
    } | null;
    if (!rendition) return;
    try {
      const loc = rendition.location;
      if (loc?.start?.displayed) {
        const { page, total } = loc.start.displayed;
        setCanGoPrev(page > 1);
        setCanGoNext(page < total);
      }
    } catch {
      // ignore
    }
  }, []);

  const goNext = useCallback(() => {
    const rendition = renditionRef.current as {
      next: () => Promise<void>;
    } | null;
    rendition?.next().then(updateNavState);
  }, [updateNavState]);

  const goPrev = useCallback(() => {
    const rendition = renditionRef.current as {
      prev: () => Promise<void>;
    } | null;
    rendition?.prev().then(updateNavState);
  }, [updateNavState]);

  // ── Initialize epub.js ──────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    // Clean up any previous instance (StrictMode double-mount protection)
    cleanupRefs(renditionRef, bookRef);

    setState("loading");
    setErrorMessage("");
    setCanGoPrev(false);
    setCanGoNext(true);

    void initEpub(url, containerRef.current, fontSize, isDark, {
      cancelled: () => cancelled,
      bookRef,
      renditionRef,
      onReady: () => {
        setState("ready");
        updateNavState();
      },
      onError: (msg: string) => {
        setState("error");
        setErrorMessage(msg);
      },
      onLocationChanged: updateNavState,
    });

    return () => {
      cancelled = true;
      cleanupRefs(renditionRef, bookRef);
    };
  }, [url, fontSize, isDark, updateNavState]);

  // ── Font size updates ──────────────────────────────────────────────────

  useEffect(() => {
    const rendition = renditionRef.current as {
      themes: { fontSize: (size: string) => void };
    } | null;
    if (rendition && state === "ready") {
      try {
        rendition.themes.fontSize(`${fontSize}px`);
      } catch {
        // ignore — rendition may have been destroyed
      }
    }
  }, [fontSize, state]);

  // ── Dark mode updates ──────────────────────────────────────────────────

  useEffect(() => {
    const rendition = renditionRef.current as {
      themes: { select: (name: string) => void };
    } | null;
    if (rendition && state === "ready") {
      try {
        rendition.themes.select(isDark ? "bookie-dark" : "bookie-light");
      } catch {
        // ignore
      }
    }
  }, [isDark, state]);

  // ── Keyboard navigation ────────────────────────────────────────────────

  useEffect(() => {
    if (state !== "ready") return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state, goNext, goPrev]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-error-muted">
          <AlertCircle className="size-6 text-error" aria-hidden />
        </span>
        <p className="text-body font-semibold text-text">
          Could not load the EPUB
        </p>
        <p className="max-w-sm text-body-sm text-text-muted">
          {errorMessage || "The file may be corrupted or unsupported."}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-control bg-brand px-5 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
        >
          <BookOpen className="size-4" aria-hidden />
          Download EPUB file
        </a>
      </div>
    );
  }

  return (
    <div className="epub-reader-wrapper overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      {/* Loading overlay */}
      {state === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center gap-3 bg-surface/80 py-20 backdrop-blur-sm">
          <Loader2
            className="size-8 animate-spin text-text-muted"
            aria-hidden
          />
          <p className="text-body-sm text-text-muted">Loading EPUB…</p>
        </div>
      )}

      {/* Reader area */}
      <div
        ref={containerRef}
        className="epub-reader-container"
        aria-label={`${title} — EPUB`}
        style={{
          height: "75vh",
          minHeight: "500px",
        }}
      />

      {/* Navigation bar */}
      {state === "ready" && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary transition-colors hover:text-text disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </button>
          <span className="text-body-sm text-text-muted">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-text"
            >
              Open file
            </a>
          </span>
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary transition-colors hover:text-text disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers (module-level, outside the component) ──────────────────────────

function cleanupRefs(
  renditionRef: React.RefObject<unknown | null>,
  bookRef: React.RefObject<unknown | null>,
) {
  if (renditionRef.current) {
    try {
      (renditionRef.current as { destroy: () => void }).destroy();
    } catch {
      // ignore
    }
    renditionRef.current = null;
  }
  if (bookRef.current) {
    try {
      (bookRef.current as { destroy: () => void }).destroy();
    } catch {
      // ignore
    }
    bookRef.current = null;
  }
}

async function initEpub(
  url: string,
  container: HTMLElement,
  fontSize: number,
  isDark: boolean,
  callbacks: {
    cancelled: () => boolean;
    bookRef: React.RefObject<unknown | null>;
    renditionRef: React.RefObject<unknown | null>;
    onReady: () => void;
    onError: (message: string) => void;
    onLocationChanged: () => void;
  },
) {
  try {
    // Dynamic import — epubjs uses browser APIs (DOM, fetch) and must
    // never run during server rendering or SSR.
    const ePub = (await import("epubjs")).default;

    if (callbacks.cancelled()) return;

    // Pre-fetch the EPUB as an ArrayBuffer to avoid URL-relative fetch
    // issues (epubjs may try to resolve META-INF/container.xml relative
    // to the URL, which fails for Cloudinary raw file URLs).
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch EPUB: ${response.status} ${response.statusText}`,
      );
    }
    const arrayBuffer = await response.arrayBuffer();

    if (callbacks.cancelled()) return;

    // Pass the ArrayBuffer directly — epubjs handles this correctly
    const book = ePub(arrayBuffer);
    callbacks.bookRef.current = book;

    // Wait for the book to be fully opened
    await book.ready;

    if (callbacks.cancelled()) {
      book.destroy();
      return;
    }

    // Use paginated flow for reliable section-by-section rendering.
    // Each section is rendered in a fixed viewport with prev/next navigation.
    const rendition = book.renderTo(container, {
      width: "100%",
      height: "100%",
      spread: "none",
      flow: "paginated",
      allowScriptedContent: false,
    });

    callbacks.renditionRef.current = rendition;

    // Apply initial font size
    rendition.themes.fontSize(`${fontSize}px`);

    // Register themes for light/dark mode
    rendition.themes.register("bookie-dark", {
      body: {
        color: "#fafafa !important",
        background: "#161617 !important",
      },
      a: {
        color: "#60a5fa !important",
      },
    });

    rendition.themes.register("bookie-light", {
      body: {
        color: "#000000 !important",
        background: "#ffffff !important",
      },
    });

    // Apply theme based on current mode
    rendition.themes.select(isDark ? "bookie-dark" : "bookie-light");

    // Track location changes for navigation state
    rendition.on("relocated", () => {
      callbacks.onLocationChanged();
    });

    // Display the EPUB (starts at the beginning)
    await rendition.display();

    if (callbacks.cancelled()) {
      rendition.destroy();
      book.destroy();
      return;
    }

    callbacks.onReady();
  } catch (error) {
    if (callbacks.cancelled()) return;
    console.error("[bookie] EPUB initialization failed:", error);
    callbacks.onError(
      error instanceof Error
        ? error.message
        : "Failed to load the EPUB file.",
    );
  }
}
