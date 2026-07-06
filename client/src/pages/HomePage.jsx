import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getRecentlyViewedIds } from "@/hooks/useRecentlyViewed";
import BookCard from "@/components/BookCard";
import { BookGridSkeleton } from "@/components/BookCardSkeleton";
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
      <div className="grid lg:grid-cols-[1fr_auto_1fr] items-center gap-8">
        <HeroStack books={leftStack} coverMap={coverMap} align="left" layout={leftLayout} />

        <div className="text-center order-first lg:order-0">
          <h1 className="font-display font-black text-4xl md:text-5xl text-ink leading-tight">
            Today's nightmares.
            <br />
            Tomorrow's cult classics.
          </h1>
          <p className="mt-4 font-mono text-xs uppercase tracking-wider text-line">
            We publish horror you can't put down.
          </p>
        </div>

        <HeroStack books={rightStack} coverMap={coverMap} align="right" layout={rightLayout} />
      </div>

      {recentlyViewed.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display font-bold text-lg text-ink mb-6">Continue browsing</h2>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
            {recentlyViewed.map((book) => (
              <BookCard key={book.id} book={book} authors={authors} imprints={imprints} coverUrl={coverMap[book.slug]} />
            ))}
          </div>
        </div>
      )}

      {books.length > 0 && <BookOracle books={books} authors={authors} coverMap={coverMap} />}

      {tabs.length > 0 && <TabbedCarousel tabs={tabs} coverMap={coverMap} authors={data.authors} imprints={imprints} />}

      {collections?.length > 0 && (
        <div className="mt-20 text-center">
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
      )}

      {imprints?.length > 0 && (
        <div className="mt-20">
          <p className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Our imprints
          </p>
          <h2 className="text-center font-display font-bold text-2xl text-ink mb-8">
            Something for every kind of reader.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
          <div className="text-center mt-6">
            <Link to="/imprints" className="font-mono text-xs uppercase tracking-wider text-rust">
              All imprints &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="mt-16 text-center">
        <Link to="/books" className="font-mono text-xs uppercase tracking-wider text-rust">
          Browse all books &rarr;
        </Link>
      </div>
    </div>
  );
}

function TabbedCarousel({ tabs, coverMap, authors, imprints }) {
  const [active, setActive] = useState(0);
  const current = tabs[active] ?? tabs[0];
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
        <div className="no-scrollbar flex gap-x-6 overflow-x-auto sm:flex-wrap sm:gap-x-8">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 pb-3 -mb-px border-b-2 font-mono text-xs uppercase tracking-wider whitespace-nowrap ${
                i === active ? "border-rust text-rust" : "border-transparent text-line hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
          ref={trackRef}
          onScroll={updateScrollState}
          className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 sm:gap-6"
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

function HeroStack({ books, coverMap, align, layout }) {
  return (
    <div className="relative hidden lg:block" style={{ height: HERO_HEIGHT }}>
      {books.map((book, i) => {
        const cardLayout = layout[i % layout.length];
        const cover = coverMap[book.slug];
        const offset = align === "right" ? { right: cardLayout.x } : { left: cardLayout.x };
        // Stagger duration/delay per card so the float never falls into lockstep.
        const floatDuration = 5.2 + ((i * 37) % 20) / 10;
        return (
          <Link
            key={book.id}
            to={`/books/${book.slug}`}
            className="absolute rounded-sm overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-2xl animate-hero-scatter"
            style={{
              width: cardLayout.w,
              top: cardLayout.y,
              "--z": cardLayout.z,
              "--card-rotate": `rotate(${cardLayout.rotate}deg)`,
              animationDelay: `${i * 0.4}s, ${i * 0.5}s`,
              animationDuration: `700ms, ${floatDuration}s`,
              ...offset,
            }}
          >
            <div className="aspect-2/3">
              {cover ? (
                <img src={cover} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-line/30" />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// Picks a random book, optionally excluding the currently-shown one so
// "seek another vision" doesn't repeat it.
function pickOracleBook(books, excludeId) {
  const pool = excludeId && books.length > 1 ? books.filter((b) => b.id !== excludeId) : books;
  return pool[Math.floor(Math.random() * pool.length)];
}

function BookOracle({ books, authors, coverMap }) {
  const [book, setBook] = useState(() => pickOracleBook(books));
  const author = authors.find((a) => a.id === book?.authorId);

  if (!book) return null;

  return (
    <div className="mt-20 border-y border-line/40 py-16">
      <p className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground mb-10">
        Not sure what to read next?
      </p>

      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
        <BookCard book={book} authors={authors} coverUrl={coverMap[book.slug]} showCaption={false} />

        <div className="max-w-sm text-center md:text-left">
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
              type="button"
              onClick={() => setBook((current) => pickOracleBook(books, current?.id))}
              className="mt-6 inline-flex items-center rounded-full bg-rust px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment transition-transform hover:scale-105"
            >
              Seek another vision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
