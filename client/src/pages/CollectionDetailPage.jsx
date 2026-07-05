import { useParams, Link } from "react-router-dom";
import { FolderX, BookX } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import BookCard from "@/components/BookCard";
import EmptyState from "@/components/EmptyState";
import { BookGridSkeleton } from "@/components/BookCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useCatalog();
  const { data: coverMap = {} } = useCovers();
  useDocumentTitle(data?.collections.find((c) => c.slug === slug)?.name);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Skeleton className="h-4 w-24 mb-8" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-xl mt-3" />
        <div className="mt-10">
          <BookGridSkeleton />
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  const collection = data.collections.find((c) => c.slug === slug);
  if (!collection) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <EmptyState
          icon={FolderX}
          title="Collection not found"
          description="This collection page may have moved or the link is out of date."
          actionTo="/collections"
          actionLabel="Browse all collections"
        />
      </main>
    );
  }

  const books = data.books.filter((b) => collection.curatedBookIds.includes(b.id));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8">
        <Link to="/collections" className="font-mono text-xs uppercase tracking-wider text-rust">
          &larr; All collections
        </Link>
      </div>

      <h1 className="font-display font-black text-4xl text-ink">{collection.name}</h1>
      {collection.description && <p className="mt-2 font-body text-ink/70 max-w-xl">{collection.description}</p>}
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-line">{books.length} books</p>

      {books.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={BookX} title="No books yet" description="Check back soon for titles in this collection." />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} authors={data.authors} imprints={data.imprints} coverUrl={coverMap[book.slug]} fluid />
          ))}
        </div>
      )}
    </main>
  );
}
