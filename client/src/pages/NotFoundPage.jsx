import { Link } from "react-router-dom";
import { Ghost } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMagnetic } from "@/hooks/useMagnetic";
import Reveal from "@/components/motion/Reveal";
import SplitHeading from "@/components/motion/SplitHeading";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  const magneticRef = useMagnetic({ strength: 0.3 });
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rust/10 text-rust mx-auto mb-6 animate-ghost-flicker">
        <Ghost className="h-7 w-7" />
      </div>
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 animate-fade-up">404</p>
      <SplitHeading as="h1" className="font-display font-black text-4xl text-ink" delay={0.1}>
        Lost in the stacks
      </SplitHeading>
      <Reveal as="p" variant="slide-up" delay={0.35} duration={0.6} className="mt-4 text-muted-foreground">
        We couldn't find the page you were looking for. It may have been moved, renamed, or never existed.
      </Reveal>
      <Reveal as="div" variant="slide-up" delay={0.5} duration={0.6}>
        <Link
          ref={magneticRef}
          to="/books"
          className="mt-8 inline-flex items-center rounded-full bg-rust px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment transition-transform hover:scale-105 active:scale-95"
        >
          Browse books
        </Link>
      </Reveal>
    </main>
  );
}
