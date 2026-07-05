import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDual } from "@/lib/currency";
import { API_BASE_URL } from "@/lib/api";

/** Live-updates admin pages over Server-Sent Events instead of polling — a
 * new order, a status change, or a stock adjustment from any staff member
 * (or a customer checkout) refreshes this page within a moment. Replaces
 * Next's `router.refresh()` with React Query's `invalidateQueries` — there's
 * no server-rendered page to re-fetch here, just cached query data. */
export default function RealtimeAdmin({ announceOrders = false }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // withCredentials: true — cross-origin now (client and API are
    // different ports/origins), so the session cookie needs to ride along.
    const source = new EventSource(`${API_BASE_URL}/api/admin/events`, { withCredentials: true });

    source.onmessage = (e) => {
      let event;
      try {
        event = JSON.parse(e.data);
      } catch {
        return;
      }

      if (event.type === "connected") return;

      if (event.type === "order.created" && announceOrders) {
        toast.success(`New order from ${event.customerEmail} — ${formatDual(event.total)}`);
      }

      queryClient.invalidateQueries({ queryKey: ["admin"] });
    };

    return () => source.close();
  }, [announceOrders, queryClient]);

  return null;
}
