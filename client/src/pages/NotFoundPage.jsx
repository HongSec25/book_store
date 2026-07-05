import { Link } from "react-router-dom";
import { Ghost } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rust/10 text-rust mx-auto mb-6">
        <Ghost className="h-7 w-7" />
      </div>
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">404</p>
      <h1 className="font-display font-black text-4xl text-ink">Lost in the stacks</h1>
      <p className="mt-4 text-muted-foreground">
        We couldn't find the page you were looking for. It may have been moved, renamed, or never existed.
      </p>
      <Link
        to="/books"
        className="mt-8 inline-flex items-center rounded-full bg-rust px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment transition-transform hover:scale-105"
      >
        Browse books
      </Link>
    </main>
  );
}
