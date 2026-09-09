/**
 * Recently-viewed book tracking (client-side only — guests have no account).
 *
 * IDs are stored in localStorage with no duplicates and a capped length.
 * The Home section reads these; future book-detail pages (B3) call
 * `recordRecentlyViewed` when a book is opened.
 *
 * These functions touch localStorage and must only be called from the client
 * (e.g. inside useEffect / event handlers).
 */

const STORAGE_KEY = "bookie:recently-viewed";
const MAX_IDS = 12;

/** Window event dispatched after the list changes (same-tab reactivity). */
export const RECENTLY_VIEWED_EVENT = "bookie:recently-viewed-change";

function readIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_IDS)
      : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_IDS)));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch {
    // Storage can be unavailable (private mode / quota) — tracking is best-effort.
  }
}

/** Current recently-viewed book IDs, most recent first. */
export function getRecentlyViewedIds(): string[] {
  return readIds();
}

/** Record a book view: moves the id to the front, dedupes, caps the list. */
export function recordRecentlyViewed(bookId: string): string[] {
  const next = [bookId, ...readIds().filter((id) => id !== bookId)].slice(0, MAX_IDS);
  writeIds(next);
  return next;
}

/** Remove a single id (e.g. a book that no longer exists). */
export function clearRecentlyViewed(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}