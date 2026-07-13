import { useMemo, useState } from "react";
import { Search, ArrowRight, ArrowLeft, SearchX, SlidersHorizontal } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import BookCard from "@/components/BookCard";
import { BookGridSkeleton } from "@/components/BookCardSkeleton";
import EmptyState from "@/components/EmptyState";
import Reveal from "@/components/motion/Reveal";
import ScrambleText from "@/components/motion/ScrambleText";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 12;
const VISIBLE_FILTER_COUNT = 8;

const SORTS = [
  { key: "relevant", label: "Most Relevant" },
  { key: "newest", label: "Newest to Oldest" },
  { key: "oldest", label: "Oldest to Newest" },
];

// Builds a compact page list with "…" gaps, e.g. [1, "…", 4, 5, 6, "…", 36].
function buildPageList(current, total) {
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) pages.push(i);
  }
  const withGaps = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) withGaps.push("…");
    withGaps.push(p);
    prev = p;
  }
  return withGaps;
}

function FilterList({ title, options, selectedId, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, VISIBLE_FILTER_COUNT);
  const hiddenCount = options.length - visible.length;

  if (options.length === 0) return null;

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {visible.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : option.id)}
              className="flex items-center gap-2 text-left font-body text-sm text-ink hover:text-rust"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full border border-rust ${isSelected ? "bg-rust" : "bg-transparent"}`}
                aria-hidden="true"
              />
              {option.name}
            </button>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 font-mono text-xs uppercase tracking-wider text-rust underline underline-offset-2"
        >
          Show {hiddenCount} More
        </button>
      )}
    </div>
  );
}

export default function BooksPage() {
  useDocumentTitle("Books");
  const { data, isLoading, error } = useCatalog();
  const { data: coverMap = {} } = useCovers();
  const [q, setQ] = useState("");
  const [imprintId, setImprintId] = useState(null);
  const [genreId, setGenreId] = useState(null);
  const [sort, setSort] = useState("relevant");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [imprintId, genreId].filter(Boolean).length;

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = data.books;
    if (q) result = result.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()));
    if (imprintId) result = result.filter((b) => b.imprintId === imprintId);
    if (genreId) result = result.filter((b) => b.genreIds.includes(genreId));
    if (sort === "newest") result = [...result].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    if (sort === "oldest") result = [...result].sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
    return result;
  }, [data, q, imprintId, genreId, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageBooks = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateAndResetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Skeleton className="h-9 w-40 mx-auto" />
        <Skeleton className="h-9 w-full max-w-2xl mx-auto mt-8" />
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-[12rem_1fr]">
          <aside className="hidden sm:block" />
          <BookGridSkeleton />
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  const { authors, imprints, genres } = data;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <ScrambleText as="h1" className="font-display font-black text-4xl text-ink text-center">
        Books
      </ScrambleText>

      <div className="mt-8 max-w-2xl mx-auto">
        <div className="group relative flex items-center border-b border-line">
          <Search className="h-4 w-4 text-line shrink-0" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => updateAndResetPage(setQ)(e.target.value)}
            placeholder="What are you looking for?"
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

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-b border-line/40 pb-4">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => updateAndResetPage(setSort)(s.key)}
            className={`flex items-center gap-2 font-mono text-xs uppercase tracking-wider ${
              sort === s.key ? "text-rust" : "text-line hover:text-ink"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${sort === s.key ? "bg-rust" : "bg-line/40"}`} aria-hidden="true" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 sm:hidden">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 justify-center text-[10px]">{activeFilterCount}</Badge>
            )}
          </Button>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-8 px-4">
              <FilterList
                title="Filter by Imprint"
                options={imprints}
                selectedId={imprintId}
                onSelect={updateAndResetPage(setImprintId)}
              />
              <FilterList
                title="Filter by Genre"
                options={genres}
                selectedId={genreId}
                onSelect={updateAndResetPage(setGenreId)}
              />
            </div>
            <SheetFooter className="flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  updateAndResetPage(setImprintId)(null);
                  updateAndResetPage(setGenreId)(null);
                }}
              >
                Clear all
              </Button>
              <SheetClose render={<Button className="flex-1" />}>Show {filtered.length} results</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-[12rem_1fr]">
        <aside className="hidden sm:flex sm:flex-col gap-8">
          <FilterList
            title="Filter by Imprint"
            options={imprints}
            selectedId={imprintId}
            onSelect={updateAndResetPage(setImprintId)}
          />
          <FilterList
            title="Filter by Genre"
            options={genres}
            selectedId={genreId}
            onSelect={updateAndResetPage(setGenreId)}
          />
        </aside>

        <div>
          {pageBooks.length === 0 ? (
            <EmptyState icon={SearchX} title="No books match those filters" description="Try a different search term or clear a filter." />
          ) : (
            <Reveal
              key={`${currentPage}-${q}-${imprintId}-${genreId}-${sort}`}
              as="div"
              variant="slide-up"
              stagger
              amount={0.04}
              duration={0.6}
              className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"
            >
              {pageBooks.map((book) => (
                <BookCard key={book.id} book={book} authors={authors} imprints={imprints} coverUrl={coverMap[book.slug]} fluid />
              ))}
            </Reveal>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-line/40 pt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink disabled:opacity-30"
              >
                <ArrowLeft className="h-3 w-3" /> Previous
              </button>
              <div className="flex items-center gap-3">
                {buildPageList(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="text-line text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`font-mono text-xs ${p === currentPage ? "text-rust font-bold" : "text-line hover:text-ink"}`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink disabled:opacity-30"
              >
                Next <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
