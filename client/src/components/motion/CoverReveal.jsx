import { useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { useBookTransition } from "@/lib/book-transition-context";
import CoverArt from "@/components/CoverArt";
import FadeImage from "@/components/FadeImage";

// Renders a book's detail-page cover. If the visitor arrived by clicking a
// cover elsewhere on the site (BookTransitionProvider has a matching
// pending capture for this slug), it grows a cloned <img> from that click's
// exact screen position/size into this cover's slot — "the cover opens into
// the page" — instead of a hard route cut. Direct visits/refreshes (no
// pending capture) just render the cover normally.
export default function CoverReveal({ slug, book, src, className }) {
  const { claim } = useBookTransition();
  const boxRef = useRef(null);
  const pendingRef = useRef(undefined);
  if (pendingRef.current === undefined) {
    pendingRef.current = claim(slug);
  }
  const pending = pendingRef.current;
  const [revealed, setRevealed] = useState(!pending || prefersReducedMotion());

  useLayoutEffect(() => {
    if (!pending || prefersReducedMotion()) return undefined;
    const box = boxRef.current;
    if (!box) return undefined;

    // PageTransition also resets scroll on route change, but layout effects
    // fire child-before-parent, so its reset would run after we've already
    // measured `target` below — reset here first so the target rect is
    // relative to the page's resting scroll position, not wherever the
    // visitor happened to be scrolled to when they clicked.
    window.scrollTo({ top: 0, behavior: "instant" });

    const clone = document.createElement("img");
    clone.src = pending.src;
    clone.alt = "";
    Object.assign(clone.style, {
      position: "fixed",
      top: `${pending.rect.top}px`,
      left: `${pending.rect.left}px`,
      width: `${pending.rect.width}px`,
      height: `${pending.rect.height}px`,
      objectFit: "cover",
      borderRadius: "2px",
      zIndex: 60,
      boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
      pointerEvents: "none",
    });
    document.body.appendChild(clone);

    const target = box.getBoundingClientRect();

    const tween = gsap.to(clone, {
      top: target.top,
      left: target.left,
      width: target.width,
      height: target.height,
      duration: 0.7,
      ease: "power3.inOut",
      onComplete: () => {
        setRevealed(true);
        gsap.to(clone, { opacity: 0, duration: 0.15, onComplete: () => clone.remove() });
      },
    });

    return () => {
      tween.kill();
      clone.remove();
    };
  }, [pending]);

  return (
    <div ref={boxRef} className={className} style={{ opacity: revealed ? 1 : 0, transition: "opacity 150ms ease" }}>
      {src ? (
        <FadeImage src={src} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
      ) : (
        <CoverArt book={book} />
      )}
    </div>
  );
}
