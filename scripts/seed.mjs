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

const { cert, initializeApp } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);

// Inline copy of lib/data.ts catalog (kept in sync manually; source of truth moves to Firestore after this run)
const { imprints, genres, collections, authors, books } = await import("../lib/data.ts").catch(async () => {
  // ts-node not available in plain node; fall back to a small transpile-free re-require via tsx if present
  throw new Error("Run this script with: npx tsx scripts/seed.mjs");
});

async function seedCollection(name, items) {
  const batch = db.batch();
  for (const item of items) {
    const ref = db.collection(name).doc(item.id);
    batch.set(ref, item);
  }
  await batch.commit();
  console.log(`Seeded ${items.length} docs into "${name}"`);
}

await seedCollection("imprints", imprints);
await seedCollection("genres", genres);
await seedCollection("collections", collections);
await seedCollection("authors", authors);
await seedCollection("books", books);

console.log("Seed complete.");
process.exit(0);
