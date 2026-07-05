import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, UserX } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";

export default function AuthorsPage() {
  useDocumentTitle("Authors");
  const { data, isLoading, error } = useCatalog();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.authors].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  }, [data, q]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Skeleton className="h-9 w-40 mx-auto" />
        <Skeleton className="h-9 w-full max-w-2xl mx-auto mt-8" />
        <div className="mt-10 divide-y divide-line/30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display font-black text-4xl text-ink text-center">Authors</h1>

      <div className="mt-8 max-w-2xl mx-auto">
        <div className="relative flex items-center border-b border-line">
          <Search className="h-4 w-4 text-line shrink-0" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find an author"
            className="border-none shadow-none bg-transparent font-body text-lg text-ink placeholder:text-line focus-visible:ring-0 px-3 h-auto"
          />
          <ArrowRight className="h-4 w-4 text-ink shrink-0" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-line">
        Showing {filtered.length} result{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={UserX} title="No authors found" description="Try a different search term." />
      ) : (
        <div className="mt-10 divide-y divide-line/30">
          {filtered.map((author) => (
            <Link
              key={author.id}
              to={`/authors/${author.slug}`}
              className="flex items-center justify-between py-4 group"
            >
              <span className="font-display font-bold text-lg text-ink group-hover:text-rust">{author.name}</span>
              <span className="text-rust">&rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
