import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { formatDual } from "@/lib/currency";

const STATUS_BADGE = {
  placed: "secondary",
  processing: "secondary",
  shipped: "outline",
  delivered: "outline",
  cancelled: "destructive",
};

export default function AccountOrdersPage() {
  useDocumentTitle("Order History");
  const { data, isLoading, error } = useQuery({
    queryKey: ["account", "orders"],
    queryFn: () => apiFetch("/api/account/orders"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <p className="text-destructive">{error.message}</p>;

  const orders = data.orders;

  return (
    <div className="space-y-6">
      <h1 className="font-display font-black text-2xl text-ink">Order history</h1>

      {orders.length === 0 ? (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="py-4">
            <EmptyState
              icon={ClipboardList}
              title="No orders yet"
              description="Once you place an order, it'll show up here."
              actionTo="/books"
              actionLabel="Start browsing"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/account/orders/${order.id}`}>
              <Card className="rounded-2xl shadow-sm hover:border-rust transition-colors">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-ink">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} &middot; {order.items.length} item
                      {order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_BADGE[order.status]} className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="font-mono text-sm text-ink">{formatDual(order.total)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
