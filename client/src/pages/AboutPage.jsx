import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AboutPage() {
  useDocumentTitle("About");
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display font-black text-4xl text-ink text-center">About This Project</h1>
      <p className="mt-6 font-body text-ink/80 leading-relaxed">
        Scorched Quarto Press is a student project built for educational purposes only. It's a
        demonstration bookstore application created to practice full-stack web development —
        including frontend design, backend APIs, authentication, checkout flows, and database
        integration — and is not a real commercial bookstore.
      </p>
      <p className="mt-4 font-body text-ink/80 leading-relaxed">
        All books, authors, imprints, and collections featured here are used for illustrative
        purposes as part of this coursework. No products are actually sold, and any payment
        flows run in sandbox/test mode only.
      </p>
    </main>
  );
}
