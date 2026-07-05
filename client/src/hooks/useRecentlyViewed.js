import { useEffect } from "react";

const STORAGE_KEY = "bookstore.recentlyViewed";
const MAX_ENTRIES = 12;

function readRecentlyViewed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Records `bookId` as viewed (most-recent-first, deduped, capped) whenever
 * it changes — call from a book detail page with the current book's id. */
export function useRecentlyViewed(bookId) {
  useEffect(() => {
    if (!bookId) return;
    const ids = readRecentlyViewed().filter((id) => id !== bookId);
    ids.unshift(bookId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
    } catch {
      // ignore quota errors
    }
  }, [bookId]);
}

/** Reads the recently-viewed id list for rendering elsewhere (e.g. the
 * homepage), optionally excluding one id (the book currently being viewed). */
export function getRecentlyViewedIds(excludeId) {
  return readRecentlyViewed().filter((id) => id !== excludeId);
}
