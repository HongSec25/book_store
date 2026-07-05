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
function MotifShape({ motif, id, accent }) {
    switch (motif) {
        case "moon":
            return <circle cx="150" cy="70" r="34" fill={accent} opacity="0.85"/>;
        case "crack":
            return (<path d="M20 0 L90 110 L60 130 L140 220 L110 240 L170 300" stroke={accent} strokeWidth="3" fill="none" opacity="0.7"/>);
        case "wave":
            return (<path d="M-10 200 Q 40 170 90 200 T 190 200 T 290 200 V300 H-10 Z" fill={accent} opacity="0.5"/>);
        case "dots":
            return (<g fill={accent} opacity="0.7">
          {Array.from({ length: 24 }, (_, i) => {
                    const seed = hashString(id + i);
                    const cx = (seed % 200);
                    const cy = ((seed >> 8) % 300);
                    const r = 1.5 + (seed % 3);
                    return <circle key={i} cx={cx} cy={cy} r={r}/>;
                })}
        </g>);
        case "web":
            return (<g stroke={accent} strokeWidth="1.2" fill="none" opacity="0.6">
          <circle cx="100" cy="150" r="30"/>
          <circle cx="100" cy="150" r="55"/>
          <circle cx="100" cy="150" r="80"/>
          {[0, 45, 90, 135].map((deg) => (<line key={deg} x1="100" y1="150" x2={100 + 90 * Math.cos((deg * Math.PI) / 180)} y2={150 + 90 * Math.sin((deg * Math.PI) / 180)}/>))}
        </g>);
        case "bramble":
            return (<g stroke={accent} strokeWidth="2" fill="none" opacity="0.65" strokeLinecap="round">
          <path d="M0 300 C 40 220 20 160 60 90"/>
          <path d="M60 90 L40 70 M60 90 L80 65 M45 150 L20 140 M45 150 L70 135"/>
          <path d="M200 300 C 160 230 180 170 140 100"/>
          <path d="M140 100 L120 80 M140 100 L160 75"/>
        </g>);
    }
}
export default function CoverArt({ book }) {
    const motif = pickMotif(book);
    const light = shade(book.coverColor, 60);
    const dark = shade(book.coverColor, -50);
    const gradId = `grad-${book.id}`;
    return (<svg viewBox="0 0 200 300" className="h-full w-full" role="img" aria-label={`Cover of ${book.title}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light}/>
          <stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#${gradId})`}/>
      <MotifShape motif={motif} id={book.id} accent={light}/>
      <rect width="200" height="300" fill="black" opacity="0.08"/>
    </svg>);
}
