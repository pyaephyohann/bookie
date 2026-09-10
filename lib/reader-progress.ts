/**
 * Reader storage helpers for Bookie B9 (Online Reading).
 *
 * Client-side only: reading position and reader settings live in localStorage
 * (no database model — a guest reader must not need an account). All reads are
 * wrapped in try/catch and validated so malformed stored data can never break
 * the reader or cause SSR/hydration issues (reads happen only inside
 * `useEffect` / event handlers, never during render).
 */

const SETTINGS_KEY = "bookie:reader-settings";

const progressKey = (slug: string) => `bookie:reader-progress:${slug}`;

export interface ReaderSettings {
  /** Base font size in px for reading content. */
  fontSize: number;
  /** Reading column width in `ch`. */
  widthCh: number;
}

export const READER_FONT_MIN = 15;
export const READER_FONT_MAX = 26;
export const READER_FONT_STEP = 1;
export const READER_FONT_DEFAULT = 19;
export const READER_WIDTH_NARROW = 68;
export const READER_WIDTH_WIDE = 88;

// ── Reading progress ───────────────────────────────────────────────────────

/** Save the current scroll position (px from top) for a book slug. */
export function saveReaderProgress(slug: string, top: number): void {
  if (typeof window === "undefined") return;
  try {
    if (!Number.isFinite(top) || top < 0) return;
    localStorage.setItem(
      progressKey(slug),
      JSON.stringify({ top: Math.round(top), updatedAt: Date.now() }),
    );
  } catch {
    // Storage unavailable (private mode / quota) — reading still works.
  }
}

/**
 * Load the saved scroll position for a book slug.
 * Returns `null` when nothing is stored or the stored value is malformed.
 */
export function loadReaderProgress(slug: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(progressKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { top?: unknown };
    if (typeof parsed.top !== "number" || !Number.isFinite(parsed.top) || parsed.top < 0) {
      return null;
    }
    return parsed.top;
  } catch {
    return null;
  }
}

// ── Reader settings (font size + width) ────────────────────────────────────

export function loadReaderSettings(): ReaderSettings {
  const fallback: ReaderSettings = {
    fontSize: READER_FONT_DEFAULT,
    widthCh: READER_WIDTH_NARROW,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
    const fontSize =
      typeof parsed.fontSize === "number" && Number.isFinite(parsed.fontSize)
        ? Math.min(READER_FONT_MAX, Math.max(READER_FONT_MIN, parsed.fontSize))
        : READER_FONT_DEFAULT;
    const widthCh =
      typeof parsed.widthCh === "number" && Number.isFinite(parsed.widthCh)
        ? Math.min(READER_WIDTH_WIDE, Math.max(40, parsed.widthCh))
        : READER_WIDTH_NARROW;
    return { fontSize, widthCh };
  } catch {
    return fallback;
  }
}

export function saveReaderSettings(settings: ReaderSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable — settings simply won't persist.
  }
}

// ── Settings store (useSyncExternalStore, project convention) ──────────────
// Follows the ThemeContext / wishlist / recently-viewed pattern: a stable
// cached snapshot is returned until the settings actually change, which keeps
// React's useSyncExternalStore from looping.

const settingsListeners = new Set<() => void>();
let cachedSettings: ReaderSettings | null = null;

function notifySettingsListeners(): void {
  settingsListeners.forEach((listener) => listener());
}

/** Client snapshot — cached and only replaced when settings change. */
export function getReaderSettingsSnapshot(): ReaderSettings {
  if (cachedSettings === null) {
    cachedSettings = readSettings();
  }
  return cachedSettings;
}

/** Server/hydration snapshot — a stable constant, never recreated. */
export function getReaderSettingsServerSnapshot(): ReaderSettings {
  return { fontSize: READER_FONT_DEFAULT, widthCh: READER_WIDTH_NARROW };
}

export function subscribeReaderSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
}

/** Apply new settings: update the cache, persist and notify subscribers. */
export function updateReaderSettings(next: ReaderSettings): void {
  cachedSettings = next;
  saveReaderSettings(next);
  notifySettingsListeners();
}

/** Internal read used by the snapshot (validated, malformed-safe). */
function readSettings(): ReaderSettings {
  return loadReaderSettings();
}