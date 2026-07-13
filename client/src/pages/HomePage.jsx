import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDraggable } from "@/hooks/useDraggable";
import { useLenis } from "@/hooks/useLenis";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useParallax } from "@/hooks/useParallax";
import { getRecentlyViewedIds } from "@/hooks/useRecentlyViewed";
import { useBookTransition } from "@/lib/book-transition-context";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import BookCard from "@/components/BookCard";
import CoverArt from "@/components/CoverArt";
import FadeImage from "@/components/FadeImage";
import { BookGridSkeleton } from "@/components/BookCardSkeleton";
import Reveal from "@/components/motion/Reveal";
import SplitHeading from "@/components/motion/SplitHeading";
import { Skeleton } from "@/components/ui/skeleton";

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Card height is 2/3 * w. Container must be tall enough that
// the lowest card (largest y + its own height) never overflows.
// Slots are spaced well apart so cards read as distinct books, not one pile.
const HERO_LAYOUT_BASE = [
  { rotate: -10, x: 0, y: 0, w: 138 },
  { rotate: 7, x: 60, y: 70, w: 148 },
  { rotate: -4, x: 115, y: 140, w: 132 },
];
// However a card gets shuffled/jittered below, x + w must never exceed this —
// it's how far a card can reach into the gap before the center heading column.
const HERO_SAFE_EXTENT = 260;
const HERO_HEIGHT = 150 + 150 * 1.5 + 30; // worst-case top + card height + margin

// Randomizes the fan of hero covers (which slot each card lands in, its tilt
// and its jitter) while clamping every card to stay clear of the center text.
function randomizeHeroLayout() {
  return shuffle(HERO_LAYOUT_BASE).map((slot, i) => {
    const jitterX = Math.round(Math.random() * 24 - 12);
    const jitterY = Math.round(Math.random() * 24 - 12);
    const rotate = slot.rotate + (Math.random() * 6 - 3);
    const x = Math.max(0, Math.min(slot.x + jitterX, HERO_SAFE_EXTENT - slot.w));
    const y = Math.max(0, slot.y + jitterY);
    return { rotate, x, y, w: slot.w, z: i + 1 };
  });
}

export default function HomePage() {
  useDocumentTitle();
  useLenis();
  const { data, isLoading, error } = useCatalog();
  const { data: coverMap = {} } = useCovers();

  // Reshuffles only when a fresh catalog is fetched (e.g. on page refresh),
  // not on every re-render triggered by tab switches etc.
  const heroBooks = useMemo(() => (data ? shuffle(data.books) : []), [data]);
  const leftLayout = useMemo(() => (data ? randomizeHeroLayout() : []), [data]);
  const rightLayout = useMemo(() => (data ? randomizeHeroLayout() : []), [data]);
  // Read once per mount — a fresh visit/refresh re-reads localStorage, but a
  // book viewed just now within this same session shouldn't reorder the row
  // out from under someone still browsing the homepage.
  const [recentlyViewedIds] = useState(() => getRecentlyViewedIds());

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <Skeleton className="h-10 w-80 mx-auto" />
          <Skeleton className="h-10 w-96 mx-auto mt-2" />
          <Skeleton className="h-3 w-56 mx-auto mt-4" />
        </div>
        <div className="mt-20">
          <BookGridSkeleton className="flex gap-6 overflow-x-hidden" count={6} fluid={false} />
        </div>
      </div>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  const { books, authors, imprints, collections } = data;
  const leftStack = heroBooks.slice(0, 3);
  const rightStack = heroBooks.slice(3, 6);
  // Continues further into the same shuffled order the hero stacks already
  // used, so the catalog spread never repeats a cover that's visible above.
  const spreadBooks = heroBooks.slice(6, 18);
  const recentlyViewed = recentlyViewedIds.map((id) => books.find((b) => b.id === id)).filter(Boolean);

  const cozyHorror = collections.find((c) => c.slug === "cozy-horror");
  const tabs = [
    { label: "New releases", books: books.filter((b) => b.isNewRelease) },
    { label: "Cult classics", books: books.filter((b) => b.isCultClassic) },
    { label: "Bestsellers", books: books.filter((b) => b.isBestseller) },
    {
      label: "Cozy horror",
      books: cozyHorror ? books.filter((b) => cozyHorror.curatedBookIds.includes(b.id)) : [],
    },
  ].filter((t) => t.books.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <HeroParallaxRow leftStack={leftStack} rightStack={rightStack} coverMap={coverMap} leftLayout={leftLayout} rightLayout={rightLayout} />

      {recentlyViewed.length > 0 && (
        <Reveal as="div" variant="slide-up" className="mt-20">
          <h2 className="font-display font-bold text-lg text-ink mb-6">Continue browsing</h2>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
            {recentlyViewed.map((book) => (
              <BookCard key={book.id} book={book} authors={authors} imprints={imprints} coverUrl={coverMap[book.slug]} />
            ))}
          </div>
        </Reveal>
      )}

      {books.length > 0 && (
        <Reveal as="div" variant="scale">
          <BookOracle books={books} authors={authors} coverMap={coverMap} />
        </Reveal>
      )}

      {tabs.length > 0 && (
        <Reveal as="div" variant="fade">
          <TabbedCarousel tabs={tabs} coverMap={coverMap} authors={data.authors} imprints={imprints} />
        </Reveal>
      )}

      {collections?.length > 0 && <BrowseByVibeBook collections={collections} />}

      {imprints?.length > 0 && (
        <div className="mt-20">
          <p className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Our imprints
          </p>
          <h2 className="text-center font-display font-bold text-2xl text-ink mb-8">
            Something for every kind of reader.
          </h2>
          <Reveal as="div" variant="slide-up" stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imprints.slice(0, 6).map((imprint) => (
              <Link
                key={imprint.id}
                to={`/imprints/${imprint.slug}`}
                className="block p-5 rounded-sm border border-line/40 hover:border-rust transition-colors"
              >
                <div className="h-8 w-8 rounded-full mb-3" style={{ backgroundColor: imprint.color }} aria-hidden="true" />
                <h3 className="font-display font-bold text-ink">{imprint.name}</h3>
                <p className="mt-1 font-body text-sm text-ink/70">{imprint.blurb}</p>
              </Link>
            ))}
          </Reveal>
          <div className="text-center mt-6">
            <Link to="/imprints" className="font-mono text-xs uppercase tracking-wider text-rust">
              All imprints &rarr;
            </Link>
          </div>
        </div>
      )}

      {spreadBooks.length > 0 && <CatalogSpread books={spreadBooks} coverMap={coverMap} />}
    </div>
  );
}

// An open book laid flat: two pages, each a small grid of cover thumbnails,
// with a spine crease down the center — the catalog-spread reference image,
// minus any pinned/scrubbed choreography. Each page fades/settles in with
// its own stagger via the same Reveal component used everywhere else on
// this page, rather than a bespoke animation with new failure modes.
function CatalogSpread({ books, coverMap }) {
  const leftPage = books.slice(0, 6);
  const rightPage = books.slice(6, 12);
  const magneticRef = useMagnetic({ strength: 0.3 });

  return (
    <div className="mt-20">
      <p className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
        The full shelf
      </p>
      <h2 className="text-center font-display font-bold text-2xl text-ink mb-10">
        Open the catalog.
      </h2>

      <div className="relative mx-auto flex max-w-3xl">
        <Reveal
          as="div"
          variant="slide-right"
          stagger
          amount={0.06}
          className="flex-1 grid grid-cols-3 gap-3 rounded-l-md border border-r-0 border-line/40 bg-parchment p-4 shadow-lg sm:p-6"
          style={{ boxShadow: "inset -10px 0 16px -14px rgba(0,0,0,0.4)" }}
        >
          {leftPage.map((book) => (
            <SpreadThumb key={book.id} book={book} coverUrl={coverMap[book.slug]} />
          ))}
        </Reveal>
        <Reveal
          as="div"
          variant="slide-left"
          stagger
          amount={0.06}
          delay={0.15}
          className="flex-1 grid grid-cols-3 gap-3 rounded-r-md border border-l-0 border-line/40 bg-parchment p-4 shadow-lg sm:p-6"
          style={{ boxShadow: "inset 10px 0 16px -14px rgba(0,0,0,0.4)" }}
        >
          {rightPage.map((book) => (
            <SpreadThumb key={book.id} book={book} coverUrl={coverMap[book.slug]} />
          ))}
        </Reveal>
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line/40"
        />
      </div>

      <div className="mt-8 text-center">
        <Link
          ref={magneticRef}
          to="/books"
          className="inline-flex items-center rounded-full bg-rust px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment transition-transform hover:scale-105 active:scale-95"
        >
          Browse all books &rarr;
        </Link>
      </div>
    </div>
  );
}

function SpreadThumb({ book, coverUrl }) {
  return (
    <Link to={`/books/${book.slug}`} className="block aspect-2/3 overflow-hidden rounded-sm bg-line/10 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
      {coverUrl ? (
        <FadeImage src={coverUrl} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
      ) : (
        <CoverArt book={book} />
      )}
    </Link>
  );
}

function TabbedCarousel({ tabs, coverMap, authors, imprints }) {
  const [active, setActive] = useState(0);
  const current = tabs[active] ?? tabs[0];
  const trackRef = useRef(null);
  const tabRefs = useRef([]);
  const indicatorRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Slides the underline to sit beneath whichever tab is active, instead of
  // each tab drawing its own border — one continuous bar reads as a single
  // moving element rather than several toggling on/off.
  useEffect(() => {
    const tabEl = tabRefs.current[active];
    const indicator = indicatorRef.current;
    if (!tabEl || !indicator) return;
    const { offsetLeft, offsetWidth } = tabEl;
    if (prefersReducedMotion()) {
      indicator.style.transform = `translateX(${offsetLeft}px)`;
      indicator.style.width = `${offsetWidth}px`;
      return;
    }
    gsap.to(indicator, { x: offsetLeft, width: offsetWidth, duration: 0.35, ease: "power2.out" });
  }, [active, tabs.length]);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    updateScrollState();
  }, [active]);

  const slide = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Auto-advances the shelf every few seconds, looping back to the start once
  // it reaches the end. Pauses while the user is hovering or has interacted.
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth * 0.8, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(id);
  }, [isPaused, active]);

  return (
    <div
      className="mt-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="flex items-end justify-between gap-x-8 border-b border-line/40">
        <div className="relative no-scrollbar flex gap-x-6 overflow-x-auto sm:flex-wrap sm:gap-x-8">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 pb-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap ${
                i === active ? "text-rust" : "text-line hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span ref={indicatorRef} className="absolute bottom-0 left-0 h-0.5 bg-rust" aria-hidden="true" />
        </div>
        <div className="hidden sm:flex gap-2 pb-3">
          <button
            type="button"
            onClick={() => slide(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line/40 text-ink transition-colors hover:border-rust hover:text-rust disabled:opacity-30 disabled:hover:border-line/40 disabled:hover:text-ink"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line/40 text-ink transition-colors hover:border-rust hover:text-rust disabled:opacity-30 disabled:hover:border-line/40 disabled:hover:text-ink"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="relative mt-8">
        <div
          key={active}
          ref={trackRef}
          onScroll={updateScrollState}
          className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 sm:gap-6 animate-fade-up"
        >
          {current.books.map((book) => (
            <div key={book.id} className="snap-start">
              <BookCard
                book={book}
                authors={authors}
                imprints={imprints}
                coverUrl={coverMap[book.slug]}
              />
            </div>
          ))}
        </div>
        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-background to-transparent" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent" />
        )}
      </div>
    </div>
  );
}

// Wraps the hero row (left cover stack / heading / right cover stack) in a
// shared pointer-tracked container. Each child gets its own parallax layer
// at a different depth — the cursor-driven drift from the Shopify Editions
// hero, translated to book covers instead of painted figures. Only mounted
// where HeroStack itself renders (lg+), since there's no cursor on touch.
function HeroParallaxRow({ leftStack, rightStack, coverMap, leftLayout, rightLayout }) {
  const rowRef = useRef(null);
  const headingLayerRef = useParallax({ container: rowRef, depth: 8 });

  return (
    <div ref={rowRef} className="grid lg:grid-cols-[1fr_auto_1fr] items-center gap-8">
      <HeroStack books={leftStack} coverMap={coverMap} align="left" layout={leftLayout} containerRef={rowRef} depth={26} dragBounds={rowRef} />

      <div ref={headingLayerRef} className="text-center order-first lg:order-0">
        <SplitHeading as="h1" className="font-display font-black text-4xl md:text-5xl text-ink leading-tight">
          Today's nightmares.
          <br />
          Tomorrow's cult classics.
        </SplitHeading>
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-line animate-fade-up" style={{ animationDelay: "500ms" }}>
          We publish horror you can't put down.
        </p>
      </div>

      <HeroStack books={rightStack} coverMap={coverMap} align="right" layout={rightLayout} containerRef={rowRef} depth={-26} dragBounds={rowRef} />
    </div>
  );
}

function HeroStack({ books, coverMap, align, layout, containerRef, depth, dragBounds }) {
  const { capture } = useBookTransition();
  const layerRef = useParallax({ container: containerRef, depth });
  return (
    <div ref={layerRef} className="relative hidden lg:block" style={{ height: HERO_HEIGHT }}>
      {books.map((book, i) => {
        const cardLayout = layout[i % layout.length];
        const cover = coverMap[book.slug];
        const offset = align === "right" ? { right: cardLayout.x } : { left: cardLayout.x };
        // Stagger duration/delay per card so the float never falls into lockstep.
        const floatDuration = 5.2 + ((i * 37) % 20) / 10;
        return (
          <HeroCoverLink
            key={book.id}
            book={book}
            cover={cover}
            cardLayout={cardLayout}
            offset={offset}
            i={i}
            floatDuration={floatDuration}
            onNavigate={capture}
            dragBounds={dragBounds}
          />
        );
      })}
    </div>
  );
}

function HeroCoverLink({ book, cover, cardLayout, offset, i, floatDuration, onNavigate, dragBounds }) {
  const imgRef = useRef(null);
  // Drag lives on this outer wrapper, not the Link below — the Link carries
  // its own CSS float/rotate keyframe animation on `transform`, and driving
  // drag x/y on that same element would fight it. This way the card keeps
  // gently floating in place, wherever it's been dropped.
  const { ref: dragRef, wasDragged } = useDraggable({ bounds: dragBounds });

  return (
    <div
      ref={dragRef}
      className="hero-card-slot absolute cursor-grab touch-none select-none active:cursor-grabbing"
      style={{
        width: cardLayout.w,
        top: cardLayout.y,
        "--z": cardLayout.z,
        ...offset,
      }}
    >
      <Link
        to={`/books/${book.slug}`}
        draggable={false}
        onClick={(e) => {
          if (wasDragged()) {
            e.preventDefault();
            return;
          }
          onNavigate(book.slug, imgRef.current);
        }}
        className="block rounded-sm overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-2xl animate-hero-scatter"
        style={{
          "--card-rotate": `rotate(${cardLayout.rotate}deg)`,
          animationDelay: `${i * 0.4}s, ${i * 0.5}s`,
          animationDuration: `700ms, ${floatDuration}s`,
        }}
      >
        <div className="aspect-2/3 bg-line/10">
          {cover ? (
            <FadeImage ref={imgRef} src={cover} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-line/30" />
          )}
        </div>
      </Link>
    </div>
  );
}

// A literal book: a cover panel hinged on its left edge swings open, once,
// the first time it scrolls into view, revealing the real "browse by vibe"
// content underneath as pages. One element, one property (rotateY), one
// non-scrubbed trigger — deliberately simpler than a pinned multi-object
// sequence, since that's what actually broke down under repeated review.
// Reduced motion just shows the pages with the cover already out of the way.
function BrowseByVibeBook({ collections }) {
  const wrapRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      // Opacity stays at 1 the whole time — a real page doesn't fade as it
      // turns, it stays solid and disappears once it's rotated past 90°,
      // which backface-visibility: hidden handles on its own. Cross-fading
      // opacity here made it look like it was dissolving, not flipping.
      gsap.set(coverRef.current, { opacity: 1, rotateY: 0 });
      gsap.to(coverRef.current, {
        rotateY: -110,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => gsap.set(coverRef.current, { pointerEvents: "none" }),
        scrollTrigger: { trigger: wrapRef.current, start: "top 75%", once: true },
      });
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="relative mt-20 mx-auto max-w-2xl" style={{ perspective: 1600 }}>
      <div
        className="rounded-sm border border-line/40 bg-parchment p-8 text-center shadow-lg sm:p-12"
        style={{ boxShadow: "inset 10px 0 16px -12px rgba(0,0,0,0.35)" }}
      >
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">Browse by vibe</p>
        <h2 className="font-display font-bold text-2xl text-ink mb-6">
          Not every reader wants a genre. Some want a feeling.
        </h2>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {collections.slice(0, 8).map((c) => (
            <Link key={c.id} to={`/collections/${c.slug}`} className="font-body text-ink hover:text-rust">
              {c.name}
            </Link>
          ))}
        </div>
        <Link to="/collections" className="inline-block mt-4 font-mono text-xs uppercase tracking-wider text-rust">
          All collections &rarr;
        </Link>
      </div>

      <div
        ref={coverRef}
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-rust p-8 text-center opacity-0"
        style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
      >
        <p className="font-mono text-xs uppercase tracking-wider text-parchment/70 mb-3">Browse by vibe</p>
        <h2 className="font-display font-black text-2xl text-parchment">
          Not every reader wants a genre.
          <br />
          Some want a feeling.
        </h2>
      </div>
    </div>
  );
}

// Picks a random book, optionally excluding the currently-shown one so
// "seek another vision" doesn't repeat it.
function pickOracleBook(books, excludeId) {
  const pool = excludeId && books.length > 1 ? books.filter((b) => b.id !== excludeId) : books;
  return pool[Math.floor(Math.random() * pool.length)];
}

const ORACLE_AUTO_SWAP_MS = 1800;

function BookOracle({ books, authors, coverMap }) {
  const [book, setBook] = useState(() => pickOracleBook(books));
  const [isPaused, setIsPaused] = useState(false);
  const author = authors.find((a) => a.id === book?.authorId);
  const coverRef = useRef(null);
  const isFirstBook = useRef(true);
  const magneticRef = useMagnetic({ strength: 0.35 });

  // Flips the cover edge-on (rotateY 0 -> 90) before swapping to the new
  // book, then flips it back in from the opposite edge — the src swap
  // happens while the card is invisible on its edge, so it reads as one
  // fast, physical flip rather than an instant image pop.
  function handleSeekAnother() {
    const el = coverRef.current;
    if (!el || prefersReducedMotion()) {
      setBook((current) => pickOracleBook(books, current?.id));
      return;
    }
    gsap.to(el, {
      rotateY: 90,
      duration: 0.16,
      ease: "power1.in",
      onComplete: () => setBook((current) => pickOracleBook(books, current?.id)),
    });
  }

  // Kept in a ref so the auto-swap interval below always calls the latest
  // version without needing to tear itself down and restart every render.
  const handleSeekAnotherRef = useRef(handleSeekAnother);
  handleSeekAnotherRef.current = handleSeekAnother;

  useEffect(() => {
    if (isFirstBook.current) {
      isFirstBook.current = false;
      return;
    }
    const el = coverRef.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { rotateY: -90 }, { rotateY: 0, duration: 0.22, ease: "power2.out" });
  }, [book?.id]);

  // Auto-cycles the vision on a fast timer, like the tabbed shelf below it.
  // Paused on hover/focus so it doesn't rotate away underneath someone
  // reading the synopsis, and skipped entirely under prefers-reduced-motion
  // since it's auto-updating content with no user-initiated stop otherwise.
  useEffect(() => {
    if (isPaused || prefersReducedMotion() || books.length <= 1) return undefined;
    const id = setInterval(() => handleSeekAnotherRef.current(), ORACLE_AUTO_SWAP_MS);
    return () => clearInterval(id);
  }, [isPaused, books.length]);

  if (!book) return null;

  return (
    <div
      className="mt-20 border-y border-line/40 py-16"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <p className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground mb-10">
        Not sure what to read next?
      </p>

      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
        <div style={{ perspective: 800 }}>
          <div ref={coverRef} style={{ backfaceVisibility: "hidden" }}>
            <BookCard book={book} authors={authors} coverUrl={coverMap[book.slug]} showCaption={false} />
          </div>
        </div>

        <div key={book.id} className="max-w-sm text-center md:text-left animate-fade-up">
          <h3 className="font-display font-black text-2xl text-ink">{book.title}</h3>
          {author && (
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-rust">{author.name}</p>
          )}
          {book.synopsis && <p className="mt-4 font-body text-sm text-ink/80">{book.synopsis}</p>}
          <Link
            to={`/books/${book.slug}`}
            className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-rust"
          >
            View book &rarr;
          </Link>
          <div>
            <button
              ref={magneticRef}
              type="button"
              onClick={handleSeekAnother}
              className="mt-6 inline-flex items-center rounded-full bg-rust px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment transition-transform hover:scale-105 active:scale-95"
            >
              Seek another vision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
