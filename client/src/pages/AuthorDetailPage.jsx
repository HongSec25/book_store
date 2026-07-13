import { useParams, Link } from "react-router-dom";
import { UserX, BookX } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import BookCard from "@/components/BookCard";
import EmptyState from "@/components/EmptyState";
import { BookGridSkeleton } from "@/components/BookCardSkeleton";
import Reveal from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useCatalog();
  const { data: coverMap = {} } = useCovers();
  useDocumentTitle(data?.authors.find((a) => a.slug === slug)?.name);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Skeleton className="h-4 w-24 mb-8" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl mt-4" />
        <div className="mt-10">
          <BookGridSkeleton className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3" count={6} />
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  const author = data.authors.find((a) => a.slug === slug);
  if (!author) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <EmptyState
          icon={UserX}
          title="Author not found"
          description="This author page may have moved or the link is out of date."
          actionTo="/authors"
          actionLabel="Browse all authors"
        />
      </main>
    );
  }

  const books = data.books.filter((b) => b.authorId === author.id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
        <Link to="/authors" className="font-mono text-xs uppercase tracking-wider text-rust">
          &larr; All authors
        </Link>
      </div>

      <Reveal as="div" variant="slide-up">
        <h1 className="font-display font-black text-4xl text-ink">{author.name}</h1>
        {author.bio && <p className="mt-4 font-body text-ink/80 max-w-2xl">{author.bio}</p>}
      </Reveal>

      {books.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={BookX} title="No books yet" description="Check back soon for titles from this author." />
        </div>
      ) : (
        <Reveal as="div" variant="slide-up" stagger amount={0.04} className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} authors={data.authors} imprints={data.imprints} coverUrl={coverMap[book.slug]} fluid />
          ))}
        </Reveal>
      )}
    </main>
  );
}
