import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AboutPage() {
  useDocumentTitle("About");
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display font-black text-4xl text-ink text-center">About Scorched Quarto</h1>
      <p className="mt-6 font-body text-ink/80 leading-relaxed">
        Scorched Quarto Press publishes horror and speculative fiction that lingers — books that
        turn today's nightmares into tomorrow's cult classics. We work with independent imprints
        across horror, thriller, and literary fiction to bring readers stories they can't put down.
      </p>
      <p className="mt-4 font-body text-ink/80 leading-relaxed">
        Founded by readers, for readers who like their stories with a little dread mixed in.
      </p>
    </main>
  );
}
