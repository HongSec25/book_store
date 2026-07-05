import { getPool } from "#lib/mysql/db";
function rowToBook(row) {
    return {
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
    };
}
export async function listBooks() {
    const [rows] = await getPool().query("SELECT * FROM books ORDER BY title");
    return rows.map(rowToBook);
}
export async function getBook(id) {
    const [rows] = await getPool().query("SELECT * FROM books WHERE id = ?", [id]);
    return rows.length ? rowToBook(rows[0]) : null;
}
export async function createBook(book) {
    await getPool().query(`INSERT INTO books
      (id, title, slug, coverColor, imprintId, authorId, genreIds, collectionIds, publishDate,
       isNewRelease, isComingSoon, isBestseller, isCultClassic, synopsis, pullQuote, formats, contentWarnings, isbn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        book.id,
        book.title,
        book.slug,
        book.coverColor,
        book.imprintId,
        book.authorId,
        JSON.stringify(book.genreIds),
        JSON.stringify(book.collectionIds),
        book.publishDate,
        book.isNewRelease,
        book.isComingSoon,
        book.isBestseller,
        book.isCultClassic,
        book.synopsis,
        book.pullQuote ?? null,
        JSON.stringify(book.formats),
        JSON.stringify(book.contentWarnings),
        book.isbn,
    ]);
}
export async function updateBook(id, book) {
    await getPool().query(`UPDATE books SET
      title = ?, slug = ?, coverColor = ?, imprintId = ?, authorId = ?, genreIds = ?, collectionIds = ?,
      publishDate = ?, isNewRelease = ?, isComingSoon = ?, isBestseller = ?, isCultClassic = ?,
      synopsis = ?, pullQuote = ?, formats = ?, contentWarnings = ?, isbn = ?
     WHERE id = ?`, [
        book.title,
        book.slug,
        book.coverColor,
        book.imprintId,
        book.authorId,
        JSON.stringify(book.genreIds),
        JSON.stringify(book.collectionIds),
        book.publishDate,
        book.isNewRelease,
        book.isComingSoon,
        book.isBestseller,
        book.isCultClassic,
        book.synopsis,
        book.pullQuote ?? null,
        JSON.stringify(book.formats),
        JSON.stringify(book.contentWarnings),
        book.isbn,
        id,
    ]);
}
/** Atomically adds (or subtracts, via a negative delta) stock for one format of a book, guarded by a row lock. */
export async function adjustStock(id, formatType, delta) {
    const conn = await getPool().getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query("SELECT formats FROM books WHERE id = ? FOR UPDATE", [id]);
        if (!rows.length) {
            await conn.rollback();
            return null;
        }
        const formats = rows[0].formats;
        const idx = formats.findIndex((f) => f.type === formatType);
        if (idx === -1) {
            await conn.rollback();
            return null;
        }
        const updated = { ...formats[idx], stockCount: Math.max(0, formats[idx].stockCount + delta) };
        formats[idx] = updated;
        await conn.query("UPDATE books SET formats = ? WHERE id = ?", [JSON.stringify(formats), id]);
        await conn.commit();
        return updated;
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
/** Atomically sets stock for one format of a book to an exact value (e.g. resetting to 0), guarded by a row lock. */
export async function setStock(id, formatType, stockCount) {
    const conn = await getPool().getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query("SELECT formats FROM books WHERE id = ? FOR UPDATE", [id]);
        if (!rows.length) {
            await conn.rollback();
            return null;
        }
        const formats = rows[0].formats;
        const idx = formats.findIndex((f) => f.type === formatType);
        if (idx === -1) {
            await conn.rollback();
            return null;
        }
        const updated = { ...formats[idx], stockCount: Math.max(0, stockCount) };
        formats[idx] = updated;
        await conn.query("UPDATE books SET formats = ? WHERE id = ?", [JSON.stringify(formats), id]);
        await conn.commit();
        return updated;
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
/** Atomically deducts stock only if enough is available (row-locked); otherwise fails without changing anything. */
export async function reserveStock(id, formatType, quantity) {
    const conn = await getPool().getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query("SELECT formats FROM books WHERE id = ? FOR UPDATE", [id]);
        if (!rows.length) {
            await conn.rollback();
            return { ok: false, available: 0 };
        }
        const formats = rows[0].formats;
        const idx = formats.findIndex((f) => f.type === formatType);
        if (idx === -1) {
            await conn.rollback();
            return { ok: false, available: 0 };
        }
        if (formats[idx].stockCount < quantity) {
            await conn.rollback();
            return { ok: false, available: formats[idx].stockCount };
        }
        const updated = { ...formats[idx], stockCount: formats[idx].stockCount - quantity };
        formats[idx] = updated;
        await conn.query("UPDATE books SET formats = ? WHERE id = ?", [JSON.stringify(formats), id]);
        await conn.commit();
        return { ok: true, format: updated };
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
export async function createAuthor(author) {
    await getPool().query("INSERT INTO authors (id, name, slug, bio) VALUES (?, ?, ?, ?)", [
        author.id,
        author.name,
        author.slug,
        author.bio,
    ]);
}
export async function createImprint(imprint) {
    await getPool().query("INSERT INTO imprints (id, name, slug, color, blurb) VALUES (?, ?, ?, ?, ?)", [
        imprint.id,
        imprint.name,
        imprint.slug,
        imprint.color,
        imprint.blurb,
    ]);
}
export async function createCollection(collection) {
    await getPool().query("INSERT INTO collections (id, name, slug, description, curatedBookIds) VALUES (?, ?, ?, ?, ?)", [collection.id, collection.name, collection.slug, collection.description, JSON.stringify(collection.curatedBookIds)]);
}
export async function deleteBook(id) {
    await getPool().query("DELETE FROM books WHERE id = ?", [id]);
}
export async function listReferenceData() {
    const pool = getPool();
    const [[authors], [imprints], [genres], [collections]] = await Promise.all([
        pool.query("SELECT * FROM authors ORDER BY name"),
        pool.query("SELECT * FROM imprints ORDER BY name"),
        pool.query("SELECT * FROM genres ORDER BY name"),
        pool.query("SELECT * FROM collections ORDER BY name"),
    ]);
    return { authors, imprints, genres, collections };
}
