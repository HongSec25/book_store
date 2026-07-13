import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
}
const motifs = ["moon", "crack", "wave", "dots", "web", "bramble"];
function pickMotif(book) {
    if (book.genreIds.includes("g-gothic"))
        return "web";
    if (book.genreIds.includes("g-folk"))
        return "bramble";
    if (book.genreIds.includes("g-scifi"))
        return "dots";
    if (book.genreIds.includes("g-weird"))
        return "crack";
    if (book.genreIds.includes("g-fantasy"))
        return "moon";
    return motifs[hashString(book.id) % motifs.length];
}
function shade(hex, amt) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return `rgb(${r}, ${g}, ${b})`;
}
// Motifs are tagged data-draw="stroke" (traced in via stroke-dashoffset, like
// a hand sketching the line) or data-draw="fill" (faded in, since a filled
// shape has no path length to trace) so CoverArt's effect below can animate
// each piece appropriately without caring which motif it ended up with.
function MotifShape({ motif, id, accent }) {
    switch (motif) {
        case "moon":
            return <circle cx="150" cy="70" r="34" fill={accent} opacity="0.85" data-draw="fill"/>;
        case "crack":
            return (<path d="M20 0 L90 110 L60 130 L140 220 L110 240 L170 300" stroke={accent} strokeWidth="3" fill="none" opacity="0.7" data-draw="stroke"/>);
        case "wave":
            return (<path d="M-10 200 Q 40 170 90 200 T 190 200 T 290 200 V300 H-10 Z" fill={accent} opacity="0.5" data-draw="fill"/>);
        case "dots":
            return (<g fill={accent} opacity="0.7">
          {Array.from({ length: 24 }, (_, i) => {
                    const seed = hashString(id + i);
                    const cx = (seed % 200);
                    const cy = ((seed >> 8) % 300);
                    const r = 1.5 + (seed % 3);
                    return <circle key={i} cx={cx} cy={cy} r={r} data-draw="fill"/>;
                })}
        </g>);
        case "web":
            return (<g stroke={accent} strokeWidth="1.2" fill="none" opacity="0.6">
          <circle cx="100" cy="150" r="30" data-draw="stroke"/>
          <circle cx="100" cy="150" r="55" data-draw="stroke"/>
          <circle cx="100" cy="150" r="80" data-draw="stroke"/>
          {[0, 45, 90, 135].map((deg) => (<line key={deg} x1="100" y1="150" x2={100 + 90 * Math.cos((deg * Math.PI) / 180)} y2={150 + 90 * Math.sin((deg * Math.PI) / 180)} data-draw="stroke"/>))}
        </g>);
        case "bramble":
            return (<g stroke={accent} strokeWidth="2" fill="none" opacity="0.65" strokeLinecap="round">
          <path d="M0 300 C 40 220 20 160 60 90" data-draw="stroke"/>
          <path d="M60 90 L40 70 M60 90 L80 65 M45 150 L20 140 M45 150 L70 135" data-draw="stroke"/>
          <path d="M200 300 C 160 230 180 170 140 100" data-draw="stroke"/>
          <path d="M140 100 L120 80 M140 100 L160 75" data-draw="stroke"/>
        </g>);
    }
}
export default function CoverArt({ book }) {
    const motif = pickMotif(book);
    const light = shade(book.coverColor, 60);
    const dark = shade(book.coverColor, -50);
    const gradId = `grad-${book.id}`;
    const grainId = `grain-${book.id}`;
    const svgRef = useRef(null);

    // The first time this placeholder scrolls into view, the motif traces
    // itself in — stroked lines (crack/web/bramble) draw along their own
    // path length, filled shapes (moon/wave/dots) fade in — echoing a sketch
    // materializing rather than an image just popping in. Runs once; a
    // reduced-motion visitor just sees the finished motif immediately, since
    // this effect never touches its opacity/dash state in that case.
    useEffect(() => {
        if (prefersReducedMotion()) return undefined;
        const svg = svgRef.current;
        if (!svg) return undefined;

        const strokeEls = svg.querySelectorAll('[data-draw="stroke"]');
        const fillEls = svg.querySelectorAll('[data-draw="fill"]');

        strokeEls.forEach((el) => {
            const length = el.getTotalLength();
            el.style.strokeDasharray = length;
            el.style.strokeDashoffset = length;
        });
        gsap.set(fillEls, { opacity: 0 });

        const tl = gsap.timeline({
            scrollTrigger: { trigger: svg, start: "top 85%", once: true },
        });
        tl.to(strokeEls, { strokeDashoffset: 0, duration: 1, ease: "power2.out", stagger: 0.15 }, 0).to(
            fillEls,
            { opacity: 1, duration: 0.5, ease: "power1.out", stagger: 0.04 },
            0.15
        );

        return () => tl.scrollTrigger?.kill();
    }, [book.id]);

    return (<svg ref={svgRef} viewBox="0 0 200 300" className="h-full w-full" role="img" aria-label={`Cover of ${book.title}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light}/>
          <stop offset="100%" stopColor={dark}/>
        </linearGradient>
        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={hashString(book.id) % 100} result="noise"/>
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0"/>
        </filter>
      </defs>
      <rect width="200" height="300" fill={`url(#${gradId})`}/>
      <rect width="200" height="300" filter={`url(#${grainId})`}/>
      <MotifShape motif={motif} id={book.id} accent={light}/>
      <rect width="200" height="300" fill="black" opacity="0.08"/>
    </svg>);
}
