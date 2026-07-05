import { Router } from "express";
import { getCatalog, getBookBySlug, getAuthorBySlug, getImprintBySlug, getCollectionBySlug } from "#lib/catalog";
import { getFrequentlyBoughtWith } from "#lib/firestore/orders";

export const catalogRouter = Router();

catalogRouter.get("/catalog", async (_req, res) => {
  res.json(await getCatalog());
});

catalogRouter.get("/books/:slug", async (req, res) => {
  const book = await getBookBySlug(req.params.slug);
  if (!book) return res.status(404).json({ error: "Book not found." });
  res.json(book);
});

// "Customers who bought this also bought" — book ids only, so the client
// resolves them against the catalog it already has cached instead of us
// re-shipping full book records here.
catalogRouter.get("/books/:slug/related", async (req, res) => {
  const book = await getBookBySlug(req.params.slug);
  if (!book) return res.status(404).json({ error: "Book not found." });
  const bookIds = await getFrequentlyBoughtWith(book.id);
  res.json({ bookIds });
});

catalogRouter.get("/authors/:slug", async (req, res) => {
  const author = await getAuthorBySlug(req.params.slug);
  if (!author) return res.status(404).json({ error: "Author not found." });
  res.json(author);
});

catalogRouter.get("/imprints/:slug", async (req, res) => {
  const imprint = await getImprintBySlug(req.params.slug);
  if (!imprint) return res.status(404).json({ error: "Imprint not found." });
  res.json(imprint);
});

catalogRouter.get("/collections/:slug", async (req, res) => {
  const collection = await getCollectionBySlug(req.params.slug);
  if (!collection) return res.status(404).json({ error: "Collection not found." });
  res.json(collection);
});
