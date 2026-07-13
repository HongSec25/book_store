import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

const VARIANTS = {
  "fade": { from: { opacity: 0 }, to: { opacity: 1 } },
  "slide-up": { from: { opacity: 0, y: 48 }, to: { opacity: 1, y: 0 } },
  "slide-left": { from: { opacity: 0, x: 48 }, to: { opacity: 1, x: 0 } },
  "slide-right": { from: { opacity: 0, x: -48 }, to: { opacity: 1, x: 0 } },
  "scale": { from: { opacity: 0, scale: 0.92 }, to: { opacity: 1, scale: 1 } },
  "mask": { from: { opacity: 0, clipPath: "inset(0 0 100% 0)" }, to: { opacity: 1, clipPath: "inset(0 0 0% 0)" } },
};

// Reveals its children with a ScrollTrigger-driven animation the first time
// the section crosses into the viewport. `stagger` targets the immediate
// children individually instead of animating the wrapper as one block —
// used for grids/rows of cards. No-ops (renders children as-is, already
// visible) under prefers-reduced-motion.
export default function Reveal({
  as: Tag = "div",
  variant = "slide-up",
  stagger = false,
  amount = 0.06,
  delay = 0,
  duration = 0.9,
  className,
  style,
  children,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    const { from, to } = VARIANTS[variant] ?? VARIANTS["slide-up"];
    const targets = stagger ? Array.from(el.children) : el;

    const tween = gsap.fromTo(
      targets,
      from,
      {
        ...to,
        duration,
        delay,
        ease: "power3.out",
        stagger: stagger ? amount : 0,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [variant, stagger, amount, delay, duration]);

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
