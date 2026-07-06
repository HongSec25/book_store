import fs from "fs";
import path from "path";
// Shared with the old Next app's public/covers directory (repo root), since
// this is a monorepo — avoids duplicating the actual cover image files.
const COVERS_DIR = path.join(process.cwd(), "..", "public", "covers");
const MANIFEST_PATH = path.join(COVERS_DIR, "manifest.json");
function ensureDir() {
    if (!fs.existsSync(COVERS_DIR))
        fs.mkdirSync(COVERS_DIR, { recursive: true });
}
function readManifest() {
    ensureDir();
    if (!fs.existsSync(MANIFEST_PATH))
        return {};
    try {
        return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    }
    catch {
        return {};
    }
}
function writeManifest(manifest) {
    ensureDir();
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}
// updatedAt is appended as a cache-busting query param — the filename alone
// doesn't change when a cover is re-uploaded, so without this, browsers keep
// serving their previously cached image at that same URL indefinitely.
function urlFor(entry) {
    return `/covers/${entry.filename}?v=${encodeURIComponent(entry.updatedAt)}`;
}
export function getCoverUrl(slug) {
    const entry = readManifest()[slug];
    return entry ? urlFor(entry) : undefined;
}
export function getCoverMap() {
    const manifest = readManifest();
    return Object.fromEntries(Object.entries(manifest).map(([slug, entry]) => [slug, urlFor(entry)]));
}
export function saveCover(slug, ext, data) {
    ensureDir();
    const manifest = readManifest();
    const previous = manifest[slug];
    if (previous && previous.filename !== `${slug}.${ext}`) {
        const oldPath = path.join(COVERS_DIR, previous.filename);
        if (fs.existsSync(oldPath))
            fs.unlinkSync(oldPath);
    }
    const filename = `${slug}.${ext}`;
    fs.writeFileSync(path.join(COVERS_DIR, filename), data);
    const entry = { filename, updatedAt: new Date().toISOString() };
    manifest[slug] = entry;
    writeManifest(manifest);
    return urlFor(entry);
}
export function deleteCover(slug) {
    const manifest = readManifest();
    const entry = manifest[slug];
    if (!entry)
        return false;
    const filePath = path.join(COVERS_DIR, entry.filename);
    if (fs.existsSync(filePath))
        fs.unlinkSync(filePath);
    delete manifest[slug];
    writeManifest(manifest);
    return true;
}
