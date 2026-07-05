import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

/** Cached across every page that needs it (React Query dedupes/caches by key)
 * — the SPA equivalent of Next's per-request `getCatalog()` call, except
 * this one persists across navigations instead of refetching every time. */
export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: () => apiFetch("/api/catalog"),
    staleTime: 60_000,
  });
}
