import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, FolderSearch } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import CoverArt from "@/components/CoverArt";
import EmptyState from "@/components/EmptyState";
import FadeImage from "@/components/FadeImage";
import Reveal from "@/components/motion/Reveal";
import ScrambleText from "@/components/motion/ScrambleText";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Small diagonal fan of up to 3 covers from the collection, echoing the
// HomePage hero stack but scaled down for a single list-row thumbnail.
const STACK_LAYOUT = [
  { rotate: -8, x: 0, z: 1 },
  { rotate: 4, x: 10, z: 2 },
  { rotate: -3, x: 20, z: 3 },
];

function CollectionCoverStack({ books, coverMap }) {
  const covers = books.slice(0, 3);
  return (
    <div className="relative h-20 w-20 shrink-0">
      {covers.map((book, i) => {
        const layout = STACK_LAYOUT[i % STACK_LAYOUT.length];
        const coverUrl = coverMap[book.slug];
        return (
          <div
            key={book.id}
            className="absolute top-0 h-20 w-14 overflow-hidden rounded-sm border border-line/40 bg-line/10 shadow-sm"
            style={{ left: layout.x, zIndex: layout.z, transform: `rotate(${layout.rotate}deg)` }}
          >
            {coverUrl ? (
              <FadeImage src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <CoverArt book={book} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CollectionsPage() {
  useDocumentTitle("Collections");
  const { data, isLoading, error } = useCatalog();
  const { data: coverMap = {} } = useCovers();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!q) return data.collections;
    return data.collections.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  }, [data, q]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Skeleton className="h-9 w-48 mx-auto" />
        <Skeleton className="h-3 w-64 mx-auto mt-4" />
        <Skeleton className="h-9 w-full max-w-xl mx-auto mt-8" />
        <div className="mt-10 divide-y divide-line/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 py-6">
              <Skeleton className="h-20 w-20 rounded-sm" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <ScrambleText as="h1" className="font-display font-black text-4xl text-ink text-center">
        Collections
      </ScrambleText>
      <Reveal
        as="p"
        variant="fade"
        delay={0.1}
        className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-line"
      >
        Stories grouped by instinct, not genre.
      </Reveal>

      <div className="mt-8 max-w-xl mx-auto">
        <div className="group relative flex items-center border-b border-line">
          <Search className="h-4 w-4 text-line shrink-0" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a collection"
            className="border-none shadow-none bg-transparent font-body text-lg text-ink placeholder:text-line focus-visible:ring-0 px-3 h-auto"
          />
          <ArrowRight className="h-4 w-4 text-ink shrink-0" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-center scale-x-0 bg-rust transition-transform duration-300 ease-out group-focus-within:scale-x-100"
          />
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-line">
        Showing {filtered.length} result{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderSearch} title="No collections found" description="Try a different search term." />
      ) : (
        <Reveal key={q} as="div" variant="slide-up" stagger amount={0.06} className="mt-10 divide-y divide-line/30">
          {filtered.map((collection) => {
            const books = data.books.filter((b) => collection.curatedBookIds.includes(b.id));
            return (
              <Link
                key={collection.id}
                to={`/collections/${collection.slug}`}
                className="group flex items-center gap-6 py-6"
              >
                <CollectionCoverStack books={books} coverMap={coverMap} />
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl text-ink group-hover:text-rust">{collection.name}</h2>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-line">
                    {books.length} book{books.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-ink shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </Reveal>
      )}
    </main>
  );
}
