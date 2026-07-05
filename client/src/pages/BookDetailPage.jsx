import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookX } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { apiFetch } from "@/lib/api";
import CoverArt from "@/components/CoverArt";
import AddToCartForm from "@/components/AddToCartForm";
import BookCard from "@/components/BookCard";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useCatalog();
  const { data: coverMap = {} } = useCovers();
  const book = data?.books.find((b) => b.slug === slug);
  useDocumentTitle(book?.title);
  useRecentlyViewed(book?.id);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Skeleton className="h-4 w-16 mb-6" />
        <div className="grid md:grid-cols-[280px_1fr] gap-10">
          <Skeleton className="aspect-2/3 rounded-sm" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full mt-4" />
          </div>
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  if (!book) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <EmptyState
          icon={BookX}
          title="Book not found"
          description="This title may have been removed or the link is out of date."
          actionTo="/books"
          actionLabel="Browse all books"
        />
      </main>
    );
  }

  const author = data.authors.find((a) => a.id === book.authorId);
  const imprint = data.imprints.find((i) => i.id === book.imprintId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-6">
        <Link to="/books" className="font-mono text-xs uppercase tracking-wider text-rust">
          &larr; Back
        </Link>
      </div>
      <div className="grid md:grid-cols-[280px_1fr] gap-10">
        <div className="md:sticky md:top-6 md:self-start">
          <div className="aspect-2/3 rounded-sm overflow-hidden shadow-lg">
            {coverMap[book.slug] ? (
              <img
                src={coverMap[book.slug]}
                alt={`Cover of ${book.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <CoverArt book={book} />
            )}
          </div>
        </div>

        <div>
          {imprint && (
            <Link to={`/imprints/${imprint.slug}`} className="font-mono text-xs uppercase tracking-wider text-rust">
              {imprint.name}
            </Link>
          )}
          <h1 className="font-display font-black text-3xl md:text-4xl text-ink mt-1">{book.title}</h1>
          {author && (
            <Link to={`/authors/${author.slug}`} className="text-line hover:text-rust mt-1 inline-block">
              {author.name}
            </Link>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {book.isNewRelease && <Badge>New release</Badge>}
            {book.isBestseller && <Badge variant="secondary">Bestseller</Badge>}
            {book.isCultClassic && <Badge variant="secondary">Cult classic</Badge>}
            {book.isComingSoon && <Badge variant="outline">Coming soon</Badge>}
          </div>

          {book.pullQuote && <p className="font-body italic text-lg text-ink mt-6">{book.pullQuote}</p>}
          <p className="font-body text-ink/80 mt-4">{book.synopsis}</p>

          {book.contentWarnings.length > 0 && (
            <p className="font-mono text-xs text-line mt-4">Content warnings: {book.contentWarnings.join(", ")}</p>
          )}

          <div className="mt-8 rounded-lg border border-line/40 p-4">
            <AddToCartForm book={book} />
          </div>

          <p className="font-mono text-xs text-muted-foreground mt-6">ISBN {book.isbn}</p>
        </div>
      </div>

      <RelatedBooks book={book} allBooks={data.books} authors={data.authors} imprints={data.imprints} coverMap={coverMap} />
    </main>
  );
}

function RelatedBooks({ book, allBooks, authors, imprints, coverMap }) {
  // "Customers who bought this also bought" when there's real order history
  // to draw on; genre overlap as a fallback for books with no sales yet
  // (or a brand-new catalog) so the section never just sits empty.
  const { data: boughtWith } = useQuery({
    queryKey: ["books", book.slug, "related"],
    queryFn: () => apiFetch(`/api/books/${book.slug}/related`),
    staleTime: 60_000,
  });

  const { related, boughtTogether } = useMemo(() => {
    const boughtWithIds = boughtWith?.bookIds ?? [];
    const boughtBooks = boughtWithIds.map((id) => allBooks.find((b) => b.id === id)).filter(Boolean);
    if (boughtBooks.length > 0) return { related: boughtBooks.slice(0, 4), boughtTogether: true };

    const sameGenre = allBooks.filter((b) => b.id !== book.id && b.genreIds.some((g) => book.genreIds.includes(g)));
    const pool = sameGenre.length > 0 ? sameGenre : allBooks.filter((b) => b.id !== book.id);
    return { related: pool.slice(0, 4), boughtTogether: false };
  }, [book, allBooks, boughtWith]);

  if (related.length === 0) return null;

  return (
    <div className="mt-20">
      <h2 className="font-display font-bold text-lg text-ink mb-6">
        {boughtTogether ? "Customers who bought this also bought" : "You might also like"}
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
        {related.map((b) => (
          <BookCard key={b.id} book={b} authors={authors} imprints={imprints} coverUrl={coverMap[b.slug]} fluid />
        ))}
      </div>
    </div>
  );
}
