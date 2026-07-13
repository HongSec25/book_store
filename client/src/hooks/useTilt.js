import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// A physical-object hover tilt: the returned ref's element rotates in 3D
// toward the cursor (rotateX/rotateY) with a slight lift and scale, and —
// if `glareRef` is given — a highlight sweeps across that element tracking
// the same cursor position via CSS custom properties. Needs `perspective`
// set on an ancestor to actually read as 3D. No-ops under
// prefers-reduced-motion, and naturally inert on touch (no mousemove).
//
// Deliberately one gsap.to() per move with all four properties together,
// not four separate gsap.quickTo() instances: quickTo creates an
// independent tween per property, and GSAP's overwrite manager treats any
// new tween touching a transform component as replacing the *whole*
// transform on that element — so four independent quickTo calls each stomp
// the others, leaving only whichever one fired last. A single combined
// tween has no such conflict.
export function useTilt({ maxTilt = 14, liftY = -6, scale = 1.05, glareRef } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        rotateY: px * maxTilt,
        rotateX: -py * maxTilt,
        scale,
        y: liftY,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
      if (glareRef?.current) {
        glareRef.current.style.setProperty("--glare-x", `${(px + 0.5) * 100}%`);
        glareRef.current.style.setProperty("--glare-y", `${(py + 0.5) * 100}%`);
        gsap.to(glareRef.current, { opacity: 1, duration: 0.2, overwrite: "auto" });
      }
    }
    function onLeave() {
      gsap.to(el, { rotateX: 0, rotateY: 0, scale: 1, y: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
      if (glareRef?.current) gsap.to(glareRef.current, { opacity: 0, duration: 0.3, overwrite: "auto" });
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [maxTilt, liftY, scale, glareRef]);

  return ref;
}
