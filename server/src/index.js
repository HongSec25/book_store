import { createApp } from "./app.js";

// Plain `node` process entry point — used for local dev (`npm run dev`) and
// any host that runs a persistent server (Render, Railway, a VPS, etc.).
// Firebase Cloud Functions uses functions.js instead, which wraps the same
// createApp() but never calls .listen() itself.
const PORT = Number(process.env.PORT) || 4000;

createApp().listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
