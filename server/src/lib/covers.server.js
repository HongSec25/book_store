import fs from "fs";
import path from "path";
import { adminDb } from "#lib/firebase/admin";
import { cloudinary } from "#lib/cloudinary";

// Two sources, merged. Legacy local manifest: git-committed seed/demo covers
// under public/covers — already durable since they ship with the repo, no
// need to touch anything external for these. Firestore + Cloudinary: real
// admin uploads, which is the part that wasn't durable before — a bare
// fs.writeFileSync into the container's local filesystem doesn't survive a
// redeploy/restart on hosts like Render, which is exactly how previously
// uploaded covers were disappearing. Firestore entries win on a slug
// conflict, since they're always the more recent, real upload.
const COVERS_DIR = path.join(process.cwd(), "..", "public", "covers");
const LEGACY_MANIFEST_PATH = path.join(COVERS_DIR, "manifest.json");

function readLegacyManifest() {
  if (!fs.existsSync(LEGACY_MANIFEST_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(LEGACY_MANIFEST_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function legacyUrlFor(entry) {
  return `/covers/${entry.filename}?v=${encodeURIComponent(entry.updatedAt)}`;
}

const manifestCollection = () => adminDb.collection("coverManifest");

// updatedAt is appended as a cache-busting query param on top of Cloudinary's
// own version segment — belt and suspenders so a browser that already has
// the old image cached doesn't keep serving it after a re-upload.
function urlFor(entry) {
  return `${entry.url}?v=${encodeURIComponent(entry.updatedAt)}`;
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

export async function getCoverUrl(slug) {
  const doc = await manifestCollection().doc(slug).get();
  if (doc.exists) return urlFor(doc.data());
  const legacy = readLegacyManifest()[slug];
  return legacy ? legacyUrlFor(legacy) : undefined;
}

export async function getCoverMap() {
  const map = {};
  for (const [slug, entry] of Object.entries(readLegacyManifest())) {
    map[slug] = legacyUrlFor(entry);
  }
  const snap = await manifestCollection().get();
  snap.forEach((doc) => {
    map[doc.id] = urlFor(doc.data());
  });
  return map;
}

export async function saveCover(slug, _ext, data) {
  // A stable public_id per slug (not per extension) means re-uploading in a
  // different format just overwrites the same asset in place — no leftover
  // orphaned file from the old extension to separately track and delete,
  // unlike the old bucket-path-per-filename approach.
  const result = await uploadBuffer(data, {
    public_id: `covers/${slug}`,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });

  const entry = {
    publicId: result.public_id,
    url: result.secure_url,
    updatedAt: new Date().toISOString(),
  };
  await manifestCollection().doc(slug).set(entry);
  return urlFor(entry);
}

export async function deleteCover(slug) {
  const docRef = manifestCollection().doc(slug);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  const { publicId } = doc.data();
  if (publicId) {
    await cloudinary.uploader.destroy(publicId).catch((err) => {
      console.error("Cloudinary delete failed:", err);
    });
  }
  await docRef.delete();
  return true;
}
