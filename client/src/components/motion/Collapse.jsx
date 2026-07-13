import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Animates a height+opacity open/close instead of the panel just
// mount/unmounting instantly — used for the nav's dropdown and mobile menu,
// which previously snapped open and shut with no transition at all. Stays
// mounted through its own closing animation (`rendered` lags one tick
// behind `open`) so there's something left to animate before it's removed.
// Reduced motion skips straight to the target mount state.
export default function Collapse({ open, children, className, duration = 0.28 }) {
  const [rendered, setRendered] = useState(open);
  const ref = useRef(null);

  // Mounts the panel the instant it's asked to open — the effect below
  // can't animate anything until this DOM node actually exists.
  useEffect(() => {
    if (open) setRendered(true);
  }, [open]);

  // Keyed on `open` (not just `rendered`): if `open` flips back to true
  // while the close tween from a previous toggle is still mid-flight,
  // `rendered` never actually became false, so a version of this keyed
  // only on `rendered` would never re-fire — leaving the panel stuck at
  // whatever partial height the interrupted close left it at. Re-running on
  // every `open` change (and always killing the prior tween first) instead
  // animates smoothly from wherever it currently is, in either direction.
  useLayoutEffect(() => {
    if (!rendered) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    if (prefersReducedMotion()) {
      el.style.height = "auto";
      el.style.opacity = 1;
      if (!open) setRendered(false);
      return undefined;
    }

    let tween;
    if (open) {
      // Only force the collapsed starting point on a genuinely fresh mount
      // (no inline height yet) — if we're resuming from an interrupted
      // close, el already has a partial height/opacity to animate from,
      // and stomping that to 0 first would flash it shut before reopening.
      if (!el.style.height) {
        gsap.set(el, { height: 0, opacity: 0 });
      }
      const target = el.scrollHeight;
      tween = gsap.to(el, {
        height: target,
        opacity: 1,
        duration,
        ease: "power2.out",
        onComplete: () => {
          el.style.height = "auto";
        },
      });
    } else {
      tween = gsap.to(el, {
        height: 0,
        opacity: 0,
        duration,
        ease: "power2.in",
        onComplete: () => setRendered(false),
      });
    }
    return () => tween.kill();
  }, [open, rendered, duration]);

  if (!rendered) return null;
  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      {children}
    </div>
  );
}
