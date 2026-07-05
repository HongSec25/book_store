import { adminDb } from "#lib/firebase/admin";
import { DB_PROVIDER } from "#lib/db-provider";
import * as mysqlBooks from "#lib/mysql/books";
import { emitAdminEvent } from "#lib/events";
export async function listBooks() {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.listBooks();
    const snap = await adminDb.collection("books").orderBy("title").get();
    return snap.docs.map((d) => d.data());
}
export async function getBook(id) {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.getBook(id);
    const doc = await adminDb.collection("books").doc(id).get();
    return doc.exists ? doc.data() : null;
}
export async function createBook(book) {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.createBook(book);
    await adminDb.collection("books").doc(book.id).set(book);
}
export async function updateBook(id, book) {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.updateBook(id, book);
    await adminDb.collection("books").doc(id).set(book);
}
export async function deleteBook(id) {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.deleteBook(id);
    await adminDb.collection("books").doc(id).delete();
}
function emitStockUpdated(bookId, formatType, format) {
    emitAdminEvent({ type: "stock.updated", bookId, formatType, stockCount: format.stockCount });
}
/** Atomically adds (or subtracts, via a negative delta) stock for one format of a book. Returns the updated format, or null if the book/format doesn't exist. */
export async function adjustStock(id, formatType, delta) {
    const updated = DB_PROVIDER === "mysql"
        ? await mysqlBooks.adjustStock(id, formatType, delta)
        : await adminDb.runTransaction(async (tx) => {
            const ref = adminDb.collection("books").doc(id);
            const doc = await tx.get(ref);
            if (!doc.exists)
                return null;
            const book = doc.data();
            const idx = book.formats.findIndex((f) => f.type === formatType);
            if (idx === -1)
                return null;
            const next = { ...book.formats[idx], stockCount: Math.max(0, book.formats[idx].stockCount + delta) };
            const formats = [...book.formats];
            formats[idx] = next;
            tx.update(ref, { formats });
            return next;
        });
    if (updated)
        emitStockUpdated(id, formatType, updated);
    return updated;
}
/** Atomically sets stock for one format of a book to an exact value (e.g. resetting to 0). Returns the updated format, or null if the book/format doesn't exist. */
export async function setStock(id, formatType, stockCount) {
    const updated = DB_PROVIDER === "mysql"
        ? await mysqlBooks.setStock(id, formatType, stockCount)
        : await adminDb.runTransaction(async (tx) => {
            const ref = adminDb.collection("books").doc(id);
            const doc = await tx.get(ref);
            if (!doc.exists)
                return null;
            const book = doc.data();
            const idx = book.formats.findIndex((f) => f.type === formatType);
            if (idx === -1)
                return null;
            const next = { ...book.formats[idx], stockCount: Math.max(0, stockCount) };
            const formats = [...book.formats];
            formats[idx] = next;
            tx.update(ref, { formats });
            return next;
        });
    if (updated)
        emitStockUpdated(id, formatType, updated);
    return updated;
}
/** Atomically deducts stock only if enough is available; otherwise fails without changing anything. */
export async function reserveStock(id, formatType, quantity) {
    const result = DB_PROVIDER === "mysql"
        ? await mysqlBooks.reserveStock(id, formatType, quantity)
        : await adminDb.runTransaction(async (tx) => {
            const ref = adminDb.collection("books").doc(id);
            const doc = await tx.get(ref);
            if (!doc.exists)
                return { ok: false, available: 0 };
            const book = doc.data();
            const idx = book.formats.findIndex((f) => f.type === formatType);
            if (idx === -1)
                return { ok: false, available: 0 };
            if (book.formats[idx].stockCount < quantity)
                return { ok: false, available: book.formats[idx].stockCount };
            const next = { ...book.formats[idx], stockCount: book.formats[idx].stockCount - quantity };
            const formats = [...book.formats];
            formats[idx] = next;
            tx.update(ref, { formats });
            return { ok: true, format: next };
        });
    if (result.ok)
        emitStockUpdated(id, formatType, result.format);
    return result;
}
export async function createAuthor(author) {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.createAuthor(author);
    await adminDb.collection("authors").doc(author.id).set(author);
}
export async function createImprint(imprint) {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.createImprint(imprint);
    await adminDb.collection("imprints").doc(imprint.id).set(imprint);
}
export async function createCollection(collection) {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.createCollection(collection);
    await adminDb.collection("collections").doc(collection.id).set(collection);
}
export async function listReferenceData() {
    if (DB_PROVIDER === "mysql")
        return mysqlBooks.listReferenceData();
    const [authorsSnap, imprintsSnap, genresSnap, collectionsSnap] = await Promise.all([
        adminDb.collection("authors").orderBy("name").get(),
        adminDb.collection("imprints").orderBy("name").get(),
        adminDb.collection("genres").orderBy("name").get(),
        adminDb.collection("collections").orderBy("name").get(),
    ]);
    return {
        authors: authorsSnap.docs.map((d) => d.data()),
        imprints: imprintsSnap.docs.map((d) => d.data()),
        genres: genresSnap.docs.map((d) => d.data()),
        collections: collectionsSnap.docs.map((d) => d.data()),
    };
}
