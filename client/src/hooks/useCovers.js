import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_BASE_URL } from "@/lib/api";

/** Slug -> uploaded cover image URL map. Falls back to CoverArt's generated
 * SVG in BookCard/BookDetailPage when a book has no real image on disk.
 * The server returns root-relative paths (e.g. "/covers/foo.webp") which
 * only resolve correctly against the API's own origin, not the client's —
 * they're different origins in dev (5173 vs 4000), so every path needs the
 * API origin prefixed here, once, rather than in every consumer. */
export function useCovers() {
  return useQuery({
    queryKey: ["covers"],
    queryFn: async () => {
      const map = await apiFetch("/api/covers");
      return Object.fromEntries(Object.entries(map).map(([slug, url]) => [slug, `${API_BASE_URL}${url}`]));
    },
    staleTime: 60_000,
  });
}
