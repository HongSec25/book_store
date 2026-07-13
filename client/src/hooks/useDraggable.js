import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion";

// Free-drag via pointer events, clamped so the element's rendered box stays
// fully inside `bounds`'s rect. Deliberately its own wrapper element rather
// than reusing whatever node already carries a CSS keyframe float/rotate
// animation: driving x/y here on the SAME element GSAP/CSS already animates
// would silently fight it (see BookCard's tilt hook for the same lesson
// learned the hard way) — this stays a separate outer layer instead, so the
// float animation keeps running on the inner element completely untouched.
// A real user-initiated drag isn't automatic motion, so this intentionally
// still runs under prefers-reduced-motion.
export function useDraggable({ bounds } = {}) {
  const ref = useRef(null);
  const stateRef = useRef({ dragging: false, moved: false });
  const rafRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Clamping runs on every animation frame while dragging, not just on
    // pointermove — `bounds` (the hero row) has its own independent
    // mouse-parallax tween easing over ~0.7s, so it keeps drifting between
    // discrete pointer events. A clamp computed only on pointermove goes
    // stale in that gap; re-checking every frame keeps it honest.
    function tick() {
      const state = stateRef.current;
      if (!state.dragging) return;
      let nextX = state.desiredX;
      let nextY = state.desiredY;

      const boundsEl = bounds?.current;
      if (boundsEl) {
        const curX = gsap.getProperty(el, "x") || 0;
        const curY = gsap.getProperty(el, "y") || 0;
        const rect = el.getBoundingClientRect();
        const naturalLeft = rect.left - curX;
        const naturalTop = rect.top - curY;
        const b = boundsEl.getBoundingClientRect();
        const minX = b.left - naturalLeft;
        const maxX = b.right - naturalLeft - rect.width;
        const minY = b.top - naturalTop;
        const maxY = b.bottom - naturalTop - rect.height;
        nextX = Math.min(Math.max(nextX, minX), maxX);
        nextY = Math.min(Math.max(nextY, minY), maxY);
      }

      gsap.set(el, { x: nextX, y: nextY });
      rafRef.current = requestAnimationFrame(tick);
    }

    function onPointerDown(e) {
      const curX = gsap.getProperty(el, "x") || 0;
      const curY = gsap.getProperty(el, "y") || 0;
      stateRef.current = {
        dragging: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        baseX: curX,
        baseY: curY,
        desiredX: curX,
        desiredY: curY,
      };
      rafRef.current = requestAnimationFrame(tick);
      // No setPointerCapture: capturing on the outer wrapper retargets the
      // eventual synthesized "click" to it instead of the inner Link,
      // which silently ate navigation for a plain, no-movement click. Move
      // and up are already handled on `window` below regardless of which
      // element the pointer is physically over, so capture buys nothing.
    }

    function onPointerMove(e) {
      const state = stateRef.current;
      if (!state.dragging) return;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.moved = true;
      state.desiredX = state.baseX + dx;
      state.desiredY = state.baseY + dy;
    }

    function onPointerUp() {
      stateRef.current.dragging = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [bounds]);

  return { ref, wasDragged: () => stateRef.current.moved };
}
