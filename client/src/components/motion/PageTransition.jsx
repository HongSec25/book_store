import { useLayoutEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Plays a quick fade + rise on every route change and resets scroll to the
// top, so navigating between pages (nav links, back links, footer) reads as
// one continuous, considered motion instead of a hard cut — echoing the
// book-cover-open transition without needing a two-tree exit animation.
// Mount this keyed by pathname so React swaps content first, then this
// plays the entrance on the fresh DOM.
export default function PageTransition({ children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    // Opacity-only (no y-translate): BookDetailPage's cover-open transition
    // measures its target rect off this same subtree in its own layout
    // effect, and a translate here would shift that rect out from under it.
    const tween = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power1.out" });
    return () => tween.kill();
  }, []);

  return <div ref={ref}>{children}</div>;
}
