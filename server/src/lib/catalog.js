import { adminDb } from "#lib/firebase/admin";
import { DB_PROVIDER } from "#lib/db-provider";
import { getCatalog as getMysqlCatalog } from "#lib/mysql/catalog";

// No more React `cache()` — that deduped calls within one Server Component
// render tree; each Express request is independent, so nothing to dedupe.
export async function getCatalog() {
  if (DB_PROVIDER === "mysql") return getMysqlCatalog();

  const [booksSnap, authorsSnap, imprintsSnap, genresSnap, collectionsSnap] = await Promise.all([
    adminDb.collection("books").get(),
    adminDb.collection("authors").get(),
    adminDb.collection("imprints").get(),
    adminDb.collection("genres").get(),
    adminDb.collection("collections").get(),
  ]);

  const books = booksSnap.docs.map((d) => d.data());

  return {
    books,
    authors: authorsSnap.docs.map((d) => d.data()),
    imprints: imprintsSnap.docs.map((d) => d.data()),
    genres: genresSnap.docs.map((d) => d.data()),
    // curatedBookIds is derived live from each book's own collectionIds (the
    // field the admin book form actually edits), not the stored document
    // field — see the matching comment in lib/mysql/catalog.js for why.
    collections: collectionsSnap.docs.map((d) => {
      const collection = d.data();
      return { ...collection, curatedBookIds: books.filter((b) => (b.collectionIds || []).includes(collection.id)).map((b) => b.id) };
    }),
  };
}

export async function getBookBySlug(slug) {
  const { books } = await getCatalog();
  return books.find((b) => b.slug === slug);
}

export async function getAuthorBySlug(slug) {
  const { authors } = await getCatalog();
  return authors.find((a) => a.slug === slug);
}

export async function getImprintBySlug(slug) {
  const { imprints } = await getCatalog();
  return imprints.find((i) => i.slug === slug);
}

export async function getCollectionBySlug(slug) {
  const { collections } = await getCatalog();
  return collections.find((c) => c.slug === slug);
}

export function booksByAuthor(books, authorId) {
  return books.filter((b) => b.authorId === authorId);
}

export function booksByCollection(books, collection) {
  return books.filter((b) => b.collectionIds.includes(collection.id));
}
