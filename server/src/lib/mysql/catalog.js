import { getPool } from "#lib/mysql/db";
export async function getCatalog() {
    const pool = getPool();
    const [[bookRows], [authorRows], [imprintRows], [genreRows], [collectionRows]] = await Promise.all([
        pool.query("SELECT * FROM books"),
        pool.query("SELECT * FROM authors"),
        pool.query("SELECT * FROM imprints"),
        pool.query("SELECT * FROM genres"),
        pool.query("SELECT * FROM collections"),
    ]);
    const books = bookRows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        coverColor: row.coverColor,
        imprintId: row.imprintId,
        authorId: row.authorId,
        genreIds: row.genreIds,
        collectionIds: row.collectionIds,
        publishDate: row.publishDate instanceof Date ? row.publishDate.toISOString().slice(0, 10) : row.publishDate,
        isNewRelease: Boolean(row.isNewRelease),
        isComingSoon: Boolean(row.isComingSoon),
        isBestseller: Boolean(row.isBestseller),
        isCultClassic: Boolean(row.isCultClassic),
        synopsis: row.synopsis,
        pullQuote: row.pullQuote ?? undefined,
        formats: row.formats,
        contentWarnings: row.contentWarnings,
        isbn: row.isbn,
    }));
    return {
        books,
        authors: authorRows,
        imprints: imprintRows,
        genres: genreRows,
        // curatedBookIds is derived live from each book's own collectionIds
        // (the field the admin book form actually edits), not read from the
        // collections table — that column exists but nothing ever writes to
        // it after a collection is created, so trusting it here silently
        // desyncs from whatever books are actually assigned to a collection.
        collections: collectionRows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            curatedBookIds: books.filter((b) => (b.collectionIds || []).includes(row.id)).map((b) => b.id),
        })),
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
