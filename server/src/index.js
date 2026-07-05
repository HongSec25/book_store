import "dotenv/config";
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

const app = express();
const PORT = Number(process.env.PORT) || 4000;
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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
