import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!?#*+-";

// Steps the element's textContent through random glyphs, revealing the real
// characters left-to-right as it goes — like a hidden truth resolving
// itself, rather than the text just fading or sliding in. Runs off
// requestAnimationFrame directly (no GSAP text plugin needed — that's a
// paid Club GSAP add-on we don't have). Returns a cleanup that cancels the
// frame loop if the component unmounts mid-scramble.
function scramble(el, finalText, duration) {
  const chars = finalText.split("");
  const frameRate = 1000 / 30;
  const totalFrames = Math.round(duration / frameRate);
  let frame = 0;
  let lastTime = 0;
  let rafId;

  function step(now) {
    if (now - lastTime < frameRate) {
      rafId = requestAnimationFrame(step);
      return;
    }
    lastTime = now;
    frame++;
    const revealCount = Math.floor((frame / totalFrames) * chars.length * 1.4);
    let output = "";
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === " ") {
        output += " ";
      } else if (i < revealCount) {
        output += chars[i];
      } else {
        output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
    }
    el.textContent = output;
    if (revealCount < chars.length) {
      rafId = requestAnimationFrame(step);
    } else {
      el.textContent = finalText;
    }
  }

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
}

// Plays once on mount — meant for above-the-fold titles (same usage
// pattern as SplitHeading), not scroll-triggered. Reduced motion just
// renders the real text immediately, since the effect that would overwrite
// it with scrambled glyphs never runs.
export default function ScrambleText({ as: Tag = "span", className, children, duration = 900 }) {
  const ref = useRef(null);
  const text = typeof children === "string" ? children : "";

  useEffect(() => {
    const el = ref.current;
    if (!el || !text || prefersReducedMotion()) return undefined;
    return scramble(el, text, duration);
  }, [text, duration]);

  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
