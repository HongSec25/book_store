import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Tracks pointer position over `container` and drifts the returned ref's
// element toward it — the Shopify-Editions-style hero parallax, where
// different layers move at different depths as the cursor moves. Layers are
// separate DOM nodes from whatever CSS float/rotate animation they already
// carry (e.g. HeroStack's infinite float), so this only ever touches the
// wrapping layer's own transform and never fights an existing animation on
// the same element. No-ops under prefers-reduced-motion, and naturally does
// nothing on touch devices since there's no mousemove to react to.
export function useParallax({ container, depth = 20 }) {
  const layerRef = useRef(null);

  useEffect(() => {
    const containerEl = container?.current;
    const layer = layerRef.current;
    if (!containerEl || !layer || prefersReducedMotion()) return undefined;

    const xTo = gsap.quickTo(layer, "x", { duration: 0.7, ease: "power3.out" });
    const yTo = gsap.quickTo(layer, "y", { duration: 0.7, ease: "power3.out" });

    function onMove(e) {
      const rect = containerEl.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      xTo(px * depth);
      yTo(py * depth);
    }
    function onLeave() {
      xTo(0);
      yTo(0);
    }

    containerEl.addEventListener("mousemove", onMove);
    containerEl.addEventListener("mouseleave", onLeave);
    return () => {
      containerEl.removeEventListener("mousemove", onMove);
      containerEl.removeEventListener("mouseleave", onLeave);
    };
  }, [container, depth]);

  return layerRef;
}
