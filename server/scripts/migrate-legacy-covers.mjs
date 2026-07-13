// One-time migration: uploads every cover currently tracked in the legacy
// public/covers/manifest.json into Cloudinary via the same saveCover() used
// for real admin uploads, so the whole catalog ends up in one consistent
// system instead of two. Safe to re-run — saveCover overwrites in place.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { saveCover } from "#lib/covers.server";

const COVERS_DIR = path.join(process.cwd(), "..", "public", "covers");
const MANIFEST_PATH = path.join(COVERS_DIR, "manifest.json");

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
const entries = Object.entries(manifest);
console.log(`Migrating ${entries.length} legacy covers to Cloudinary...\n`);

let ok = 0;
let failed = 0;

for (const [slug, entry] of entries) {
  const filePath = path.join(COVERS_DIR, entry.filename);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ ${slug}: file missing (${entry.filename})`);
    failed++;
    continue;
  }
  const ext = path.extname(entry.filename).slice(1);
  try {
    const buf = fs.readFileSync(filePath);
    const url = await saveCover(slug, ext, buf);
    console.log(`✓ ${slug} -> ${url}`);
    ok++;
  } catch (err) {
    console.error(`✗ ${slug}: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. ${ok} migrated, ${failed} failed.`);
