import { useEffect, useRef } from "react";
import SplitType from "split-type";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Splits a headline into lines and animates them in with a staggered mask
// reveal on mount — used for above-the-fold copy that shouldn't wait on
// scroll. Falls back to plain static text under prefers-reduced-motion.
export default function SplitHeading({ as: Tag = "h1", className, children, delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    const split = new SplitType(el, { types: "lines", tagName: "span" });
    // Each line span becomes the overflow-hidden mask; its text is re-wrapped
    // in an inner span so that inner element (not the mask itself) is what
    // translates up into view.
    const inners = split.lines.map((line) => {
      line.style.overflow = "hidden";
      line.style.display = "block";
      const inner = document.createElement("span");
      inner.style.display = "block";
      inner.innerHTML = line.innerHTML;
      line.innerHTML = "";
      line.appendChild(inner);
      return inner;
    });

    const tween = gsap.fromTo(
      inners,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.08, delay }
    );

    return () => {
      tween.kill();
      split.revert();
    };
  }, [children, delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
