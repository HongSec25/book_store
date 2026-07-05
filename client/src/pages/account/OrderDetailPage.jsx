import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { formatDual } from "@/lib/currency";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["account", "orders", id],
    queryFn: () => apiFetch(`/api/account/orders/${id}`),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;

  const { order } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/account/orders" className="font-mono text-xs uppercase tracking-wider text-rust">
          &larr; Back to orders
        </Link>
        <Link to={`/account/orders/${order.id}/invoice`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          View invoice
        </Link>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-2xl">Order #{order.id.slice(0, 8)}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {order.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString()}</p>

          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={`${item.bookId}-${item.formatType}`} className="flex justify-between text-sm">
                <span>
                  {item.title} <span className="text-muted-foreground capitalize">({item.formatType})</span>{" "}
                  <span className="text-muted-foreground">&times;{item.quantity}</span>
                </span>
                <span>{formatDual(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatDual(order.total)}</span>
          </div>

          {order.paymentStatus === "cod" && (
            <p className="text-sm text-muted-foreground">
              Payment: <span className="text-ink">Cash on delivery</span> — pay when your order arrives.
            </p>
          )}

          <Separator />

          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Shipping to</p>
            <p className="text-sm text-ink">{order.shippingName}</p>
            <p className="text-sm text-ink whitespace-pre-line">{order.shippingAddress}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
