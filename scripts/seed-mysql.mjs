import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const env = fs.readFileSync(path.join(root, "server", ".env"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const mysql = (await import("mysql2/promise")).default;

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

const schema = fs.readFileSync(path.join(__dirname, "..", "lib", "mysql", "schema.sql"), "utf-8");
for (const statement of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
  await pool.query(statement);
}
console.log("Schema applied.");

const { imprints, genres, collections, authors, books } = await import("../lib/data.ts").catch(() => {
  throw new Error("Run this script with: npx tsx scripts/seed-mysql.mjs");
});

for (const i of imprints) {
  await pool.query(
    "INSERT INTO imprints (id, name, slug, color, blurb) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), color=VALUES(color), blurb=VALUES(blurb)",
    [i.id, i.name, i.slug, i.color, i.blurb]
  );
}
console.log(`Seeded ${imprints.length} imprints`);

for (const g of genres) {
  await pool.query(
    "INSERT INTO genres (id, name, slug) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
    [g.id, g.name, g.slug]
  );
}
console.log(`Seeded ${genres.length} genres`);

for (const c of collections) {
  await pool.query(
    "INSERT INTO collections (id, name, slug, description, curatedBookIds) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), curatedBookIds=VALUES(curatedBookIds)",
    [c.id, c.name, c.slug, c.description, JSON.stringify(c.curatedBookIds)]
  );
}
console.log(`Seeded ${collections.length} collections`);

for (const a of authors) {
  await pool.query(
    "INSERT INTO authors (id, name, slug, bio) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), bio=VALUES(bio)",
    [a.id, a.name, a.slug, a.bio]
  );
}
console.log(`Seeded ${authors.length} authors`);

for (const b of books) {
  await pool.query(
    `INSERT INTO books
      (id, title, slug, coverColor, imprintId, authorId, genreIds, collectionIds, publishDate,
       isNewRelease, isComingSoon, isBestseller, isCultClassic, synopsis, pullQuote, formats, contentWarnings, isbn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title=VALUES(title), coverColor=VALUES(coverColor), imprintId=VALUES(imprintId), authorId=VALUES(authorId),
       genreIds=VALUES(genreIds), collectionIds=VALUES(collectionIds), publishDate=VALUES(publishDate),
       isNewRelease=VALUES(isNewRelease), isComingSoon=VALUES(isComingSoon), isBestseller=VALUES(isBestseller),
       isCultClassic=VALUES(isCultClassic), synopsis=VALUES(synopsis), pullQuote=VALUES(pullQuote),
       formats=VALUES(formats), contentWarnings=VALUES(contentWarnings), isbn=VALUES(isbn)`,
    [
      b.id,
      b.title,
      b.slug,
      b.coverColor,
      b.imprintId,
      b.authorId,
      JSON.stringify(b.genreIds),
      JSON.stringify(b.collectionIds),
      b.publishDate,
      b.isNewRelease,
      b.isComingSoon,
      b.isBestseller,
      b.isCultClassic,
      b.synopsis,
      b.pullQuote ?? null,
      JSON.stringify(b.formats),
      JSON.stringify(b.contentWarnings),
      b.isbn,
    ]
  );
}
console.log(`Seeded ${books.length} books`);

console.log("MySQL seed complete.");
process.exit(0);
