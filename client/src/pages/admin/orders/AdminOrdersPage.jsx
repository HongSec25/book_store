import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import RealtimeAdmin from "@/components/RealtimeAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDual } from "@/lib/currency";

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
const TERMINAL = ["delivered", "cancelled"];
const STATUS_LABEL = { placed: "Placed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => apiFetch("/api/admin/orders"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
  }

  async function handleStatusChange(id, status) {
    try {
      await apiFetch(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success(`Order #${id.slice(0, 8)} marked ${STATUS_LABEL[status].toLowerCase()}`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status.");
    }
  }

  async function handleDelete(id) {
    if (!confirm(`Delete order #${id.slice(0, 8)}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      toast.success(`Deleted order #${id.slice(0, 8)}`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order.");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { orders } = data;

  return (
    <div className="space-y-6">
      <RealtimeAdmin announceOrders />
      <h1 className="font-display font-bold text-2xl text-ink">Orders ({orders.length})</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const terminal = TERMINAL.includes(order.status);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      <Link to={`/admin/orders/${order.id}`} className="text-rust hover:underline">
                        #{order.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-ink">
                      {order.channel === "in_store" ? (
                        <Badge variant="secondary">In-store</Badge>
                      ) : (
                        order.customerEmail
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-ink whitespace-nowrap">{formatDual(order.total)}</TableCell>
                    <TableCell>
                      {terminal ? (
                        <Badge variant={order.status === "cancelled" ? "destructive" : "outline"} className="capitalize">
                          {STATUS_LABEL[order.status]} &middot; final
                        </Badge>
                      ) : (
                        <Select value={order.status} onValueChange={(v) => v && handleStatusChange(order.id, v)}>
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
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {!terminal && (
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(order.id, "delivered")}>
                          Mark complete
                        </Button>
                      )}
                      <Link
                        to={`/admin/orders/${order.id}/invoice`}
                        className="text-xs font-mono uppercase tracking-wider text-rust hover:underline"
                      >
                        Invoice
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(order.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
