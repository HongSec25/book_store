import { useParams, Link } from "react-router-dom";
import { FolderX, BookX } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import BookCard from "@/components/BookCard";
import EmptyState from "@/components/EmptyState";
import { BookGridSkeleton } from "@/components/BookCardSkeleton";
import Reveal from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/skeleton";

export default function ImprintDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useCatalog();
  const { data: coverMap = {} } = useCovers();
  useDocumentTitle(data?.imprints.find((i) => i.slug === slug)?.name);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Skeleton className="h-4 w-24 mb-8" />
        <Skeleton className="h-16 w-16 rounded-full mb-4" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-xl mt-3" />
        <div className="mt-10">
          <BookGridSkeleton />
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  const imprint = data.imprints.find((i) => i.slug === slug);
  if (!imprint) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <EmptyState
          icon={FolderX}
          title="Imprint not found"
          description="This imprint page may have moved or the link is out of date."
          actionTo="/imprints"
          actionLabel="Browse all imprints"
        />
      </main>
    );
  }

  const books = data.books.filter((b) => b.imprintId === imprint.id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8">
        <Link to="/imprints" className="font-mono text-xs uppercase tracking-wider text-rust">
          &larr; All imprints
        </Link>
      </div>

      <Reveal as="div" variant="slide-up">
        <div
          className="h-16 w-16 rounded-full mb-4"
          style={{ backgroundColor: imprint.color }}
          aria-hidden="true"
        />
        <h1 className="font-display font-black text-4xl text-ink">{imprint.name}</h1>
        <p className="mt-2 font-body text-ink/70 max-w-xl">{imprint.blurb}</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-line">{books.length} books</p>
      </Reveal>

      {books.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={BookX} title="No books yet" description="Check back soon for titles from this imprint." />
        </div>
      ) : (
        <Reveal as="div" variant="slide-up" stagger amount={0.04} className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} authors={data.authors} imprints={data.imprints} coverUrl={coverMap[book.slug]} fluid />
          ))}
        </Reveal>
      )}
    </main>
  );
}
