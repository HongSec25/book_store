import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

// Runs Lenis smooth-scroll for as long as the calling component is mounted,
// ticked off GSAP's own rAF loop so ScrollTrigger and Lenis never fight over
// frame timing. Scoped per-page (rather than app-wide) so only pages that
// opt into cinematic scrolling pay for it; native scroll elsewhere stays
// instant and predictable. No-ops under prefers-reduced-motion.
export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);
}
