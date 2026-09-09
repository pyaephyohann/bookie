/**
 * Client-side wishlist backed by localStorage.
 * Guests have no account — wishlist is device-local only.
 *
 * Pattern mirrors lib/recently-viewed.ts (useSyncExternalStore for SSR safety).
 */

const STORAGE_KEY = "bookie:wishlist";
const MAX_IDS = 100;

export const WISHLIST_EVENT = "bookie:wishlist-change";

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
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  } catch {
    // best-effort
  }
}

/** Current wishlist IDs. */
export function getWishlistIds(): string[] {
  return readIds();
}

/** Toggle a book in/out of the wishlist. Returns the new state. */
export function toggleWishlist(bookId: string): boolean {
  const ids = readIds();
  const index = ids.indexOf(bookId);
  if (index >= 0) {
    ids.splice(index, 1);
    writeIds(ids);
    return false;
  }
  writeIds([bookId, ...ids].slice(0, MAX_IDS));
  return true;
}

/** Check if a book is in the wishlist. */
export function isWishlisted(bookId: string): boolean {
  return readIds().includes(bookId);
}