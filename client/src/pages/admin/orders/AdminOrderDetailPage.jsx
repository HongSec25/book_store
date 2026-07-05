import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDual } from "@/lib/currency";

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
const TERMINAL = ["delivered", "cancelled"];
const STATUS_LABEL = { placed: "Placed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: () => apiFetch(`/api/admin/orders/${id}`),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { order } = data;
  const terminal = TERMINAL.includes(order.status);

  async function handleStatusChange(status) {
    try {
      await apiFetch(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success(`Order #${id.slice(0, 8)} marked ${STATUS_LABEL[status].toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status.");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete order #${id.slice(0, 8)}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      toast.success(`Deleted order #${id.slice(0, 8)}`);
      navigate("/admin/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order.");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Link to="/admin/orders" className="font-mono text-xs uppercase tracking-wider text-rust">
          &larr; Back to orders
        </Link>
        <Link to={`/admin/orders/${order.id}/invoice`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          View invoice
        </Link>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-2xl">Order #{order.id.slice(0, 8)}</CardTitle>
          <div className="flex items-center gap-2">
            {!terminal && (
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("delivered")}>
                Mark complete
              </Button>
            )}
            {terminal ? (
              <Badge variant={order.status === "cancelled" ? "destructive" : "outline"} className="capitalize">
                {STATUS_LABEL[order.status]} &middot; final
              </Badge>
            ) : (
              <Select value={order.status} onValueChange={(v) => v && handleStatusChange(v)}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString()}</p>

          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Customer</p>
            <p className="text-sm text-ink">
              {order.channel === "in_store" ? "In-store walk-in sale" : order.customerEmail}
            </p>
          </div>

          <Separator />

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
