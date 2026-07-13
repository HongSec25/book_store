import "dotenv/config";
// Must be imported before any router that has `async (req, res) => {...}`
// handlers, and before those routers are registered — it patches Express's
// routing layer so a rejected promise from an async handler is forwarded to
// the error-handling middleware below, instead of becoming an unhandled
// rejection. Node 20+ terminates the whole process on an unhandled
// rejection by default, so without this, any thrown error inside an async
// route handler (e.g. a Storage/Firestore call failing) took down the
// entire server, not just that one request — confirmed by reproducing it.
import "express-async-errors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { attachUser } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { coversRouter } from "./routes/covers.js";
import { checkoutRouter } from "./routes/checkout.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { accountRouter } from "./routes/account.js";
import { adminRouter } from "./routes/admin.js";
import { analyticsRouter } from "./routes/analytics.js";
import { eventsRouter } from "./routes/events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Builds the configured Express app without binding a port — shared by
 * index.js (plain `node` process, local dev / any non-Firebase host) and
 * functions.js (Cloud Functions entry point), so there's exactly one place
 * the route/middleware wiring is defined. */
export function createApp() {
  const app = express();
  const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());

  // Mounted before express.json() — this route needs the raw body (its own
  // express.text() parser) for PayWay's signature verification, which would
  // be lost if the global JSON parser consumed the stream first.
  app.use("/api", webhooksRouter);

  app.use(express.json());
  app.use(attachUser);

  // Shared with the old Next app's public/covers directory (monorepo root).
  app.use("/covers", express.static(path.join(__dirname, "..", "..", "public", "covers")));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api", coversRouter);
  app.use("/api", checkoutRouter);
  app.use("/api", accountRouter);
  app.use("/api", adminRouter);
  app.use("/api", analyticsRouter);
  app.use("/api", eventsRouter);

  // Last middleware: catches anything forwarded via next(err) or, thanks to
  // express-async-errors above, any rejected promise from an async route
  // handler — so a failure in one request returns a normal 500 response
  // instead of crashing the process for every other in-flight request too.
  app.use((err, _req, res, _next) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Something went wrong on our end." });
  });

  return app;
}
