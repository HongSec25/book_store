import { createContext, useContext, useRef, useCallback } from "react";

const BookTransitionContext = createContext(null);

// Captures the clicked book cover's on-screen rect + image src just before
// react-router navigates to its detail page, so BookDetailPage can pick it
// up and animate a clone from that exact position/size into the detail
// layout (a "the cover opens into the page" effect) instead of a hard cut.
// Held in a ref, not state — this is a write-once handoff between two route
// renders, not something that should trigger a re-render itself.
export function BookTransitionProvider({ children }) {
  const pendingRef = useRef(null);

  const capture = useCallback((slug, imgEl) => {
    if (!imgEl) return;
    const rect = imgEl.getBoundingClientRect();
    pendingRef.current = {
      slug,
      src: imgEl.currentSrc || imgEl.src,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    };
  }, []);

  // Detail page calls this once on mount to claim (and clear) the pending
  // transition — claiming is one-shot so a back/forward or refresh doesn't
  // replay a stale animation.
  const claim = useCallback((slug) => {
    const pending = pendingRef.current;
    if (!pending || pending.slug !== slug) return null;
    pendingRef.current = null;
    return pending;
  }, []);

  return (
    <BookTransitionContext.Provider value={{ capture, claim }}>
      {children}
    </BookTransitionContext.Provider>
  );
}

export function useBookTransition() {
  const ctx = useContext(BookTransitionContext);
  if (!ctx) throw new Error("useBookTransition must be used within BookTransitionProvider");
  return ctx;
}
