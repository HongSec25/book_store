import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./app.js";

// Firebase's entry point (server/package.json "main" points here). The app
// is built once per cold start and reused across warm invocations — same
// Express instance createApp() gives the local-dev index.js, just handed to
// Cloud Functions' request wrapper instead of app.listen().
export const api = onRequest({ region: "us-central1" }, createApp());
