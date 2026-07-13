import { useRef } from "react";
import { Link } from "react-router-dom";
import CoverArt from "./CoverArt";
import FadeImage from "./FadeImage";
import { Badge } from "@/components/ui/badge";
import { useBookTransition } from "@/lib/book-transition-context";
import { useTilt } from "@/hooks/useTilt";
export default function BookCard({ book, rotate, coverUrl, authors = [], imprints = [], showCaption = true, showOverlay = true, fluid = false, }) {
    const author = authors.find((a) => a.id === book.authorId);
    const imprint = imprints.find((i) => i.id === book.imprintId);
    const imgRef = useRef(null);
    const glareRef = useRef(null);
    const { capture } = useBookTransition();
    const tiltRef = useTilt({ glareRef });
    // fluid: fills its grid cell (used in grid layouts so mobile 2-up grids
    // don't leave cards stranded left-aligned with empty space beside them).
    // Fixed w-40/shrink-0 (the default) is required for horizontal-scroll
    // carousels, where a card must keep its own width regardless of viewport.
    return (<Link
        to={`/books/${book.slug}`}
        onClick={() => capture(book.slug, imgRef.current)}
        className={`group block focus:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-parchment rounded-sm ${fluid ? "w-full" : "w-32 shrink-0 sm:w-40"}`}
        style={{ perspective: 800 }}>
      <div ref={tiltRef} className="relative">
        <div className="relative aspect-2/3 overflow-hidden rounded-sm shadow-md transition-shadow duration-200 group-hover:shadow-xl" style={{
              transform: rotate ? `rotate(${rotate}deg)` : undefined,
          }}>
          <div className="absolute inset-0 bg-line/10">
            {coverUrl ? (
          <FadeImage ref={imgRef} src={coverUrl} alt={`Cover of ${book.title}`} className="h-full w-full object-cover"/>) : (<CoverArt book={book}/>)}
          </div>
          {showOverlay && (book.isNewRelease || book.isBestseller) && (<div className="absolute top-2 right-2 z-10">
              <Badge className="text-[9px]">{book.isNewRelease ? "New" : "Bestseller"}</Badge>
            </div>)}
          {showOverlay && !coverUrl && (<div className="relative z-10 flex h-full flex-col justify-between p-3 text-parchment">
              {imprint && (<span className="font-mono text-[10px] uppercase tracking-wider opacity-90 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                  {imprint.name}
                </span>)}
              <span className="font-display font-extrabold text-lg leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                {book.title}
              </span>
            </div>)}
          <div
            ref={glareRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-0"
            style={{
              background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.55), transparent 55%)",
              mixBlendMode: "overlay",
            }}
          />
        </div>
      </div>
      {showCaption && (<div className="mt-2">
          <p className="font-display font-bold text-sm text-ink truncate">{book.title}</p>
          {author && <p className="font-mono text-xs text-line truncate">{author.name}</p>}
          {imprint && (<span className="inline-block mt-1 font-mono text-[10px] uppercase tracking-wider text-rust">
              {imprint.name}
            </span>)}
        </div>)}
    </Link>);
}
