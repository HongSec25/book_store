import { Link } from "react-router-dom";
import { useCatalog } from "@/hooks/useCatalog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Reveal from "@/components/motion/Reveal";
import ScrambleText from "@/components/motion/ScrambleText";
import { Skeleton } from "@/components/ui/skeleton";

export default function ImprintsPage() {
  useDocumentTitle("Imprints");
  const { data, isLoading, error } = useCatalog();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Skeleton className="h-9 w-48 mx-auto" />
        <Skeleton className="h-3 w-64 mx-auto mt-4" />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-sm border border-line/40">
              <Skeleton className="h-10 w-10 rounded-full mb-4" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full mt-2" />
            </div>
          ))}
        </div>
      </main>
    );
  }
  if (error) return <p className="text-center py-16 text-destructive">{error.message}</p>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <ScrambleText as="h1" className="font-display font-black text-4xl text-ink text-center">
        Imprints
      </ScrambleText>
      <Reveal
        as="p"
        variant="fade"
        delay={0.1}
        className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-line"
      >
        Something for every kind of reader.
      </Reveal>

      <Reveal as="div" variant="slide-up" stagger amount={0.06} className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.imprints.map((imprint) => (
          <Link
            key={imprint.id}
            to={`/imprints/${imprint.slug}`}
            className="block p-6 rounded-sm border border-line/40 hover:border-rust transition-colors"
          >
            <div
              className="h-10 w-10 rounded-full mb-4"
              style={{ backgroundColor: imprint.color }}
              aria-hidden="true"
            />
            <h2 className="font-display font-bold text-lg text-ink">{imprint.name}</h2>
            <p className="mt-2 font-body text-sm text-ink/70">{imprint.blurb}</p>
          </Link>
        ))}
      </Reveal>
    </main>
  );
}
