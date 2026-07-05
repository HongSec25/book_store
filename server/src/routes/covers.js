import { Router } from "express";
import { getCoverMap } from "#lib/covers.server";

export const coversRouter = Router();

// GET /api/covers -> { "book-slug": "/covers/book-slug.jpg", ... }
// POST/DELETE (admin cover upload/delete) are added alongside the admin book
// management routes in a later phase.
coversRouter.get("/covers", (_req, res) => {
  res.json(getCoverMap());
});
