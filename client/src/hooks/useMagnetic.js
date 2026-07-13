import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// The returned ref's element leans toward the cursor while hovered, then
// snaps back with a bit of overshoot on mouse-leave — a magnetic-feeling
// pull rather than a rigid hover state. No-ops under prefers-reduced-motion
// and naturally inert on touch (no mousemove).
export function useMagnetic({ strength = 0.4 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.3, ease: "power2.out", overwrite: "auto" });
    }
    function onLeave() {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return ref;
}
